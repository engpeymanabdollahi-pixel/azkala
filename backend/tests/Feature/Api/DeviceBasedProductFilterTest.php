<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceSeries;
use App\Models\DeviceModel;
use App\Models\Product;
use App\Models\ProductDeviceCompatibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceBasedProductFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_endpoint_returns_only_compatible_items(): void
    {
        // ساخت سلسله مراتب دستگاه با ترتیب صحیح
        $brand = DeviceBrand::factory()->create(['name' => 'Samsung', 'slug' => 'samsung']);
        $series = DeviceSeries::factory()->create([
            'brand_id' => $brand->id,
            'name' => 'Galaxy S',
            'slug' => 'galaxy-s'
        ]);
        $model = DeviceModel::factory()->create([
            'series_id' => $series->id,
            'name' => 'S24 Ultra',
            'slug' => 's24-ultra'
        ]);

        // محصول سازگار
        $compatibleProduct = Product::factory()->create(['name' => 'Case S24 Ultra']);
        ProductDeviceCompatibility::create([
            'product_id' => $compatibleProduct->id,
            'device_model_id' => $model->id
        ]);

        // محصول ناسازگار
        $incompatibleProduct = Product::factory()->create(['name' => 'Case S23 Ultra']);

        // درخواست API
        $response = $this->getJson('/api/products?device_model_id=' . $model->id);

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['name' => 'Case S24 Ultra']);
        $response->assertJsonMissing(['name' => 'Case S23 Ultra']);
    }

    public function test_products_endpoint_returns_all_if_no_device_selected(): void
    {
        Product::factory()->count(3)->create();

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }
}