<?php

namespace Tests\Feature\Api;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ Brand Detail فاز ۲: این صفحه محصولات برند را از همان
 * GET /api/v1/products?brand_id={id} موجود می‌گیرد (بدون هیچ endpoint
 * جدید) — ولی این ترکیب دقیق (brand_id + صفحه‌بندی واقعی + فیلتر
 * دسته‌بندی/قیمت هم‌زمان) قبلاً هیچ تست مستقیمی نداشت. این فایل دقیقاً
 * همان چیزی را می‌سنجد که فاز ۲ صراحتاً خواسته: «Test with enough
 * products to prove pagination actually occurs.»
 */
class BrandProductsPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_brand_products_are_paginated_with_real_backend_pagination(): void
    {
        $brand = Brand::factory()->active()->create();
        Product::factory()->count(12)->create(['brand_id' => $brand->id, 'is_active' => true]);

        $page1 = $this->getJson("/api/v1/products?brand_id={$brand->id}&per_page=5");
        $page1->assertStatus(200);
        $this->assertCount(5, $page1->json('data'));
        $this->assertEquals(12, $page1->json('meta.total'));
        $this->assertEquals(3, $page1->json('meta.last_page'));
        $this->assertEquals(1, $page1->json('meta.current_page'));

        $page2 = $this->getJson("/api/v1/products?brand_id={$brand->id}&per_page=5&page=2");
        $page2->assertStatus(200);
        $this->assertCount(5, $page2->json('data'));
        $this->assertEquals(2, $page2->json('meta.current_page'));

        // ✅ صفحه‌ی دوم باید محصولات متفاوتی از صفحه‌ی اول برگرداند —
        // اثبات واقعی اینکه صفحه‌بندی واقعاً رخ می‌دهد، نه اینکه هر دو
        // درخواست همان ۵ محصول اول را برگردانند.
        $page1Ids = collect($page1->json('data'))->pluck('id')->all();
        $page2Ids = collect($page2->json('data'))->pluck('id')->all();
        $this->assertEmpty(array_intersect($page1Ids, $page2Ids));
    }

    public function test_brand_products_can_be_filtered_by_category_within_the_brand(): void
    {
        $brand = Brand::factory()->active()->create();
        $categoryA = Category::factory()->create();
        $categoryB = Category::factory()->create();

        Product::factory()->count(3)->create([
            'brand_id' => $brand->id, 'category_id' => $categoryA->id, 'is_active' => true,
        ]);
        Product::factory()->count(2)->create([
            'brand_id' => $brand->id, 'category_id' => $categoryB->id, 'is_active' => true,
        ]);
        // محصول برند دیگر با همان دسته — نباید در نتیجه بیاید.
        $otherBrand = Brand::factory()->active()->create();
        Product::factory()->create([
            'brand_id' => $otherBrand->id, 'category_id' => $categoryA->id, 'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/products?brand_id={$brand->id}&category_id={$categoryA->id}");

        $response->assertStatus(200);
        $this->assertEquals(3, $response->json('meta.total'));
        // ✅ ProductResource برند/دسته را تودرتو serialize می‌کند
        // (brand.id/category.id)، نه ستون خام brand_id/category_id.
        foreach ($response->json('data') as $product) {
            $this->assertEquals($brand->id, $product['brand']['id']);
            $this->assertEquals($categoryA->id, $product['category']['id']);
        }
    }

    public function test_brand_products_respect_price_range_filter(): void
    {
        $brand = Brand::factory()->active()->create();
        Product::factory()->create(['brand_id' => $brand->id, 'is_active' => true, 'price' => 50000]);
        Product::factory()->create(['brand_id' => $brand->id, 'is_active' => true, 'price' => 150000]);
        Product::factory()->create(['brand_id' => $brand->id, 'is_active' => true, 'price' => 500000]);

        $response = $this->getJson("/api/v1/products?brand_id={$brand->id}&min_price=100000&max_price=200000");

        $response->assertStatus(200)->assertJsonCount(1, 'data');
        $this->assertEquals(150000, $response->json('data.0.price'));
    }

    public function test_brand_products_exclude_inactive_products(): void
    {
        $brand = Brand::factory()->active()->create();
        Product::factory()->create(['brand_id' => $brand->id, 'is_active' => true, 'name' => 'Active One']);
        Product::factory()->create(['brand_id' => $brand->id, 'is_active' => false, 'name' => 'Inactive One']);

        $response = $this->getJson("/api/v1/products?brand_id={$brand->id}");

        $response->assertStatus(200)->assertJsonCount(1, 'data');
        $this->assertEquals('Active One', $response->json('data.0.name'));
    }
}
