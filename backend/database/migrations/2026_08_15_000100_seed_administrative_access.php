<?php

use Database\Seeders\AdministrativeAccessSeeder;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * ✅ حیاتی برای backward compatibility: نقش‌های Administrative
     * (super_admin/admin/manager) + کل Permission taxonomy باید در *هر*
     * محیطی که این کد اجرا می‌شود از قبل موجود باشند — از جمله محیط
     * تست (`RefreshDatabase` فقط migration ها را اجرا می‌کند، نه
     * `DatabaseSeeder` را؛ دقیقاً همان الگویی که `commission_rules` هم
     * از آن پیروی می‌کند: seed پیش‌فرض داخل خودِ migration).
     *
     * بدون این migration، اولین باری که هر کاربر با users.role=admin در
     * یک دیتابیس تازه (یا محیط تست) لاگین می‌کند، User::boot()'s saved
     * hook سعی می‌کند نقش 'admin' را assign کند ولی چون آن نقش اصلاً
     * وجود ندارد، با RoleDoesNotExist می‌شکند — دقیقاً همان چیزی که در
     * حین توسعه‌ی همین کار روی ۲۰۶ تست موجود اتفاق افتاد.
     *
     * منطق واقعی (permission ها، ۳ نقش، تخصیص پیش‌فرض، و backfill
     * ادمین‌های موجود) در AdministrativeAccessSeeder است — اینجا فقط
     * صدا زده می‌شود تا یک منبع حقیقت واحد بماند (نه تکرار کد).
     */
    public function up(): void
    {
        (new AdministrativeAccessSeeder)->run();
    }

    public function down(): void
    {
        // حذف امن: cascadeOnDelete روی model_has_roles/model_has_permissions/
        // role_has_permissions (تعریف‌شده در مایگریشن اصلی spatie) خودش
        // پاک می‌شود؛ خودِ جدول‌های roles/permissions هرگز drop نمی‌شوند
        // (متعلق به این migration نیستند — از قبل وجود داشتند).
        Role::whereIn('name', ['super_admin', 'admin', 'manager'])->get()->each->delete();
        Permission::whereIn('name', array_keys(collect(config('azkala.permissions', []))
            ->flatMap(fn ($module) => $module['permissions'])
            ->all()))->get()->each->delete();
    }
};
