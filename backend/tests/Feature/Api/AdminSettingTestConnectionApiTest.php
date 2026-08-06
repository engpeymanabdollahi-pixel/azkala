<?php

namespace Tests\Feature\Api;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminSettingTestConnectionApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    /**
     * ✅ قبلاً testSmtp() یک mock ثابت بود و بدون توجه به تنظیمات واقعی
     * همیشه success=true برمی‌گرداند. حالا اگر Host/Port ذخیره نشده باشد
     * باید صادقانه شکست بخورد و هیچ ایمیلی هم نباید تلاش شود ارسال شود.
     */
    public function test_smtp_test_fails_honestly_when_not_configured(): void
    {
        Mail::fake();

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/settings/test-smtp');

        $response->assertStatus(200)
            ->assertJsonPath('success', false);

        Mail::assertNothingSent();
    }

    /**
     * وقتی Host/Port/ایمیل پشتیبانی واقعاً ذخیره شده باشند، باید مسیر ارسال
     * واقعی (نه یک mock ثابت) اجرا شود. Mail::fake() مانع اتصال واقعی به
     * شبکه می‌شود، بنابراین اینجا فقط صحت مسیر «تنظیمات کامل → تلاش برای
     * ارسال» را بررسی می‌کنیم؛ Mail::raw() توسط MailFake قابل ردیابی نیست.
     */
    public function test_smtp_test_succeeds_when_fully_configured(): void
    {
        Mail::fake();

        Setting::factory()->create(['key' => 'smtp_host', 'value' => 'smtp.mailtrap.io', 'type' => 'text']);
        Setting::factory()->create(['key' => 'smtp_port', 'value' => '2525', 'type' => 'text']);
        Setting::factory()->create(['key' => 'smtp_username', 'value' => 'test', 'type' => 'text']);
        Setting::factory()->create(['key' => 'smtp_password', 'value' => 'secret', 'type' => 'text']);
        Setting::factory()->create(['key' => 'support_email', 'value' => 'support@azkala.test', 'type' => 'text']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/settings/test-smtp');

        $response->assertStatus(200)->assertJsonPath('success', true);
    }

    /**
     * ✅ قبلاً testSms() صرف‌نظر از اینکه هیچ تنظیمی ذخیره نشده باشد، همیشه
     * success=true با پیام «ارسال موفق» برمی‌گرداند.
     */
    public function test_sms_test_fails_honestly_when_not_configured(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/settings/test-sms');

        $response->assertStatus(200)->assertJsonPath('success', false);
    }

    public function test_sms_test_reports_configured_state_when_settings_exist(): void
    {
        Setting::factory()->create(['key' => 'sms_provider', 'value' => 'kavenegar', 'type' => 'text']);
        Setting::factory()->create(['key' => 'sms_api_key', 'value' => 'test-key', 'type' => 'text']);
        Setting::factory()->create(['key' => 'sms_sender_number', 'value' => '30001234', 'type' => 'text']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/settings/test-sms');

        $response->assertStatus(200)->assertJsonPath('success', true);
    }
}
