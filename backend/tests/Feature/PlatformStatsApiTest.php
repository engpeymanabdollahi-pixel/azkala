<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ صفحه‌ی «درباره ازکالا» قبلاً چهار آمار ثابت و ساختگی نشان می‌داد
 * («+۱۰,۰۰۰ محصول»، «+۵۰۰ فروشنده»، «۹۸٪ رضایت»، «+۵۰,۰۰۰ مشتری») که به
 * هیچ داده‌ی واقعی وصل نبود. GET /platform-stats عدد واقعی محصول و
 * فروشنده‌ی فعال را از دیتابیس می‌شمارد.
 */
class PlatformStatsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_stats_returns_real_counts(): void
    {
        // ✅ ProductFactory به‌طور پیش‌فرض برای هر محصول یک فروشنده‌ی ضمنی
        // جدید می‌سازد (seller_id => User::factory(['role' => 'seller']))؛
        // بدون override صریح seller_id، شمارش فروشنده‌ها با تعداد محصولات
        // قاطی می‌شد.
        $owner = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        Product::factory()->count(3)->create(['is_active' => true, 'seller_id' => $owner->id]);
        Product::factory()->create(['is_active' => false, 'seller_id' => $owner->id]);

        User::factory()->create(['role' => 'seller', 'is_active' => true]);
        User::factory()->create(['role' => 'seller', 'is_active' => false]);
        User::factory()->create(['role' => 'buyer', 'is_active' => true]);

        $response = $this->getJson('/api/v1/platform-stats');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.products_count', 3)
            ->assertJsonPath('data.sellers_count', 2);
    }

    public function test_platform_stats_is_publicly_accessible(): void
    {
        $this->getJson('/api/v1/platform-stats')->assertOk();
    }
}
