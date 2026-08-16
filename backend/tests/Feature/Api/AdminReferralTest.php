<?php

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\Referral;
use App\Models\User;
use App\Services\Admin\AdminOrderService;
use App\Services\Referral\ReferralService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Referral System — Phase 3 (Admin Module — MVP: نمایش/ممیزی).
 * دقیقاً هم‌الگو با AdminStoreTest: پوشش permission gating
 * (referrals.view) با همان middleware استاندارد permission: پروژه.
 */
class AdminReferralTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['admin']);

        return $u;
    }

    private function managerWithout(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['manager']); // ✅ بدون هیچ permission پیش‌فرض

        return $u;
    }

    /**
     * یک Referral rewarded واقعی می‌سازد (از مسیر واقعی capture +
     * AdminOrderService::updateStatus — نه insert مستقیم روی جدول‌ها).
     */
    private function makeRewardedReferral(): Referral
    {
        $referrer = User::factory()->create();
        $referred = User::factory()->create();

        $code = app(ReferralService::class)->ensureUserReferralCode($referrer);
        app(ReferralService::class)->captureReferral($referred, $code);

        $order = Order::factory()->create(['user_id' => $referred->id, 'status' => 'processing']);
        app(AdminOrderService::class)->updateStatus($order->id, ['status' => 'delivered']);

        return Referral::where('referred_user_id', $referred->id)->firstOrFail();
    }

    public function test_admin_with_referrals_view_can_list_referrals(): void
    {
        $this->makeRewardedReferral();

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/referrals')
            ->assertOk()
            ->assertJsonStructure(['data' => ['referrals', 'pagination', 'summary']]);
    }

    public function test_admin_without_permission_gets_403(): void
    {
        $this->actingAs($this->managerWithout(), 'sanctum')
            ->getJson('/api/v1/admin/referrals')
            ->assertStatus(403);
    }

    public function test_admin_can_inspect_referral_detail(): void
    {
        $referral = $this->makeRewardedReferral();

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/v1/admin/referrals/{$referral->id}")
            ->assertOk();

        $response->assertJsonPath('data.id', $referral->id);
        $response->assertJsonPath('data.status', Referral::STATUS_REWARDED);
    }

    public function test_summary_counts_are_correct(): void
    {
        $this->makeRewardedReferral();

        // یک Referral دیگر که هنوز pending است (بدون سفارش صلاحیت‌دار)
        $referrer2 = User::factory()->create();
        $referred2 = User::factory()->create();
        $code2 = app(ReferralService::class)->ensureUserReferralCode($referrer2);
        app(ReferralService::class)->captureReferral($referred2, $code2);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/referrals')
            ->assertOk();

        $summary = $response->json('data.summary');
        $this->assertSame(2, $summary['total_referrals']);
        $this->assertSame(1, $summary['pending']);
        $this->assertSame(1, $summary['rewarded']);
        $this->assertGreaterThan(0, $summary['total_reward_amount']);
    }

    public function test_reward_information_is_visible_in_detail(): void
    {
        $referral = $this->makeRewardedReferral();

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/v1/admin/referrals/{$referral->id}")
            ->assertOk();

        $response->assertJsonPath('data.reward.status', 'granted');
        $response->assertJsonPath('data.reward.type', 'fixed_credit');
        $this->assertNotNull($response->json('data.reward.amount'));
        $this->assertNotNull($response->json('data.reward.order_number'));
    }

    public function test_reward_information_is_visible_in_list(): void
    {
        $this->makeRewardedReferral();

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/referrals')
            ->assertOk();

        $referrals = $response->json('data.referrals.data');
        $this->assertNotEmpty($referrals);
        $this->assertNotNull($referrals[0]['reward']['amount']);
    }

    public function test_status_filter_narrows_the_list(): void
    {
        $this->makeRewardedReferral();

        $referrer2 = User::factory()->create();
        $referred2 = User::factory()->create();
        $code2 = app(ReferralService::class)->ensureUserReferralCode($referrer2);
        app(ReferralService::class)->captureReferral($referred2, $code2);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/referrals?status=pending')
            ->assertOk();

        $referrals = $response->json('data.referrals.data');
        $this->assertCount(1, $referrals);
        $this->assertSame('pending', $referrals[0]['status']);
    }

    public function test_guest_cannot_access_admin_referrals(): void
    {
        $this->getJson('/api/v1/admin/referrals')->assertStatus(401);
    }

    public function test_seller_cannot_access_admin_referrals(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/admin/referrals')
            ->assertStatus(403);
    }

    public function test_admin_referral_detail_does_not_expose_referred_user_phone(): void
    {
        $referral = $this->makeRewardedReferral();

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson("/api/v1/admin/referrals/{$referral->id}")
            ->assertOk();

        $this->assertArrayNotHasKey('phone', $response->json('data.referred'));
        $this->assertArrayNotHasKey('email', $response->json('data.referred'));
    }
}
