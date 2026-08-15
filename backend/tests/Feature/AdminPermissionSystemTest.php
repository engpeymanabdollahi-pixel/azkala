<?php

namespace Tests\Feature;

use App\Models\AdminAccessLog;
use App\Models\CommissionRule;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Admin\AdminAccessService;
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
        $rule = CommissionRule::first();
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

    // ==================== Legacy users.role Bypass (بخش ۱۸ گزارش نهایی) ====================
    //
    // مسیر قدیمی PUT /admin/users/{user}/role (users.role اصلی، نه
    // Administrative Role) یک بردار غیرمستقیم برای دور زدن hierarchy
    // بود: کسی با فقط users.role.manage می‌توانست بدون admin.access.
    // manage یک کاربر را به role=admin ارتقا دهد (که خودکار Administrative
    // Role «admin» می‌گیرد) یا Administrative Role موجود کسی را با
    // تغییر users.role قطع کند. AdminUserService::updateUserRole حالا
    // این حالت‌ها را از طریق AdminAccessService::canManageAdministrativeRole
    // (همان منبع حقیقت مسیر admin/access/*) رد می‌کند.

    public function test_users_role_manage_alone_cannot_promote_customer_to_admin(): void
    {
        $manager = $this->managerWith(['users.role.manage']); // بدون admin.access.manage
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/users/{$customer->id}/role", ['role' => 'admin'])
            ->assertStatus(403);

        $this->assertEquals('customer', $customer->fresh()->role);
    }

    public function test_users_role_manage_alone_cannot_demote_an_existing_admin(): void
    {
        $manager = $this->managerWith(['users.role.manage']);
        $existingAdmin = $this->admin(); // Administrative Role «admin» دارد

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/users/{$existingAdmin->id}/role", ['role' => 'customer'])
            ->assertStatus(403);

        $this->assertEquals('admin', $existingAdmin->fresh()->role);
    }

    public function test_users_role_manage_with_admin_access_manage_can_promote_to_admin(): void
    {
        // ✅ عمداً از admin() استفاده می‌شود نه managerWith(): delegation بر
        // اساس نقش Administrative («admin»/«super_admin») است، نه صرفاً
        // داشتن Permission admin.access.manage — دقیقاً همان قانونی که
        // test_manager_cannot_delegate_even_with_admin_access_manage_permission
        // برای مسیر admin/access/* اثبات می‌کند؛ اینجا همان قانون را برای
        // مسیر قدیمی users.role هم صادق نگه می‌داریم.
        $admin = $this->admin();
        $admin->givePermissionTo(['users.role.manage', 'admin.access.manage']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($admin)
            ->putJson("/api/v1/admin/users/{$customer->id}/role", ['role' => 'admin'])
            ->assertStatus(200);

        $this->assertEquals('admin', $customer->fresh()->role);
    }

    public function test_manager_with_both_permissions_still_cannot_promote_via_legacy_endpoint(): void
    {
        // Manager هرگز delegation ندارد — even با هر دو Permission (رفتار
        // یکسان با /admin/access/* برای همین مسیر قدیمی حفظ می‌شود).
        $manager = $this->managerWith(['users.role.manage', 'admin.access.manage']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/users/{$customer->id}/role", ['role' => 'admin'])
            ->assertStatus(403);

        $this->assertEquals('customer', $customer->fresh()->role);
    }

    public function test_users_role_manage_alone_still_works_for_ordinary_non_administrative_changes(): void
    {
        // ✅ چک جدید نباید رفتار غیرحساس (customer→seller) را بشکند —
        // هیچ Administrative Role ای نه هدف دارد نه role جدید ایجاد می‌کند.
        $manager = $this->managerWith(['users.role.manage']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/users/{$customer->id}/role", ['role' => 'seller'])
            ->assertStatus(200);

        $this->assertEquals('seller', $customer->fresh()->role);
    }

    public function test_super_admin_can_promote_via_legacy_role_endpoint(): void
    {
        $superAdmin = $this->superAdmin();
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/users/{$customer->id}/role", ['role' => 'admin'])
            ->assertStatus(200);

        $this->assertEquals('admin', $customer->fresh()->role);
    }

    // ==================== Admin Access Search (GET /admin/access/users?search=) ====================
    //
    // بدون endpoint جدید — همان GET /admin/access/users با پارامتر
    // اختیاری search (name/phone/email، الگوی LIKE دقیقاً مطابق
    // AdminUserRepository::getUsers). جستجو همیشه *داخل* استخر
    // users.role='admin' اعمال می‌شود (مسیر A دست‌نخورده).

    public function test_search_finds_user_by_name(): void
    {
        $superAdmin = $this->superAdmin();
        $target = User::factory()->create(['role' => 'admin', 'name' => 'زهرا احمدی نمونه']);
        User::factory()->create(['role' => 'admin', 'name' => 'کاربر بی‌ربط دیگر']);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users?search=احمدی');

        $response->assertStatus(200);
        $names = collect($response->json('data.data'))->pluck('id');
        $this->assertTrue($names->contains($target->id));
        $this->assertCount(1, $response->json('data.data'));
    }

    public function test_search_finds_user_by_phone(): void
    {
        $superAdmin = $this->superAdmin();
        $target = User::factory()->create(['role' => 'admin', 'phone' => '09121234567']);
        User::factory()->create(['role' => 'admin', 'phone' => '09359998877']);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users?search=0912');

        $response->assertStatus(200)->assertJsonCount(1, 'data.data');
        $this->assertEquals($target->id, $response->json('data.data.0.id'));
    }

    public function test_search_finds_user_by_email(): void
    {
        $superAdmin = $this->superAdmin();
        $target = User::factory()->create(['role' => 'admin', 'email' => 'unique-search-target@azkala.test']);
        User::factory()->create(['role' => 'admin', 'email' => 'someone-else@azkala.test']);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users?search=unique-search-target');

        $response->assertStatus(200)->assertJsonCount(1, 'data.data');
        $this->assertEquals($target->id, $response->json('data.data.0.id'));
    }

    public function test_empty_search_returns_all_admin_role_users(): void
    {
        $superAdmin = $this->superAdmin();
        User::factory()->count(3)->create(['role' => 'admin']);

        // بدون search اصلاً — یعنی رفتار قبلی (قبل از این تسک) باید دست‌نخورده بماند
        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users');

        $response->assertStatus(200);
        // ۳ کاربر تازه‌ساخته + خودِ superAdmin (که users.role هم admin است)
        $this->assertEquals(4, $response->json('data.total'));
    }

    public function test_search_with_no_matching_result_returns_empty_list_not_error(): void
    {
        $superAdmin = $this->superAdmin();
        User::factory()->create(['role' => 'admin', 'name' => 'یک کاربر واقعی']);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users?search=رشته-کاملا-نامرتبط-xyz-999');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data.data')
            ->assertJsonPath('data.total', 0);
    }

    public function test_search_respects_pagination(): void
    {
        $superAdmin = $this->superAdmin();
        // ۵ کاربر با یک نام مشترک قابل‌جستجو، per_page=2 → باید ۳ صفحه بدهد
        User::factory()->count(5)->create(['role' => 'admin', 'name' => fn () => 'مشترک-جستجو '.fake()->firstName()]);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users?search=مشترک-جستجو&per_page=2&page=1');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 5)
            ->assertJsonPath('data.per_page', 2)
            ->assertJsonPath('data.last_page', 3)
            ->assertJsonCount(2, 'data.data');
    }

    public function test_search_finds_users_with_any_users_role(): void
    {
        // ✅ تصمیم معماری صریح این تسک (به‌روزرسانی نسبت به تسک قبلی
        // Search): جستجو دیگر به users.role=admin محدود نیست — یک Super
        // Admin باید بتواند هر کاربر موجودی (customer/seller/admin) را
        // پیدا کند تا بتواند اولین بار به او Administrative Role بدهد.
        // مرز امنیتی واقعی جای دیگری enforce می‌شود (canManageAdministrativeRole
        // در assignAdministrativeRole)، نه در این لیست فقط-خواندنی.
        $superAdmin = $this->superAdmin();
        User::factory()->create(['role' => 'admin', 'name' => 'رضا مشترک تست']);
        User::factory()->create(['role' => 'customer', 'name' => 'رضا مشترک تست']);
        User::factory()->create(['role' => 'seller', 'name' => 'رضا مشترک تست']);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users?search=رضا مشترک تست');

        $response->assertStatus(200)->assertJsonCount(3, 'data.data');
        $roles = collect($response->json('data.data'))->pluck('users_role')->sort()->values();
        $this->assertEquals(['admin', 'customer', 'seller'], $roles->all());
    }

    public function test_search_finds_users_by_email_even_when_not_admin_role(): void
    {
        $superAdmin = $this->superAdmin();
        $target = User::factory()->create(['role' => 'customer', 'email' => 'brand-new-customer-target@azkala.test']);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users?search=brand-new-customer-target');

        $response->assertStatus(200)->assertJsonCount(1, 'data.data');
        $this->assertEquals($target->id, $response->json('data.data.0.id'));
        $this->assertEquals('customer', $response->json('data.data.0.users_role'));
        $this->assertNull($response->json('data.data.0.administrative_role'));
    }

    public function test_without_search_default_list_stays_scoped_to_admin_role_only(): void
    {
        // ✅ بدون search، رفتار قبلی (قبل از این تسک) دست‌نخورده می‌ماند —
        // این پیش‌فرض هرگز خودش را روی کل جدول users باز نمی‌کند.
        $superAdmin = $this->superAdmin();
        User::factory()->create(['role' => 'customer']);
        User::factory()->create(['role' => 'seller']);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/admin/access/users');

        $response->assertStatus(200);
        collect($response->json('data.data'))->each(
            fn (array $u) => $this->assertEquals('admin', $u['users_role'])
        );
    }

    // ==================== Auth/Hierarchy Regression روی endpoint های همین تسک ====================
    //
    // این‌ها همان قوانین از پیش تثبیت‌شده (بخش‌های بالای همین فایل) را
    // *دوباره طراحی* نمی‌کنند؛ فقط مستقیماً روی GET/PUT admin/access/users
    // (endpoint هدف این تسک) تکرار می‌کنند تا رگرسیون این تسک را هم
    // مستقل پوشش دهند.

    public function test_guest_cannot_access_admin_access_users(): void
    {
        $this->getJson('/api/v1/admin/access/users')->assertStatus(401);
    }

    public function test_customer_cannot_access_admin_access_users(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $this->actingAs($customer)->getJson('/api/v1/admin/access/users')->assertStatus(403);
    }

    public function test_seller_cannot_access_admin_access_users(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $this->actingAs($seller)->getJson('/api/v1/admin/access/users')->assertStatus(403);
    }

    public function test_admin_without_admin_access_view_cannot_list_users(): void
    {
        $manager = $this->bareManager(); // صفر Permission، از جمله admin.access.view
        $this->actingAs($manager)->getJson('/api/v1/admin/access/users')->assertStatus(403);
    }

    public function test_admin_without_admin_access_manage_cannot_change_role_or_permissions(): void
    {
        $manager = $this->managerWith(['admin.access.view']); // فقط view، نه manage
        $target = $this->bareManager();

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$target->id}/role", ['role' => 'admin'])
            ->assertStatus(403);

        $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$target->id}/permissions", ['permissions' => ['orders.view']])
            ->assertStatus(403);
    }

    // ==================== Administrative Role Assignment برای کاربران غیر-admin ====================
    //
    // Option A: assignAdministrativeRole دیگر users.role=admin را
    // پیش‌نیاز نمی‌داند — اگر actor مجاز باشد، users.role هدف هم در همان
    // تراکنش به‌طور خودکار admin می‌شود. ۱۲ سناریوی امنیتی الزامی‌شده
    // در این تسک، دقیقاً به همین ترتیب.

    // ۱. Super Admin → customer → manager = موفق
    public function test_super_admin_can_assign_manager_role_to_a_customer(): void
    {
        $superAdmin = $this->superAdmin();
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'manager']);

        $response->assertStatus(200);
        $customer->refresh();
        $this->assertEquals('admin', $customer->role); // ✅ Option A: users.role هم خودکار admin شد
        $this->assertTrue($customer->hasRole('manager'));
        $this->assertFalse($customer->hasRole('admin')); // Administrative Role دقیقاً manager است، نه admin
    }

    // ۲. Super Admin → seller → manager = موفق
    public function test_super_admin_can_assign_manager_role_to_a_seller(): void
    {
        $superAdmin = $this->superAdmin();
        $seller = User::factory()->create(['role' => 'seller']);

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$seller->id}/role", ['role' => 'manager']);

        $response->assertStatus(200);
        $seller->refresh();
        $this->assertEquals('admin', $seller->role);
        $this->assertTrue($seller->hasRole('manager'));
    }

    // ۳. Super Admin → customer → admin (Administrative Role) = موفق
    public function test_super_admin_can_assign_administrative_admin_role_to_a_customer(): void
    {
        $superAdmin = $this->superAdmin();
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'admin']);

        $response->assertStatus(200);
        $customer->refresh();
        $this->assertEquals('admin', $customer->role);
        $this->assertTrue($customer->hasRole('admin'));
    }

    // ۴. Admin (با admin.access.manage) → customer → manager = طبق hierarchy مجاز
    public function test_admin_with_admin_access_manage_can_assign_manager_to_a_customer(): void
    {
        $admin = $this->admin();
        $admin->givePermissionTo('admin.access.manage');
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'manager']);

        $response->assertStatus(200);
        $this->assertTrue($customer->fresh()->hasRole('manager'));
    }

    // ۵. Manager → customer → admin = رد (Manager صفر delegation دارد)
    public function test_manager_cannot_assign_admin_role_to_a_customer(): void
    {
        $manager = $this->managerWith(['admin.access.manage']); // even با این Permission
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'admin']);

        $response->assertStatus(403);
        $this->assertEquals('customer', $customer->fresh()->role); // ✅ users.role هم دست‌نخورده ماند
        $this->assertNull($customer->fresh()->getRoleNames()->first());
    }

    // ۶. Manager → customer → super_admin = رد
    public function test_manager_cannot_assign_super_admin_role_to_a_customer(): void
    {
        $manager = $this->managerWith(['admin.access.manage']);
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'super_admin']);

        $response->assertStatus(403);
        $this->assertEquals('customer', $customer->fresh()->role);
    }

    // ۷. Admin → super_admin (حتی برای یک کاربر کاملاً تازه) = رد
    public function test_admin_cannot_assign_super_admin_role_to_a_fresh_customer(): void
    {
        $admin = $this->admin();
        $admin->givePermissionTo('admin.access.manage');
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'super_admin']);

        $response->assertStatus(403);
        $this->assertEquals('customer', $customer->fresh()->role); // ✅ حتی users.role هم تغییر نکرد
    }

    // ۸. Admin → تغییر super_admin موجود = رد
    public function test_admin_cannot_change_an_existing_super_admin(): void
    {
        $admin = $this->admin();
        $admin->givePermissionTo('admin.access.manage');
        $existingSuperAdmin = $this->superAdmin();

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/access/users/{$existingSuperAdmin->id}/role", ['role' => 'manager']);

        $response->assertStatus(403);
        $this->assertTrue($existingSuperAdmin->fresh()->hasRole('super_admin'));
    }

    // ۹. Manager → تغییر Role خودش = رد
    public function test_manager_cannot_change_its_own_role_via_assignment_endpoint(): void
    {
        $manager = $this->managerWith(['admin.access.manage']);

        $response = $this->actingAs($manager)
            ->putJson("/api/v1/admin/access/users/{$manager->id}/role", ['role' => 'admin']);

        $response->assertStatus(403);
        $this->assertTrue($manager->fresh()->hasRole('manager'));
    }

    // ۱۰. Super Admin → تغییر Role خودش = رد (پوشش تکراری عمدی با تست
    // موجود cannot_modify_own_administrative_role — اینجا با target=null هم چک می‌شود)
    public function test_super_admin_cannot_remove_its_own_role_via_assignment_endpoint(): void
    {
        $superAdmin = $this->superAdmin();

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$superAdmin->id}/role", ['role' => 'admin']);

        $response->assertStatus(403);
        $this->assertTrue($superAdmin->fresh()->hasRole('super_admin'));
    }

    // ۱۱. Customer بدون permission → endpoint = 403
    public function test_customer_without_permission_cannot_assign_role_to_anyone(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $otherCustomer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)
            ->putJson("/api/v1/admin/access/users/{$otherCustomer->id}/role", ['role' => 'manager'])
            ->assertStatus(403);
    }

    // ۱۲. Seller بدون permission → endpoint = 403
    public function test_seller_without_permission_cannot_assign_role_to_anyone(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($seller)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'manager'])
            ->assertStatus(403);
    }

    // ==================== تست‌های تکمیلی: audit log و حذف نقش ====================

    public function test_assigning_role_to_non_admin_user_logs_both_users_role_and_administrative_role_change(): void
    {
        $superAdmin = $this->superAdmin();
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'manager'])
            ->assertStatus(200);

        $log = AdminAccessLog::where('target_user_id', $customer->id)->latest()->first();
        $this->assertNotNull($log);
        $this->assertEquals(AdminAccessLog::ACTION_ROLE_ASSIGNED, $log->action);
        $newValue = json_decode($log->new_value, true);
        $this->assertEquals('manager', $newValue['administrative_role']);
        $this->assertEquals('admin', $newValue['users_role']);
    }

    public function test_removing_administrative_role_does_not_revert_users_role(): void
    {
        // ✅ رفتار مستند‌شده: حذف Administrative Role (role=null) عمداً
        // users.role را به حالت قبلی برنمی‌گرداند — کاربر همچنان
        // users.role=admin می‌ماند.
        $superAdmin = $this->superAdmin();
        $customer = User::factory()->create(['role' => 'customer']);
        $this->actingAs($superAdmin)->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => 'manager']);

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/access/users/{$customer->id}/role", ['role' => null]);

        $response->assertStatus(200);
        $customer->refresh();
        $this->assertEquals('admin', $customer->role); // برنگشت به customer
        $this->assertNull($this->app->make(AdminAccessService::class)
            ->currentAdministrativeRole($customer));
    }
}
