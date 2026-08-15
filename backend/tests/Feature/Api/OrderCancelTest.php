<?php

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * POST /api/v1/orders/{order}/cancel
 *
 * ✅ CONFIRMED BUG (Backend Full Audit): OrderController::cancel() قبلاً
 * app(\App\Services\OrderService::class) صدا می‌زد — یک namespace نادرست
 * (کلاس واقعی App\Services\Order\OrderService است، نه App\Services\
 * OrderService). چنین کلاسی اصلاً وجود نداشت، پس هر درخواست واقعی به این
 * endpoint با ۵۰۰ (BindingResolutionException) رد می‌شد — یعنی هیچ
 * مشتری‌ای هرگز نمی‌توانست سفارشش را لغو کند. علاوه بر آن، فراخوانی با
 * امضای واقعی cancelOrder(int $orderId, int $userId): bool هم ناسازگار
 * بود (کل مدل Order پاس داده می‌شد، بدون userId). این تست‌ها همان مسیر
 * واقعی HTTP را — نه فقط متد Service را مستقیم — بررسی می‌کنند، دقیقاً
 * چون تست‌های Unit موجود (OrderServiceTest) خودِ Service را مستقیم صدا
 * می‌زدند و این باگ در چسب کنترلر هرگز توسط آن‌ها گرفته نمی‌شد.
 */
class OrderCancelTest extends TestCase
{
    use RefreshDatabase;

    private function createOrder(User $customer, string $status = 'pending'): Order
    {
        $product = Product::factory()->create(['stock' => 5, 'price' => 100000]);

        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'AZK-'.strtoupper(uniqid()),
            'subtotal' => 100000,
            'discount' => 0,
            'shipping' => 0,
            'tax' => 0,
            'total' => 100000,
            'status' => $status,
            'payment_status' => 'pending',
            'payment_method' => 'online',
            'shipping_address' => ['full_name' => 'تست'],
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'seller_id' => $product->seller_id,
            'quantity' => 2,
            'price' => $product->price,
            'total' => $product->price * 2,
        ]);

        return $order;
    }

    public function test_customer_can_cancel_their_own_pending_order(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = $this->createOrder($customer, 'pending');

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/cancel");

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'cancelled']);
    }

    public function test_cancelling_an_order_restores_product_stock(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = $this->createOrder($customer, 'pending');
        $item = $order->items()->first();
        $product = Product::find($item->product_id);
        $stockBefore = $product->stock;

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/cancel")
            ->assertOk();

        $this->assertEquals($stockBefore + $item->quantity, $product->fresh()->stock);
    }

    public function test_customer_cannot_cancel_another_customers_order(): void
    {
        $owner = User::factory()->create(['role' => 'customer']);
        $intruder = User::factory()->create(['role' => 'customer']);
        $order = $this->createOrder($owner, 'pending');

        $response = $this->actingAs($intruder, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/cancel");

        $response->assertStatus(403);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'pending']);
    }

    public function test_shipped_order_cannot_be_cancelled(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = $this->createOrder($customer, 'shipped');

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/cancel");

        $response->assertStatus(403);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'shipped']);
    }

    public function test_already_cancelled_order_returns_a_clear_error_not_a_crash(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = $this->createOrder($customer, 'cancelled');

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/cancel");

        // Policy این وضعیت را هم مسدود می‌کند (authorize() قبل از رسیدن
        // به try/catch ما throw می‌کند، پس پاسخ فرمت استاندارد ۴۰۳ خودِ
        // Laravel است)؛ نکته‌ی اصلی این تست این است که پاسخ یک خطای JSON
        // تمیز و قابل‌پیش‌بینی است، نه ۵۰۰ کرش‌شده.
        $response->assertStatus(403);
    }

    public function test_guest_cannot_cancel_an_order(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $order = $this->createOrder($customer, 'pending');

        $this->postJson("/api/v1/orders/{$order->id}/cancel")->assertStatus(401);
    }
}
