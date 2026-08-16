<?php

namespace Tests\Feature\Api;

use App\Models\ReferralRewardRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Referral Rule Engine — Admin CRUD (Part 4 audit). دقیقاً هم‌الگو با
 * AdminReferralTest: permission gating با referrals.view/referrals.manage
 * (همان Permission رزروشده‌ی موجود، بدون هیچ Permission جدید).
 */
class AdminReferralRuleTest extends TestCase
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

    public function test_admin_can_list_rules(): void
    {
        ReferralRewardRule::create(['milestone' => 5, 'reward_type' => 'fixed_credit', 'reward_value' => 100000]);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/referral-rules')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_manager_without_permission_cannot_list_rules(): void
    {
        $this->actingAs($this->managerWithout(), 'sanctum')
            ->getJson('/api/v1/admin/referral-rules')
            ->assertStatus(403);
    }

    public function test_admin_can_create_a_rule(): void
    {
        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/referral-rules', [
                'milestone' => 10,
                'reward_type' => 'fixed_coupon',
                'reward_value' => 200000,
                'coupon_expiration_days' => 30,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('referral_reward_rules', ['milestone' => 10, 'reward_type' => 'fixed_coupon']);
    }

    public function test_manager_without_permission_cannot_create_a_rule(): void
    {
        $this->actingAs($this->managerWithout(), 'sanctum')
            ->postJson('/api/v1/admin/referral-rules', [
                'milestone' => 10, 'reward_type' => 'fixed_credit', 'reward_value' => 10000,
            ])
            ->assertStatus(403);

        $this->assertDatabaseMissing('referral_reward_rules', ['milestone' => 10]);
    }

    public function test_cannot_create_two_rules_with_the_same_milestone(): void
    {
        ReferralRewardRule::create(['milestone' => 5, 'reward_type' => 'fixed_credit', 'reward_value' => 100000]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/referral-rules', [
                'milestone' => 5, 'reward_type' => 'fixed_coupon', 'reward_value' => 5000,
            ])
            ->assertStatus(422);
    }

    public function test_percentage_coupon_value_cannot_exceed_100(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/referral-rules', [
                'milestone' => 5, 'reward_type' => 'percentage_coupon', 'reward_value' => 150,
            ])
            ->assertStatus(422);
    }

    public function test_admin_can_update_a_rule(): void
    {
        $rule = ReferralRewardRule::create(['milestone' => 5, 'reward_type' => 'fixed_credit', 'reward_value' => 100000]);

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/v1/admin/referral-rules/{$rule->id}", [
                'milestone' => 5, 'reward_type' => 'fixed_credit', 'reward_value' => 150000,
            ])
            ->assertOk();

        $this->assertDatabaseHas('referral_reward_rules', ['id' => $rule->id, 'reward_value' => 150000]);
    }

    public function test_admin_can_toggle_a_rule_active_state(): void
    {
        $rule = ReferralRewardRule::create(['milestone' => 5, 'reward_type' => 'fixed_credit', 'reward_value' => 100000, 'is_active' => true]);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson("/api/v1/admin/referral-rules/{$rule->id}/toggle")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_admin_can_soft_delete_a_rule(): void
    {
        $rule = ReferralRewardRule::create(['milestone' => 5, 'reward_type' => 'fixed_credit', 'reward_value' => 100000]);

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson("/api/v1/admin/referral-rules/{$rule->id}")
            ->assertOk();

        $this->assertSoftDeleted('referral_reward_rules', ['id' => $rule->id]);
    }

    public function test_updating_nonexistent_rule_returns_404(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->putJson('/api/v1/admin/referral-rules/999999', [
                'milestone' => 5, 'reward_type' => 'fixed_credit', 'reward_value' => 100000,
            ])
            ->assertStatus(404);
    }

    public function test_guest_cannot_access_referral_rules(): void
    {
        $this->getJson('/api/v1/admin/referral-rules')->assertStatus(401);
    }
}
