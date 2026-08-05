<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * ✅ config/azkala/settings_defaults.php از قبل ۵۸ تنظیم پیش‌فرض کامل و
 * درست‌ساخته‌شده دارد (عمومی، پرداخت، ارسال، مالیات، اعلان‌ها، قوانین،
 * سیستم) و AdminSettingService::seedDefaults() هم واقعاً درست همین فایل
 * را می‌خواند و seed می‌کند — ولی این اکشن فقط با کلیک دستی ادمین روی
 * دکمه‌ی «بازگرداندن پیش‌فرض‌ها» در پنل تنظیمات اجرا می‌شود. هیچ‌جای
 * DatabaseSeeder این را صدا نمی‌زد، پس روی هر نصب تازه، جدول settings
 * کاملاً خالی می‌ماند تا وقتی ادمین خودش این دکمه‌ی نه‌چندان شناخته‌شده را
 * پیدا و کلیک کند. نتیجه: GET /site-settings (که هدر و فوتر سایت مستقیماً
 * از آن تغذیه می‌شوند) روی هر نصب تازه data خالی برمی‌گرداند و نام سایت،
 * لوگو، شماره پشتیبانی، ایمیل، آدرس، ساعات کاری و لینک شبکه‌های اجتماعی
 * همیشه روی fallback ثابت فرانت‌اند می‌مانند، نه چیزی که واقعاً قابل تنظیم
 * باشد.
 *
 * این Seeder دقیقاً همان منبع حقیقتِ config('azkala.settings_defaults')
 * را با firstOrCreate (بی‌خطر برای اجرای مجدد؛ مقدار ویرایش‌شده‌ی ادمین را
 * دست‌نخورده نگه می‌دارد) در دیتابیس می‌سازد — یعنی همان چیزی که کلیک روی
 * دکمه‌ی ادمین انجام می‌داد، حالا از روز اول نصب هم اجرا می‌شود.
 */
class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = config('azkala.settings_defaults', []);
        $created = 0;

        foreach ($defaults as $item) {
            $setting = Setting::firstOrCreate(
                ['key' => $item['key']],
                [
                    'value' => $item['value'],
                    'group' => $item['group'],
                    'type' => $item['type'],
                    'label' => $item['label'],
                    'is_sensitive' => $item['is_sensitive'] ?? false,
                ]
            );
            if ($setting->wasRecentlyCreated) {
                $created++;
            }
        }

        $this->command?->info("⚙️  {$created} تنظیم پیش‌فرض سایت ایجاد شد (site_name, support_phone, instagram_url و...).");
    }
}
