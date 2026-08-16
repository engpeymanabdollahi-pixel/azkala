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
     * ✅ رگرسیون واقعی: GET /api/v1/products/featured → 500.
     *
     * علت واقعی: نسخه‌ی قبلی ProductService::getFeaturedProducts کل
     * Collection مدل‌های Eloquent (با روابط) را مستقیماً Cache::remember
     * می‌کرد. درایور کش این پروژه 'database' است، یعنی مقدار با
     * serialize() خام PHP در جدول cache ذخیره می‌شود. بازتولید مستقیم
     * (خارج از این تست، در دو پردازش PHP جدا — دقیقاً معادل دو
     * PHP-FPM worker متفاوت که یک درخواست واقعی HTTP رویشان می‌رود)
     * نشان داد unserialize() این گراف پیچیده در یک پردازش تازه با
     * خطای "incomplete object... was loaded before unserialize()"
     * می‌شکند؛ یعنی درخواست اول (cache miss) کار می‌کرد، درخواست دوم
     * (cache hit) ۵۰۰ می‌داد.
     *
     * چون این خطا فقط بین دو پردازش PHP جدا رخ می‌دهد (کلاس‌ها در همان
     * پردازش PHPUnit از قبل autoload شده‌اند)، این تست خودِ آن exception
     * را نمی‌تواند بازتولید کند — به‌جایش عاملِ ریشه‌ای را مستقیم تضمین
     * می‌کند: مقدار خام ذخیره‌شده در جدول cache هرگز نباید یک آبجکت
     * serialize‌شده باشد (نشانگر "O:" در ابتدای رشته‌ی serialize شده‌ی
     * PHP)، فقط باید یک آرایه‌ی ساده باشد — دقیقاً چیزی که فیکس
     * (کش‌کردن فقط ID ها، نه مدل‌ها) تضمین می‌کند.
     */
    public function test_featured_products_cache_never_stores_a_serialized_object(): void
    {
        // ✅ phpunit.xml کش تست را روی 'array' ست کرده (درست برای سرعت
        // بقیه‌ی تست‌ها) — ولی همان دلیلی است که این باگ تولید هرگز با
        // هیچ تست موجودی گرفته نمی‌شد: درایور 'array' اصلاً چیزی روی
        // جدول cache نمی‌نویسد (serialize/unserialize واقعی هم در کار
        // نیست). اینجا صراحتاً همان درایوری که production واقعاً استفاده
        // می‌کند (config/cache.php → CACHE_STORE=database) موقتاً فعال
        // می‌شود تا این تست واقعاً همان مسیر کد را بسنجد.
        config(['cache.default' => 'database']);

        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        Product::factory()->count(3)->create([
            'is_active' => true, 'is_featured' => true, 'seller_id' => $seller->id,
        ]);

        Cache::store('database')->flush();
        $this->getJson('/api/v1/products/featured')->assertStatus(200);

        $cachedRows = DB::table('cache')->where('key', 'like', '%featured%')->pluck('value', 'key');

        $this->assertNotEmpty($cachedRows, 'انتظار می‌رفت getFeaturedProducts چیزی در جدول cache بنویسد.');

        // ✅ DatabaseStore::serialize فقط وقتی مقدار سریالایزشده حاوی
        // بایت null باشد (دقیقاً همان چیزی که سریالایز یک آبجکت Eloquent
        // با propertyهای protected/private تولید می‌کند) آن را
        // base64_encode می‌کند؛ یک آرایه‌ی ساده‌ی int هرگز بایت null ندارد
        // و دست‌نخورده ذخیره می‌شود. همان تشخیص را که خودِ
        // DatabaseStore::unserialize موقع خواندن انجام می‌دهد اینجا هم
        // تکرار می‌شود: اگر رشته حاوی ':' یا ';' (نشانگرهای واقعی فرمت
        // serialize PHP) نباشد، یعنی base64 است.
        foreach ($cachedRows as $key => $rawValue) {
            $looksLikeBase64 = ! str_contains($rawValue, ':') && ! str_contains($rawValue, ';');
            $decoded = $looksLikeBase64 ? base64_decode($rawValue, true) : $rawValue;
            $this->assertNotFalse($decoded, "کلید کش '{$key}' base64 معتبر نیست.");

            $this->assertStringStartsNotWith(
                'O:',
                $decoded,
                "کلید کش '{$key}' یک آبجکت serialize‌شده ذخیره کرده — دقیقاً همان الگویی که باعث ۵۰۰ در unserialize() روی یک پردازش PHP تازه می‌شد."
            );
        }
    }

    /**
     * ✅ درخواست دوم (cache hit، بدون Cache::flush بین دو فراخوانی) باید
     * دقیقاً همان ۲۰۰ و همان تعداد محصول را برگرداند — این دقیقاً همان
     * مسیری است که در production واقعاً ۵۰۰ می‌داد (چون درخواست دوم از
     * کش خوانده می‌شد، نه fresh compute).
     */
    public function test_featured_products_returns_200_on_repeated_cached_request(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        Product::factory()->count(3)->create([
            'is_active' => true, 'is_featured' => true, 'seller_id' => $seller->id,
        ]);

        Cache::flush();
        $this->getJson('/api/v1/products/featured')->assertStatus(200)->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/products/featured')->assertStatus(200)->assertJsonCount(3, 'data');
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
