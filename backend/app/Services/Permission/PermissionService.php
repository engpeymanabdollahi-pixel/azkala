<?php

namespace App\Services\Permission;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;

/**
 * نقطه‌ی مرکزی enforcement برای سیستم Multi-Admin/Manager — هم
 * EnsurePermission middleware و هم هر Service حساس (AdminOrderService و
 * ...) دقیقاً همین متد را صدا می‌زنند تا منطق تکرار نشود (طبق دستور:
 * «منطق authorization را duplicate نکن»).
 *
 * قانون Super Admin: صراحتاً bypass کدی دارد (علاوه بر اینکه در seed
 * واقعاً همه‌ی Permission ها را هم دارد) — تا حتی اگر بعداً taxonomy
 * رشد کرد و کسی فراموش کرد Permission جدید را به نقش super_admin sync
 * کند، Super Admin هرگز به‌طور تصادفی قفل نشود.
 */
class PermissionService
{
    public function userHasPermission(User $user, string $permission): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        try {
            return $user->hasPermissionTo($permission);
        } catch (PermissionDoesNotExist $e) {
            // یک Permission ناموجود (مثلاً typo در middleware:permission:xxx)
            // نباید کل request را با ۵۰۰ بترکاند — همیشه یعنی «دسترسی ندارد»،
            // ولی چون نشانه‌ی یک باگ کد است، لاگ می‌شود.
            Log::warning("PermissionService: permission '{$permission}' در دیتابیس تعریف نشده است.");

            return false;
        }
    }

    /**
     * هر کدام از این Permission ها کافی است (OR).
     */
    public function userHasAnyPermission(User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->userHasPermission($user, $permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * همه‌ی این Permission ها لازم است (AND) — مثلاً تراکنش delivered که
     * هم orders.manage هم finance.payout لازم دارد.
     */
    public function userHasAllPermissions(User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (! $this->userHasPermission($user, $permission)) {
                return false;
            }
        }

        return true;
    }
}
