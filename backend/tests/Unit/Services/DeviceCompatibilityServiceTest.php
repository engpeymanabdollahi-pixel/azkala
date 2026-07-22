<?php

namespace Tests\Unit\Services;

use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use App\Services\DeviceCompatibilityService; // ✅ ایمپورت سرویس
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceCompatibilityServiceTest extends TestCase
{
    use RefreshDatabase;

    protected DeviceCompatibilityService $compatibilityService;
    protected int $modelId;
    protected int $productId;
    protected int $unlinkedModelId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->compatibilityService = new DeviceCompatibilityService();

        $category = Category::factory()->create();
        $brand = DeviceBrand::create(['name' => 'Test', 'slug' => 'test', 'is_active' => 1]);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'Test', 'slug' => 'test']);
        
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'Model A', 'slug' => 'model-a', 'release_year' => 2023]);
        $this->modelId = $model->id;

        $unlinkedModel = DeviceModel::create(['series_id' => $series->id, 'name' => 'Model B', 'slug' => 'model-b', 'release_year' => 2023]);
        $this->unlinkedModelId = $unlinkedModel->id;

        $product = Product::factory()->create(['category_id' => $category->id, 'is_active' => true]);
        $this->productId = $product->id;
        
        // لینک کردن محصول به مدل
        $product->deviceModels()->attach($this->modelId);
    }

        public function test_get_compatible_products_returns_only_matching_items(): void
    {
        $products = $this->compatibilityService->getCompatibleProducts($this->modelId);
        
        // ✅ استفاده از assertIsIterable به جای assertIsArray برای پشتیبانی از Collectionهای لاراول
        $this->assertIsIterable($products);
        $this->assertCount(1, $products); // چون در setUp فقط ۱ محصول را لینک کردیم
    }

    public function test_is_compatible_returns_true_for_linked_product(): void
    {
        $result = $this->compatibilityService->isCompatible($this->productId, $this->modelId);
        $this->assertTrue($result);
    }

    public function test_is_compatible_returns_false_for_unlinked_product(): void
    {
        $result = $this->compatibilityService->isCompatible($this->productId, $this->unlinkedModelId);
        $this->assertFalse($result);
    }
}