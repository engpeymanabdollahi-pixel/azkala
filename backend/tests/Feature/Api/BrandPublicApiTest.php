<?php

namespace Tests\Feature\Api;

use App\Models\Brand;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * ✅ Brand Backend فاز ۰ — پوشش تست برای API عمومی برند
 * (GET /brands، GET /brands/{brand}، GET /brands/slug/{slug}) که پیش از
 * این فاز اصلاً تست نداشت (BrandApiTest.php موجود فقط سمت ادمین را پوشش
 * می‌دهد). این تست‌ها دقیقاً همان رفتارهایی را تایید می‌کنند که در فاز ۰
 * فیکس/تایید شدند:
 *   - BrandResource::is_verified واقعاً از Brand::isVerified() می‌آید
 *     (نه یک attribute غیرموجود که همیشه null بود).
 *   - BrandController::show() برند غیرفعال را ۴۰۴ می‌دهد (قبلاً هر برندی
 *     را برمی‌گرداند، صرف‌نظر از is_active).
 *   - BrandController::index() بر اساس sort_order (سپس name) مرتب می‌کند
 *     (قبلاً sort_order هیچ اثری نداشت).
 *   - products_count در index() (withCount) و show()/bySlug()
 *     (loadCount) هر دو واقعی/زنده هستند، نه ستون خام DB.
 *   - پاسخ show()/bySlug() دیگر کلید 'products' ندارد (حذف load بدون
 *     مصرف‌کننده — کد مرده‌ای که BrandResource هرگز serialize نمی‌کرد).
 */
class BrandPublicApiTest extends TestCase
{
    use RefreshDatabase;

    private function countQueries(callable $call): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $call();
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    }

    // ==================== Query Count (فاز ۰.۱۲) ====================

    /**
     * ✅ withCount('products') باید یک کوئری aggregate واحد (با subquery)
     * تولید کند، نه یک "select count(*)" جدا به‌ازای هر برند — یعنی تعداد
     * کوئری‌ها باید مستقل از تعداد برندها ثابت بماند.
     */
    public function test_brand_index_query_count_does_not_grow_with_number_of_brands(): void
    {
        Brand::factory()->active()->count(2)->create();
        $countWithTwo = $this->countQueries(fn () => $this->getJson('/api/v1/brands'));

        Brand::factory()->active()->count(8)->create();
        $countWithTen = $this->countQueries(fn () => $this->getJson('/api/v1/brands'));

        $this->assertEquals($countWithTwo, $countWithTen);
    }

    /**
     * ✅ show()/bySlug() دیگر همه‌ی محصولات برند را load نمی‌کند
     * (loadCount به‌جای load کامل) — تعداد کوئری باید مستقل از تعداد
     * محصولات برند ثابت بماند، نه با آن رشد کند.
     */
    public function test_brand_show_query_count_does_not_grow_with_number_of_products(): void
    {
        $brandFew = Brand::factory()->active()->create();
        Product::factory()->count(2)->create(['brand_id' => $brandFew->id, 'is_active' => true]);
        $countFew = $this->countQueries(fn () => $this->getJson("/api/v1/brands/{$brandFew->id}"));

        $brandMany = Brand::factory()->active()->create();
        Product::factory()->count(20)->create(['brand_id' => $brandMany->id, 'is_active' => true]);
        $countMany = $this->countQueries(fn () => $this->getJson("/api/v1/brands/{$brandMany->id}"));

        $this->assertEquals($countFew, $countMany);
    }

    // ==================== GET /brands ====================

    public function test_can_list_active_brands(): void
    {
        Brand::factory()->active()->create(['name' => 'Nike']);

        $response = $this->getJson('/api/v1/brands');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(1, 'data');
    }

    public function test_brand_list_excludes_inactive_brands(): void
    {
        Brand::factory()->active()->create(['name' => 'Active Brand']);
        Brand::factory()->inactive()->create(['name' => 'Inactive Brand']);

        $response = $this->getJson('/api/v1/brands');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
        $this->assertEquals('Active Brand', $response->json('data.0.name'));
    }

    public function test_brand_list_excludes_soft_deleted_brands(): void
    {
        $brand = Brand::factory()->active()->create();
        $brand->delete();

        $response = $this->getJson('/api/v1/brands');

        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_brand_list_is_ordered_by_sort_order_then_name(): void
    {
        // ✅ عمداً sort_order برعکس ترتیب الفبایی چیده شده تا تست واقعاً
        // sort_order را بسنجد، نه اینکه به‌طور تصادفی با orderBy('name')ی
        // قدیمی هم‌ترتیب دربیاید (اگر اسم‌ها به‌گونه‌ای انتخاب می‌شدند که
        // ترتیب الفبایی و ترتیب sort_order یکی از آب دربیاید، این تست حتی
        // بدون فیکس هم پاس می‌شد و چیزی را ثابت نمی‌کرد).
        Brand::factory()->active()->create(['name' => 'Zebra Co', 'sort_order' => 0]);
        Brand::factory()->active()->create(['name' => 'Beta Co', 'sort_order' => 1]);
        Brand::factory()->active()->create(['name' => 'Alpha Co', 'sort_order' => 2]);

        $response = $this->getJson('/api/v1/brands');

        $names = collect($response->json('data'))->pluck('name')->all();
        // بر اساس sort_order: Zebra(۰) → Beta(۱) → Alpha(۲) — دقیقاً برعکسِ
        // چیزی که orderBy('name') به‌تنهایی تولید می‌کرد.
        $this->assertEquals(['Zebra Co', 'Beta Co', 'Alpha Co'], $names);
    }

    public function test_brand_list_exposes_accurate_products_count(): void
    {
        $brand = Brand::factory()->active()->create();
        Product::factory()->count(3)->create(['brand_id' => $brand->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/brands');

        $response->assertStatus(200);
        $this->assertEquals(3, $response->json('data.0.products_count'));
    }

    public function test_brand_list_reflects_real_verification_state(): void
    {
        Brand::factory()->active()->create(['name' => 'Verified Co', 'verified_at' => now()]);
        Brand::factory()->active()->create(['name' => 'Unverified Co', 'verified_at' => null]);

        $response = $this->getJson('/api/v1/brands');

        $byName = collect($response->json('data'))->keyBy('name');
        $this->assertTrue($byName['Verified Co']['is_verified']);
        $this->assertFalse($byName['Unverified Co']['is_verified']);
    }

    // ==================== GET /brands/{brand} ====================

    public function test_can_show_active_brand_by_id(): void
    {
        $brand = Brand::factory()->active()->create(['name' => 'Sony']);

        $response = $this->getJson("/api/v1/brands/{$brand->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['id' => $brand->id, 'name' => 'Sony'],
            ]);
    }

    public function test_show_returns_404_for_inactive_brand(): void
    {
        $brand = Brand::factory()->inactive()->create();

        $response = $this->getJson("/api/v1/brands/{$brand->id}");

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_soft_deleted_brand(): void
    {
        $brand = Brand::factory()->active()->create();
        $brandId = $brand->id;
        $brand->delete();

        $response = $this->getJson("/api/v1/brands/{$brandId}");

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_nonexistent_brand(): void
    {
        $response = $this->getJson('/api/v1/brands/999999');

        $response->assertStatus(404);
    }

    public function test_show_exposes_accurate_live_products_count(): void
    {
        $brand = Brand::factory()->active()->create(['products_count' => 999]);
        Product::factory()->count(2)->create(['brand_id' => $brand->id, 'is_active' => true]);

        $response = $this->getJson("/api/v1/brands/{$brand->id}");

        // ✅ باید از loadCount زنده بیاید، نه ستون خام DB (که عمداً ۹۹۹
        // ست شده تا اگر fallback به ستون خام رخ دهد تست واقعاً fail شود)
        $this->assertEquals(2, $response->json('data.products_count'));
    }

    public function test_show_response_does_not_expose_raw_products_list(): void
    {
        $brand = Brand::factory()->active()->create();
        Product::factory()->create(['brand_id' => $brand->id, 'is_active' => true]);

        $response = $this->getJson("/api/v1/brands/{$brand->id}");

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('products', $response->json('data'));
    }

    // ==================== GET /brands/slug/{slug} ====================

    public function test_can_show_active_brand_by_slug(): void
    {
        $brand = Brand::factory()->active()->create(['name' => 'Apple', 'slug' => 'apple']);

        $response = $this->getJson('/api/v1/brands/slug/apple');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['id' => $brand->id, 'slug' => 'apple'],
            ]);
    }

    public function test_show_by_slug_returns_404_for_invalid_slug(): void
    {
        $response = $this->getJson('/api/v1/brands/slug/does-not-exist');

        $response->assertStatus(404);
    }

    public function test_show_by_slug_returns_404_for_inactive_brand(): void
    {
        Brand::factory()->inactive()->create(['slug' => 'inactive-brand']);

        $response = $this->getJson('/api/v1/brands/slug/inactive-brand');

        $response->assertStatus(404);
    }

    public function test_show_by_slug_exposes_accurate_products_count(): void
    {
        $brand = Brand::factory()->active()->create(['slug' => 'counted-brand']);
        Product::factory()->count(4)->create(['brand_id' => $brand->id, 'is_active' => true]);

        $response = $this->getJson('/api/v1/brands/slug/counted-brand');

        $response->assertStatus(200);
        $this->assertEquals(4, $response->json('data.products_count'));
    }
}
