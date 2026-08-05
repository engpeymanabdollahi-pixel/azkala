<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * GET /sellers/top — بخش «فروشگاه‌های برتر» صفحه‌ی اصلی.
 */
class TopSellersTest extends TestCase
{
    use RefreshDatabase;

    private function makeSeller(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'seller',
            'is_active' => true,
            'slug' => 'shop-'.uniqid(),
            'products_count' => 1,
            'seller_rating' => 0,
            'followers_count' => 0,
        ], $overrides));
    }

    public function test_it_orders_by_rating_then_followers(): void
    {
        $low = $this->makeSeller(['shop_name' => 'کم‌امتیاز', 'seller_rating' => 3.0, 'followers_count' => 500]);
        $high = $this->makeSeller(['shop_name' => 'پرامتیاز', 'seller_rating' => 4.9, 'followers_count' => 10]);

        $response = $this->getJson('/api/v1/sellers/top')->assertOk();

        $names = collect($response->json('data'))->pluck('shop_name');

        $this->assertSame(
            [$high->shop_name, $low->shop_name],
            $names->take(2)->all()
        );
    }

    public function test_sellers_with_no_products_are_excluded(): void
    {
        $empty = $this->makeSeller(['products_count' => 0]);

        $response = $this->getJson('/api/v1/sellers/top')->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($empty->id));
    }

    public function test_inactive_sellers_are_excluded(): void
    {
        $inactive = $this->makeSeller(['is_active' => false]);

        $response = $this->getJson('/api/v1/sellers/top')->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($inactive->id));
    }

    /**
     * /top باید قبل از /{slug} ثبت شده باشد. اگر جای این دو عوض شود، لاراول
     * «top» را به‌عنوان اسلاگ یک فروشنده تفسیر می‌کند و PublicSellerService
     * چون چنین فروشنده‌ای وجود ندارد ۴۰۴ برمی‌گرداند — نه لیست فروشگاه‌های برتر.
     */
    public function test_top_route_is_not_shadowed_by_the_slug_wildcard(): void
    {
        $this->makeSeller();

        $response = $this->getJson('/api/v1/sellers/top');

        $response->assertOk();
        $response->assertJsonStructure(['success', 'data']);
    }

    public function test_limit_is_capped(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->makeSeller();
        }

        $response = $this->getJson('/api/v1/sellers/top?limit=2')->assertOk();

        $this->assertCount(2, $response->json('data'));
    }
}
