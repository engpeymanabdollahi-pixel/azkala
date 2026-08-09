<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductBySlugApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_product_for_existing_slug(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->getJson("/api/v1/products/slug/{$product->slug}");

        $response->assertStatus(200)->assertJsonPath('success', true);
    }

    /**
     * ✅ قبلاً ProductService::getProductBySlug برای اسلاگ ناموجود یک
     * \Exception('محصول یافت نشد', 404) پرتاب می‌کرد — لاراول کد HTTP را از
     * HttpExceptionInterface می‌خواند نه از getCode() یک Exception عادی،
     * پس این مسیر همیشه ۵۰۰ برمی‌گرداند، دقیقاً چیزی که در لاگ‌های واقعی
     * سایت (testing.ERROR: ProductService@getProductBySlug) ثبت شده بود.
     */
    public function test_returns_a_clean_404_for_a_nonexistent_slug(): void
    {
        $response = $this->getJson('/api/v1/products/slug/this-slug-does-not-exist');

        $response->assertStatus(404);
    }
}
