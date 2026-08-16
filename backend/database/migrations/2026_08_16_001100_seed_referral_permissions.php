<?php

use Database\Seeders\AdministrativeAccessSeeder;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Referral System — Phase 3 (Admin Module).
     *
     * migration اصلی Multi-Admin (2026_08_15_000100) فقط یک‌بار در زمان
     * استقرار خودش AdministrativeAccessSeeder را اجرا کرد؛ چون آن
     * migration از قبل در جدول migrations ثبت شده، دوباره اجرا نمی‌شود
     * و taxonomy جدید (ماژول 'referrals' که همین الان به
     * config/azkala/permissions.php اضافه شد) هرگز به‌صورت خودکار در
     * دیتابیس‌های موجود ساخته نمی‌شود.
     *
     * راه‌حل: AdministrativeAccessSeeder را دوباره صدا می‌زنیم — کاملاً
     * idempotent است (Permission::firstOrCreate + Role::syncPermissions
     * بر مبنای کل taxonomy فعلی)، پس:
     *   - Permission های جدید (referrals.view/referrals.manage) ساخته
     *     می‌شوند.
     *   - super_admin/admin دوباره sync می‌شوند (چون هیچ‌کدام در
     *     $superAdminOnlyByDefault نیستند، admin هم آن‌ها را می‌گیرد —
     *     دقیقاً هم‌راستا با stores.view/stores.manage).
     *   - manager دست‌نخورده می‌ماند (چیزی برایش sync نمی‌شود).
     *   - Permission ها یا نقش‌های قبلی هیچ تغییری نمی‌کنند — همان
     *     منطق idempotent خودِ seeder.
     */
    public function up(): void
    {
        (new AdministrativeAccessSeeder)->run();
    }

    public function down(): void
    {
        // فقط دو Permission این فاز حذف می‌شوند — نقش‌ها/بقیه‌ی
        // Permission ها متعلق به migration دیگری‌اند و اینجا لمس
        // نمی‌شوند.
        Permission::whereIn('name', ['referrals.view', 'referrals.manage'])->get()->each->delete();
    }
};
