<?php

namespace Tests\Unit\Services;

use App\Models\Coupon;
use App\Models\User;
use App\Services\CouponService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CouponServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected CouponService $couponService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->couponService = app(CouponService::class);
    }

    public function test_coupon_is_valid_when_all_conditions_are_met(): void
    {
        $coupon = Coupon::create([
            'code' => 'TEST20',
            'type' => 'percentage',
            'value' => 20,
            'min_order_amount' => 100000,
            'usage_limit_per_user' => 10, // ✅ صریحاً تعیین شد تا با تست‌های دیگر تداخل نکند
            'is_active' => true,
        ]);

        $result = $coupon->isValidFor($this->user->id, 150000);

        $this->assertTrue($result['valid']);
        $this->assertEquals('کد معتبر است', $result['message']);
    }

    public function test_coupon_is_invalid_if_inactive(): void
    {
        $coupon = Coupon::create([
            'code' => 'INACTIVE',
            'type' => 'fixed',
            'value' => 50000,
            'is_active' => false,
        ]);

        $result = $coupon->isValidFor($this->user->id, 100000);

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('غیرفعال', $result['message']);
    }

    public function test_coupon_is_invalid_if_start_date_is_in_future(): void
    {
        $coupon = Coupon::create([
            'code' => 'FUTURE',
            'type' => 'fixed',
            'value' => 50000,
            'start_date' => now()->addDays(5),
            'is_active' => true,
        ]);

        $result = $coupon->isValidFor($this->user->id, 100000);

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('هنوز فعال نشده', $result['message']);
    }

    public function test_coupon_is_invalid_if_end_date_is_in_past(): void
    {
        $coupon = Coupon::create([
            'code' => 'EXPIRED',
            'type' => 'fixed',
            'value' => 50000,
            'end_date' => now()->subDays(1),
            'is_active' => true,
        ]);

        $result = $coupon->isValidFor($this->user->id, 100000);

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('به پایان رسیده', $result['message']);
    }

    public function test_coupon_is_invalid_if_usage_limit_reached(): void
    {
        $coupon = Coupon::create([
            'code' => 'LIMITED',
            'type' => 'fixed',
            'value' => 50000,
            'usage_limit' => 1,
            'used_count' => 1,
            'is_active' => true,
        ]);

        $result = $coupon->isValidFor($this->user->id, 100000);

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('تکمیل شده', $result['message']);
    }

    public function test_coupon_is_invalid_if_user_usage_limit_reached(): void
    {
        $coupon = Coupon::create([
            'code' => 'USERLIMIT',
            'type' => 'fixed',
            'value' => 50000,
            'usage_limit_per_user' => 1, // ✅ محدودیت روی ۱ تنظیم شد
            'is_active' => true,
        ]);

        // شبیه‌سازی استفاده قبلی کاربر
        DB::table('coupon_user')->insert([
            'coupon_id' => $coupon->id,
            'user_id' => $this->user->id,
            'discount_amount' => 50000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $result = $coupon->isValidFor($this->user->id, 100000);

        $this->assertFalse($result['valid']);
        // ✅ اصلاح رشته دقیقاً مطابق با خروجی مدل Coupon
        $this->assertStringContainsString('شما قبلاً از این کد استفاده کرده‌اید', $result['message']);
    }

    public function test_coupon_is_invalid_if_min_order_amount_not_met(): void
    {
        $coupon = Coupon::create([
            'code' => 'MINORDER',
            'type' => 'percentage',
            'value' => 10,
            'min_order_amount' => 200000,
            'usage_limit_per_user' => 10, // ✅ صریحاً تعیین شد تا خطای "استفاده شده" ندهد
            'is_active' => true,
        ]);

        $result = $coupon->isValidFor($this->user->id, 150000);

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('حداقل مبلغ', $result['message']);
    }

    public function test_calculate_discount_for_percentage_with_max_limit(): void
    {
        $coupon = Coupon::create([
            'code' => 'PERCMAX',
            'type' => 'percentage',
            'value' => 50,
            'max_discount' => 100000,
        ]);

        $discount = $coupon->calculateDiscount(500000);

        $this->assertEquals(100000.00, $discount);
    }

    public function test_calculate_discount_for_fixed_amount(): void
    {
        $coupon = Coupon::create([
            'code' => 'FIXED',
            'type' => 'fixed',
            'value' => 75000,
        ]);

        $discount = $coupon->calculateDiscount(200000);

        $this->assertEquals(75000.00, $discount);
    }

    public function test_calculate_discount_never_exceeds_subtotal(): void
    {
        $coupon = Coupon::create([
            'code' => 'TOOBIG',
            'type' => 'fixed',
            'value' => 500000,
        ]);

        $discount = $coupon->calculateDiscount(100000);

        $this->assertEquals(100000.00, $discount);
    }

    public function test_record_usage_increments_count_and_creates_pivot(): void
    {
        $coupon = Coupon::create([
            'code' => 'RECORD',
            'type' => 'fixed',
            'value' => 10000,
        ]);

        $coupon->recordUsage($this->user->id, 99, 10000);

        $coupon->refresh();
        $this->assertEquals(1, $coupon->used_count);

        $this->assertDatabaseHas('coupon_user', [
            'coupon_id' => $coupon->id,
            'user_id' => $this->user->id,
            'order_id' => 99,
            'discount_amount' => 10000,
        ]);
    }

    /**
     * ✅ قبلاً getAllCoupons() هیچ فیلتری را پشتیبانی نمی‌کرد و همیشه کل
     * کدهای تخفیف را برمی‌گرداند — فیلتر جستجو/وضعیت/نوع فقط سمت کلاینت
     * و فقط روی همان یک صفحهٔ بارگذاری‌شده اعمال می‌شد.
     */
    public function test_get_all_coupons_filters_by_search(): void
    {
        Coupon::create(['code' => 'SUMMER2026', 'type' => 'fixed', 'value' => 1000]);
        Coupon::create(['code' => 'WINTERSALE', 'type' => 'fixed', 'value' => 1000]);

        $result = $this->couponService->getAllCoupons(['search' => 'SUMMER']);

        $this->assertEquals(1, $result->total());
        $this->assertEquals('SUMMER2026', $result->items()[0]->code);
    }

    public function test_get_all_coupons_filters_by_active_status(): void
    {
        Coupon::create(['code' => 'ACTIVE1', 'type' => 'fixed', 'value' => 1000, 'is_active' => true]);
        Coupon::create(['code' => 'INACTIVE1', 'type' => 'fixed', 'value' => 1000, 'is_active' => false]);

        $result = $this->couponService->getAllCoupons(['is_active' => true]);

        $this->assertEquals(1, $result->total());
        $this->assertEquals('ACTIVE1', $result->items()[0]->code);
    }

    public function test_get_all_coupons_filters_by_type(): void
    {
        Coupon::create(['code' => 'PERC1', 'type' => 'percentage', 'value' => 10]);
        Coupon::create(['code' => 'FIX1', 'type' => 'fixed', 'value' => 1000]);

        $result = $this->couponService->getAllCoupons(['type' => 'percentage']);

        $this->assertEquals(1, $result->total());
        $this->assertEquals('PERC1', $result->items()[0]->code);
    }

    public function test_get_all_coupons_paginates_results(): void
    {
        Coupon::factory()->count(25)->create();

        $result = $this->couponService->getAllCoupons([], 10);

        $this->assertEquals(25, $result->total());
        $this->assertEquals(3, $result->lastPage());
        $this->assertCount(10, $result->items());
    }

    /**
     * ✅ قبلاً آماری در بکند وجود نداشت — کارت‌های آمار پنل ادمین از روی
     * همان یک صفحهٔ بارگذاری‌شده محاسبه می‌شدند که برای فروشگاه‌های با
     * بیش از ۲۰ کد تخفیف، اعداد را به‌اشتباه کمتر از واقعی نشان می‌داد.
     */
    public function test_get_stats_reflects_the_whole_database(): void
    {
        Coupon::create(['code' => 'S1', 'type' => 'percentage', 'value' => 10, 'is_active' => true, 'used_count' => 3]);
        Coupon::create(['code' => 'S2', 'type' => 'fixed', 'value' => 1000, 'is_active' => false, 'used_count' => 2]);
        Coupon::create(['code' => 'S3', 'type' => 'percentage', 'value' => 5, 'is_active' => true, 'used_count' => 1]);

        $stats = $this->couponService->getStats();

        $this->assertEquals(3, $stats['total']);
        $this->assertEquals(2, $stats['active']);
        $this->assertEquals(2, $stats['percentage']);
        $this->assertEquals(1, $stats['fixed']);
        $this->assertEquals(6, $stats['total_usage']);
    }
}
