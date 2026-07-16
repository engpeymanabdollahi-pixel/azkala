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
        // مرحله ۱: ساخت برند
        $brand = DeviceBrand::factory()->create([
            'name' => 'Samsung',
            'slug' => 'samsung'
        ]);

        // مرحله ۲: ساخت سری با اتصال صریح به برند
        $series = DeviceSeries::factory()->create([
            'brand_id' => $brand->id, // استفاده از id واقعی
            'name' => 'Galaxy S',
            'slug' => 'galaxy-s'
        ]);

        // مرحله ۳: ساخت مدل با اتصال صریح به سری
        $model = DeviceModel::factory()->create([
            'series_id' => $series->id, // استفاده از id واقعی
            'name' => 'S24 Ultra',
            'slug' => 's24-ultra'
        ]);

        // مرحله ۴: ساخت محصول سازگار
        $compatibleProduct = Product::factory()->create(['name' => 'Case S24 Ultra']);
        ProductDeviceCompatibility::create([
            'product_id' => $compatibleProduct->id,
            'device_model_id' => $model->id
        ]);

        // مرحله ۵: ساخت محصول ناسازگار
        $incompatibleProduct = Product::factory()->create(['name' => 'Case S23 Ultra']);

        // مرحله ۶: درخواست API
        $response = $this->getJson('/api/products?device_model_id=' . $model->id);

        // مرحله ۷: بررسی پاسخ
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['name' => 'Case S24 Ultra']);
    }

    public function test_products_endpoint_returns_all_if_no_device_selected(): void
    {
        Product::factory()->count(3)->create();

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }
}