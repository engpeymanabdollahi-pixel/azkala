<?php

namespace Tests\Unit\Services;

use App\Models\SellerRequest;
use App\Models\User;
use App\Repositories\AdminUserRepository;
use App\Services\Admin\AdminUserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminUserService $service;
    protected AdminUserRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new AdminUserRepository();
        $this->service = new AdminUserService($this->repository);
    }

    // ==================== getUsers Tests ====================

    public function test_can_get_users_with_default_filters(): void
    {
        User::factory()->count(3)->create(['role' => 'customer']);
        User::factory()->count(2)->create(['role' => 'seller']);

        $result = $this->service->getUsers([], 20);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('users', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertArrayHasKey('stats', $result);
        $this->assertEquals(5, $result['pagination']['total']);
    }

    public function test_can_filter_users_by_role(): void
    {
        User::factory()->count(3)->create(['role' => 'customer']);
        User::factory()->count(2)->create(['role' => 'seller']);
        User::factory()->count(1)->create(['role' => 'admin']);

        $result = $this->service->getUsers(['role' => 'seller'], 20);

        $this->assertEquals(2, $result['pagination']['total']);
    }

    public function test_can_filter_users_by_active_status(): void
    {
        User::factory()->count(3)->create(['is_active' => true]);
        User::factory()->count(2)->create(['is_active' => false]);

        $result = $this->service->getUsers(['is_active' => true], 20);

        $this->assertEquals(3, $result['pagination']['total']);
    }

    public function test_can_search_users_by_name(): void
    {
        User::factory()->create(['name' => 'Ali Mohammadi']);
        User::factory()->create(['name' => 'Reza Ahmadi']);
        User::factory()->create(['name' => 'Sara Karimi']);

        $result = $this->service->getUsers(['search' => 'Ali'], 20);

        $this->assertEquals(1, $result['pagination']['total']);
    }

    // ==================== getUserDetails Tests ====================

    public function test_can_get_user_details(): void
    {
        $user = User::factory()->create(['role' => 'seller']);

        $result = $this->service->getUserDetails($user->id);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('user', $result);
        $this->assertEquals($user->id, $result['user']->id);
    }

    public function test_get_user_details_throws_exception_for_nonexistent_user(): void
    {
        // ✅ اصلاح: Service خودش Exception throw می‌کند نه ModelNotFoundException
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('کاربر یافت نشد');

        $this->service->getUserDetails(9999);
    }

    // ==================== updateUserRole Tests ====================

    public function test_can_update_user_role(): void
    {
        $user = User::factory()->create(['role' => 'customer']);

        $updated = $this->service->updateUserRole($user->id, 'seller');

        $this->assertEquals('seller', $updated->role);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'seller',
        ]);
    }

    public function test_cannot_update_role_for_nonexistent_user(): void
    {
        $this->expectException(\Exception::class);

        $this->service->updateUserRole(9999, 'seller');
    }

    // ==================== updateUserStatus Tests ====================

    public function test_can_activate_user(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $updated = $this->service->updateUserStatus($user->id, true);

        $this->assertTrue($updated->is_active);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_active' => true,
        ]);
    }

    public function test_can_deactivate_user(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $updated = $this->service->updateUserStatus($user->id, false);

        $this->assertFalse($updated->is_active);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_active' => false,
        ]);
    }

    // ==================== approveSeller Tests ====================

    public function test_can_approve_seller(): void
    {
        // ✅ ایجاد کاربر با فیلدهای لازم برای فروشنده
        $user = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
            'seller_badge' => 'none',
            'seller_rating' => 0,
            'total_sales' => 0,
            'products_count' => 0,
        ]);

        $approved = $this->service->approveSeller($user->id);

        $this->assertEquals('seller', $approved->role);
        $this->assertNotNull($approved->seller_verified_at);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'seller',
        ]);
    }

    // ==================== rejectSeller Tests ====================

    public function test_can_reject_seller(): void
    {
        $user = User::factory()->create(['role' => 'seller']);

        $rejected = $this->service->rejectSeller($user->id);

        $this->assertEquals('customer', $rejected->role);
        $this->assertNull($rejected->seller_verified_at);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'customer',
        ]);
    }

    // ==================== getSellerRequests Tests ====================

    public function test_can_get_seller_requests(): void
    {
        SellerRequest::factory()->count(3)->create(['status' => 'pending']);
        SellerRequest::factory()->count(2)->create(['status' => 'approved']);

        $result = $this->service->getSellerRequests(20);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('requests', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertEquals(5, $result['pagination']['total']);
    }

    // ==================== approveSellerRequest Tests ====================

    public function test_can_approve_seller_request(): void
    {
        $user = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
            'seller_badge' => 'none',
            'seller_rating' => 0,
            'total_sales' => 0,
            'products_count' => 0,
        ]);
        $request = SellerRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $result = $this->service->approveSellerRequest($request->id, $admin->id);

        $this->assertTrue($result);

        $request->refresh();
        $this->assertEquals('approved', $request->status);
        $this->assertEquals($admin->id, $request->reviewed_by);
        $this->assertNotNull($request->reviewed_at);

        $user->refresh();
        $this->assertEquals('seller', $user->role);
    }

    // ==================== rejectSellerRequest Tests ====================

    public function test_can_reject_seller_request(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $request = SellerRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $result = $this->service->rejectSellerRequest($request->id, $admin->id, 'مدارک ناقص');

        $this->assertTrue($result);

        $request->refresh();
        $this->assertEquals('rejected', $request->status);
        $this->assertEquals('مدارک ناقص', $request->rejection_reason);
        $this->assertEquals($admin->id, $request->reviewed_by);
        $this->assertNotNull($request->reviewed_at);

        $user->refresh();
        $this->assertEquals('customer', $user->role);
    }
}