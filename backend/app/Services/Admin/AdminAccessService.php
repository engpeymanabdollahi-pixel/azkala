<?php

namespace App\Services\Admin;

use App\Models\AdminAccessLog;
use App\Models\User;
use App\Services\Permission\PermissionService;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * سرویس مرکزی مدیریت Administrative Access (نقش Super Admin/Admin/
 * Manager + Permission های مستقیم هر کاربر). تمام hierarchy/delegation/
 * self-modification rules دقیقاً همین‌جا enforce می‌شوند — Controller
 * فقط orchestration است.
 *
 * نام‌های نقش اینجا (super_admin/admin/manager) در جدول جداگانه‌ی
 * spatie (`roles`) هستند؛ هیچ‌وقت با ستون users.role
 * (customer/seller/admin/pending_seller) قاطی نمی‌شوند.
 */
class AdminAccessService
{
    private const ADMINISTRATIVE_ROLES = ['super_admin', 'admin', 'manager'];

    public function __construct(protected PermissionService $permissionService) {}

    /**
     * فهرست کاربرانی که واجد شرایط Administrative Access اند
     * (users.role === 'admin') به‌همراه نقش/Permission فعلی هرکدام.
     */
    public function listUsers(int $perPage = 20): LengthAwarePaginator
    {
        $paginator = User::where('role', 'admin')
            ->with('roles', 'permissions')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $paginator->getCollection()->transform(fn (User $user) => $this->formatUserAccess($user));

        return $paginator;
    }

    public function getUserAccess(int $userId): array
    {
        $user = User::with('roles', 'permissions')->findOrFail($userId);

        return $this->formatUserAccess($user);
    }

    public function getRoles(): array
    {
        return Role::with('permissions')
            ->whereIn('name', self::ADMINISTRATIVE_ROLES)
            ->get()
            ->map(fn (Role $role) => [
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->values(),
            ])
            ->values()
            ->all();
    }

    public function getPermissionsTaxonomy(): array
    {
        return config('azkala.permissions', []);
    }

    /**
     * تنظیم/حذف نقش Administrative یک کاربر.
     *
     * $newRole یکی از super_admin|admin|manager یا null (یعنی حذف کامل
     * Administrative Access — کاربر همچنان users.role=admin می‌ماند،
     * فقط دیگر هیچ نقش/Permission ای ندارد).
     */
    public function assignAdministrativeRole(User $actor, int $targetUserId, ?string $newRole): User
    {
        if ($newRole !== null && ! in_array($newRole, self::ADMINISTRATIVE_ROLES, true)) {
            throw new Exception('نقش Administrative نامعتبر است.', 422);
        }

        // ✅ Self-Modification Protection (بخش ۱۴ درخواست): به‌صورت
        // پیش‌فرض و بدون استثنا — حتی Super Admin نمی‌تواند نقش
        // Administrative خودش را از همین مسیر تغییر دهد.
        if ($actor->id === $targetUserId) {
            throw new Exception('امکان تغییر نقش Administrative خودتان وجود ندارد.', 403);
        }

        $target = User::findOrFail($targetUserId);

        if ($target->role !== 'admin') {
            throw new Exception('این کاربر ابتدا باید users.role=admin داشته باشد (از مسیر /admin/users/{user}/role).', 422);
        }

        $currentRole = $this->currentAdministrativeRole($target);

        // ✅ Privilege Hierarchy (بخش ۱۶): Manager هیچ delegation ندارد؛
        // Admin نمی‌تواند super_admin بسازد یا یک super_admin موجود را
        // دست بزند؛ فقط Super Admin به super_admin دسترسی دارد.
        if (! $this->canManageAdministrativeRole($actor, $currentRole, $newRole)) {
            throw new Exception('شما اجازه‌ی این تغییر Administrative Access را ندارید.', 403);
        }

        DB::transaction(function () use ($target, $newRole, $actor, $currentRole) {
            $target->syncRoles($newRole ? [$newRole] : []);

            AdminAccessLog::create([
                'actor_user_id' => $actor->id,
                'target_user_id' => $target->id,
                'action' => $newRole ? AdminAccessLog::ACTION_ROLE_ASSIGNED : AdminAccessLog::ACTION_ROLE_REMOVED,
                'old_value' => $currentRole,
                'new_value' => $newRole,
            ]);
        });

        return $target->fresh(['roles', 'permissions']);
    }

    /**
     * تنظیم Permission های مستقیم یک کاربر (روی نقش Administrative
     * پایه‌اش اضافه می‌شود — replace کامل، طبق معنای PUT).
     *
     * @param  string[]  $permissionNames
     */
    public function setUserPermissions(User $actor, int $targetUserId, array $permissionNames): User
    {
        if ($actor->id === $targetUserId) {
            throw new Exception('امکان تغییر Permission های خودتان وجود ندارد.', 403);
        }

        $target = User::findOrFail($targetUserId);

        if ($target->role !== 'admin') {
            throw new Exception('این کاربر ابتدا باید users.role=admin داشته باشد.', 422);
        }

        $validNames = Permission::whereIn('name', $permissionNames)->pluck('name')->all();
        if (count($validNames) !== count(array_unique($permissionNames))) {
            throw new Exception('یک یا چند Permission نامعتبر است.', 422);
        }

        // ✅ Delegation Security (بخش ۱۵/۲۲): «هیچ کاربری نمی‌تواند
        // دسترسی‌ای بالاتر از سطح مجاز خودش اعطا کند» — فقط برای
        // Permission های *جدید* چک می‌شود (حذف/revoke همیشه مجاز است
        // برای کسی که اصلاً حق مدیریت این کاربر را دارد).
        if (! $this->canManageAdministrativeAccessOf($actor, $target)) {
            throw new Exception('شما اجازه‌ی مدیریت دسترسی این کاربر را ندارید.', 403);
        }

        $currentPermissions = $target->getDirectPermissions()->pluck('name')->all();
        $added = array_values(array_diff($validNames, $currentPermissions));
        $removed = array_values(array_diff($currentPermissions, $validNames));

        if (! $actor->hasRole('super_admin') && ! empty($added)) {
            $actorPermissions = $actor->getAllPermissions()->pluck('name')->all();
            $beyondAuthority = array_diff($added, $actorPermissions);
            if (! empty($beyondAuthority)) {
                throw new Exception(
                    'نمی‌توانید Permission ای را که خودتان ندارید واگذار کنید: '.implode(', ', $beyondAuthority),
                    403
                );
            }
        }

        DB::transaction(function () use ($target, $validNames, $actor, $added, $removed) {
            $target->syncPermissions($validNames);

            if (! empty($added)) {
                AdminAccessLog::create([
                    'actor_user_id' => $actor->id,
                    'target_user_id' => $target->id,
                    'action' => AdminAccessLog::ACTION_PERMISSION_GRANTED,
                    'old_value' => null,
                    'new_value' => json_encode($added),
                ]);
            }
            if (! empty($removed)) {
                AdminAccessLog::create([
                    'actor_user_id' => $actor->id,
                    'target_user_id' => $target->id,
                    'action' => AdminAccessLog::ACTION_PERMISSION_REVOKED,
                    'old_value' => json_encode($removed),
                    'new_value' => null,
                ]);
            }
        });

        return $target->fresh(['roles', 'permissions']);
    }

    /**
     * ✅ public (نه فقط برای این سرویس): AdminUserService هم از همین
     * متد برای رفع ریسک مستند‌شده در گزارش نهایی استفاده می‌کند — مسیر
     * قدیمی PUT /admin/users/{user}/role (تغییر users.role اصلی) نباید
     * بتواند Administrative Access را بدون عبور از همین hierarchy دور
     * بزند. یک منبع حقیقت واحد برای «آیا actor اجازه دارد Administrative
     * Role این هدف را تغییر دهد»، به‌جای تکرار منطق در دو Service.
     */
    public function currentAdministrativeRole(User $user): ?string
    {
        foreach (self::ADMINISTRATIVE_ROLES as $role) {
            if ($user->hasRole($role)) {
                return $role;
            }
        }

        return null;
    }

    /**
     * Hierarchy: Super Admin > Admin > Manager.
     *   - Manager (هر Permission ای هم مستقیم داشته باشد) هرگز از این
     *     چک عبور نمی‌کند — delegation فقط بر اساس نقش Administrative
     *     است، نه Permission تکی.
     *   - هیچ‌کس جز Super Admin نمی‌تواند super_admin بسازد یا یک
     *     super_admin موجود را تغییر دهد.
     */
    public function canManageAdministrativeRole(User $actor, ?string $targetCurrentRole, ?string $newRole): bool
    {
        if ($actor->hasRole('super_admin')) {
            return true;
        }

        if ($newRole === 'super_admin' || $targetCurrentRole === 'super_admin') {
            return false;
        }

        return $actor->hasRole('admin') && $this->permissionService->userHasPermission($actor, 'admin.access.manage');
    }

    private function canManageAdministrativeAccessOf(User $actor, User $target): bool
    {
        return $this->canManageAdministrativeRole($actor, $this->currentAdministrativeRole($target), null);
    }

    private function formatUserAccess(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'users_role' => $user->role,
            'administrative_role' => $this->currentAdministrativeRole($user),
            'direct_permissions' => $user->getDirectPermissions()->pluck('name')->values(),
            'effective_permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ];
    }
}
