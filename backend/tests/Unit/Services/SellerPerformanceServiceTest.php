<?php

namespace Tests\Unit\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\SellerRating;
use App\Models\User;
use App\Services\Seller\SellerPerformanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerPerformanceServiceTest extends TestCase
{
    use RefreshDatabase;

    protected SellerPerformanceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SellerPerformanceService;
    }

    /**
     * ثابت‌کردن یک وزن روی ۱۰۰٪ و بقیه روی صفر، ساده‌ترین راه برای تست
     * جدا از هم هر مؤلفه بدون وابستگی به مقادیر پیش‌فرض بقیه‌ی وزن‌ها.
     */
    private function setOnlyWeight(string $key): void
    {
        foreach (['rating', 'success_rate', 'cancellation', 'quality', 'reliability'] as $w) {
            Setting::set("commission_weight_{$w}", $w === $key ? 100 : 0, ['group' => 'commission', 'type' => 'number']);
        }
    }

    private function makeOrderForSeller(User $seller, string $status, float $total = 100000): Order
    {
        $product = Product::factory()->create(['seller_id' => $seller->id]);
        $order = Order::factory()->create(['status' => $status, 'total' => $total]);
        $order->items()->create([
            'product_id' => $product->id,
            'seller_id' => $seller->id,
            'quantity' => 1,
            'price' => $total,
            'total' => $total,
        ]);

        return $order;
    }

    public function test_seller_with_no_history_gets_configured_default_score(): void
    {
        Setting::set('commission_new_seller_score', 17, ['group' => 'commission', 'type' => 'number']);
        $seller = User::factory()->create(['role' => 'seller']);

        $result = $this->service->calculate($seller);

        $this->assertEquals(17.0, (float) $result->score);
        $this->assertTrue($result->is_new_seller);
        $this->assertEquals(0, $result->total_orders);
    }

    public function test_rating_component_falls_back_to_neutral_when_seller_has_no_ratings_but_has_orders(): void
    {
        Setting::set('commission_neutral_rating_score', 55, ['group' => 'commission', 'type' => 'number']);
        $this->setOnlyWeight('rating');

        $seller = User::factory()->create(['role' => 'seller']);
        $this->makeOrderForSeller($seller, 'delivered');

        $result = $this->service->calculate($seller);

        $this->assertFalse($result->is_new_seller);
        $this->assertEquals(55.0, (float) $result->score);
    }

    public function test_rating_component_reflects_real_seller_ratings(): void
    {
        $this->setOnlyWeight('rating');
        $seller = User::factory()->create(['role' => 'seller']);
        $this->makeOrderForSeller($seller, 'delivered');

        SellerRating::factory()->create(['seller_id' => $seller->id, 'overall_rating' => 4.0]);
        SellerRating::factory()->create(['seller_id' => $seller->id, 'overall_rating' => 2.0]);

        $result = $this->service->calculate($seller);

        // میانگین (4+2)/2=3 از ۵ -> ۶۰٪
        $this->assertEquals(60.0, round((float) $result->score, 2));
    }

    public function test_success_rate_component_only_counts_concluded_orders(): void
    {
        $this->setOnlyWeight('success_rate');
        $seller = User::factory()->create(['role' => 'seller']);

        $this->makeOrderForSeller($seller, 'delivered');
        $this->makeOrderForSeller($seller, 'cancelled');
        // pending نباید اصلاً شمرده شود
        $this->makeOrderForSeller($seller, 'pending');
        $this->makeOrderForSeller($seller, 'processing');

        $result = $this->service->calculate($seller);

        $this->assertEquals(2, $result->total_orders); // فقط delivered+cancelled
        $this->assertEquals(1, $result->successful_orders);
        $this->assertEquals(50.0, round((float) $result->score, 2)); // 1 موفق از ۲
    }

    public function test_cancellation_component_treats_returned_same_as_cancelled(): void
    {
        $this->setOnlyWeight('cancellation');
        $seller = User::factory()->create(['role' => 'seller']);

        $this->makeOrderForSeller($seller, 'delivered');
        $this->makeOrderForSeller($seller, 'returned');

        $result = $this->service->calculate($seller);

        // ۱ لغو-مانند از ۲ سفارش -> مؤلفه‌ی عدم‌لغو = ۱۰۰ - ۵۰ = ۵۰
        $this->assertEquals(50.0, round((float) $result->score, 2));
        $this->assertEquals(1, $result->cancelled_orders);
    }

    public function test_score_is_clamped_between_zero_and_hundred(): void
    {
        // وزن‌های منفی/عجیب نباید امتیاز را از بازه‌ی ۰-۱۰۰ خارج کنند
        Setting::set('commission_weight_rating', 100, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_weight_success_rate', 0, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_weight_cancellation', 0, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_weight_quality', 0, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_weight_reliability', 0, ['group' => 'commission', 'type' => 'number']);

        $seller = User::factory()->create(['role' => 'seller']);
        $this->makeOrderForSeller($seller, 'delivered');
        SellerRating::factory()->create(['seller_id' => $seller->id, 'overall_rating' => 5.0]);

        $result = $this->service->calculate($seller);

        $this->assertLessThanOrEqual(100.0, (float) $result->score);
        $this->assertGreaterThanOrEqual(0.0, (float) $result->score);
    }

    public function test_level_is_assigned_from_commission_rules_seeded_by_migration(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        Setting::set('commission_new_seller_score', 95, ['group' => 'commission', 'type' => 'number']);

        $result = $this->service->calculate($seller);

        $this->assertEquals('platinum', $result->level);
    }

    public function test_recalculate_all_processes_every_seller_and_skips_non_sellers(): void
    {
        User::factory()->count(3)->create(['role' => 'seller']);
        User::factory()->count(2)->create(['role' => 'customer']);

        $count = $this->service->recalculateAll();

        $this->assertEquals(3, $count);
        $this->assertEquals(3, \App\Models\SellerPerformanceScore::count());
    }
}
