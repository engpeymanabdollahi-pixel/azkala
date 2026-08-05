<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * GET /seller/orders/{order} — پاسخی که SellerOrderDetail.tsx و
 * SellerOrderDetailModal.tsx واقعاً از آن می‌خوانند.
 *
 * قبل از این، Order::$casts فاقد 'shipping_address' => 'array' بود؛ چون
 * ستون واقعاً JSON است ولی بدون cast، Eloquent آن را به‌صورت رشته‌ی JSON خام
 * برمی‌گرداند نه یک آبجکت — یعنی seller_order_detail صفحه‌ی فروشنده مجبور
 * بود آن را دستی JSON.parse کند (که در SellerOrderDetail.tsx قدیمی اصلاً
 * این کار هم انجام نمی‌شد، چون آن صفحه اصلاً از این endpoint واقعی استفاده
 * نمی‌کرد).
 */
class SellerOrderShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_shipping_address_is_returned_as_a_real_object_not_a_json_string(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $customer = User::factory()->create(['role' => 'customer', 'name' => 'مشتری تست', 'phone' => '09120000000']);
        $product = Product::factory()->create(['seller_id' => $seller->id, 'category_id' => Category::factory()]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'status' => 'processing',
            'shipping_address' => [
                'full_name' => 'مشتری تست',
                'phone' => '09120000000',
                'province' => 'تهران',
                'city' => 'تهران',
                'address' => 'خیابان آزمایشی، پلاک ۱',
                'postal_code' => '1111111111',
            ],
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'seller_id' => $seller->id,
            'product_id' => $product->id,
        ]);

        $response = $this->actingAs($seller, 'sanctum')
            ->getJson("/api/v1/seller/orders/{$order->id}");

        $response->assertOk();
        // اگر cast غایب باشد، این کلید یک رشته‌ی JSON برمی‌گردد نه یک آرایه —
        // assertJsonPath برای مقایسه‌ی تودرتو نیاز به آرایه‌ی واقعی دارد.
        $response->assertJsonPath('data.shipping_address.city', 'تهران');
        $response->assertJsonPath('data.shipping_address.postal_code', '1111111111');
        $this->assertIsArray($response->json('data.shipping_address'));
    }

    public function test_response_includes_the_real_customer_and_product_not_placeholder_data(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $customer = User::factory()->create(['role' => 'customer', 'name' => 'رضا احمدی', 'phone' => '09121234567']);
        $product = Product::factory()->create([
            'seller_id' => $seller->id,
            'category_id' => Category::factory(),
            'name' => 'کاور مخصوص تست',
        ]);

        $order = Order::factory()->create(['user_id' => $customer->id]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'seller_id' => $seller->id,
            'product_id' => $product->id,
        ]);

        $response = $this->actingAs($seller, 'sanctum')
            ->getJson("/api/v1/seller/orders/{$order->id}")
            ->assertOk();

        $this->assertSame('رضا احمدی', $response->json('data.user.name'));
        $this->assertSame('09121234567', $response->json('data.user.phone'));
        $this->assertSame('کاور مخصوص تست', $response->json('data.items.0.product.name'));
    }
}
