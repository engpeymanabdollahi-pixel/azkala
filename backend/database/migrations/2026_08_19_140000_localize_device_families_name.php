<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// ✅ Device-First Architecture — Phase 8: هماهنگ‌سازی device_families.name
// با قراردادِ از قبل موجودِ سایبلینگش.
//
// شواهد این فاز نشان داد device_brands.name همیشه متن فارسیِ نمایشی است
// («اپل»، «سامسونگ»، «ایسوس») و slug همیشه شناسه‌ی انگلیسی/ماشینی — این
// یک قراردادِ واقعی و از‌پیش‌موجودِ پروژه است، نه چیزی که این فاز اختراع
// کند. device_families.name این قرارداد را نقض می‌کرد (انگلیسی: Smartphone/
// Laptop/Tablet) — دقیقاً همان دلیلی که در فاز ۷ مانع شد برچسبِ UI از روی
// family ساخته شود (چون مستقیماً متن انگلیسی وسط رابط فارسی نشان می‌داد) و
// مسیر برچسب را همچنان به DeviceBrand.type وابسته نگه داشت.
//
// این migration ستون/جدول جدیدی اضافه نمی‌کند — فقط داده‌ی همان ستون name
// را برای ۳ خانواده‌ی کنونی اصلاح می‌کند؛ family منبع حقیقتِ برچسب می‌شود،
// دقیقاً مثل آیکون در فاز ۵.
//
// idempotent در هر دو جهت (دقیقاً همان الگوی backfill_device_families_icon):
// - up() فقط سطری را عوض می‌کند که هنوز دقیقاً روی مقدار انگلیسیِ شناخته‌شده
//   است — اجرای دوباره (مثلاً بعد از migrate:fresh یا rollback+reapply روی
//   dev DB) بی‌خطر است، چون بعد از اجرای اول دیگر با این WHERE مچ نمی‌شود.
// - down() فقط سطری را برمی‌گرداند که هنوز دقیقاً روی مقدار فارسیِ
//   نوشته‌شده توسط همین migration است — اگر ادمین بین این دو، نام را دستی
//   به چیز دیگری تغییر داده باشد، آن تغییرِ دستی در هیچ‌کدام جهت رونویسی
//   نمی‌شود.
return new class extends Migration
{
    public function up(): void
    {
        $map = [
            'smartphone' => ['from' => 'Smartphone', 'to' => 'گوشی'],
            'laptop' => ['from' => 'Laptop', 'to' => 'لپ‌تاپ'],
            'tablet' => ['from' => 'Tablet', 'to' => 'تبلت'],
        ];

        DB::transaction(function () use ($map) {
            foreach ($map as $slug => $names) {
                DB::table('device_families')
                    ->where('slug', $slug)
                    ->where('name', $names['from'])
                    ->update(['name' => $names['to'], 'updated_at' => now()]);
            }
        });
    }

    public function down(): void
    {
        $map = [
            'smartphone' => ['from' => 'Smartphone', 'to' => 'گوشی'],
            'laptop' => ['from' => 'Laptop', 'to' => 'لپ‌تاپ'],
            'tablet' => ['from' => 'Tablet', 'to' => 'تبلت'],
        ];

        DB::transaction(function () use ($map) {
            foreach ($map as $slug => $names) {
                DB::table('device_families')
                    ->where('slug', $slug)
                    ->where('name', $names['to'])
                    ->update(['name' => $names['from'], 'updated_at' => now()]);
            }
        });
    }
};
