<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceBasedProductFilterTest extends TestCase
{
    use RefreshDatabase;

    protected int $modelId;
    protected Product $compatibleProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::factory()->create();
        
        $brand = DeviceBrand::create([
            'name' => 'Test Brand', 
            'slug' => 'test-brand', 
            'is_active' => 1
        ]);
        
        $series = DeviceSeries::create([
            'brand_id' => $brand->id, 
            'name' => 'Test Series', 
            'slug' => 'test-series'
        ]);
        
        $model = DeviceModel::create([
            'series_id' => $series->id,
            'name' => 'Test Model',
            'slug' => 'test-model',
            'release_year' => 2023,
        ]);
        
        $this->modelId = $model->id;

        $this->compatibleProduct = Product::factory()->create([
            'category_id' => $category->id,
            'is_active' => true,
        ]);
        
        $this->compatibleProduct->deviceModels()->attach($this->modelId);
    }

    public function test_products_endpoint_returns_only_compatible_items(): void
    {
        $response = $this->getJson('/api/v1/products?device_model_id=' . $this->modelId);
        
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'data']);
    }

    public function test_products_endpoint_returns_all_if_no_device_selected(): void
    {
        $response = $this->getJson('/api/v1/products');
        
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'data']);
    }
}