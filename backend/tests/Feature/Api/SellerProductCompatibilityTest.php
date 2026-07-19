<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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
        
        // ✅ خاموش کردن Foreign Key برای جلوگیری از خطای SQLite
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        }

        $this->seller = User::factory()->create(['role' => 'seller']);
        $this->category = Category::factory()->create();

        // ✅ استفاده مستقیم از DB::table() برای درج قطعی
        $brandId = DB::table('device_brands')->insertGetId([
            'name' => 'Samsung',
            'slug' => 'samsung-test-' . uniqid(),
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $seriesId = DB::table('device_series')->insertGetId([
            'brand_id' => $brandId,
            'name' => 'Galaxy',
            'slug' => 'galaxy-test-' . uniqid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->modelAId = DB::table('device_models')->insertGetId([
            'series_id' => $seriesId,
            'name' => 'Galaxy A54',
            'slug' => 'a54-test-' . uniqid(),
            'release_year' => 2023,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->modelBId = DB::table('device_models')->insertGetId([
            'series_id' => $seriesId,
            'name' => 'Galaxy S24',
            'slug' => 's24-test-' . uniqid(),
            'release_year' => 2024,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function tearDown(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        }
        parent::tearDown();
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

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $productId = $response->json('data.id');

        $this->assertDatabaseHas('device_model_product', [
            'product_id' => $productId,
            'device_model_id' => $this->modelAId,
        ]);
        $this->assertDatabaseHas('device_model_product', [
            'product_id' => $productId,
            'device_model_id' => $this->modelBId,
        ]);
    }

    public function test_seller_can_update_product_device_models(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'category_id' => $this->category->id,
        ]);
        $product->deviceModels()->attach($this->modelAId);

        $payload = [
            'name' => 'کاور محافظ گوشی (ویرایش شده)',
            'price' => 160000,
            'device_model_ids' => [$this->modelBId],
        ];

        $response = $this->actingAs($this->seller, 'sanctum')
                         ->putJson("/api/seller/products/{$product->id}", $payload);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

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

        $payload = [
            'name' => 'تلاش برای هک',
            'device_model_ids' => [$this->modelAId],
        ];

        $response = $this->actingAs($this->seller, 'sanctum')
                         ->putJson("/api/seller/products/{$product->id}", $payload);

        $response->assertStatus(403)
                 ->assertJsonPath('success', false);
    }
}