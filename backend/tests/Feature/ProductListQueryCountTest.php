<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The product listings must issue a fixed number of queries regardless of how
 * many products come back. Counting queries is the only way to catch this:
 * the responses are byte-identical whether the relations are eager-loaded or
 * fetched one row at a time, so every ordinary assertion passes either way.
 *
 * Two regressions this guards:
 *
 *  - GET /products. ProductResource calls loadMissing('seller') per model, so
 *    with 'seller' missing from the repository's with() every product ran its
 *    own "select * from users" - 11 queries for 6 products, growing 1:1.
 *  - GET /sellers/{slug}/products. Only 'category' was eager-loaded while the
 *    resource also reads images, so product_images was queried per product.
 */
class ProductListQueryCountTest extends TestCase
{
    use RefreshDatabase;

    private function countQueries(callable $call): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $call();
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    }

    public function test_public_product_list_query_count_does_not_grow_with_the_number_of_products(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true, 'slug' => 'shop']);
        Product::factory()->count(2)->create(['is_active' => true, 'seller_id' => $seller->id]);

        $few = $this->countQueries(fn () => $this->getJson('/api/v1/products?per_page=50')->assertStatus(200));

        Product::factory()->count(18)->create(['is_active' => true, 'seller_id' => $seller->id]);

        $many = $this->countQueries(fn () => $this->getJson('/api/v1/products?per_page=50')->assertStatus(200));

        $this->assertSame(
            $few,
            $many,
            "GET /products issued {$few} queries for 2 products but {$many} for 20 - a relation is being lazy-loaded per row."
        );
    }

    public function test_seller_storefront_query_count_does_not_grow_with_the_number_of_products(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true, 'slug' => 'shop']);
        Product::factory()->count(2)->create(['is_active' => true, 'seller_id' => $seller->id]);

        $few = $this->countQueries(fn () => $this->getJson('/api/v1/sellers/shop/products')->assertStatus(200));

        Product::factory()->count(16)->create(['is_active' => true, 'seller_id' => $seller->id]);

        $many = $this->countQueries(fn () => $this->getJson('/api/v1/sellers/shop/products')->assertStatus(200));

        $this->assertSame(
            $few,
            $many,
            "GET /sellers/{slug}/products issued {$few} queries for 2 products but {$many} for 18 - a relation is being lazy-loaded per row."
        );
    }
}
