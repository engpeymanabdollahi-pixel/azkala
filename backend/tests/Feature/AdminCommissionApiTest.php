<?php

namespace Tests\Feature;

use App\Models\CommissionRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCommissionApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    // ==================== Authorization ====================

    public function test_guest_cannot_list_commission_rules(): void
    {
        $this->getJson('/api/v1/admin/commission-rules')->assertStatus(401);
    }

    public function test_customer_cannot_list_commission_rules(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)
            ->getJson('/api/v1/admin/commission-rules')
            ->assertStatus(403);
    }

    public function test_seller_cannot_update_commission_rules(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $rule = CommissionRule::where('level', 'bronze')->first();

        $this->actingAs($seller)
            ->putJson("/api/v1/admin/commission-rules/{$rule->id}", ['commission_rate' => 0.5])
            ->assertStatus(403);

        $this->assertDatabaseHas('commission_rules', ['id' => $rule->id, 'commission_rate' => 4.00]);
    }

    public function test_seller_cannot_set_their_own_commission_override(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);

        $this->actingAs($seller)
            ->putJson("/api/v1/admin/users/{$seller->id}/commission-override", ['rate' => 0.1])
            ->assertStatus(403);

        $this->assertNull($seller->fresh()->seller_commission_rate);
    }

    // ==================== Commission Rules CRUD ====================

    public function test_admin_can_list_commission_rules_seeded_by_migration(): void
    {
        $response = $this->actingAs($this->admin())
            ->getJson('/api/v1/admin/commission-rules')
            ->assertStatus(200);

        $response->assertJsonCount(4, 'data');
        $levels = collect($response->json('data'))->pluck('level')->sort()->values()->all();
        $this->assertEquals(['bronze', 'gold', 'platinum', 'silver'], $levels);
    }

    public function test_admin_can_update_a_commission_rule(): void
    {
        $rule = CommissionRule::where('level', 'gold')->first();

        $this->actingAs($this->admin())
            ->putJson("/api/v1/admin/commission-rules/{$rule->id}", [
                'commission_rate' => 1.5,
                'label' => 'طلایی ویژه',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.commission_rate', '1.50');

        $this->assertDatabaseHas('commission_rules', ['id' => $rule->id, 'commission_rate' => 1.50, 'label' => 'طلایی ویژه']);
    }

    public function test_updating_a_rule_rejects_max_score_below_min_score(): void
    {
        $rule = CommissionRule::where('level', 'silver')->first();

        $this->actingAs($this->admin())
            ->putJson("/api/v1/admin/commission-rules/{$rule->id}", [
                'min_score' => 60,
                'max_score' => 55,
            ])
            ->assertStatus(422);
    }

    public function test_admin_can_create_a_new_commission_rule(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/v1/admin/commission-rules', [
                'level' => 'diamond',
                'label' => 'الماسی',
                'min_score' => 98,
                'max_score' => 100,
                'commission_rate' => 0.5,
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('commission_rules', ['level' => 'diamond']);
    }

    public function test_admin_can_delete_a_commission_rule_without_touching_past_transactions(): void
    {
        $rule = CommissionRule::create([
            'level' => 'temp', 'label' => 'موقت', 'min_score' => 40, 'max_score' => 41,
            'commission_rate' => 3, 'is_active' => true, 'sort_order' => 9,
        ]);

        $this->actingAs($this->admin())
            ->deleteJson("/api/v1/admin/commission-rules/{$rule->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('commission_rules', ['id' => $rule->id]);
    }

    // ==================== Seller Commission Info + Override ====================

    public function test_admin_can_view_seller_commission_info(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);

        $response = $this->actingAs($this->admin())
            ->getJson("/api/v1/admin/users/{$seller->id}/commission")
            ->assertStatus(200);

        $response->assertJsonStructure([
            'data' => ['seller_id', 'override_rate', 'current_rate', 'current_source', 'current_level', 'score'],
        ]);
        $this->assertTrue($response->json('data.score.is_new_seller'));
    }

    public function test_commission_info_returns_error_for_non_seller_user(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($this->admin())
            ->getJson("/api/v1/admin/users/{$customer->id}/commission")
            ->assertStatus(422);
    }

    public function test_admin_can_set_seller_commission_override(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);

        $this->actingAs($this->admin())
            ->putJson("/api/v1/admin/users/{$seller->id}/commission-override", ['rate' => 2.25])
            ->assertStatus(200)
            ->assertJsonPath('data.override_rate', 2.25)
            ->assertJsonPath('data.current_source', 'override');

        $this->assertEquals(2.25, (float) $seller->fresh()->seller_commission_rate);
    }

    public function test_admin_can_clear_seller_commission_override(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 3.0]);

        $this->actingAs($this->admin())
            ->putJson("/api/v1/admin/users/{$seller->id}/commission-override", ['rate' => null])
            ->assertStatus(200)
            ->assertJsonPath('data.override_rate', null)
            ->assertJsonPath('data.current_source', 'score_rule');

        $this->assertNull($seller->fresh()->seller_commission_rate);
    }

    public function test_override_rate_must_be_within_valid_percent_range(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);

        $this->actingAs($this->admin())
            ->putJson("/api/v1/admin/users/{$seller->id}/commission-override", ['rate' => 150])
            ->assertStatus(422);

        $this->assertNull($seller->fresh()->seller_commission_rate);
    }
}
