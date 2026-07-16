<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DeviceBasedProductFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_endpoint_returns_only_compatible_items(): void
    {
        // مرحله ۱: ساخت مستقیم برند با insert مستقیم
        $brandId = DB::table('device_brands')->insertGetId([
            'name' => 'Samsung',
            'slug' => 'samsung',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // مرحله ۲: ساخت سری با brand_id واقعی
        $seriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $brandId,
            'name' => 'Galaxy S',
            'slug' => 'galaxy-s',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // مرحله ۳: ساخت مدل با series_id واقعی
        $modelId = DB::table('device_models')->insertGetId([
            'series_id' => $seriesId,
            'name' => 'S24 Ultra',
            'slug' => 's24-ultra',
            'release_year' => 2024,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // مرحله ۴: ساخت محصولات
        $compatibleProduct = DB::table('products')->insertGetId([
            'name' => 'Case S24 Ultra',
            'slug' => 'case-s24-ultra',
            'price' => 100000,
            'stock' => 10,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $incompatibleProduct = DB::table('products')->insertGetId([
            'name' => 'Case S23 Ultra',
            'slug' => 'case-s23-ultra',
            'price' => 90000,
            'stock' => 5,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // مرحله ۵: ایجاد رابطه سازگاری
        DB::table('product_device_compatibility')->insert([
            'product_id' => $compatibleProduct,
            'device_model_id' => $modelId,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // مرحله ۶: درخواست API
        $response = $this->getJson('/api/products?device_model_id=' . $modelId);

        // مرحله ۷: بررسی پاسخ
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['name' => 'Case S24 Ultra']);
    }

    public function test_products_endpoint_returns_all_if_no_device_selected(): void
    {
        DB::table('products')->insert([
            ['name' => 'Product 1', 'slug' => 'product-1', 'price' => 100, 'stock' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Product 2', 'slug' => 'product-2', 'price' => 200, 'stock' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Product 3', 'slug' => 'product-3', 'price' => 300, 'stock' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }
}