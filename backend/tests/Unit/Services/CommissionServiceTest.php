<?php

namespace Tests\Unit\Services;

use App\Models\CommissionRule;
use App\Models\Setting;
use App\Models\User;
use App\Services\Commission\CommissionService;
use App\Services\Seller\SellerPerformanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected CommissionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CommissionService(new SellerPerformanceService);
    }

    public function test_valid_override_is_used_and_score_is_never_computed_from_it(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 2.75]);

        $result = $this->service->resolveCommissionRate($seller);

        $this->assertEquals(2.75, $result['rate']);
        $this->assertEquals('override', $result['source']);
        $this->assertNull($result['level']);
    }

    public function test_null_override_falls_through_to_score_based_rule(): void
    {
        Setting::set('commission_new_seller_score', 95, ['group' => 'commission', 'type' => 'number']); // -> platinum -> 1%
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => null]);

        $result = $this->service->resolveCommissionRate($seller);

        $this->assertEquals('score_rule', $result['source']);
        $this->assertEquals('platinum', $result['level']);
        $this->assertEquals(1.0, $result['rate']);
    }

    public function test_default_rate_used_when_no_rule_matches(): void
    {
        // همه‌ی rule ها را غیرفعال کن — یعنی هیچ‌کدام نباید مطابقت پیدا کند
        CommissionRule::query()->update(['is_active' => false]);
        // ✅ type='number' در Setting::castValue واقعاً (int) کست می‌کند
        // (رجوع به app/Models/Setting.php) — یعنی مقدار واقعاً قابل‌ذخیره
        // برای این تنظیم یک عدد صحیح است، نه اعشاری؛ مطابق همان قرارداد
        // بقیه‌ی تنظیمات group=commission در settings_defaults.php.
        Setting::set('commission_default_rate', 3, ['group' => 'commission', 'type' => 'number']);

        $seller = User::factory()->create(['role' => 'seller']);

        $result = $this->service->resolveCommissionRate($seller);

        $this->assertEquals('default', $result['source']);
        $this->assertEquals(3.0, $result['rate']);
    }

    public function test_boundary_minimum_one_percent(): void
    {
        // یک rule جدید با نرخ زیر حداقل مجاز (باید clamp شود به min)
        CommissionRule::create([
            'level' => 'super', 'label' => 'فوق‌العاده', 'min_score' => 99, 'max_score' => 100,
            'commission_rate' => 0.1, 'is_active' => true, 'sort_order' => 5,
        ]);
        Setting::set('commission_new_seller_score', 99.5, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_min_rate', 1, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_max_rate', 4, ['group' => 'commission', 'type' => 'number']);

        $seller = User::factory()->create(['role' => 'seller']);

        $result = $this->service->resolveCommissionRate($seller);

        $this->assertEquals(1.0, $result['rate']);
    }

    public function test_boundary_maximum_four_percent(): void
    {
        CommissionRule::query()->where('level', 'bronze')->update(['commission_rate' => 9.9]);
        Setting::set('commission_min_rate', 1, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_max_rate', 4, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_new_seller_score', 0, ['group' => 'commission', 'type' => 'number']); // -> bronze

        $seller = User::factory()->create(['role' => 'seller']);

        $result = $this->service->resolveCommissionRate($seller);

        $this->assertEquals(4.0, $result['rate']);
    }

    public function test_rate_is_rounded_to_two_decimals(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 3.14159]);

        $result = $this->service->resolveCommissionRate($seller);

        $this->assertEquals(3.14, $result['rate']);
    }

    public function test_swapped_min_max_bounds_are_handled_defensively(): void
    {
        // اگر ادمین به‌اشتباه min بزرگ‌تر از max بگذارد، سیستم نباید crash کند
        Setting::set('commission_min_rate', 10, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_max_rate', 2, ['group' => 'commission', 'type' => 'number']);
        Setting::set('commission_new_seller_score', 0, ['group' => 'commission', 'type' => 'number']);

        $seller = User::factory()->create(['role' => 'seller']);

        $result = $this->service->resolveCommissionRate($seller);

        $this->assertGreaterThanOrEqual(2.0, $result['rate']);
        $this->assertLessThanOrEqual(10.0, $result['rate']);
    }
}
