<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * ✅ قبلاً SearchController برای هر فروشنده‌ی یافته‌شده (تا ۵ تا) در یک حلقه
 * دو کوئری COUNT جدا می‌زد (products_count و followers_count) — یعنی تا ۱۰
 * کوئری اضافه روی هر درخواست جستجو، فقط برای بخش فروشندگان، که با تعداد
 * فروشندگان یافته‌شده به‌صورت خطی رشد می‌کرد. withCount این را در همان
 * کوئری اصلی حل می‌کند.
 *
 * الگوی همین تست از tests/Feature/ProductListQueryCountTest.php گرفته شده.
 */
class SearchQueryCountTest extends TestCase
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

    public function test_seller_query_count_does_not_grow_with_the_number_of_matching_sellers(): void
    {
        $make = fn (int $n) => User::factory()->count($n)->create([
            'role' => 'seller',
            'is_active' => true,
            'shop_name' => 'فروشگاه تست موبایل',
        ]);

        $make(1);
        $few = $this->countQueries(
            fn () => $this->getJson('/api/v1/search/global?q=موبایل')->assertStatus(200)
        );

        $make(4);
        $many = $this->countQueries(
            fn () => $this->getJson('/api/v1/search/global?q=موبایل')->assertStatus(200)
        );

        $this->assertSame(
            $few,
            $many,
            "GET /search/global issued {$few} queries for 1 matching seller but {$many} for 5 - products_count/followers_count are being queried per row instead of via withCount()."
        );
    }
}
