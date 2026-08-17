<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * تست‌های Permission Gate روی گروه روت /api/v1/admin/dashboard/*.
 *
 * پوشش فاز ۲ تسک «P0 SETTINGS/SECURITY FIX + WISHLIST RUNTIME FIX»:
 * قبل از این تغییر، routes/api.php فقط middleware عمومی 'admin' روی این
 * گروه داشت (بدون permission:X دانه‌ریز) — یعنی هر کاربر users.role=admin
 * با هر نقش Administrative (حتی manager با صفر Permission) می‌توانست
 * آمار داشبورد را ببیند. این فایل ثابت می‌کند:
 *   ۱. permission موجود → دسترسی مجاز
 *   ۲. permission غیرموجود → 403 (نه 500، نه bypass خاموش)
 *   ۳. رفتار قبلی نقش «admin» دست‌نخورده می‌ماند (چون dashboard.view در
 *      $superAdminOnlyByDefault نیست و از طریق seeder به‌صورت خودکار
 *      sync می‌شود).
 *
 * الگوی helper ها دقیقاً از AdminPermissionSystemTest.php کپی شده تا با
 * قرارداد تست‌های موجود این پروژه هم‌راستا بماند.
 */
class AdminDashboardPermissionTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['super_admin']);

        return $u;
    }

    /** ادمین با نقش Administrative «admin» (پیش‌فرض seed‌شده) */
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

    public function test_guest_gets_401_on_dashboard_stats(): void
    {
        $this->getJson('/api/v1/admin/dashboard/stats')->assertStatus(401);
    }

    public function test_customer_gets_403_on_dashboard_stats(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)->getJson('/api/v1/admin/dashboard/stats')->assertStatus(403);
    }

    // ==================== Permission missing → 403 ====================

    public function test_manager_without_dashboard_view_gets_403_on_all_four_routes(): void
    {
        $manager = $this->bareManager(); // صفر Permission

        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/stats')->assertStatus(403);
        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/chat-stats')->assertStatus(403);
        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/sentiment-stats')->assertStatus(403);
        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/recent-chat-activity')->assertStatus(403);
    }

    public function test_manager_with_unrelated_permission_still_gets_403_on_dashboard(): void
    {
        // ✅ اثبات می‌کند permission:dashboard.view واقعاً دانه‌ریز است —
        // یک Permission کاملاً بی‌ربط (orders.view) نباید دسترسی بدهد.
        $manager = $this->managerWith(['orders.view']);

        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/stats')->assertStatus(403);
    }

    // ==================== Permission granted → access allowed ====================

    public function test_manager_with_dashboard_view_can_access_all_four_routes(): void
    {
        $manager = $this->managerWith(['dashboard.view']);

        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/stats')->assertStatus(200);
        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/chat-stats')->assertStatus(200);
        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/sentiment-stats')->assertStatus(200);
        $this->actingAs($manager)->getJson('/api/v1/admin/dashboard/recent-chat-activity')->assertStatus(200);
    }

    public function test_super_admin_has_access_without_explicit_grant(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)->getJson('/api/v1/admin/dashboard/stats')->assertStatus(200);
    }

    // ==================== رفتار قبلی نقش admin دست‌نخورده می‌ماند ====================

    public function test_existing_admin_role_keeps_dashboard_access_without_manual_grant(): void
    {
        // ✅ رگرسیون حیاتی: قبل از این فاز، هر role=admin بدون هیچ
        // Permission ای می‌توانست داشبورد را ببیند. dashboard.view در
        // $superAdminOnlyByDefault نیست، پس seeder آن را خودکار به نقش
        // «admin» sync می‌کند — یعنی ادمین‌های موجود بدون تغییر رفتار،
        // همچنان دسترسی دارند (نه ۴۰۳ ناگهانی).
        $admin = $this->admin();

        $this->assertTrue($admin->hasPermissionTo('dashboard.view'));

        $this->actingAs($admin)->getJson('/api/v1/admin/dashboard/stats')->assertStatus(200);
        $this->actingAs($admin)->getJson('/api/v1/admin/dashboard/chat-stats')->assertStatus(200);
        $this->actingAs($admin)->getJson('/api/v1/admin/dashboard/sentiment-stats')->assertStatus(200);
        $this->actingAs($admin)->getJson('/api/v1/admin/dashboard/recent-chat-activity')->assertStatus(200);
    }

    public function test_dashboard_stats_response_shape_is_unchanged(): void
    {
        // ✅ اطمینان از این‌که فاز ۲ فقط یک لایه‌ی permission اضافه کرده،
        // نه تغییری در پاسخ خودِ controller/service.
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertArrayHasKey('data', $response->json());
    }
}
