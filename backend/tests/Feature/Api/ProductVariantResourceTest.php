<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Variant/Color System فاز ۲.۱ — گسترش افزایشی ProductResource.
 *
 * GET /api/v1/products (index) تنها مسیر عمومی است که فعلاً واقعاً از
 * ProductResource + eager-load شده‌ی variants (طبق تصمیم صریح این فاز، فقط
 * ProductRepository::getActiveProducts) عبور می‌کند؛ GET /products/{id}
 * (show) عمداً variants را eager-load نمی‌کند (تصمیم دامنه‌ی همین فاز) و
 * GET /products/slug/{slug} اصلاً از ProductResource عبور نمی‌کند — یک باگ
 * از قبل موجود و کاملاً بی‌ربط به این فاز (ProductController::bySlug فقط
 * وقتی $result['product'] یک instanceof Product باشد آن را با
 * ProductResource می‌پیچد؛ اما ProductService::getProductBySlug همیشه
 * toArray() را برمی‌گرداند، نه خودِ مدل — پس آن شرط هرگز true نمی‌شود).
 * این تست‌ها عمداً روی مسیر واقعی (index) تمرکز دارند، نه رفتار فرضی.
 */
class ProductVariantResourceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * سناریوی ۱: محصول بدون variant — رفتار قبلی ProductResource
     * (price/compare_price/discount_price/final_price/stock/sku) دست‌نخورده
     * می‌ماند، و کلیدهای جدید به‌شکل امن (نه غایب) اضافه شده‌اند.
     */
    public function test_product_without_variants_keeps_legacy_fields_and_reports_no_variants(): void
    {
        $product = Product::factory()->create([
            'is_active' => true,
            'price' => 250000,
            'compare_price' => 300000,
            'stock' => 12,
            'sku' => 'LEGACY-NO-VARIANT',
        ]);

        $response = $this->getJson('/api/v1/products?per_page=10');

        $response->assertStatus(200);

        $row = collect($response->json('data'))->firstWhere('id', $product->id);

        $this->assertNotNull($row, 'محصول تازه‌ساخته در پاسخ لیست یافت نشد.');

        // ✅ فیلدهای قدیمی دقیقاً همان قبل — کاملاً دست‌نخورده
        $this->assertEquals(250000.0, $row['price']);
        $this->assertEquals(300000.0, $row['compare_price']);
        $this->assertSame(12, $row['stock']);
        $this->assertSame('LEGACY-NO-VARIANT', $row['sku']);
        $this->assertEquals(250000.0, $row['final_price']);

        // ✅ کلیدهای جدید همیشه حاضرند، نه یک کلید غایب
        $this->assertArrayHasKey('has_variants', $row);
        $this->assertArrayHasKey('variants', $row);
        $this->assertFalse($row['has_variants']);
        $this->assertSame([], $row['variants']);
    }

    /**
     * سناریوی ۲: محصولی با چند variant — رنگ‌ها با فیلدهای درست (شامل
     * قیمت/موجودی مستقل هر رنگ) در پاسخ برمی‌گردند، بدون اینکه فیلدهای
     * سطح-محصول (price/stock اصلی) تغییری کنند.
     */
    public function test_product_with_variants_returns_them_correctly_without_altering_product_level_fields(): void
    {
        $product = Product::factory()->create([
            'is_active' => true,
            'price' => 500000,
            'stock' => 20,
        ]);

        $black = $product->variants()->create([
            'color_name' => 'مشکی',
            'color_code' => '#000000',
            'sku' => 'VAR-BLACK-1',
            'price' => 520000,
            'stock' => 10,
        ]);
        $white = $product->variants()->create([
            'color_name' => 'سفید',
            'color_code' => '#FFFFFF',
            'sku' => 'VAR-WHITE-1',
            'price' => 510000,
            'stock' => 4,
        ]);

        $response = $this->getJson('/api/v1/products?per_page=10');

        $response->assertStatus(200);

        $row = collect($response->json('data'))->firstWhere('id', $product->id);
        $this->assertNotNull($row);

        // فیلدهای سطح-محصول دست‌نخورده
        $this->assertEquals(500000.0, $row['price']);
        $this->assertSame(20, $row['stock']);

        $this->assertTrue($row['has_variants']);
        $this->assertCount(2, $row['variants']);

        $variantSkus = collect($row['variants'])->pluck('sku')->all();
        $this->assertContains('VAR-BLACK-1', $variantSkus);
        $this->assertContains('VAR-WHITE-1', $variantSkus);

        $blackRow = collect($row['variants'])->firstWhere('sku', 'VAR-BLACK-1');
        $whiteRow = collect($row['variants'])->firstWhere('sku', 'VAR-WHITE-1');

        // سناریوهای ۱۰ و ۱۱: قیمت و موجودی مستقل هر رنگ
        $this->assertEquals(520000.0, $blackRow['price']);
        $this->assertSame(10, $blackRow['stock']);
        $this->assertEquals(510000.0, $whiteRow['price']);
        $this->assertSame(4, $whiteRow['stock']);
        $this->assertNotEquals($blackRow['price'], $whiteRow['price']);
        $this->assertNotEquals($blackRow['stock'], $whiteRow['stock']);

        $this->assertSame('#000000', $blackRow['color_code']);
        $this->assertTrue($blackRow['is_in_stock']);
    }

    /**
     * سناریوی ۱۵: تعداد کوئری‌ها هنگام سریالایز کردن variants نباید با
     * تعداد محصولات (یا تعداد variant های هر محصول) رشد کند — دقیقاً همان
     * الگوی ProductListQueryCountTest برای seller/images/deviceModels.
     */
    public function test_variant_serialization_does_not_grow_query_count_with_product_or_variant_count(): void
    {
        $countQueries = function (callable $call): int {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $call();
            $count = count(DB::getQueryLog());
            DB::disableQueryLog();

            return $count;
        };

        $makeProductsWithVariants = function (int $productCount, int $variantsPerProduct): void {
            $products = Product::factory()->count($productCount)->create(['is_active' => true]);
            foreach ($products as $product) {
                for ($i = 0; $i < $variantsPerProduct; $i++) {
                    $product->variants()->create([
                        'color_name' => 'رنگ ' . $i,
                        'sku' => 'QC-' . $product->id . '-' . $i,
                        'price' => 100000 + $i,
                        'stock' => $i,
                    ]);
                }
            }
        };

        $makeProductsWithVariants(2, 3);
        $few = $countQueries(fn () => $this->getJson('/api/v1/products?per_page=50')->assertStatus(200));

        $makeProductsWithVariants(18, 3);
        $many = $countQueries(fn () => $this->getJson('/api/v1/products?per_page=50')->assertStatus(200));

        $this->assertSame(
            $few,
            $many,
            "GET /products با variants: {$few} کوئری برای ۲ محصول ولی {$many} کوئری برای ۲۰ محصول — یعنی variants به‌ازای هر ردیف lazy-load می‌شود."
        );
    }
}
