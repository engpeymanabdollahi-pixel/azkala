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
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'coupons',
                    'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                    'stats' => ['total', 'active', 'percentage', 'fixed', 'total_usage'],
                ],
            ]);
    }

    /**
     * ✅ قبلاً آمار پنل ادمین فقط از روی صفحهٔ اول (حداکثر ۲۰ کد) محاسبه
     * می‌شد. این تست تضمین می‌کند stats روی کل دیتابیس محاسبه شود، حتی
     * وقتی صفحه‌بندی صفحهٔ اول را کوچک‌تر از کل دیتابیس نشان می‌دهد.
     */
    public function test_admin_coupon_stats_reflect_the_whole_database_not_just_the_current_page(): void
    {
        Coupon::factory()->count(25)->create(['type' => 'percentage', 'is_active' => true]);
        Coupon::factory()->count(5)->create(['type' => 'fixed', 'is_active' => false]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/coupons?per_page=20');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 30)
            ->assertJsonPath('data.pagination.last_page', 2)
            ->assertJsonPath('data.stats.total', 30)
            ->assertJsonPath('data.stats.percentage', 25)
            ->assertJsonPath('data.stats.fixed', 5)
            ->assertJsonPath('data.stats.active', 25);

        $this->assertCount(20, $response->json('data.coupons'));
    }

    public function test_admin_can_filter_coupons_by_search(): void
    {
        Coupon::factory()->create(['code' => 'SUMMER2026']);
        Coupon::factory()->create(['code' => 'WINTERSALE']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/coupons?search=SUMMER');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.coupons.0.code', 'SUMMER2026');
    }

    public function test_admin_can_filter_coupons_by_active_status(): void
    {
        Coupon::factory()->create(['is_active' => true]);
        Coupon::factory()->count(2)->create(['is_active' => false]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/coupons?is_active=1');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 1);
    }

    public function test_admin_can_filter_coupons_by_type(): void
    {
        Coupon::factory()->create(['type' => 'percentage']);
        Coupon::factory()->count(2)->create(['type' => 'fixed']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/coupons?type=fixed');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.total', 2);
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
