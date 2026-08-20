<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use App\Models\ProductRelationship;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * ✅ Product Relationship Phase 2: مصرف عمومی «همراه این محصول»
 * (complementary_products در پاسخ GET /products/slug/{slug}) — مستقل و
 * مجزا از related_products (هم‌دسته‌ای) و از compatible_models (سازگاری
 * دستگاه).
 */
class ProductRelationshipPublicTest extends TestCase
{
    use RefreshDatabase;

    public function test_response_includes_active_complementary_products_ordered_by_sort_order(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $second = Product::factory()->create(['is_active' => true, 'name' => 'دوم']);
        $first = Product::factory()->create(['is_active' => true, 'name' => 'اول']);

        ProductRelationship::factory()->create([
            'source_product_id' => $product->id,
            'target_product_id' => $second->id,
            'sort_order' => 1,
        ]);
        ProductRelationship::factory()->create([
            'source_product_id' => $product->id,
            'target_product_id' => $first->id,
            'sort_order' => 0,
        ]);

        $response = $this->getJson("/api/v1/products/slug/{$product->slug}");

        $response->assertOk();
        $ids = collect($response->json('data.complementary_products'))->pluck('id');
        $this->assertSame([$first->id, $second->id], $ids->all());
    }

    public function test_inactive_relationship_is_hidden_from_public_response(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $target = Product::factory()->create(['is_active' => true]);

        ProductRelationship::factory()->create([
            'source_product_id' => $product->id,
            'target_product_id' => $target->id,
            'is_active' => false,
        ]);

        $response = $this->getJson("/api/v1/products/slug/{$product->slug}");

        $ids = collect($response->json('data.complementary_products'))->pluck('id');
        $this->assertFalse($ids->contains($target->id));
    }

    public function test_inactive_target_product_is_hidden_from_public_response(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $target = Product::factory()->create(['is_active' => false]);

        ProductRelationship::factory()->create([
            'source_product_id' => $product->id,
            'target_product_id' => $target->id,
        ]);

        $response = $this->getJson("/api/v1/products/slug/{$product->slug}");

        $ids = collect($response->json('data.complementary_products'))->pluck('id');
        $this->assertFalse($ids->contains($target->id));
    }

    /**
     * محصولِ مقصدِ soft-deleted نباید نشت کند — global scope حذف نرم
     * Product::query() این را خودکار تضمین می‌کند.
     */
    public function test_deleted_target_product_is_hidden_from_public_response(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $target = Product::factory()->create(['is_active' => true]);

        ProductRelationship::factory()->create([
            'source_product_id' => $product->id,
            'target_product_id' => $target->id,
        ]);

        $target->delete();

        $response = $this->getJson("/api/v1/products/slug/{$product->slug}");

        $ids = collect($response->json('data.complementary_products'))->pluck('id');
        $this->assertFalse($ids->contains($target->id));
    }

    /**
     * جهت‌داری: (A → B) به‌معنای «B مکمل A» است؛ نباید خودکار استنتاج شود
     * که «A مکمل B» هم هست.
     */
    public function test_relationship_is_directional_not_symmetric(): void
    {
        $a = Product::factory()->create(['is_active' => true]);
        $b = Product::factory()->create(['is_active' => true]);

        ProductRelationship::factory()->create([
            'source_product_id' => $a->id,
            'target_product_id' => $b->id,
        ]);

        $responseA = $this->getJson("/api/v1/products/slug/{$a->slug}");
        $responseB = $this->getJson("/api/v1/products/slug/{$b->slug}");

        $this->assertTrue(collect($responseA->json('data.complementary_products'))->pluck('id')->contains($b->id));
        $this->assertFalse(collect($responseB->json('data.complementary_products'))->pluck('id')->contains($a->id));
    }

    /**
     * Product Relationship ≠ Device Compatibility: یک محصول هم‌زمان یک
     * رابطه‌ی «مکمل» و یک سازگاری دستگاه دارد — هر دو باید مستقل و بدون
     * تداخل در پاسخ ظاهر شوند.
     */
    public function test_product_relationship_is_independent_from_device_compatibility(): void
    {
        $brand = DeviceBrand::factory()->create();
        $series = DeviceSeries::factory()->create(['brand_id' => $brand->id]);
        $deviceModel = DeviceModel::factory()->create(['series_id' => $series->id]);

        $product = Product::factory()->create(['is_active' => true]);
        $product->deviceModels()->attach($deviceModel->id);

        $complement = Product::factory()->create(['is_active' => true]);
        ProductRelationship::factory()->create([
            'source_product_id' => $product->id,
            'target_product_id' => $complement->id,
        ]);

        $response = $this->getJson("/api/v1/products/slug/{$product->slug}");

        $response->assertOk();
        $complementaryIds = collect($response->json('data.complementary_products'))->pluck('id');
        $compatibleIds = collect($response->json('data.compatible_models'))->pluck('id');

        $this->assertTrue($complementaryIds->contains($complement->id));
        $this->assertTrue($compatibleIds->contains($deviceModel->id));
        // ✅ دو دیتاست هرگز نباید قاطی شوند — مدل دستگاه هرگز در
        // complementary_products و محصول مکمل هرگز در compatible_models
        // ظاهر نمی‌شود.
        $this->assertFalse($complementaryIds->contains($deviceModel->id));
    }

    /**
     * رابطه هیچ اثری بر قیمت/موجودی محصول مبدأ ندارد.
     */
    public function test_relationship_does_not_affect_source_product_price_or_stock(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => 123456, 'stock' => 7]);
        $target = Product::factory()->create(['is_active' => true]);

        ProductRelationship::factory()->create([
            'source_product_id' => $product->id,
            'target_product_id' => $target->id,
        ]);

        $response = $this->getJson("/api/v1/products/slug/{$product->slug}");

        $this->assertEquals(123456, $response->json('data.product.price'));
        $this->assertEquals(7, $response->json('data.product.stock'));
    }

    /**
     * N+1: تعداد کوئری‌های صفحه‌ی جزئیات محصول نباید با تعداد محصولات
     * مکمل رشد کند — دقیقاً همان الگوی
     * ProductTemplatesEndpointTest::test_query_count_does_not_grow.
     */
    public function test_query_count_does_not_grow_with_number_of_complementary_products(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $one = Product::factory()->create(['is_active' => true]);
        ProductRelationship::factory()->create(['source_product_id' => $product->id, 'target_product_id' => $one->id]);

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson("/api/v1/products/slug/{$product->slug}")->assertOk();
        $few = count(DB::getQueryLog());
        DB::disableQueryLog();

        for ($i = 0; $i < 5; $i++) {
            $extra = Product::factory()->create(['is_active' => true]);
            ProductRelationship::factory()->create(['source_product_id' => $product->id, 'target_product_id' => $extra->id]);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson("/api/v1/products/slug/{$product->slug}")->assertOk();
        $many = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertSame($few, $many, 'تعداد کوئری با تعداد محصولات مکمل رشد می‌کند — یعنی جایی N+1 هست.');
    }
}
