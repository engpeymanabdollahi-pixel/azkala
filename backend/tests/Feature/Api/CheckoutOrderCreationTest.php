<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * POST /api/v1/orders — همان مسیر واقعی که CheckoutForm.tsx صدا می‌زند.
 *
 * OrderController::store() از قبل متد $this->orderService->createOrderFromCart(...)
 * را صدا می‌زد، ولی این متد اصلاً در OrderService تعریف نشده بود — یعنی هر
 * تلاش واقعی برای ثبت سفارش، با یک \Error («Call to undefined method»)
 * کرش می‌کرد (چون \Error زیرکلاس \Exception نیست، حتی catch (\Exception $e)
 * در همان کنترلر هم آن را نمی‌گرفت). این تست همان مسیر واقعی چک‌اوت را از
 * ابتدا تا انتها بررسی می‌کند.
 */
class CheckoutOrderCreationTest extends TestCase
{
    use RefreshDatabase;

    private function shippingAddressPayload(): array
    {
        return [
            'receiver_name' => 'علی محمدی',
            'phone' => '09123456789',
            'province' => 'تهران',
            'city' => 'تهران',
            'address' => 'خیابان آزادی، پلاک ۱',
            'postal_code' => '1234567890',
        ];
    }

    public function test_customer_can_create_order_from_their_cart(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10, 'price' => 100000, 'is_active' => true]);

        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'price' => $product->price,
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'shipping_address' => $this->shippingAddressPayload(),
                'payment_method' => 'online',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $this->assertNotEmpty($response->json('data.order_number'));

        $this->assertDatabaseHas('orders', [
            'user_id' => $customer->id,
            'payment_method' => 'online',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        // ✅ موجودی محصول باید کم شده باشد
        $this->assertEquals(8, $product->fresh()->stock);

        // ✅ سبد خرید باید خالی شده باشد
        $this->assertEquals(0, $cart->items()->count());
    }

    public function test_checkout_fails_with_clear_message_when_cart_is_empty(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        Cart::create(['user_id' => $customer->id]);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'shipping_address' => $this->shippingAddressPayload(),
                'payment_method' => 'online',
            ]);

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);
    }

    public function test_checkout_fails_with_clear_message_when_stock_is_insufficient(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 1, 'is_active' => true]);

        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'price' => $product->price,
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'shipping_address' => $this->shippingAddressPayload(),
                'payment_method' => 'online',
            ]);

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);
        $this->assertStringContainsString('موجودی', $response->json('message'));

        // سفارش نباید ساخته شده باشد و موجودی نباید تغییر کرده باشد
        $this->assertDatabaseCount('orders', 0);
        $this->assertEquals(1, $product->fresh()->stock);
    }

    /**
     * ✅ قبلاً محصولات هنگام بررسی موجودی بدون lockForUpdate خوانده
     * می‌شدند — یعنی دو سفارش همزمان برای آخرین واحد موجودی می‌توانستند
     * هر دو از بررسی «موجودی کافی است» عبور کنند و stock منفی شود.
     * تست همزمانی واقعی نیازمند ابزار جداگانه (چند اتصال/فرآیند) است؛
     * این تست تضمین می‌کند که خودِ رفع باگ (قفل ردیف) در کد باقی می‌ماند
     * و به‌صورت ناخواسته در بازنویسی‌های بعدی حذف نمی‌شود.
     */
    public function test_stock_check_locks_the_product_row_to_prevent_overselling(): void
    {
        $source = file_get_contents(app_path('Services/Order/OrderService.php'));

        $this->assertStringContainsString(
            'lockForUpdate()',
            $source,
            'validateAndPrepareItems باید محصولات را با lockForUpdate بخواند تا از فروش بیش از موجودی جلوگیری شود.'
        );
    }
}
