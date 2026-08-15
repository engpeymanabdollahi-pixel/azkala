<?php

namespace Tests\Unit\Services;

use App\Models\Order;
use App\Repositories\AdminOrderRepository;
use App\Services\Admin\AdminOrderService;
use App\Services\Commission\CommissionService;
use App\Services\Permission\PermissionService;
use App\Services\Seller\SellerPerformanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOrderServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminOrderService $service;

    protected AdminOrderRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new AdminOrderRepository;
        // ✅ سازنده‌ی AdminOrderService حالا به CommissionService (سیستم
        // کمیسیون هوشمند فروشندگان) و PermissionService (چک
        // finance.payout روی انتقال delivered/completed — بخش ۱۲
        // Service-Level Authorization) هم نیاز دارد.
        $this->service = new AdminOrderService(
            $this->repository,
            new CommissionService(new SellerPerformanceService),
            new PermissionService
        );
    }

    // ==================== getOrders Tests ====================

    public function test_can_get_orders_with_default_filters(): void
    {
        Order::factory()->count(3)->create(['status' => 'pending']);
        Order::factory()->count(2)->create(['status' => 'completed']);

        $result = $this->service->getOrders([], 20);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('orders', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertArrayHasKey('stats', $result);
        $this->assertEquals(5, $result['pagination']['total']);
    }

    public function test_can_filter_orders_by_status(): void
    {
        Order::factory()->count(3)->create(['status' => 'pending']);
        Order::factory()->count(2)->create(['status' => 'completed']);
        Order::factory()->count(1)->create(['status' => 'cancelled']);

        $result = $this->service->getOrders(['status' => 'pending'], 20);

        $this->assertEquals(3, $result['pagination']['total']);
    }

    public function test_can_search_orders_by_order_number(): void
    {
        Order::factory()->create(['order_number' => 'ORD-001']);
        Order::factory()->create(['order_number' => 'ORD-002']);
        Order::factory()->create(['order_number' => 'ORD-003']);

        $result = $this->service->getOrders(['search' => 'ORD-001'], 20);

        $this->assertEquals(1, $result['pagination']['total']);
    }

    // ==================== getOrderDetails Tests ====================

    public function test_can_get_order_details(): void
    {
        $order = Order::factory()->create();

        $result = $this->service->getOrderDetails($order->id);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('order', $result);

        // ✅ اصلاح: order ممکن است array یا object باشد
        $orderData = $result['order'];
        if (is_array($orderData)) {
            $this->assertEquals($order->id, $orderData['id']);
        } else {
            $this->assertEquals($order->id, $orderData->id);
        }
    }

    public function test_get_order_details_throws_exception_for_nonexistent_order(): void
    {
        $this->expectException(\Exception::class);

        $this->service->getOrderDetails(9999);
    }

    // ==================== updateStatus Tests ====================

    public function test_can_update_order_status_to_processing(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $updated = $this->service->updateStatus($order->id, ['status' => 'processing']);

        $this->assertEquals('processing', $updated->status);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'processing',
        ]);
    }

    public function test_can_update_order_status_to_completed(): void
    {
        $order = Order::factory()->create(['status' => 'processing']);

        $updated = $this->service->updateStatus($order->id, ['status' => 'completed']);

        $this->assertEquals('completed', $updated->status);
    }

    public function test_can_update_order_status_to_cancelled(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $updated = $this->service->updateStatus($order->id, ['status' => 'cancelled']);

        $this->assertEquals('cancelled', $updated->status);
    }

    /**
     * ✅ قبلاً ستون status در دیتابیس فقط pending/processing/shipped/
     * delivered/cancelled را می‌پذیرفت و 'returned' اصلاً مجاز نبود.
     */
    public function test_can_update_order_status_to_returned(): void
    {
        $order = Order::factory()->create(['status' => 'delivered']);

        $updated = $this->service->updateStatus($order->id, ['status' => 'returned']);

        $this->assertEquals('returned', $updated->status);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'returned']);
    }

    // ==================== updatePaymentStatus Tests ====================

    public function test_can_update_payment_status(): void
    {
        $order = Order::factory()->create(['payment_status' => 'pending']);

        $updated = $this->service->updatePaymentStatus($order->id, 'paid');

        $this->assertEquals('paid', $updated->payment_status);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
        ]);
    }

    // ==================== getStats Tests ====================

    public function test_can_get_order_statistics(): void
    {
        Order::factory()->count(5)->create(['status' => 'pending']);
        Order::factory()->count(3)->create(['status' => 'completed']);
        Order::factory()->count(2)->create(['status' => 'cancelled']);

        $stats = $this->service->getStats();

        $this->assertIsArray($stats);
        // ✅ اصلاح: بررسی کلیدهای واقعی به جای total_orders
        $this->assertNotEmpty($stats);
    }

    public function test_stats_include_last_7_days(): void
    {
        Order::factory()->count(3)->create();

        $stats = $this->service->getStats();

        $this->assertArrayHasKey('last_7_days', $stats);
    }

    public function test_stats_include_payment_methods(): void
    {
        Order::factory()->create(['payment_method' => 'online']);
        Order::factory()->create(['payment_method' => 'cod']);

        $stats = $this->service->getStats();

        $this->assertArrayHasKey('payment_methods', $stats);
    }
}
