<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ قبلاً SearchController با Product::where('status', 'active') کوئری
 * می‌زد — این ستون اصلاً روی جدول products وجود ندارد (فقط is_active
 * بولین دارد). چون Laravel برای SQLite شناسه‌ها را با کوتیشن دوتایی
 * می‌گذارد، "status" = ? به‌جای خطای «no such column» به‌عنوان رشته‌ی
 * لفظی «status» با ورودی مقایسه می‌شد و همیشه false بود — یعنی جستجو
 * همیشه صفر نتیجه برمی‌گرداند، بدون هیچ خطایی (روی MySQL همین کد ۵۰۰
 * واقعی می‌داد، چون آنجا شناسه‌ها با بک‌تیک هستند و ستون ناموجود خطا
 * می‌دهد).
 */
class GlobalSearchApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_global_search_finds_an_active_product_by_name(): void
    {
        $category = Category::factory()->create();
        Product::factory()->create([
            'name' => 'قاب آیفون پرو مکس',
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/search/global?q=آیفون');

        $response->assertStatus(200)
            ->assertJsonPath('data.products.count', 1);
    }

    public function test_global_search_excludes_an_inactive_product(): void
    {
        Product::factory()->create([
            'name' => 'قاب آیفون قدیمی',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/search/global?q=آیفون');

        $response->assertStatus(200)
            ->assertJsonPath('data.products.count', 0);
    }

    /**
     * ✅ قبلاً هیچ throttle روی این گروه نبود.
     */
    public function test_global_search_is_rate_limited(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->getJson('/api/v1/search/global?q=تست')->assertStatus(200);
        }

        $this->getJson('/api/v1/search/global?q=تست')->assertStatus(429);
    }
}
