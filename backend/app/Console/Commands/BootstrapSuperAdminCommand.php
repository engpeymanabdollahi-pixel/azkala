<?php

namespace App\Console\Commands;

use App\Models\AdminAccessLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * تعیین امن اولین Super Admin — راه‌حل مشکل «lockout» (چون هیچ Admin ای
 * از قبل نمی‌تواند از طریق API این نقش را به کسی بدهد اگر هنوز هیچ
 * Super Admin ای وجود ندارد).
 *
 * عمداً:
 *   - هیچ ID کاربری در کد hardcode نشده.
 *   - این دستور کاربر جدید نمی‌سازد؛ فقط روی یک حساب *موجود* عمل می‌کند
 *     (شماره تلفن باید از قبل در جدول users ثبت شده باشد — از طریق
 *     مسیر واقعی OTP/ثبت‌نام سایت، نه یک اکانت جعلی ساخته‌شده در همین‌جا).
 *   - نیازمند تایید صریح (مگر --force) است.
 *   - هر اجرا در admin_access_logs ثبت می‌شود (actor_user_id=null یعنی
 *     اقدام از طریق CLI/سیستم بوده، نه یک کاربر وب).
 *
 * استفاده در Production:
 *   AZKALA_SUPER_ADMIN_PHONE=09xxxxxxxxx php artisan app:bootstrap-super-admin
 *
 * یا با گذاشتن AZKALA_SUPER_ADMIN_PHONE در .env سرور و اجرای:
 *   php artisan app:bootstrap-super-admin --force
 */
class BootstrapSuperAdminCommand extends Command
{
    protected $signature = 'app:bootstrap-super-admin {--force : بدون تایید تعاملی اجرا شود}';

    protected $description = 'تعیین اولین Super Admin از روی شماره تلفن AZKALA_SUPER_ADMIN_PHONE';

    public function handle(): int
    {
        // ✅ config/azkala/*.php هرکدام زیر همان نام فایل تودرتو می‌شوند
        // (azkala.security.xxx)، نه merge تخت (azkala.xxx) — همان الگویی
        // که بقیه‌ی این پروژه هم واقعاً استفاده می‌کند.
        $phone = config('azkala.security.super_admin_phone');

        if (empty($phone)) {
            $this->error('AZKALA_SUPER_ADMIN_PHONE تنظیم نشده است.');
            $this->line('این مقدار را در .env سرور تنظیم کنید، مثلاً:');
            $this->line('  AZKALA_SUPER_ADMIN_PHONE=09xxxxxxxxx');
            $this->line('سپس دوباره اجرا کنید: php artisan app:bootstrap-super-admin');

            return self::FAILURE;
        }

        $user = User::where('phone', $phone)->first();

        if (! $user) {
            $this->error("هیچ کاربری با شماره تلفن {$phone} پیدا نشد.");
            $this->line('این دستور کاربر جدید نمی‌سازد — ابتدا آن شخص باید یک‌بار از مسیر واقعی ثبت‌نام/OTP سایت وارد شده باشد.');

            return self::FAILURE;
        }

        $existingSuperAdmins = User::role('super_admin')->pluck('phone', 'id');
        if ($existingSuperAdmins->isNotEmpty() && ! $existingSuperAdmins->has($user->id)) {
            $this->warn('توجه: هم‌اکنون '.$existingSuperAdmins->count().' Super Admin دیگر در سیستم وجود دارد:');
            foreach ($existingSuperAdmins as $id => $existingPhone) {
                $this->line("  - user #{$id} ({$existingPhone})");
            }
        }

        if ($user->hasRole('super_admin') && $user->role === 'admin') {
            $this->info("کاربر #{$user->id} ({$user->name}, {$phone}) از قبل هم users.role=admin و هم نقش Administrative super_admin را دارد. کاری برای انجام نیست.");

            return self::SUCCESS;
        }

        $this->info("کاربر پیدا شد: #{$user->id} — {$user->name} ({$phone})");
        $this->line('users.role فعلی: '.$user->role);
        $this->line('این دستور دو کار می‌کند:');
        if ($user->role !== 'admin') {
            $this->line("  ۱. users.role این کاربر را از «{$user->role}» به «admin» تغییر می‌دهد (شرط لازم برای ورود به /admin/*).");
        } else {
            $this->line('  ۱. users.role از قبل admin است — تغییری لازم نیست.');
        }
        $this->line('  ۲. نقش Administrative «super_admin» (دسترسی کامل به همه‌ی Permission ها) به او می‌دهد.');

        if (! $this->option('force') && ! $this->confirm('ادامه می‌دهید؟')) {
            $this->warn('لغو شد.');

            return self::FAILURE;
        }

        DB::transaction(function () use ($user) {
            $oldRole = $user->role;
            if ($user->role !== 'admin') {
                $user->forceFill(['role' => 'admin'])->save();
            }

            $hadSuperAdmin = $user->hasRole('super_admin');
            if (! $hadSuperAdmin) {
                $user->assignRole('super_admin');
            }

            AdminAccessLog::create([
                'actor_user_id' => null, // CLI bootstrap، نه یک کاربر وب
                'target_user_id' => $user->id,
                'action' => AdminAccessLog::ACTION_ROLE_ASSIGNED,
                'old_value' => json_encode(['users_role' => $oldRole, 'administrative_role' => $hadSuperAdmin ? 'super_admin' : null]),
                'new_value' => json_encode(['users_role' => 'admin', 'administrative_role' => 'super_admin']),
            ]);
        });

        $this->info("✅ کاربر #{$user->id} ({$phone}) اکنون Super Admin است.");

        return self::SUCCESS;
    }
}
