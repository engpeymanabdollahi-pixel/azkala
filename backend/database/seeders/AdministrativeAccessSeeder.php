<?php

namespace Database\Seeders;

use App\Models\AdminAccessLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Seed سه نقش Administrative (super_admin/admin/manager) + کل Permission
 * Taxonomy (از config/azkala/permissions.php) + تخصیص پیش‌فرض.
 *
 * ⚠️ این نام‌های نقش (super_admin/admin/manager) در جدول جداگانه‌ی
 * spatie (`roles`) زندگی می‌کنند — هیچ ربطی به ستون users.role
 * (customer/seller/admin/pending_seller) ندارند و هرگز آن را overwrite
 * نمی‌کنند.
 *
 * ایمن برای اجرای مکرر (idempotent): firstOrCreate/syncPermissions.
 */
class AdministrativeAccessSeeder extends Seeder
{
    public function run(): void
    {
        $guard = 'web';

        // ۱. ساخت همه‌ی Permission های taxonomy
        $taxonomy = config('azkala.permissions', []);
        $allPermissionNames = [];

        foreach ($taxonomy as $module) {
            foreach ($module['permissions'] as $name => $meta) {
                Permission::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
                $allPermissionNames[] = $name;
            }
        }

        // ۲. ساخت سه نقش Administrative
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => $guard]);
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => $guard]);
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => $guard]);

        // ۳. Super Admin: همه‌ی Permission ها (شفاف و قابل‌ممیزی در DB —
        // علاوه بر bypass کدی در PermissionService برای اطمینان از
        // پوشش کامل حتی وقتی taxonomy بعداً رشد کند).
        $superAdmin->syncPermissions($allPermissionNames);

        // ۴. Admin: دسترسی گسترده پیش‌فرض («Admin: دسترسی مدیریتی
        // گسترده») — دقیقاً همان چیزی که کاربران role=admin از قبل
        // (پیش از این سیستم) بدون هیچ محدودیتی داشتند؛ این با تست‌های
        // از پیش موجود اثبات شده است (AdminCommissionApiTest،
        // AdminOrderApiTest::admin_can_update_payment_status،
        // AdminSettingTestConnectionApiTest) — این‌ها همگی یک
        // role=admin ساده می‌سازند و انتظار دسترسی کامل به مدیریت
        // قوانین کمیسیون/Override/وضعیت پرداخت/تنظیمات سیستم را دارند؛
        // محدود کردن این‌ها به‌صورت پیش‌فرض یعنی از دست رفتن ناگهانی
        // دسترسی برای ادمین‌های موجود (نقض صریح بخش ۳۸).
        //
        // استثنای واقعی فقط Permission هایی است که مستقیماً بردار
        // escalation/delegation یا حساس‌ترین عملیات مالی‌اند و هیچ تست
        // از پیش موجودی هم ثابت نمی‌کند که یک role=admin ساده امروز
        // بتواند بدون محدودیت آن‌ها را انجام دهد — این‌ها می‌مانند
        // Super-Admin-exclusive مگر آنکه یک Super Admin صریحاً از طریق
        // PUT admin/access/users/{user}/permissions به یک Admin خاص
        // بدهد:
        //   - admin.access.manage: مدیریت نقش/Permission سایر ادمین‌ها
        //     (بردار مستقیم delegation/escalation).
        //   - users.role.manage: تغییر users.role (از جمله ارتقا به
        //     admin) — می‌تواند غیرمستقیم یک Administrative Role جدید
        //     بسازد (از طریق saved hook مدل User) و از چک hierarchy
        //     مسیر admin/access/* عبور کند.
        //   - finance.view / finance.manage / finance.payout: حساس‌ترین
        //     عملیات مالی (شامل Payout واقعی فروشندگان).
        $superAdminOnlyByDefault = [
            'admin.access.manage',
            'users.role.manage',
            'finance.view',
            'finance.manage',
            'finance.payout',
        ];
        $admin->syncPermissions(array_values(array_diff($allPermissionNames, $superAdminOnlyByDefault)));

        // ۵. Manager: بدون هیچ Permission پیش‌فرض — طبق دستور صریح
        // «Manager فقط Permissionهایی را دارد که برای او یا Role او
        // تعریف شده‌اند» — تخصیص واقعی بعداً از طریق
        // AdminAccessService/UI انجام می‌شود.
        // (چیزی برای sync نیست — نقش از قبل خالی ساخته شده.)

        // ۶. Backward compatibility — بخش ۳۸ درخواست («Adminهای موجود
        // نباید ناگهان قفل شوند»): هر کاربری که از قبل (پیش از استقرار
        // این سیستم) users.role=admin داشته و هنوز هیچ نقش Administrative
        // ندارد، به‌صورت صریح و قابل‌ممیزی نقش «admin» می‌گیرد — نه
        // super_admin (طبق دستور صریح «خودسرانه همه را Super Admin
        // نکن»). این دقیقاً همان دسترسی گسترده‌ای است که این کاربران از
        // قبل داشتند؛ بدون این backfill، اولین ورودشان بعد از استقرار با
        // ۴۰۳ روی همه‌چیز مواجه می‌شد.
        $backfilled = [];
        User::where('role', 'admin')->doesntHave('roles')->each(function (User $user) use (&$backfilled) {
            $user->assignRole('admin');
            $backfilled[] = $user->id;

            AdminAccessLog::create([
                'actor_user_id' => null, // backfill سیستمی، نه یک کاربر وب
                'target_user_id' => $user->id,
                'action' => AdminAccessLog::ACTION_ROLE_ASSIGNED,
                'old_value' => null,
                'new_value' => 'admin',
            ]);
        });

        $this->command?->info(
            'Administrative Access: '.count($allPermissionNames).' permission، 3 نقش seed شد؛ '
            .count($backfilled).' ادمین موجود به‌صورت خودکار نقش «admin» گرفت.'
        );
    }
}
