<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ✅ Device-First Architecture — حذف نهایی device_brands.type.
//
// پیش‌نیازها قبل از این migration کامل شدند (طبق دستور صریح این فاز):
// - صفر consumer فعال type در frontend (فقط fallback داخلی resolveDeviceIcon/
//   resolveDeviceLabel که خودشان هم family-only شدند).
// - صفر business logic وابسته (getTemplates() family-only شد).
// - صفر API contract ضروری (header-hierarchy، search/global، search/devices
//   همه family-only شدند؛ search/devices فیلتر type را با فیلتر family
//   (slug) جایگزین کرد — تغییر contract آگاهانه، نه شکستن بی‌صدا).
// - صفر factory/seeder dependency (DeviceBrandFactory و DeviceHierarchySeeder
//   هر دو family-first شدند).
// - family_id برای هر ۶ برند canonical فعلی پر است (صفر orphan).
//
// این پروژه هنوز pre-production است (طبق تأیید صریح درخواست‌دهنده) — یعنی
// شرط «عدم قطعیتِ consumer خارجی» که فازهای قبلی را STOP کرده بود، دیگر
// برای همین محیط صدق نمی‌کند؛ ریسکِ باقی‌مانده (مصرف‌کننده‌ی خارجیِ احتمالیِ
// آینده) در گزارش نهایی مستند شده، نه نادیده گرفته.
return new class extends Migration
{
    public function up(): void
    {
        // ✅ روی SQLite، DROP COLUMN روی ستونی که ایندکس دارد بدون حذف اول
        // خودِ ایندکس شکست می‌خورد («index ... after drop column: no such
        // column») — دقیقاً همان کلاسِ مشکلی که در down() مهاجرت
        // add_family_id_to_device_brands_table مستند شده. type از migration
        // اولیه‌اش ایندکس داشت.
        Schema::table('device_brands', function (Blueprint $table) {
            if (Schema::hasColumn('device_brands', 'type')) {
                $table->dropIndex(['type']);
                $table->dropColumn('type');
            }
        });
    }

    public function down(): void
    {
        // ✅ بازگشت‌پذیر: ستون را دقیقاً با همان تعریف اولیه‌اش
        // (nullable string، indexed، بدون enum بسته) بازمی‌گرداند. مقادیر
        // قدیمی (که با drop از بین رفته‌اند) قابل بازیابی نیستند — این
        // محدودیتِ ذاتیِ هر DROP COLUMN است، نه نقصِ این migration؛ چون
        // پیش‌نیاز اجرا این بود که هیچ منطق فعالی به این مقادیر وابسته نباشد.
        Schema::table('device_brands', function (Blueprint $table) {
            $table->string('type')->nullable()->after('slug')->index();
        });
    }
};
