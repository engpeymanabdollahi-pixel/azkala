<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\Referral;
use App\Models\ReferralRewardRule;
use App\Models\ReferralRuleTrigger;
use App\Models\User;
use App\Services\Admin\AdminOrderService;
use App\Services\Referral\ReferralRuleEngineService;
use App\Services\Referral\ReferralService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Referral Rule Engine — Part 4 audit (پاداش‌های سطحی/milestone روی
 * تعداد کل «معرفی موفق» یک معرف). دقیقاً همان مسیر واقعی end-to-end
 * که ReferralRewardTest برای پاداش پایه استفاده می‌کند —
 * AdminOrderService::updateStatus، نه صدازدن مستقیم سرویس‌ها.
 */
class ReferralRuleEngineTest extends TestCase
{
    use RefreshDatabase;

    private function referralService(): ReferralService
    {
        return app(ReferralService::class);
    }

    private function adminOrderService(): AdminOrderService
    {
        return app(AdminOrderService::class);
    }

    private function ruleEngine(): ReferralRuleEngineService
    {
        return app(ReferralRuleEngineService::class);
    }

    /**
     * $count کاربر جدید معرفی می‌کند و سفارش هرکدام را delivered می‌کند
     * — یعنی $count بار مسیر واقعی qualifyAndRewardForCompletedOrder
     * (و به‌دنبالش rule engine) طی می‌شود.
     */
    private function completeSuccessfulReferrals(User $referrer, int $count): void
    {
        $code = $this->referralService()->ensureUserReferralCode($referrer);

        for ($i = 0; $i < $count; $i++) {
            $referred = User::factory()->create();
            $this->referralService()->captureReferral($referred, $code);
            $order = Order::factory()->create(['user_id' => $referred->id, 'status' => 'processing']);
            $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);
        }
    }

    public function test_successful_referrals_count_matches_rewarded_referrals(): void
    {
        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 3);

        $this->assertSame(3, $this->ruleEngine()->successfulReferralsCount($referrer->id));
        $this->assertSame(3, Referral::where('referrer_user_id', $referrer->id)->where('status', Referral::STATUS_REWARDED)->count());
    }

    public function test_fixed_credit_milestone_rule_fires_at_exact_threshold(): void
    {
        ReferralRewardRule::create([
            'milestone' => 2, 'reward_type' => ReferralRewardRule::TYPE_FIXED_CREDIT,
            'reward_value' => 100000, 'is_active' => true,
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 2);

        $this->assertSame(1, ReferralRuleTrigger::where('referrer_user_id', $referrer->id)->count());
        $trigger = ReferralRuleTrigger::where('referrer_user_id', $referrer->id)->first();
        $this->assertSame(2, $trigger->successful_referrals_count_at_trigger);
        $this->assertNull($trigger->coupon_id);
    }

    public function test_rule_does_not_fire_before_reaching_milestone(): void
    {
        ReferralRewardRule::create([
            'milestone' => 5, 'reward_type' => ReferralRewardRule::TYPE_FIXED_CREDIT,
            'reward_value' => 100000, 'is_active' => true,
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 3);

        $this->assertSame(0, ReferralRuleTrigger::count());
    }

    public function test_non_repeatable_rule_fires_only_once(): void
    {
        $rule = ReferralRewardRule::create([
            'milestone' => 2, 'reward_type' => ReferralRewardRule::TYPE_FIXED_CREDIT,
            'reward_value' => 50000, 'is_active' => true, 'repeatable' => false,
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 2);
        $this->assertSame(1, ReferralRuleTrigger::count());

        // ✅ دفاعی: صدازدن دستی دوباره‌ی engine برای همان معرف با همان
        // count نباید ردیف دوم بسازد (idempotency واقعی روی
        // unique constraint، نه فقط یک چک قبل از insert).
        $this->ruleEngine()->evaluateAndTrigger($referrer);
        $this->ruleEngine()->evaluateAndTrigger($referrer);

        $this->assertSame(1, ReferralRuleTrigger::where('referral_reward_rule_id', $rule->id)->count());
    }

    public function test_repeatable_rule_fires_again_at_next_multiple(): void
    {
        ReferralRewardRule::create([
            'milestone' => 2, 'reward_type' => ReferralRewardRule::TYPE_FIXED_CREDIT,
            'reward_value' => 30000, 'is_active' => true, 'repeatable' => true,
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 2);
        $this->assertSame(1, ReferralRuleTrigger::count());

        $this->completeSuccessfulReferrals($referrer, 2); // مجموع ۴
        $this->assertSame(2, ReferralRuleTrigger::count());

        $counts = ReferralRuleTrigger::orderBy('successful_referrals_count_at_trigger')->pluck('successful_referrals_count_at_trigger')->all();
        $this->assertSame([2, 4], $counts);
    }

    public function test_fixed_coupon_rule_generates_a_real_reusable_coupon(): void
    {
        ReferralRewardRule::create([
            'milestone' => 1, 'reward_type' => ReferralRewardRule::TYPE_FIXED_COUPON,
            'reward_value' => 200000, 'usage_limit' => 1, 'coupon_expiration_days' => 30, 'is_active' => true,
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 1);

        $trigger = ReferralRuleTrigger::first();
        $this->assertNotNull($trigger->coupon_id);

        $coupon = Coupon::find($trigger->coupon_id);
        $this->assertNotNull($coupon);
        $this->assertSame('fixed', $coupon->type);
        $this->assertEquals(200000, (float) $coupon->value);
        $this->assertTrue($coupon->end_date->isFuture());
    }

    public function test_percentage_coupon_rule_respects_max_discount(): void
    {
        ReferralRewardRule::create([
            'milestone' => 1, 'reward_type' => ReferralRewardRule::TYPE_PERCENTAGE_COUPON,
            'reward_value' => 20, 'max_discount' => 50000, 'is_active' => true,
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 1);

        $coupon = Coupon::find(ReferralRuleTrigger::first()->coupon_id);
        $this->assertSame('percentage', $coupon->type);
        $this->assertEquals(50000, (float) $coupon->max_discount);
        // ✅ تخفیف واقعی روی یک سبد بزرگ باید به همان سقف محدود بماند —
        // دقیقاً همان منطق Coupon::calculateDiscount موجود، بدون تغییر.
        $this->assertEquals(50000, $coupon->calculateDiscount(10_000_000));
    }

    public function test_inactive_rule_never_fires(): void
    {
        ReferralRewardRule::create([
            'milestone' => 1, 'reward_type' => ReferralRewardRule::TYPE_FIXED_CREDIT,
            'reward_value' => 10000, 'is_active' => false,
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 1);

        $this->assertSame(0, ReferralRuleTrigger::count());
    }

    public function test_expired_rule_never_fires(): void
    {
        ReferralRewardRule::create([
            'milestone' => 1, 'reward_type' => ReferralRewardRule::TYPE_FIXED_CREDIT,
            'reward_value' => 10000, 'is_active' => true,
            'end_date' => now()->subDay(),
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 1);

        $this->assertSame(0, ReferralRuleTrigger::count());
    }

    public function test_multiple_milestones_all_fire_independently_as_referrer_progresses(): void
    {
        // ✅ milestone روی خودِ جدول unique است (یک قانون به‌ازای هر
        // آستانه) — پس این تست چند آستانه‌ی *متفاوت* را همزمان تعریف
        // می‌کند تا مطمئن شود یکی مانع دیگری نمی‌شود.
        ReferralRewardRule::create([
            'milestone' => 1, 'reward_type' => ReferralRewardRule::TYPE_FIXED_CREDIT,
            'reward_value' => 10000, 'is_active' => true,
        ]);
        ReferralRewardRule::create([
            'milestone' => 3, 'reward_type' => ReferralRewardRule::TYPE_FIXED_COUPON,
            'reward_value' => 5000, 'is_active' => true,
        ]);

        $referrer = User::factory()->create();
        $this->completeSuccessfulReferrals($referrer, 3);

        $this->assertSame(2, ReferralRuleTrigger::where('referrer_user_id', $referrer->id)->count());
        $milestonesFired = ReferralRuleTrigger::where('referrer_user_id', $referrer->id)
            ->join('referral_reward_rules', 'referral_reward_rules.id', '=', 'referral_rule_triggers.referral_reward_rule_id')
            ->pluck('referral_reward_rules.milestone')
            ->sort()
            ->values()
            ->all();
        $this->assertSame([1, 3], $milestonesFired);
    }
}
