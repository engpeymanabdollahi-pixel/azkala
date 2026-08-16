<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\Store;
use App\Models\StoreHour;
use App\Models\StoreInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * GET /api/v1/products/{product}/nearby-stores — Phase 22.
 *
 * ✅ نکته‌ی مهم درباره‌ی مختصات: ۰.۰۱ درجه‌ی latitude ≈ ۱۱۱۳ متر (هر
 * درجه‌ی latitude ≈ ۱۱۱٬۳۲۰ متر، مستقل از longitude) — از همین رابطه‌ی
 * ثابت برای ساختن سناریوهای «داخل radius» / «بیرون radius» با دقت قابل
 * پیش‌بینی استفاده شده، نه یک عدد فرضی.
 */
class NearbyStoreSearchTest extends TestCase
{
    use RefreshDatabase;

    private const ORIGIN_LAT = 35.6892;

    private const ORIGIN_LNG = 51.3890;

    private function verifiedStoreWithInventory(Product $product, array $storeOverrides = [], array $inventoryOverrides = []): Store
    {
        $store = Store::factory()->verified()->create(array_merge([
            'is_active' => true,
            'latitude' => self::ORIGIN_LAT,
            'longitude' => self::ORIGIN_LNG,
        ], $storeOverrides));

        StoreInventory::create(array_merge([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock' => 5,
            'pickup_enabled' => true,
        ], $inventoryOverrides));

        return $store;
    }

    public function test_returns_store_at_exact_coordinates(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $store = $this->verifiedStoreWithInventory($product);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertOk();
        $response->assertJsonPath('data.0.id', $store->id);
        $response->assertJsonPath('meta.total', 1);
    }

    public function test_excludes_store_outside_requested_radius(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        // ✅ ۰.۰۲ درجه ≈ ۲۲۲۶ متر — با radius=1000 حتماً بیرون است.
        $this->verifiedStoreWithInventory($product, ['latitude' => self::ORIGIN_LAT + 0.02]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG.'&radius=1000');

        $response->assertOk();
        $response->assertJsonPath('meta.total', 0);
    }

    public function test_includes_store_inside_requested_radius(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        // ✅ ۰.۰۰۵ درجه ≈ ۵۵۷ متر — با radius=1000 حتماً داخل است.
        $store = $this->verifiedStoreWithInventory($product, ['latitude' => self::ORIGIN_LAT + 0.005]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG.'&radius=1000');

        $response->assertOk();
        $response->assertJsonPath('meta.total', 1);
        $response->assertJsonPath('data.0.id', $store->id);
    }

    public function test_results_are_sorted_by_distance_ascending(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $far = $this->verifiedStoreWithInventory($product, ['latitude' => self::ORIGIN_LAT + 0.02, 'name' => 'دور']);
        $near = $this->verifiedStoreWithInventory($product, ['latitude' => self::ORIGIN_LAT + 0.001, 'name' => 'نزدیک']);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG.'&radius=5000');

        $response->assertOk();
        $response->assertJsonPath('data.0.id', $near->id);
        $response->assertJsonPath('data.1.id', $far->id);
    }

    public function test_excludes_unverified_store(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $store = Store::factory()->create([ // ✅ بدون verified()، پس verified_at=null
            'is_active' => true,
            'latitude' => self::ORIGIN_LAT,
            'longitude' => self::ORIGIN_LNG,
        ]);
        StoreInventory::create(['store_id' => $store->id, 'product_id' => $product->id, 'stock' => 5, 'pickup_enabled' => true]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertOk();
        $response->assertJsonPath('meta.total', 0);
    }

    public function test_excludes_inactive_store(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $this->verifiedStoreWithInventory($product, ['is_active' => false]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertJsonPath('meta.total', 0);
    }

    public function test_excludes_zero_stock_inventory(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $this->verifiedStoreWithInventory($product, [], ['stock' => 0]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertJsonPath('meta.total', 0);
    }

    public function test_excludes_pickup_disabled_inventory(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $this->verifiedStoreWithInventory($product, [], ['pickup_enabled' => false]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertJsonPath('meta.total', 0);
    }

    public function test_excludes_inactive_product(): void
    {
        $product = Product::factory()->create(['is_active' => false]);
        $this->verifiedStoreWithInventory($product);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertJsonPath('meta.total', 0);
    }

    public function test_a_store_never_shows_a_different_products_inventory(): void
    {
        $productA = Product::factory()->create(['is_active' => true]);
        $productB = Product::factory()->create(['is_active' => true]);
        $this->verifiedStoreWithInventory($productB); // فقط برای B موجودی دارد

        $response = $this->getJson("/api/v1/products/{$productA->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertJsonPath('meta.total', 0);
    }

    public function test_rejects_invalid_latitude(): void
    {
        $product = Product::factory()->create();

        $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=999&lng=51.39")
            ->assertStatus(422);
    }

    public function test_rejects_missing_coordinates(): void
    {
        $product = Product::factory()->create();

        $this->getJson("/api/v1/products/{$product->id}/nearby-stores")
            ->assertStatus(422);
    }

    public function test_rejects_zero_or_negative_radius(): void
    {
        $product = Product::factory()->create();

        $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG.'&radius=0')
            ->assertStatus(422);
    }

    public function test_response_includes_pagination_meta(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $this->verifiedStoreWithInventory($product);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertOk();
        $response->assertJsonStructure(['success', 'data', 'meta' => ['total', 'page', 'per_page', 'radius']]);
    }

    public function test_no_results_returns_empty_array_not_an_error(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertOk();
        $response->assertJsonPath('meta.total', 0);
        $response->assertJsonCount(0, 'data');
    }

    // ==================== Store Hours — Nearby Stores Completion Phase ====================

    public function test_nearby_response_includes_store_hours(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $store = $this->verifiedStoreWithInventory($product);

        StoreHour::create(['store_id' => $store->id, 'day_of_week' => 0, 'opens_at' => '09:00', 'closes_at' => '21:00', 'is_closed' => false]);
        StoreHour::create(['store_id' => $store->id, 'day_of_week' => 5, 'opens_at' => null, 'closes_at' => null, 'is_closed' => true]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertOk();
        $hours = $response->json('data.0.hours');
        $this->assertIsArray($hours);
        $this->assertCount(2, $hours);
    }

    public function test_store_hours_returns_correct_open_and_close_times(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $store = $this->verifiedStoreWithInventory($product);
        StoreHour::create(['store_id' => $store->id, 'day_of_week' => 1, 'opens_at' => '10:00', 'closes_at' => '20:00', 'is_closed' => false]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $hour = collect($response->json('data.0.hours'))->firstWhere('day_of_week', 1);
        $this->assertNotNull($hour);
        // ✅ فقط پیشوند «HH:MM» چک می‌شود، نه رشته‌ی دقیق — چون فرمت خام
        // ستون TIME می‌تواند بسته به driver با/بدون ثانیه برگردد؛ نکته‌ی
        // اصلی این تست درستیِ مقدار است، نه فرمت داخلی DB.
        $this->assertStringStartsWith('10:00', $hour['opens_at']);
        $this->assertStringStartsWith('20:00', $hour['closes_at']);
        $this->assertFalse($hour['is_closed']);
    }

    public function test_closed_day_is_correctly_represented(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $store = $this->verifiedStoreWithInventory($product);
        StoreHour::create(['store_id' => $store->id, 'day_of_week' => 5, 'is_closed' => true]);

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $hour = collect($response->json('data.0.hours'))->firstWhere('day_of_week', 5);
        $this->assertNotNull($hour);
        $this->assertTrue($hour['is_closed']);
    }

    public function test_store_without_hours_returns_empty_hours_array(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $this->verifiedStoreWithInventory($product); // بدون هیچ ردیف StoreHour

        $response = $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG);

        $response->assertOk();
        $this->assertSame([], $response->json('data.0.hours'));
    }

    public function test_fetching_store_hours_does_not_introduce_n_plus_one_query(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $store1 = $this->verifiedStoreWithInventory($product);
        StoreHour::create(['store_id' => $store1->id, 'day_of_week' => 0, 'opens_at' => '09:00', 'closes_at' => '21:00']);

        Cache::flush();
        DB::enableQueryLog();
        $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG)->assertOk();
        $queryCountWithOneStore = count(DB::getQueryLog());
        DB::flushQueryLog();

        // ✅ حالا ۴ فروشگاه دیگر (جمعاً ۵) اضافه می‌شود، هرکدام با ساعات
        // کاری خودشان — اگر پیاده‌سازی N+1 بود، تعداد کوئری با تعداد
        // فروشگاه‌ها رشد می‌کرد. (Query log موقتاً خاموش می‌شود تا
        // INSERTهای این setup با کوئری‌های واقعیِ درخواست دوم قاطی نشوند.)
        DB::disableQueryLog();
        for ($i = 0; $i < 4; $i++) {
            $store = $this->verifiedStoreWithInventory($product, ['latitude' => self::ORIGIN_LAT + 0.0001 * ($i + 1)]);
            StoreHour::create(['store_id' => $store->id, 'day_of_week' => 0, 'opens_at' => '09:00', 'closes_at' => '21:00']);
        }

        Cache::flush(); // ✅ کلید کش قبلی نباید نتیجه‌ی این درخواست را «رایگان» کند
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson("/api/v1/products/{$product->id}/nearby-stores?lat=".self::ORIGIN_LAT.'&lng='.self::ORIGIN_LNG)->assertOk();
        $queryCountWithFiveStores = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertSame(
            $queryCountWithOneStore,
            $queryCountWithFiveStores,
            'تعداد کوئری‌های SQL نباید با افزایش تعداد فروشگاه‌های بازگشتی رشد کند (N+1).'
        );
    }
}
