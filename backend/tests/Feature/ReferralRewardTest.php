<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Referral;
use App\Models\ReferralReward;
use App\Models\SellerTransaction;
use App\Models\User;
use App\Services\Admin\AdminOrderService;
use App\Services\Referral\ReferralService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Referral System — Phase 3 (Qualification → Reward Ledger).
 *
 * دقیقاً همان مسیر واقعی HTTP/Service که SellerCommissionPayoutTest برای
 * تسویه‌ی فروشنده امتحان می‌کند: AdminOrderService::updateStatus() —
 * هیچ فراخوانی مستقیمی به ReferralRewardService از بیرون این فلو نیست،
 * چون در تولید هم هرگز این‌طور صدا زده نمی‌شود.
 */
class ReferralRewardTest extends TestCase
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

    /**
     * یک Referral واقعی pending می‌سازد (از همان مسیر واقعی capture، نه
     * insert مستقیم) و یک سفارش برای کاربر معرفی‌شده برمی‌گرداند.
     */
    private function makeReferredOrder(User $referrer, User $referred, string $status = 'processing'): Order
    {
        $code = $this->referralService()->ensureUserReferralCode($referrer);
        $this->referralService()->captureReferral($referred, $code);

        return Order::factory()->create(['user_id' => $referred->id, 'status' => $status]);
    }

    // ==================== ۱-۵: مسیر موفق ====================

    public function test_pending_referral_qualifies_on_first_completed_order(): void
    {
        config(['azkala.referral.reward.amount' => 20000]);
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $this->assertSame(Referral::STATUS_REWARDED, $referral->status);
    }

    public function test_reward_ledger_row_is_created(): void
    {
        config(['azkala.referral.reward.amount' => 20000]);
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $this->assertDatabaseHas('referral_rewards', [
            'referral_id' => $referral->id,
            'referrer_user_id' => $referrer->id,
            'order_id' => $order->id,
            'amount' => 20000.00,
            'type' => 'fixed_credit',
            'status' => 'granted',
        ]);
    }

    public function test_referral_status_becomes_rewarded(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'completed']);

        $this->assertDatabaseHas('referrals', [
            'referred_user_id' => $referred->id,
            'status' => Referral::STATUS_REWARDED,
        ]);
    }

    public function test_qualified_at_is_populated(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $this->assertNotNull($referral->qualified_at);
    }

    public function test_rewarded_at_is_populated(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $this->assertNotNull($referral->rewarded_at);

        $reward = ReferralReward::where('referral_id', $referral->id)->firstOrFail();
        $this->assertNotNull($reward->rewarded_at);
    }

    // ==================== ۶-۱۱: Idempotency و منفی ====================

    public function test_second_completed_order_produces_no_second_reward(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order1 = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order1->id, ['status' => 'delivered']);

        $order2 = Order::factory()->create(['user_id' => $referred->id, 'status' => 'processing']);
        $this->adminOrderService()->updateStatus($order2->id, ['status' => 'delivered']);

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $this->assertSame(1, ReferralReward::where('referral_id', $referral->id)->count());
        $this->assertDatabaseMissing('referral_rewards', ['order_id' => $order2->id]);
    }

    public function test_cancelled_order_produces_no_reward(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'cancelled']);

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $this->assertSame(Referral::STATUS_PENDING, $referral->status);
        $this->assertSame(0, ReferralReward::count());
    }

    public function test_repeated_completed_transition_is_idempotent(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $service = $this->adminOrderService();
        $service->updateStatus($order->id, ['status' => 'delivered']);
        // شبیه‌سازی delivered->shipped->delivered (یا دوبار درخواست سریع)
        $service->updateStatus($order->id, ['status' => 'shipped']);
        $service->updateStatus($order->id, ['status' => 'delivered']);

        $this->assertSame(1, ReferralReward::count());
    }

    public function test_referral_with_no_qualifying_order_remains_pending(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $this->makeReferredOrder($referrer, $referred, 'processing');
        // هرگز به completed/delivered نمی‌رود

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $this->assertSame(Referral::STATUS_PENDING, $referral->status);
        $this->assertSame(0, ReferralReward::count());
    }

    public function test_unrelated_order_creates_no_reward(): void
    {
        // یک کاربر که اصلاً هیچ Referral ای ندارد
        $unrelatedUser = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $unrelatedUser->id, 'status' => 'processing']);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        $this->assertSame(0, ReferralReward::count());
    }

    public function test_database_unique_constraint_prevents_duplicate_rewards(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);
        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);
        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();

        // تلاش مستقیم برای ساخت یک ردیف reward دوم برای همان Referral —
        // باید در سطح دیتابیس رد شود (unique(referral_id))، صرف‌نظر از
        // اینکه منطق سرویس هم همین را جلوگیری می‌کند.
        $this->expectException(QueryException::class);
        ReferralReward::create([
            'referral_id' => $referral->id,
            'referrer_user_id' => $referrer->id,
            'order_id' => null,
            'amount' => 1000,
            'type' => 'fixed_credit',
            'status' => 'granted',
            'rewarded_at' => now(),
        ]);
    }

    public function test_already_rewarded_referral_cannot_reward_again(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);
        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        // ادمین (یا هر مسیر دیگری) دوباره مستقیماً سرویس را برای همان
        // سفارش صدا می‌زند — نباید هیچ اثری داشته باشد.
        app(\App\Services\Referral\ReferralRewardService::class)->qualifyAndRewardForCompletedOrder($order->fresh());

        $this->assertSame(1, ReferralReward::count());
    }

    // ==================== ۱۲-۱۳: عدم تداخل با پول فروشنده ====================

    public function test_seller_wallet_is_untouched_by_referral_reward(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        $this->assertEquals(0.0, (float) $referrer->refresh()->wallet_balance);
        $this->assertEquals(0.0, (float) $referred->refresh()->wallet_balance);
    }

    public function test_seller_transactions_is_untouched_by_referral_reward(): void
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        $this->assertSame(0, SellerTransaction::where('order_id', $order->id)->count());
    }

    // ==================== بند ۹: مبلغ پاداش قابل‌تنظیم است ====================

    public function test_reward_amount_is_read_from_config_not_hardcoded(): void
    {
        config(['azkala.referral.reward.amount' => 123456]);

        $referrer = User::factory()->create();
        $referred = User::factory()->create();
        $order = $this->makeReferredOrder($referrer, $referred);

        $this->adminOrderService()->updateStatus($order->id, ['status' => 'delivered']);

        $referral = Referral::where('referred_user_id', $referred->id)->firstOrFail();
        $reward = ReferralReward::where('referral_id', $referral->id)->firstOrFail();
        $this->assertEquals(123456.00, (float) $reward->amount);
    }
}
