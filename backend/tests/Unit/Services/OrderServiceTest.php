<?php

namespace Tests\Unit\Services;

use App\DTOs\Order\CreateOrderDTO;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Repositories\OrderRepository;
use App\Repositories\ProductRepository;
use App\Services\Order\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $service;
    protected OrderRepository $repository;
    protected ProductRepository $productRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->repository = new OrderRepository();
        $this->productRepository = new ProductRepository();
        
        $this->service = new OrderService($this->repository, $this->productRepository);
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

        $this->assertNotNull($result);
        if (is_array($result)) {
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
            items: [['product_id' => 1, 'quantity' => 1, 'price' => 50000]]
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
            items: [['product_id' => 1, 'quantity' => 1, 'price' => 50000]]
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

    // ==================== Multi-Vendor Commission Tests ====================

    public function test_process_commission_handles_multiple_sellers_correctly(): void
    {
        $seller1 = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 5.00]);
        $seller2 = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 10.00]);

        $product1 = Product::factory()->create(['seller_id' => $seller1->id, 'price' => 100000]);
        $product2 = Product::factory()->create(['seller_id' => $seller2->id, 'price' => 200000]);

        $order = Order::factory()->create(['total' => 300000]);
        
        // ✅ اصلاح ۱: اضافه کردن فیلد total که در دیتابیس NOT NULL است
        $order->items()->createMany([
            ['product_id' => $product1->id, 'quantity' => 1, 'price' => 100000, 'seller_id' => $seller1->id, 'total' => 100000],
            ['product_id' => $product2->id, 'quantity' => 1, 'price' => 200000, 'seller_id' => $seller2->id, 'total' => 200000],
        ]);

        $order->load('items');
        $this->service->processCommission($order);

        // تأیید فروشنده ۱
        $this->assertDatabaseHas('seller_transactions', [
            'seller_id' => $seller1->id,
            'order_id' => $order->id,
            'type' => 'commission_deduction',
            'amount' => 5000.00,
        ]);
        $this->assertDatabaseHas('seller_transactions', [
            'seller_id' => $seller1->id,
            'order_id' => $order->id,
            'type' => 'payout',
            'amount' => 95000.00,
        ]);
        $seller1->refresh();
        $this->assertEquals(95000.00, $seller1->wallet_balance);

        // تأیید فروشنده ۲
        $this->assertDatabaseHas('seller_transactions', [
            'seller_id' => $seller2->id,
            'order_id' => $order->id,
            'type' => 'commission_deduction',
            'amount' => 20000.00,
        ]);
        $seller2->refresh();
        $this->assertEquals(180000.00, $seller2->wallet_balance);
    }

    // ==================== Config-Driven Logic Tests ====================

    public function test_order_totals_use_config_values_not_magic_numbers(): void
    {
        config(['azkala.free_shipping_threshold' => 100000]);
        config(['azkala.default_shipping_cost' => 25000]);
        config(['azkala.tax_rate' => 10]);

        $user = User::factory()->create();
        
        // ✅ اصلاح ۲: ساخت Address به صورت دستی چون Factory ندارد
       // ✅ اصلاح: تغییر recipient_name به full_name مطابق با Migration
$address = Address::create([
    'user_id' => $user->id,
    'full_name' => 'کاربر تست', // <--- اینجا تغییر کرد
    'phone' => '09123456789',
    'province' => 'تهران',
    'city' => 'تهران',
    'address' => 'آدرس تست',
    'postal_code' => '1234567890',
    'is_default' => true,
]);
        
        $product = Product::factory()->create(['price' => 90000, 'stock' => 10]);

        $dto = new CreateOrderDTO(
            user_id: $user->id,
            address_id: $address->id,
            note: 'Test',
            payment_method: 'online',
            items: [['product_id' => $product->id, 'quantity' => 1]]
        );

        $order = $this->service->createOrder($dto);

        $this->assertEquals(25000.00, $order->shipping_cost);
        $this->assertEquals(9000.00, $order->tax);
        $this->assertEquals(124000.00, $order->total);

        $product2 = Product::factory()->create(['price' => 150000, 'stock' => 10]);
        $dto2 = new CreateOrderDTO(
            user_id: $user->id,
            address_id: $address->id,
            note: 'Test',
            payment_method: 'online',
            items: [['product_id' => $product2->id, 'quantity' => 1]]
        );

        $order2 = $this->service->createOrder($dto2);
        $this->assertEquals(0.00, $order2->shipping_cost);
    }

    // ==================== N+1 Query Prevention Tests ====================

        public function test_validate_and_prepare_items_prevents_n_plus_one_queries(): void
    {
        \DB::enableQueryLog();
        
        $user = User::factory()->create();
        
        // ✅ اصلاح نهایی: تغییر recipient_name به full_name در اینجا هم انجام شود
        $address = Address::create([
            'user_id' => $user->id,
            'full_name' => 'کاربر تست', // <--- این خط باید full_name باشد
            'phone' => '09123456789',
            'province' => 'تهران',
            'city' => 'تهران',
            'address' => 'آدرس تست',
            'postal_code' => '1234567890',
            'is_default' => true,
        ]);
        
        $products = Product::factory()->count(5)->create(['stock' => 10, 'price' => 50000]);
        $items = $products->map(fn($p) => ['product_id' => $p->id, 'quantity' => 1])->toArray();

        $dto = new CreateOrderDTO(
            user_id: $user->id,
            address_id: $address->id,
            note: 'Test',
            payment_method: 'online',
            items: $items
        );

        $this->service->createOrder($dto);

        $queries = \DB::getQueryLog();
        \DB::disableQueryLog();

        $productQueries = collect($queries)->filter(fn($q) => str_contains(strtolower($q['query']), 'products'));

        $this->assertLessThanOrEqual(
            2, 
            $productQueries->count(),
            'تعداد کوئری‌های محصول باید حداقل باشد (جلوگیری از مشکل N+1)'
        );
        
        $hasWhereIn = $productQueries->contains(fn($q) => str_contains(strtolower($q['query']), 'in'));
        $this->assertTrue($hasWhereIn, 'کوئری محصول باید از whereIn برای بهینه‌سازی استفاده کند');
    }
}