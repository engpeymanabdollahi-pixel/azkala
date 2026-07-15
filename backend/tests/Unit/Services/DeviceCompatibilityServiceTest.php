<?php

namespace Tests\Unit\Services;

use App\Models\DeviceBrand;
use App\Models\DeviceSeries;
use App\Models\DeviceModel;
use App\Models\Product;
use App\Models\ProductDeviceCompatibility;
use App\Services\DeviceCompatibilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceCompatibilityServiceTest extends TestCase
{
    use RefreshDatabase;

    private DeviceCompatibilityService $service;
    private DeviceModel $targetModel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(DeviceCompatibilityService::class);

        $brand = DeviceBrand::create(['name' => 'Samsung', 'slug' => 'samsung']);
        $series = DeviceSeries::create(['brand_id' => $brand->id, 'name' => 'Galaxy S', 'slug' => 'galaxy-s']);
        $this->targetModel = DeviceModel::create([
            'series_id' => $series->id,
            'name' => 'Galaxy S24 Ultra',
            'slug' => 'galaxy-s24-ultra',
            'release_year' => 2024
        ]);
    }

    public function test_get_compatible_products_returns_only_matching_items(): void
    {
        $compatibleProduct = Product::factory()->create(['name' => 'Case S24 Ultra']);
        ProductDeviceCompatibility::create([
            'product_id' => $compatibleProduct->id,
            'device_model_id' => $this->targetModel->id
        ]);

        $incompatibleProduct = Product::factory()->create(['name' => 'Case S23 Ultra']);

        $result = $this->service->getCompatibleProducts($this->targetModel->id);

        $this->assertCount(1, $result);
        $this->assertEquals('Case S24 Ultra', $result->first()->name);
        $this->assertNotContains($incompatibleProduct->id, $result->pluck('id'));
    }

    public function test_is_compatible_returns_true_for_linked_product(): void
    {
        $product = Product::factory()->create();
        ProductDeviceCompatibility::create([
            'product_id' => $product->id,
            'device_model_id' => $this->targetModel->id
        ]);

        $this->assertTrue($this->service->isCompatible($product->id, $this->targetModel->id));
    }

    public function test_is_compatible_returns_false_for_unlinked_product(): void
    {
        $product = Product::factory()->create();
        $this->assertFalse($this->service->isCompatible($product->id, $this->targetModel->id));
    }
}