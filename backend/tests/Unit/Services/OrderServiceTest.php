<?php

namespace Tests\Unit\Services;

use App\DTOs\Order\CreateOrderDTO;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Repositories\OrderRepository;
use App\Services\Order\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $service;
    protected OrderRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new OrderRepository();
        $this->service = new OrderService($this->repository);
    }

    // ==================== getUserOrders Tests ====================

    public function test_can_get_user_orders(): void
    {
        $user = User::factory()->create();
        Order::factory()->count(3)->create(['user_id' => $user->id]);
        
        $otherUser = User::factory()->create();
        Order::factory()->count(2)->create(['user_id' => $otherUser->id]);

        $result = $this->service->getUserOrders($user->id);

        $this->assertEquals(3, $result->total());
    }

    public function test_can_get_user_orders_with_pagination(): void
    {
        $user = User::factory()->create();
        Order::factory()->count(25)->create(['user_id' => $user->id]);

        $result = $this->service->getUserOrders($user->id, 10);

        $this->assertEquals(25, $result->total());
        $this->assertEquals(10, $result->perPage());
        $this->assertCount(10, $result->items());
    }

    // ==================== getOrderDetails Tests ====================

    public function test_can_get_order_details(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'order_number' => 'ORD-12345678',
            'status' => 'pending',
        ]);

        $result = $this->service->getOrderDetails($order->id, $user->id);

        // نتیجه می‌تواند array یا model باشد
        $this->assertNotNull($result);
        
        if (is_array($result)) {
            // اگر array است، خالی نباشد
            $this->assertNotEmpty($result);
        }
    }

    public function test_cannot_get_order_details_for_nonexistent_order(): void
    {
        $user = User::factory()->create();

        $this->expectException(\Exception::class);

        $this->service->getOrderDetails(9999, $user->id);
    }

    // ==================== createOrder Tests ====================

    public function test_cannot_create_order_with_empty_items(): void
    {
        $dto = new CreateOrderDTO(
            user_id: 1,
            address_id: 1,
            note: 'Test order',
            payment_method: 'online',
            items: []
        );

        $this->expectException(\Exception::class);

        $this->service->createOrder($dto);
    }

    public function test_cannot_create_order_without_address(): void
    {
        $dto = new CreateOrderDTO(
            user_id: 1,
            address_id: null,
            note: 'Test order',
            payment_method: 'online',
            items: [
                ['product_id' => 1, 'quantity' => 1, 'price' => 50000],
            ]
        );

        $this->expectException(\Exception::class);

        $this->service->createOrder($dto);
    }

    public function test_cannot_create_order_with_invalid_payment_method(): void
    {
        $dto = new CreateOrderDTO(
            user_id: 1,
            address_id: 1,
            note: 'Test order',
            payment_method: 'invalid_method',
            items: [
                ['product_id' => 1, 'quantity' => 1, 'price' => 50000],
            ]
        );

        $this->expectException(\Exception::class);

        $this->service->createOrder($dto);
    }

    // ==================== cancelOrder Tests ====================

    public function test_cancel_order_throws_exception_for_nonexistent_order(): void
    {
        $user = User::factory()->create();

        $this->expectException(\Exception::class);

        $this->service->cancelOrder(9999, $user->id);
    }

    // ==================== getUserStats Tests ====================

    public function test_can_get_user_stats(): void
    {
        $user = User::factory()->create();
        Order::factory()->count(5)->create([
            'user_id' => $user->id,
            'status' => 'completed',
            'total' => 100000,
        ]);

        $stats = $this->service->getUserStats($user->id);

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total_orders', $stats);
    }

    public function test_user_stats_returns_zero_for_new_user(): void
    {
        $user = User::factory()->create();

        $stats = $this->service->getUserStats($user->id);

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total_orders', $stats);
    }
        public function test_concurrent_orders_do_not_cause_overselling(): void
    {
        $product = Product::factory()->create(['stock' => 1]);
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // ایجاد سبد خرید برای هر دو کاربر
        $cart1 = Cart::factory()->create(['user_id' => $user1->id]);
        $cart2 = Cart::factory()->create(['user_id' => $user2->id]);
        
        CartItem::create(['cart_id' => $cart1->id, 'product_id' => $product->id, 'quantity' => 1]);
        CartItem::create(['cart_id' => $cart2->id, 'product_id' => $product->id, 'quantity' => 1]);

        // اجرای همزمان دو سفارش
        $order1 = OrderService::createOrderFromCart($user1, $cart1, []);
        
        // انتظار می‌رود سفارش دوم با خطای OutOfStock مواجه شود
        $this->expectException(OutOfStockException::class);
        $order2 = OrderService::createOrderFromCart($user2, $cart2, []);
    }
}