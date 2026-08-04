<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

    public function test_special_offers_query_count_does_not_grow_with_the_number_of_products(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        $make = fn (int $n) => Product::factory()->count($n)->create([
            'is_active' => true, 'is_special_offer' => true, 'seller_id' => $seller->id,
        ]);

        $make(2);
        $few = $this->countQueries(fn () => $this->getJson('/api/v1/products/special-offers')->assertStatus(200));

        $make(8);
        $many = $this->countQueries(fn () => $this->getJson('/api/v1/products/special-offers')->assertStatus(200));

        $this->assertSame($few, $many, "GET /products/special-offers: {$few} queries for 2, {$many} for 10.");
    }

    /**
     * getFeaturedProducts() caches for an hour, which hid an N+1 rather than
     * fixing one: the extra per-product queries only ran on a cache miss, so a
     * naive count on the second request saw zero queries and looked perfect.
     * Both samples here are taken on the miss path, which is what a cold cache
     * or an eviction actually costs.
     */
    public function test_featured_query_count_does_not_grow_on_the_cache_miss_path(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        $make = fn (int $n) => Product::factory()->count($n)->create([
            'is_active' => true, 'is_featured' => true, 'seller_id' => $seller->id,
        ]);

        $make(2);
        Cache::flush();
        $few = $this->countQueries(fn () => $this->getJson('/api/v1/products/featured')->assertStatus(200));

        $make(8);
        Cache::flush();
        $many = $this->countQueries(fn () => $this->getJson('/api/v1/products/featured')->assertStatus(200));

        $this->assertSame($few, $many, "GET /products/featured: {$few} queries for 2, {$many} for 10.");
    }

    /**
     * my-products has its own with() in the repository, separate from the one
     * the main listing uses, so fixing that listing did not cover this.
     */
    public function test_my_products_query_count_does_not_grow_with_the_number_of_purchases(): void
    {
        $user = User::factory()->create();
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);

        $buy = function (int $n) use ($user, $seller) {
            $order = Order::factory()->create([
                'user_id' => $user->id, 'status' => 'delivered', 'payment_status' => 'paid',
            ]);
            for ($i = 0; $i < $n; $i++) {
                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'product_id' => Product::factory()->create(['is_active' => true, 'seller_id' => $seller->id])->id,
                ]);
            }
        };

        $buy(2);
        // First authenticated request also writes last_seen_at; warm up past it.
        $this->actingAs($user)->getJson('/api/v1/products/my-products');
        $few = $this->countQueries(
            fn () => $this->actingAs($user)->getJson('/api/v1/products/my-products')->assertStatus(200)
        );

        $buy(8);
        $many = $this->countQueries(
            fn () => $this->actingAs($user)->getJson('/api/v1/products/my-products')->assertStatus(200)
        );

        $this->assertSame($few, $many, "GET /products/my-products: {$few} queries for 2, {$many} for 10.");
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
