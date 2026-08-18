<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Brand Detail فاز ۲: قبل از این فیکس، ProductRepository::getActiveProducts()
 * مقادیر sort_by/sort_order را بدون هیچ اعتبارسنجی مستقیم به orderBy()
 * eloquent می‌داد — روی یک endpoint کاملاً عمومی (بدون auth).
 *
 * دو یافته‌ی جدا (هر دو با فراخوانی مستقیم Eloquent در tinker تأیید شدند،
 * نه حدس):
 *  ۱. sort_order نامعتبر (هر مقداری جز 'asc'/'desc') — این یکی واقعاً و
 *     مستقل از نوع دیتابیس کرش می‌کند: خودِ Illuminate\Database\Query\
 *     Builder::orderBy() یک InvalidArgumentException ("Order direction
 *     must be a SortDirection, asc or desc") پرتاب می‌کند، نه لایه‌ی
 *     دیتابیس. این ۵۰۰ خام واقعی و قابل‌بازتولید روی هر درایوری است.
 *  ۲. sort_by با نام ستون ناموجود — روی درایور فعلی این پروژه (SQLite،
 *     طبق .env) کرش نمی‌کند: SQLite شناسه‌ی دابل‌کوتیشن‌شده‌ای که به هیچ
 *     ستونی resolve نشود را به‌عنوان یک literal رشته‌ای تفسیر می‌کند
 *     («ORDER BY 'رشته‌ی ثابت'» یعنی sort بی‌اثر، نه خطا) — تأیید مستقیم با
 *     toSql()/tinker. یعنی این بخش امروز روی این پروژه فقط hardening
 *     دفاعی است (و مطابق همان الگوی allowedSorts که در
 *     AdminProductRepository از قبل هست)، نه یک کرش فعال — ولی روی
 *     MySQL/Postgres واقعاً کرش می‌کرد، پس فیکس هنوز کاملاً موجه است.
 *
 * فیکس یکسان (allow-list) هر دو را می‌بندد؛ تست‌های زیر هرکدام دقیقاً
 * همان چیزی را می‌سنجند که واقعاً تفاوت رفتار قبل/بعد از فیکس است.
 */
class ProductListSortSecurityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * ✅ این همان بخشی از فیکس است که واقعاً bisection-proof است — بدون
     * فیکس، این درخواست با InvalidArgumentException (۵۰۰) شکست می‌خورد،
     * مستقل از نوع دیتابیس.
     */
    public function test_invalid_sort_order_does_not_crash(): void
    {
        Product::factory()->create(['is_active' => true]);

        $response = $this->getJson('/api/v1/products?sort_by=price&sort_order=' . urlencode('DROP TABLE'));

        $response->assertStatus(200)->assertJson(['success' => true]);
    }

    /**
     * ✅ روی SQLite (درایور فعلی این پروژه) یک sort_by نامعتبر خودش کرش
     * نمی‌کند (توضیح بالا)، پس صرفِ «۲۰۰ برگشت» چیزی را ثابت نمی‌کند. آنچه
     * واقعاً قبل/بعدِ فیکس فرق می‌کند: ترتیب. بدون فیکس، SQLite این ستون
     * را به رشته‌ی ثابت تبدیل می‌کند → sort بی‌اثر → ترتیب همان ترتیب خام
     * درج در DB می‌ماند (نه created_at DESC). با فیکس، fallback صریح به
     * created_at DESC اعمال می‌شود.
     */
    public function test_invalid_sort_by_falls_back_to_deterministic_created_at_desc(): void
    {
        $older = Product::factory()->create(['is_active' => true, 'name' => 'Older', 'created_at' => now()->subDays(2)]);
        $newer = Product::factory()->create(['is_active' => true, 'name' => 'Newer', 'created_at' => now()]);

        $response = $this->getJson('/api/v1/products?sort_by=' . urlencode('nonexistent_column'));

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertEquals([$newer->id, $older->id], $ids);
    }

    /**
     * ✅ هر پنج مقدار sort_by که Brand Detail واقعاً می‌فرستد باید کار
     * کنند — همان چیزی که فاز ۲ صراحتاً می‌خواهد: «Never display a sorting
     * option that backend ignores.»
     */
    public function test_all_brand_detail_sort_options_work(): void
    {
        Product::factory()->create(['is_active' => true, 'price' => 100000, 'name' => 'B Product']);
        Product::factory()->create(['is_active' => true, 'price' => 50000, 'name' => 'A Product']);

        foreach (['created_at', 'price', 'sales_count', 'rating', 'name'] as $sortBy) {
            $response = $this->getJson("/api/v1/products?sort_by={$sortBy}&sort_order=asc");
            $response->assertStatus(200)->assertJson(['success' => true]);
        }
    }

    public function test_price_sort_actually_orders_by_price(): void
    {
        Product::factory()->create(['is_active' => true, 'price' => 300000, 'name' => 'Expensive']);
        Product::factory()->create(['is_active' => true, 'price' => 100000, 'name' => 'Cheap']);

        $response = $this->getJson('/api/v1/products?sort_by=price&sort_order=asc');

        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertEquals(['Cheap', 'Expensive'], $names);
    }
}
