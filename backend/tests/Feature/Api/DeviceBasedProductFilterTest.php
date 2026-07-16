<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceSeries;
use App\Models\DeviceModel;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductDeviceCompatibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceBasedProductFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_endpoint_returns_only_compatible_items(): void
    {
        // مرحله ۱: ساخت سلسله مراتب دستگاه با Factory
        $brand = DeviceBrand::factory()->create([
            'name' => 'Samsung',
            'slug' => 'samsung'
        ]);

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

        // مرحله ۲: ساخت دسته‌بندی (اجباری)
        $category = Category::factory()->create();

        // مرحله ۳: ساخت محصولات با category_id
        $compatibleProduct = Product::factory()->create([
            'name' => 'Case S24 Ultra',
            'category_id' => $category->id
        ]);

        $incompatibleProduct = Product::factory()->create([
            'name' => 'Case S23 Ultra',
            'category_id' => $category->id
        ]);

        // مرحله ۴: ایجاد رابطه سازگاری
        ProductDeviceCompatibility::create([
            'product_id' => $compatibleProduct->id,
            'device_model_id' => $model->id
        ]);

        // مرحله ۵: درخواست API
        $response = $this->getJson('/api/products?device_model_id=' . $model->id);

        // مرحله ۶: بررسی پاسخ
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['name' => 'Case S24 Ultra']);
    }

    public function test_products_endpoint_returns_all_if_no_device_selected(): void
    {
        // ساخت دسته‌بندی
        $category = Category::factory()->create();

        // ساخت محصولات با category_id
        Product::factory()->count(3)->create([
            'category_id' => $category->id
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }
}