<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * تست‌های سیستم Multi-Admin/Manager (Role + Permission).
 * پوشش: بخش ۲۹ درخواست (Authentication/Permissions/Roles/Escalation/
 * Self-Modification/Delegation/Commission/Finance isolation).
 */
class AdminPermissionSystemTest extends TestCase
{
    use RefreshDatabase;

    // ==================== Helpers ====================

    private function superAdmin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['super_admin']);

        return $u;
    }

    /** ادمین با نقش Administrative «admin» (پیش‌فرض seed‌شده — بدون sensitive permission ها) */
    private function admin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['admin']);

        return $u;
    }

    /** Manager با users.role=admin ولی صفر Permission (رفتار پیش‌فرض seed) */
    private function bareManager(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['manager']);

        return $u;
    }

    private function managerWith(array $permissions): User
    {
        $u = $this->bareManager();
        $u->givePermissionTo($permissions);

        return $u;
    }

    // ==================== Authentication ====================

    public function test_guest_gets_401_on_permission_gated_route(): void
    {
        $this->getJson('/api/v1/admin/orders')->assertStatus(401);
    }

    public function test_customer_gets_403_on_permission_gated_route(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)->getJson('/api/v1/admin/orders')->assertStatus(403);
    }

    public function test_seller_gets_403_on_permission_gated_route(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);

        $this->actingAs($seller)->getJson('/api/v1/admin/orders')->assertStatus(403);
    }

    public function test_admin_without_permission_gets_403(): void
    {
        $manager = $this->bareManager(); // users.role=admin, صفر Permission

        $this->actingAs($manager)->getJson('/api/v1/admin/orders')->assertStatus(403);
    }

    public function test_authorized_admin_gets_200(): void
    {
        $manager = $this->managerWith(['orders.view']);

        $this->actingAs($manager)->getJson('/api/v1/admin/orders')->assertStatus(200);
    }

    // ==================== Permissions ====================

    public function test_permission_granted_allows_action(): void
    {
        $manager = $this->managerWith(['catalog.view']);

        $this->actingAs($manager)->getJson('/api/v1/admin/categories')->assertStatus(200);
    }

    public function test_permission_missing_returns_403(): void
    {
        $manager = $this->managerWith(['catalog.view']); // view دارد، manage ندارد

        $this->actingAs($manager)
            ->postJson('/api/v1/admin/categories', ['name' => 'تست'])
            ->assertStatus(403);
    }

    // ==================== Roles ====================

    public function test_super_admin_has_full_access_without_explicit_grants(): void
    {
        $superAdmin = $this->superAdmin();

        // چند endpoint کاملاً متفاوت — هیچ‌کدام صریحاً grant نشده‌اند،
        // فقط از طریق نقش super_admin (که در seed همه‌ی permission ها را دارد + bypass کدی).
        $this->actingAs($superAdmin)->getJson('/api/v1/admin/orders')->assertStatus(200);
        $this->actingAs($superAdmin)->getJson('/api/v1/admin/commission-rules')->assertStatus(200);
        $this->actingAs($superAdmin)->getJson('/api/v1/admin/settings')->assertStatus(200);
        $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users')->assertStatus(200);
    }

    public function test_admin_role_has_broad_default_access_but_not_super_admin_only_permissions(): void
    {
        // ⚠️ این تست عمداً تصمیم معماری seeder را بازتاب می‌دهد، نه یک
        // فرض دلخواه: نقش Administrative «admin» به‌صورت پیش‌فرض دسترسی
        // گسترده دارد (دقیقاً همان چیزی که هر role=admin موجود از قبل
        // بدون هیچ محدودیتی داشت — اثبات‌شده توسط تست‌های از پیش موجود
        // AdminCommissionApiTest/AdminOrderApiTest/
        // AdminSettingTestConnectionApiTest که این‌ها را برای یک
        // role=admin ساده انتظار موفقیت دارند). تنها استثناها همان چند
        // Permission واقعاً Super-Admin-exclusive‌اند (رجوع به کامنت
        // کامل در AdministrativeAccessSeeder::run).
        $admin = $this->admin();

        $this->actingAs($admin)->getJson('/api/v1/admin/orders')->assertStatus(200); // orders.view
        $this->actingAs($admin)->getJson('/api/v1/admin/commission-rules')->assertStatus(200); // commission.view

        // دسترسی گسترده پیش‌فرض — برخلاف قبل، این‌ها دیگر «حساس و مستثنا»
        // نیستند، چون تست‌های از پیش موجود اثبات می‌کنند یک role=admin
        // ساده امروز واقعاً می‌تواند این کارها را انجام دهد.
        $rule = \App\Models\CommissionRule::first();
        $this->actingAs($admin)
            ->putJson("/api/v1/admin/commission-rules/{$rule->id}", ['commission_rate' => 2, 'label' => $rule->label])
            ->assertStatus(200); // commission.rules.manage اکنون پیش‌فرض است

        // admin.access.view (فقط مشاهده، بی‌خطر) هم پیش‌فرض داده می‌شود
        $this->actingAs($admin)->getJson('/api/v1/admin/access/users')->assertStatus(200);

        // استثنای واقعی Super-Admin-only: *مدیریت* (نه مشاهده)
        // Administrative Access — بردار delegation/escalation
        $other = $this->bareManager();
        $this->actingAs($admin)
            ->putJson("/api/v1/admin/access/users/{$other->id}/role", ['role' => 'manager'])
            ->assertStatus(403); // admin.access.manage پیش‌فرض Super-Admin-exclusive است

        // finance.payout هم پیش‌فرض Super-Admin-exclusive است (بخش ۹:
        // Finance Isolation) — رجوع به تست‌های Finance Isolation پایین
        // فایل برای پوشش کامل‌تر این مورد از طریق مسیر Order.
    }

    public function test_manager_has_only_explicitly_granted_permissions(): void
    {
        $manager = $this->managerWith(['reviews.view']);

        $this->actingAs($manager)->getJson('/api/v1/admin/reviews')->assertStatus(200);
        $this->actingAs($manager)->getJson('/api/v1/admin/orders')->assertStatus(403);
        $this->actingAs($manager)->getJson('/api/v1/admin/commission-rules')->assertStatus(403);
    }

    // ==================== Escalation ====================

    public function test_manager_cannot_become_admin(): void
    {
        $superAdmin = $this->superAdmin();
        $manager = $this->managerWith(['admin.access.manage']); // حتی اگر این را (اشتباهاً) داشته باشد

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$manager->id}/role", ['role' => 'admin'])
            ->assertStatus(403);
    }

    public function test_manager_cannot_become_super_admin(): void
    {
        $manager = $this->managerWith(['admin.access.manage']);
        $other = $this->bareManager();

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$other->id}/role", ['role' => 'super_admin'])
            ->assertStatus(403);
    }

    public function test_admin_cannot_become_super_admin(): void
    {
        $admin = $this->admin();
        $admin->givePermissionTo('admin.access.manage');
        $other = $this->bareManager();

        $this->actingAs($admin)
            ->putJson("/api/v1/admin/access/users/{$other->id}/role", ['role' => 'super_admin'])
            ->assertStatus(403);
    }

    public function test_manager_cannot_grant_admin_role_to_anyone(): void
    {
        $manager = $this->managerWith(['admin.access.manage']);
        $other = $this->bareManager();

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$other->id}/role", ['role' => 'admin'])
            ->assertStatus(403);
    }

    public function test_admin_cannot_grant_super_admin_role(): void
    {
        $admin = $this->admin();
        $admin->givePermissionTo('admin.access.manage');
        $other = $this->bareManager();

        $this->actingAs($admin)
            ->putJson("/api/v1/admin/access/users/{$other->id}/role", ['role' => 'super_admin'])
            ->assertStatus(403);

        $this->assertFalse($other->fresh()->hasRole('super_admin'));
    }

    // ==================== Self Modification ====================

    public function test_cannot_modify_own_administrative_role(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$superAdmin->id}/role", ['role' => null])
            ->assertStatus(403);

        $this->assertTrue($superAdmin->fresh()->hasRole('super_admin'));
    }

    public function test_cannot_modify_own_permissions(): void
    {
        $admin = $this->admin();
        $admin->givePermissionTo('admin.access.manage');

        $this->actingAs($admin)
            ->putJson("/api/v1/admin/access/users/{$admin->id}/permissions", ['permissions' => ['finance.payout']])
            ->assertStatus(403);

        $this->assertFalse($admin->fresh()->hasPermissionTo('finance.payout'));
    }

    public function test_users_role_self_modification_still_blocked_finding_1(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->putJson("/api/v1/admin/users/{$admin->id}/role", ['role' => 'customer'])
            ->assertStatus(403);

        $this->assertEquals('admin', $admin->fresh()->role);
    }

    // ==================== Delegation ====================

    public function test_manager_cannot_delegate_even_with_admin_access_manage_permission(): void
    {
        // Manager هیچ delegation ای ندارد — حتی اگر Permission
        // admin.access.manage به او داده شده باشد (سناریوی غیرمعمول ولی
        // باید همچنان reject شود، چون delegation بر اساس *نقش*
        // Administrative است نه یک Permission تکی).
        $manager = $this->managerWith(['admin.access.manage']);
        $target = $this->bareManager();

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$target->id}/permissions", ['permissions' => ['orders.view']])
            ->assertStatus(403);
    }

    public function test_admin_cannot_grant_permission_beyond_its_own_authority(): void
    {
        $admin = $this->admin(); // پیش‌فرض finance.payout ندارد (حساس است)
        $admin->givePermissionTo('admin.access.manage');
        $target = $this->bareManager();

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/access/users/{$target->id}/permissions", ['permissions' => ['finance.payout']]);

        $response->assertStatus(403);
        $this->assertFalse($target->fresh()->hasPermissionTo('finance.payout'));
    }

    public function test_super_admin_can_manage_admin_access_fully(): void
    {
        $superAdmin = $this->superAdmin();
        $target = $this->bareManager();

        $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$target->id}/role", ['role' => 'admin'])
            ->assertStatus(200);

        $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$target->id}/permissions", ['permissions' => ['finance.payout', 'commission.rules.manage']])
            ->assertStatus(200);

        $target->refresh();
        $this->assertTrue($target->hasRole('admin'));
        $this->assertTrue($target->hasPermissionTo('finance.payout'));
        $this->assertTrue($target->hasPermissionTo('commission.rules.manage'));
    }

    // ==================== Commission Isolation ====================

    public function test_commission_view_permission_works(): void
    {
        $manager = $this->managerWith(['commission.view']);

        $this->actingAs($manager)->getJson('/api/v1/admin/commission-rules')->assertStatus(200);
    }

    public function test_commission_rules_manage_requires_specific_permission(): void
    {
        $viewOnly = $this->managerWith(['commission.view']);
        $manager = $this->managerWith(['commission.rules.manage']);

        $this->actingAs($viewOnly)
            ->postJson('/api/v1/admin/commission-rules', ['level' => 'x', 'label' => 'x', 'min_score' => 1, 'max_score' => 2, 'commission_rate' => 1])
            ->assertStatus(403);

        $this->actingAs($manager)
            ->postJson('/api/v1/admin/commission-rules', ['level' => 'test_level', 'label' => 'تست', 'min_score' => 1, 'max_score' => 2, 'commission_rate' => 1])
            ->assertStatus(201);
    }

    public function test_commission_override_view_and_manage_are_separate_permissions(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $viewer = $this->managerWith(['commission.override.view']);
        $manager = $this->managerWith(['commission.override.manage']);

        $this->actingAs($viewer)->getJson("/api/v1/admin/users/{$seller->id}/commission")->assertStatus(200);
        $this->actingAs($viewer)
            ->putJson("/api/v1/admin/users/{$seller->id}/commission-override", ['rate' => 2])
            ->assertStatus(403);

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/users/{$seller->id}/commission-override", ['rate' => 2])
            ->assertStatus(200);
    }

    public function test_commission_permissions_do_not_grant_finance_payout(): void
    {
        $manager = $this->managerWith([
            'commission.view', 'commission.rules.manage',
            'commission.override.view', 'commission.override.manage',
            'orders.view', 'orders.manage',
        ]);

        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create(['seller_id' => $seller->id, 'price' => 100000]);
        $order = Order::factory()->create(['status' => 'processing', 'total' => 100000]);
        $order->items()->create(['product_id' => $product->id, 'seller_id' => $seller->id, 'quantity' => 1, 'price' => 100000, 'total' => 100000]);

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertStatus(403);
    }

    // ==================== Finance Isolation ====================

    public function test_finance_view_does_not_imply_finance_manage(): void
    {
        $manager = $this->managerWith(['finance.view']);

        $this->assertTrue($manager->hasPermissionTo('finance.view'));
        $this->assertFalse($manager->hasPermissionTo('finance.manage'));
    }

    public function test_finance_manage_does_not_imply_finance_payout(): void
    {
        $manager = $this->managerWith(['finance.manage']);

        $this->assertTrue($manager->hasPermissionTo('finance.manage'));
        $this->assertFalse($manager->hasPermissionTo('finance.payout'));
    }

    public function test_orders_manage_alone_cannot_trigger_payout_transition(): void
    {
        $manager = $this->managerWith(['orders.view', 'orders.manage']);

        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create(['seller_id' => $seller->id, 'price' => 80000]);
        $order = Order::factory()->create(['status' => 'processing', 'total' => 80000]);
        $order->items()->create(['product_id' => $product->id, 'seller_id' => $seller->id, 'quantity' => 1, 'price' => 80000, 'total' => 80000]);

        // انتقال بی‌ضرر (بدون Payout) باید کار کند
        $this->actingAs($manager)
            ->putJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'shipped'])
            ->assertStatus(200);

        // انتقال به delivered (Payout واقعی) باید رد شود
        $this->actingAs($manager)
            ->putJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertStatus(403);

        $this->assertEquals(0, (float) $seller->fresh()->wallet_balance);
    }

    public function test_orders_manage_with_finance_payout_can_complete_delivery(): void
    {
        $manager = $this->managerWith(['orders.view', 'orders.manage', 'finance.payout']);

        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 5]);
        $product = Product::factory()->create(['seller_id' => $seller->id, 'price' => 80000]);
        $order = Order::factory()->create(['status' => 'processing', 'total' => 80000]);
        $order->items()->create(['product_id' => $product->id, 'seller_id' => $seller->id, 'quantity' => 1, 'price' => 80000, 'total' => 80000]);

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertStatus(200);

        $this->assertGreaterThan(0, (float) $seller->fresh()->wallet_balance);
    }
}
