<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// ✅ Device-First Architecture — Phase 5: تکمیل ستون device_families.icon.
//
// طبق کامنت خودِ migration ایجادکننده‌ی جدول (create_device_families_table)،
// icon باید «نام/اسلاگ آیکون از یک ست شناخته‌شده در فرانت‌اند» باشد؛ فرم
// ادمین (AdminDeviceFamiliesPage.tsx) هم صراحتاً آن را «نام lucide-react»
// می‌نامد. تا این migration، هر سه خانواده‌ی موجود (Smartphone/Laptop/
// Tablet) این ستون را خالی داشتند — نه به این دلیل که قراردادی وجود
// نداشت، بلکه چون هیچ ادمینی هنوز فرم را پر نکرده بود.
//
// این migration همان الگوی خودِ پروژه را دنبال می‌کند (مثل
// add_family_id_to_device_brands_table که خودِ ۳ خانواده را idempotent
// insert کرد): مقداردهی canonical این سه ردیف از طریق یک migration، نه
// یک DB mutation محلی یک‌بارمصرف — چون این داده‌ی پیکربندی اپلیکیشن است
// (مطابق با معماری Device-First)، نه داده‌ی sandbox توسعه.
//
// idempotent: فقط جایی که icon فعلاً NULL است می‌نویسد — هرگز مقدار
// دستیِ از‌قبل‌ثبت‌شده‌ی یک ادمین را رونویسی نمی‌کند. نام‌های Lucide انتخابی
// (Smartphone/Laptop/Tablet) قبل از نوشتن مستقیماً در نسخه‌ی نصب‌شده‌ی
// lucide-react (۱.۲۷.۰) تأیید شدند — دقیقاً همان سه export که خودِ
// frontend/src/utils/familyIcon.ts (فاز ۵) allow-list می‌کند.
return new class extends Migration
{
    public function up(): void
    {
        $map = [
            'smartphone' => 'Smartphone',
            'laptop' => 'Laptop',
            'tablet' => 'Tablet',
        ];

        DB::transaction(function () use ($map) {
            foreach ($map as $slug => $iconName) {
                DB::table('device_families')
                    ->where('slug', $slug)
                    ->whereNull('icon')
                    ->update(['icon' => $iconName, 'updated_at' => now()]);
            }
        });
    }

    public function down(): void
    {
        // ✅ فقط همان سه مقداری که خودِ این migration نوشت را برمی‌گرداند —
        // اگر ادمین بعداً مقدار دیگری ست کرده باشد، down() آن را دست‌نخورده
        // می‌گذارد (بدون WHERE روی مقدار دقیق، نمی‌توان مطمئن شد چه کسی آن
        // را نوشته).
        DB::transaction(function () {
            DB::table('device_families')->where('slug', 'smartphone')->where('icon', 'Smartphone')->update(['icon' => null]);
            DB::table('device_families')->where('slug', 'laptop')->where('icon', 'Laptop')->update(['icon' => null]);
            DB::table('device_families')->where('slug', 'tablet')->where('icon', 'Tablet')->update(['icon' => null]);
        });
    }
};
