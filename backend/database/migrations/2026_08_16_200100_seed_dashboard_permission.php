<?php

use Database\Seeders\AdministrativeAccessSeeder;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * P1 Forensic Audit fix — همان الگوی دقیق
     * 2026_08_16_001100_seed_referral_permissions.php: چون migration
     * اصلی Multi-Admin فقط یک‌بار (در استقرار خودش) AdministrativeAccessSeeder
     * را اجرا کرد و دوباره اجرا نمی‌شود، ماژول تازه‌ی 'dashboard' که همین
     * الان به config/azkala/permissions.php اضافه شد هرگز به‌صورت خودکار
     * در دیتابیس‌های موجود ساخته نمی‌شود. دوباره صدا زدن seeder کاملاً
     * idempotent است (Permission::firstOrCreate + Role::syncPermissions
     * بر مبنای کل taxonomy فعلی):
     *   - Permission جدید (dashboard.view) ساخته می‌شود.
     *   - super_admin/admin دوباره sync می‌شوند (dashboard.view در
     *     $superAdminOnlyByDefault نیست، پس admin هم آن را می‌گیرد —
     *     دقیقاً هم‌راستا با stores.view/referrals.view — یعنی
     *     ادمین‌های موجود همان دسترسی قبلی‌شان را حفظ می‌کنند، بدون
     *     ۴۰۳ ناگهانی).
     *   - manager دست‌نخورده می‌ماند (چیزی برایش sync نمی‌شود؛ طبق طراحی
     *     این سیستم پیش‌فرض هیچ Permission ای ندارد).
     *   - Permission ها یا نقش‌های قبلی هیچ تغییری نمی‌کنند.
     */
    public function up(): void
    {
        (new AdministrativeAccessSeeder)->run();
    }

    public function down(): void
    {
        Permission::whereIn('name', ['dashboard.view'])->get()->each->delete();
    }
};
