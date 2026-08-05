<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer1;
    protected User $customer2;
    protected User $seller1;
    protected User $seller2;
    protected User $admin;
    
    protected Order $order1;
    protected Order $order2;

    protected function setUp(): void
    {
        parent::setUp();

        // ۱. ساخت کاربران
        $this->customer1 = User::factory()->create(['role' => 'customer']);
        $this->customer2 = User::factory()->create(['role' => 'customer']);
        $this->seller1 = User::factory()->create(['role' => 'seller']);
        $this->seller2 = User::factory()->create(['role' => 'seller']);
        $this->admin = User::factory()->create(['role' => 'admin']);

        // ۲. ساخت محصولات
        $product1 = Product::factory()->create(['seller_id' => $this->seller1->id, 'price' => 100000]);
        $product2 = Product::factory()->create(['seller_id' => $this->seller2->id, 'price' => 200000]);

        // ۳. ساخت سفارش‌ها با تمام فیلدهای اجباری
        $this->order1 = Order::create([
            'user_id' => $this->customer1->id,
            'order_number' => 'AZK-TEST-001',
            'status' => 'pending',
            'payment_status' => 'pending',
            'subtotal' => 100000,
            'tax' => 9000,
            'shipping' => 35000,
            'discount' => 0,
            'total' => 144000,
            'shipping_address' => [
                'full_name' => 'Customer One',
                'phone' => '09123456789',
                'address' => 'Tehran, Street 1',
                'postal_code' => '1234567890',
            ],
        ]);
        OrderItem::create([
            'order_id' => $this->order1->id,
            'product_id' => $product1->id,
            'seller_id' => $this->seller1->id,
            'quantity' => 1,
            'price' => 100000,
            'total' => 100000,
        ]);

        $this->order2 = Order::create([
            'user_id' => $this->customer2->id,
            'order_number' => 'AZK-TEST-002',
            'status' => 'pending',
            'payment_status' => 'pending',
            'subtotal' => 200000,
            'tax' => 18000,
            'shipping' => 35000,
            'discount' => 0,
            'total' => 253000,
            'shipping_address' => [
                'full_name' => 'Customer Two',
                'phone' => '09123456788',
                'address' => 'Tehran, Street 2',
                'postal_code' => '0987654321',
            ],
        ]);
        OrderItem::create([
            'order_id' => $this->order2->id,
            'product_id' => $product2->id,
            'seller_id' => $this->seller2->id,
            'quantity' => 1,
            'price' => 200000,
            'total' => 200000,
        ]);
    }

    // ==================== تست‌های مشتری (Customer) ====================

    public function test_customer_can_view_own_order(): void
    {
        $response = $this->actingAs($this->customer1)
                         ->getJson("/api/v1/orders/{$this->order1->id}");
        
        $response->assertStatus(200);
    }

    public function test_customer_cannot_view_other_customer_order(): void
    {
        $response = $this->actingAs($this->customer1)
                         ->getJson("/api/v1/orders/{$this->order2->id}");
        
        $response->assertStatus(403);
    }

    // ==================== تست‌های فروشنده (Seller) ====================

    public function test_seller_can_view_order_containing_their_product(): void
    {
        $response = $this->actingAs($this->seller1)
                         ->getJson("/api/v1/seller/orders/{$this->order1->id}");
        
        $response->assertStatus(200);
    }

    public function test_seller_cannot_view_order_without_their_product(): void
    {
        $response = $this->actingAs($this->seller1)
                         ->getJson("/api/v1/seller/orders/{$this->order2->id}");
        
        $response->assertStatus(403);
    }

    // ==================== تست‌های ادمین (Admin) ====================

    public function test_admin_can_view_any_order(): void
    {
        $response1 = $this->actingAs($this->admin)
                          ->getJson("/api/v1/admin/orders/{$this->order1->id}");
        $response2 = $this->actingAs($this->admin)
                          ->getJson("/api/v1/admin/orders/{$this->order2->id}");
        
        $response1->assertStatus(200);
        $response2->assertStatus(200);
    }
}