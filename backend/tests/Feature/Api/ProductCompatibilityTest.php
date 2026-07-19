<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProductCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    protected Category $category;
    protected int $modelAId;
    protected int $modelBId;
    protected Product $compatibleProduct;
    protected Product $incompatibleProduct;

    protected function setUp(): void
    {
        parent::setUp();
        
        // ✅ خاموش کردن Foreign Key
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        }

        $this->category = Category::factory()->create();

        // ✅ استفاده مستقیم از DB::table()
        $brandId = DB::table('device_brands')->insertGetId([
            'name' => 'Apple',
            'slug' => 'apple-test-' . uniqid(),
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $seriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $brandId,
            'name' => 'iPhone',
            'slug' => 'iphone-test-' . uniqid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->modelAId = DB::table('device_models')->insertGetId([
            'series_id' => $seriesId,
            'name' => 'iPhone 13',
            'slug' => 'iphone13-test-' . uniqid(),
            'release_year' => 2021,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->modelBId = DB::table('device_models')->insertGetId([
            'series_id' => $seriesId,
            'name' => 'iPhone 14',
            'slug' => 'iphone14-test-' . uniqid(),
            'release_year' => 2022,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->compatibleProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'is_active' => true,
            'name' => 'گلس آیفون ۱۳',
        ]);
        $this->compatibleProduct->deviceModels()->attach($this->modelAId);

        $this->incompatibleProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'is_active' => true,
            'name' => 'گلس آیفون ۱۵',
        ]);
    }

    protected function tearDown(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        }
        parent::tearDown();
    }

    public function test_product_list_shows_is_compatible_true(): void
    {
        $response = $this->getJson('/api/products?device_model_id=' . $this->modelAId);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $products = $response->json('data.data');
        $targetProduct = collect($products)->firstWhere('id', $this->compatibleProduct->id);
        
        $this->assertNotNull($targetProduct);
        $this->assertTrue($targetProduct['is_compatible']);
    }

    public function test_product_list_shows_is_compatible_false(): void
    {
        $response = $this->getJson('/api/products?device_model_id=' . $this->modelBId);

        $response->assertStatus(200);

        $products = $response->json('data.data');
        $targetProduct = collect($products)->firstWhere('id', $this->compatibleProduct->id);
        
        $this->assertNotNull($targetProduct);
        $this->assertFalse($targetProduct['is_compatible']);
    }

    public function test_product_detail_returns_compatible_models(): void
    {
        $response = $this->getJson('/api/products/slug/' . $this->compatibleProduct->slug);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $response->assertJsonFragment([
            'id' => $this->modelAId,
            'name' => 'iPhone 13',
        ]);
    }
}