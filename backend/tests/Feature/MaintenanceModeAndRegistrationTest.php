<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * تست‌های فاز ۳ تسک «P0 SETTINGS/SECURITY FIX»: enforcement واقعی
 * maintenance_mode/maintenance_message (CheckMaintenanceMode middleware)
 * و registration_enabled (AuthService::registerOrRequestOtp).
 *
 * پیش از این فاز هر دو کاملاً no-op بودند — این فایل با bisection
 * (git stash روی فایل‌های تغییریافته) تایید شده که واقعاً بدون فیکس رد
 * می‌شوند، نه این‌که تصادفاً پاس شوند.
 */
class MaintenanceModeAndRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $u = User::factory()->create(['role' => 'admin']);
        $u->syncRoles(['admin']);

        return $u;
    }

    // ==================== registration_enabled ====================

    public function test_registration_disabled_blocks_a_brand_new_phone_number(): void
    {
        Setting::set('registration_enabled', '0', ['group' => 'system', 'type' => 'boolean']);

        $response = $this->postJson('/api/v1/register', ['phone' => '09121112233']);

        $response->assertStatus(422)->assertJsonValidationErrors('phone');
        $this->assertDatabaseMissing('users', ['phone' => '09121112233']);
    }

    public function test_registration_disabled_still_allows_an_existing_user_to_request_otp(): void
    {
        $existing = User::factory()->create(['phone' => '09121112244']);
        Setting::set('registration_enabled', '0', ['group' => 'system', 'type' => 'boolean']);

        $response = $this->postJson('/api/v1/register', ['phone' => '09121112244']);

        // این Setting درباره‌ی «ثبت‌نام» است نه «ورود» — کاربر موجود باید
        // بتواند صرف‌نظر از این کلید دوباره OTP بگیرد.
        $response->assertStatus(200);
        $this->assertEquals(1, User::where('phone', '09121112244')->count());
        $this->assertEquals($existing->id, User::where('phone', '09121112244')->first()->id);
    }

    public function test_registration_enabled_explicitly_true_allows_new_registration(): void
    {
        Setting::set('registration_enabled', '1', ['group' => 'system', 'type' => 'boolean']);

        $this->postJson('/api/v1/register', ['phone' => '09121112255'])->assertStatus(200);
        $this->assertDatabaseHas('users', ['phone' => '09121112255']);
    }

    public function test_registration_falls_back_to_enabled_when_no_setting_row_exists(): void
    {
        // ✅ هیچ ردیف Setting ای اصلاً وجود ندارد — باید طبق دیفالت
        // امن (true) رفتار کند، دقیقاً همان رفتار قبل از این فاز.
        $this->assertNull(Setting::where('key', 'registration_enabled')->first());

        $this->postJson('/api/v1/register', ['phone' => '09121112266'])->assertStatus(200);
        $this->assertDatabaseHas('users', ['phone' => '09121112266']);
    }

    // ==================== maintenance_mode ====================

    public function test_maintenance_mode_off_by_default_does_not_block_public_routes(): void
    {
        $this->assertNull(Setting::where('key', 'maintenance_mode')->first());

        $this->getJson('/api/v1/products')->assertStatus(200);
    }

    public function test_maintenance_mode_blocks_guest_on_public_routes(): void
    {
        Setting::set('maintenance_mode', '1', ['group' => 'system', 'type' => 'boolean']);
        Setting::set('maintenance_message', 'پیام تست تعمیر', ['group' => 'system', 'type' => 'textarea']);

        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'message' => 'پیام تست تعمیر',
                'code' => 'MAINTENANCE_MODE',
            ]);
    }

    public function test_maintenance_mode_blocks_authenticated_customer(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        Setting::set('maintenance_mode', '1', ['group' => 'system', 'type' => 'boolean']);

        $this->actingAs($customer)->getJson('/api/v1/wishlist')->assertStatus(503);
    }

    public function test_maintenance_mode_allows_authenticated_admin(): void
    {
        $admin = $this->admin();
        Setting::set('maintenance_mode', '1', ['group' => 'system', 'type' => 'boolean']);

        // ✅ همان روت داشبورد فاز ۲ — admin به‌صورت پیش‌فرض dashboard.view
        // دارد، پس اگر ۲۰۰ بگیرد یعنی از گیت maintenance عبور کرده، نه اینکه
        // قبل از آن با ۴۰۳ permission رد شده باشد.
        $this->actingAs($admin)->getJson('/api/v1/admin/dashboard/stats')->assertStatus(200);
    }

    public function test_maintenance_mode_does_not_lock_out_login_for_unauthenticated_users(): void
    {
        // ✅ حیاتی‌ترین تست ضد قفل-خودزنی: حتی وقتی سایت در حالت تعمیر
        // است، مسیر auth.* (ثبت‌نام/OTP/ورود) باز می‌ماند — وگرنه خودِ
        // ادمین هم هرگز نمی‌توانست دوباره وارد شود تا آن را خاموش کند.
        Setting::set('maintenance_mode', '1', ['group' => 'system', 'type' => 'boolean']);

        $this->postJson('/api/v1/register', ['phone' => '09121112277'])
            ->assertStatus(200);
    }

    public function test_maintenance_mode_response_has_no_success_field_true(): void
    {
        Setting::set('maintenance_mode', '1', ['group' => 'system', 'type' => 'boolean']);

        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(503)->assertJsonPath('success', false);
    }

    public function test_disabling_maintenance_mode_again_restores_normal_access(): void
    {
        Setting::set('maintenance_mode', '1', ['group' => 'system', 'type' => 'boolean']);
        $this->getJson('/api/v1/products')->assertStatus(503);

        Setting::set('maintenance_mode', '0', ['group' => 'system', 'type' => 'boolean']);
        $this->getJson('/api/v1/products')->assertStatus(200);
    }
}
