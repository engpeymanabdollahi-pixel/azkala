<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerProductCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $seller;
    protected Category $category;
    protected int $modelAId;
    protected int $modelBId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seller = User::factory()->create(['role' => 'seller']);
        $this->category = Category::factory()->create();

        $brand = DeviceBrand::create([
            'name' => 'Samsung',
            'slug' => 'samsung-' . uniqid(),
            'is_active' => 1,
        ]);

        $series = DeviceSeries::create([
            'brand_id' => $brand->id,
            'name' => 'Galaxy',
            'slug' => 'galaxy-' . uniqid(),
        ]);

        $this->modelAId = DeviceModel::create([
            'series_id' => $series->id,
            'name' => 'Galaxy A54',
            'slug' => 'a54-' . uniqid(),
            'release_year' => 2023,
        ])->id;

        $this->modelBId = DeviceModel::create([
            'series_id' => $series->id,
            'name' => 'Galaxy S24',
            'slug' => 's24-' . uniqid(),
            'release_year' => 2024,
        ])->id;
    }

    public function test_seller_can_create_product_with_device_models(): void
    {
        $payload = [
            'name' => 'کاور محافظ گوشی',
            'description' => 'یک کاور عالی',
            'price' => 150000,
            'stock' => 50,
            'category_id' => $this->category->id,
            'device_model_ids' => [$this->modelAId, $this->modelBId],
        ];

        $response = $this->actingAs($this->seller, 'sanctum')
                         ->postJson('/api/seller/products', $payload);

        $response->assertStatus(201);

        $productId = $response->json('data.id');

        $this->assertDatabaseHas('device_model_product', [
            'product_id' => $productId,
            'device_model_id' => $this->modelAId,
        ]);
    }

    public function test_seller_can_update_product_device_models(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'category_id' => $this->category->id,
        ]);
        $product->deviceModels()->attach($this->modelAId);

        $response = $this->actingAs($this->seller, 'sanctum')
                         ->putJson("/api/seller/products/{$product->id}", [
                             'name' => 'ویرایش شده',
                             'price' => 160000,
                             'device_model_ids' => [$this->modelBId],
                         ]);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('device_model_product', [
            'product_id' => $product->id,
            'device_model_id' => $this->modelAId,
        ]);
        $this->assertDatabaseHas('device_model_product', [
            'product_id' => $product->id,
            'device_model_id' => $this->modelBId,
        ]);
    }

    public function test_seller_cannot_update_another_sellers_product(): void
    {
        $otherSeller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create(['seller_id' => $otherSeller->id]);

        $response = $this->actingAs($this->seller, 'sanctum')
                         ->putJson("/api/seller/products/{$product->id}", [
                             'name' => 'هک',
                             'device_model_ids' => [$this->modelAId],
                         ]);

        $response->assertStatus(403);
    }
}