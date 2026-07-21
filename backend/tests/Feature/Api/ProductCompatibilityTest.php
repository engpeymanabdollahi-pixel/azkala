<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    protected int $modelAId;
    protected int $modelBId;
    protected Product $compatibleProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::factory()->create();

        $brand = DeviceBrand::create([
            'name' => 'Apple',
            'slug' => 'apple-' . uniqid(),
            'is_active' => 1,
        ]);

        $series = DeviceSeries::create([
            'brand_id' => $brand->id,
            'name' => 'iPhone',
            'slug' => 'iphone-' . uniqid(),
        ]);

        $this->modelAId = DeviceModel::create([
            'series_id' => $series->id,
            'name' => 'iPhone 13',
            'slug' => 'iphone13-' . uniqid(),
            'release_year' => 2021,
        ])->id;

        $this->modelBId = DeviceModel::create([
            'series_id' => $series->id,
            'name' => 'iPhone 14',
            'slug' => 'iphone14-' . uniqid(),
            'release_year' => 2022,
        ])->id;

        // ساخت محصول و اطمینان از is_active
        $this->compatibleProduct = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'گلس آیفون ۱۳',
        ]);
        $this->compatibleProduct->update(['is_active' => true]);
        $this->compatibleProduct->deviceModels()->attach($this->modelAId);
    }

    public function test_product_list_shows_is_compatible_true(): void
    {
        $response = $this->getJson('/api/products?device_model_id=' . $this->modelAId);
        $response->assertStatus(200);

        // پشتیبانی از همه ساختارهای ممکن
        $data = $response->json('data');
        $products = $data['data'] ?? $data;

        // اگر هنوز آرایه نیست، dump برای دیباگ
        if (!is_array($products) || empty($products)) {
            $response->dump();
            $this->fail('Products array is empty or invalid structure');
        }

        $target = collect($products)->firstWhere(fn($p) => ($p['id'] ?? null) == $this->compatibleProduct->id);

        $this->assertNotNull($target, 'Product with ID ' . $this->compatibleProduct->id . ' not found in list');
        $this->assertTrue($target['is_compatible'] ?? false, 'is_compatible should be true');
    }

    public function test_product_list_shows_is_compatible_false(): void
    {
        $response = $this->getJson('/api/products?device_model_id=' . $this->modelBId);
        $response->assertStatus(200);

        $data = $response->json('data');
        $products = $data['data'] ?? $data;

        if (!is_array($products) || empty($products)) {
            $response->dump();
            $this->fail('Products array is empty or invalid structure');
        }

        $target = collect($products)->firstWhere(fn($p) => ($p['id'] ?? null) == $this->compatibleProduct->id);

        $this->assertNotNull($target, 'Product with ID ' . $this->compatibleProduct->id . ' not found in list');
        $this->assertFalse($target['is_compatible'] ?? true, 'is_compatible should be false');
    }

    public function test_product_detail_returns_compatible_models(): void
    {
        $response = $this->getJson('/api/products/slug/' . $this->compatibleProduct->slug);
        $response->assertStatus(200);

        $response->assertJsonFragment([
            'id' => $this->modelAId,
            'name' => 'iPhone 13',
        ]);
    }
}