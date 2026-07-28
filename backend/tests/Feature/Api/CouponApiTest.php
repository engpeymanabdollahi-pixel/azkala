<?php

namespace Tests\Feature\Api;

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_unauthenticated_user_cannot_validate_coupon(): void
    {
        $response = $this->postJson('/api/v1/coupons/validate', ['code' => 'TEST']);
        $response->assertStatus(401);
    }

        public function test_user_can_validate_valid_coupon(): void
    {
        Coupon::create([
            'code' => 'VALIDCODE',
            'type' => 'percentage',
            'value' => 10,
            'min_order_amount' => 0, // ✅ اصلاح شد: حداقل مبلغ 0 تا با سبد خالی هم کار کند
            'usage_limit_per_user' => 10, // ✅ اضافه شد
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/coupons/validate', ['code' => 'VALIDCODE']);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.coupon.code', 'VALIDCODE');
    }

    public function test_user_cannot_validate_invalid_coupon_code(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/coupons/validate', ['code' => 'NOTEXIST']);

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_user_can_get_my_coupons(): void
    {
        Coupon::create([
            'code' => 'PUBLIC10',
            'type' => 'percentage',
            'value' => 10,
            'applicable_to' => 'all',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/coupons/my');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_list_coupons(): void
    {
        Coupon::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/coupons');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_admin_can_create_coupon(): void
    {
        $data = [
            'code' => 'ADMINCREATE',
            'type' => 'fixed',
            'value' => 100000,
            'usage_limit' => 100,
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/coupons', $data);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'ADMINCREATE');

        $this->assertDatabaseHas('coupons', ['code' => 'ADMINCREATE']);
    }

    public function test_admin_can_update_coupon(): void
    {
        $coupon = Coupon::create([
            'code' => 'TOUPDATE',
            'type' => 'percentage',
            'value' => 5,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/coupons/{$coupon->id}", [
                'value' => 15,
                'is_active' => false,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('coupons', [
            'id' => $coupon->id,
            'value' => 15,
            'is_active' => false,
        ]);
    }

    public function test_admin_can_delete_coupon(): void
    {
        $coupon = Coupon::create([
            'code' => 'TODELETE',
            'type' => 'fixed',
            'value' => 50000,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/coupons/{$coupon->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('coupons', ['id' => $coupon->id]);
    }
}