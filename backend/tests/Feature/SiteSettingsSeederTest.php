<?php

namespace Tests\Feature;

use App\Models\Setting;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ قبلاً هیچ Seederی جدول settings را پر نمی‌کرد. config('azkala.settings_defaults')
 * و AdminSettingService::seedDefaults() از قبل درست کار می‌کردند، ولی فقط
 * با کلیک دستی ادمین روی دکمه‌ی «بازگرداندن پیش‌فرض‌ها» صدا زده می‌شدند —
 * روی هر نصب تازه، جدول settings خالی می‌ماند و GET /site-settings
 * (که هدر و فوتر سایت مستقیماً از آن تغذیه می‌شوند) data خالی برمی‌گرداند.
 */
class SiteSettingsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_creates_all_keys_that_the_public_site_settings_endpoint_reads(): void
    {
        $this->seed(SettingSeeder::class);

        $expectedKeys = [
            'site_name', 'site_logo', 'site_favicon',
            'support_phone', 'support_email', 'address', 'working_hours',
            'instagram_url', 'telegram_url', 'twitter_url', 'about_text',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertDatabaseHas('settings', ['key' => $key]);
        }
    }

    public function test_public_site_settings_endpoint_returns_real_seeded_values(): void
    {
        $this->seed(SettingSeeder::class);

        $response = $this->getJson('/api/v1/site-settings');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.site_name', 'ازکالا')
            ->assertJsonPath('data.support_phone', '021-12345678')
            ->assertJsonPath('data.support_email', 'support@azkala.com');
    }

    public function test_seeder_uses_the_full_canonical_defaults_file_not_just_footer_fields(): void
    {
        // ✅ منبع درستی، config/azkala/settings_defaults.php، فقط تنظیمات هدر/فوتر
        // نیست — پرداخت، ارسال، مالیات، اعلان‌ها و... هم دارد. این تست اطمینان
        // می‌دهد Seeder کل فایل واقعی را می‌خواند، نه یک زیرمجموعه‌ی دستی که
        // ممکن است از فایل اصلی عقب بیفتد.
        $this->seed(SettingSeeder::class);

        $this->assertSame(count(config('azkala.settings_defaults')), Setting::count());

        $this->assertDatabaseHas('settings', [
            'key' => 'zarinpal_merchant_id',
            'group' => 'payment',
            'is_sensitive' => true,
        ]);
    }

    public function test_reseeding_does_not_overwrite_a_value_admin_already_edited(): void
    {
        $this->seed(SettingSeeder::class);

        Setting::where('key', 'support_phone')->update(['value' => '021-99999999']);

        // اجرای دوباره‌ی seeder (مثلاً در دیپلوی بعدی) نباید مقدار واقعیِ
        // ادمین را با placeholder اولیه جایگزین کند — firstOrCreate باید
        // این را تضمین کند.
        $this->seed(SettingSeeder::class);

        $this->assertDatabaseHas('settings', [
            'key' => 'support_phone',
            'value' => '021-99999999',
        ]);
    }

    public function test_trust_badge_codes_are_empty_by_default_and_only_shown_when_admin_sets_them(): void
    {
        // ✅ اینماد/ساماندهی نمادهای رسمی و قابل‌استعلام هستند — نباید هیچ
        // مقدار پیش‌فرضی برایشان ساخته شود، فقط ردیف خالی تا ادمین واقعی
        // کد را وارد کند.
        $this->seed(SettingSeeder::class);

        // ✅ گروه general (نه یک گروه trust جدا) تا AdminSettingsPage.tsx که
        // فهرست تب‌ها را هاردکد کرده همین حالا هم این فیلدها را نشان دهد.
        $this->assertDatabaseHas('settings', ['key' => 'enamad_code', 'value' => '', 'group' => 'general']);
        $this->assertDatabaseHas('settings', ['key' => 'samandehi_code', 'value' => '', 'group' => 'general']);

        $response = $this->getJson('/api/v1/site-settings');
        $response->assertOk()
            ->assertJsonPath('data.enamad_code', '')
            ->assertJsonPath('data.samandehi_code', '');

        Setting::where('key', 'enamad_code')->update(['value' => '123456789']);

        $this->getJson('/api/v1/site-settings')
            ->assertJsonPath('data.enamad_code', '123456789');
    }

    public function test_reseeding_does_not_create_duplicate_rows(): void
    {
        $this->seed(SettingSeeder::class);
        $countAfterFirstSeed = Setting::count();

        $this->seed(SettingSeeder::class);
        $countAfterSecondSeed = Setting::count();

        $this->assertSame($countAfterFirstSeed, $countAfterSecondSeed);
    }

    /**
     * ✅ رگرسیون: config/azkala.php (فایل جدا) و config/azkala/settings_defaults.php
     * هر دو زیر همان مسیر نقطه‌ای azkala.settings_defaults بارگذاری می‌شدند —
     * پوشه‌ی azkala/ بی‌صدا محتوای فایل تخت azkala.php را نادیده می‌گرفت.
     * نتیجه: گروه marketing (announcement_enabled/text/link/bg_color/
     * show_live_users که AnnouncementBar بالای هدر از آن‌ها می‌خواند) هرگز
     * seed نمی‌شد، حتی با کلیک دستی روی «مقداردهی اولیه». این تست مطمئن
     * می‌شود گروه marketing واقعاً در نتیجه‌ی seed حاضر است و از
     * GET /site-settings هم برمی‌گردد — تا این باگ خاموش دوباره رخ ندهد.
     */
    public function test_marketing_announcement_settings_are_seeded_and_publicly_readable(): void
    {
        $this->seed(SettingSeeder::class);

        $this->assertDatabaseHas('settings', ['key' => 'announcement_enabled', 'group' => 'marketing']);
        $this->assertDatabaseHas('settings', ['key' => 'announcement_text', 'group' => 'marketing']);
        $this->assertDatabaseHas('settings', ['key' => 'announcement_link', 'group' => 'marketing']);
        $this->assertDatabaseHas('settings', ['key' => 'announcement_bg_color', 'group' => 'marketing']);
        $this->assertDatabaseHas('settings', ['key' => 'announcement_show_live_users', 'group' => 'marketing']);

        $response = $this->getJson('/api/v1/site-settings');

        $response->assertOk()
            ->assertJsonPath('data.announcement_enabled', '1')
            ->assertJsonPath('data.announcement_bg_color', 'gradient');
    }

    /**
     * ✅ رگرسیون ممیزی حقوقی: terms_text/privacy_text/warranty_text از قبل
     * seed می‌شدند ولی هرگز به whitelist عمومی GET /site-settings اضافه
     * نشده بودند — یعنی حتی اگر ادمین متن رسمی خودش را وارد می‌کرد، هیچ
     * صفحه‌ای امکان خواندنش را نداشت. فیلدهای ارسال هم مشابه‌اند: بدون
     * اینها، صفحه‌ی «روش‌ها و هزینه‌ی ارسال» نمی‌تواند هزینه‌ی واقعی را
     * نشان دهد.
     */
    public function test_legal_and_shipping_settings_are_seeded_and_publicly_readable(): void
    {
        $this->seed(SettingSeeder::class);

        $this->assertDatabaseHas('settings', ['key' => 'terms_text', 'group' => 'legal']);
        $this->assertDatabaseHas('settings', ['key' => 'privacy_text', 'group' => 'legal']);
        $this->assertDatabaseHas('settings', ['key' => 'warranty_text', 'group' => 'legal']);
        $this->assertDatabaseHas('settings', ['key' => 'seller_terms_text', 'group' => 'legal']);

        $response = $this->getJson('/api/v1/site-settings');

        $response->assertOk();
        $data = $response->json('data');

        foreach (['terms_text', 'privacy_text', 'warranty_text', 'seller_terms_text',
            'post_pishtaz_cost', 'free_shipping_min_amount'] as $key) {
            $this->assertArrayHasKey($key, $data, "کلید {$key} باید در پاسخ GET /site-settings موجود باشد.");
        }

        $this->assertSame('35000', $data['post_pishtaz_cost']);
        $this->assertSame('500000', $data['free_shipping_min_amount']);
    }
}
