<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ قبلاً کل گروه /api/v1/seller/* (داشبورد، لیست/ثبت محصول، آپلود گروهی،
 * سفارشات، تنظیمات) فقط auth:sanctum داشت — هیچ بررسی role نمی‌شد. یعنی
 * یک customer یا pending_seller لاگین‌شده (که هنوز فرآیند تایید فروشندگی
 * را طی نکرده) می‌توانست مستقیماً POST /seller/products بزند و محصول
 * واقعی در مارکت‌پلیس بسازد. حالا middleware('seller') این گروه را دقیقاً
 * مثل middleware('admin') روی گروه admin محدود می‌کند.
 */
class SellerRouteAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_seller_products(): void
    {
        $this->getJson('/api/v1/seller/products')->assertStatus(401);
    }

    public function test_customer_cannot_access_seller_products(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $this->actingAs($customer)
            ->getJson('/api/v1/seller/products')
            ->assertStatus(403);
    }

    public function test_pending_seller_cannot_access_seller_products(): void
    {
        $pending = User::factory()->create(['role' => 'pending_seller', 'is_active' => true]);

        $this->actingAs($pending)
            ->getJson('/api/v1/seller/products')
            ->assertStatus(403);
    }

    public function test_customer_cannot_create_product_via_bulk_commit(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $this->actingAs($customer)
            ->postJson('/api/v1/seller/products/bulk/commit', [
                'valid_rows' => [
                    ['row' => 2, 'data' => ['name' => 'x']],
                ],
            ])
            ->assertStatus(403);
    }

    public function test_approved_seller_can_access_seller_products(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);

        $this->actingAs($seller)
            ->getJson('/api/v1/seller/products')
            ->assertStatus(200);
    }

    public function test_admin_cannot_access_seller_only_routes(): void
    {
        // ✅ نقش admin هم به‌طور خودکار seller نیست — همان‌طور که seller هم
        // به admin دسترسی ندارد؛ نقش‌ها جدا و هرکدام فقط مسیر خودشان را دارند.
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $this->actingAs($admin)
            ->getJson('/api/v1/seller/products')
            ->assertStatus(403);
    }
}
