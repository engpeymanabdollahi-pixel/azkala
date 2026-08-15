import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { AdministrativeRole } from '@/types/models';

/**
 * انتزاع مرکزی سیستم Multi-Admin/Manager سمت Frontend (بخش ۱۹ درخواست).
 *
 * ⚠️ این فقط برای UX است — مخفی/غیرفعال کردن دکمه‌ها و آیتم‌های Sidebar.
 * Backend تنها مرجع امنیتی واقعی است و هر درخواست حساس را مستقل از این
 * hook دوباره enforce می‌کند (EnsurePermission middleware +
 * PermissionService سمت سرور)؛ حتی اگر این hook با دستکاری state
 * محلی فریب بخورد، هیچ درخواست واقعی‌ای بدون Permission واقعی موفق
 * نمی‌شود.
 *
 * منطق Super Admin bypass دقیقاً همان چیزی است که سمت بک‌اند در
 * PermissionService::userHasPermission پیاده شده — عمداً همین‌جا (یک
 * نقطه) نوشته شده تا hasPermission/hasAnyPermission/hasAllPermissions
 * سه‌بار آن را تکرار نکنند.
 *
 * @example
 * const { hasPermission } = usePermission();
 * if (!hasPermission('commission.rules.manage')) return null; // دکمه‌ی ویرایش را مخفی کن
 */
export function usePermission() {
  const administrativeRole = useAuthStore((state) => state.user?.administrative_role ?? null);
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);

  const isSuperAdmin = administrativeRole === 'super_admin';

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (isSuperAdmin) return true;

      return permissions.includes(permission);
    },
    [isSuperAdmin, permissions]
  );

  const hasAnyPermission = useCallback(
    (permissionList: string[]): boolean => {
      if (isSuperAdmin) return true;
      if (permissionList.length === 0) return false;

      return permissionList.some((permission) => permissions.includes(permission));
    },
    [isSuperAdmin, permissions]
  );

  const hasAllPermissions = useCallback(
    (permissionList: string[]): boolean => {
      if (isSuperAdmin) return true;
      if (permissionList.length === 0) return true;

      return permissionList.every((permission) => permissions.includes(permission));
    },
    [isSuperAdmin, permissions]
  );

  // نقش Administrative (نه role اصلی کاربر — کاملاً جداست، رجوع به
  // types/models.ts) برای نمایش برچسب/تمایز UI در بخش‌های ۲۲/۲۴.
  const isAdministrativeRole = useCallback(
    (role: AdministrativeRole): boolean => administrativeRole === role,
    [administrativeRole]
  );

  return useMemo(
    () => ({
      administrativeRole,
      permissions,
      isSuperAdmin,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isAdministrativeRole,
    }),
    [administrativeRole, permissions, isSuperAdmin, hasPermission, hasAnyPermission, hasAllPermissions, isAdministrativeRole]
  );
}
