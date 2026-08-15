import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { Crown, ShieldCheck, UserCog, ShieldAlert, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/store/authStore';
import { useCrudMutations } from '@/features/admin/hooks';
import {
  adminAccessService,
  type AdminAccessUser,
  type AdminAccessPermissionsTaxonomy,
} from '@/services/api/adminAccess.service';
import type { AdministrativeRole } from '@/types/models';

/**
 * صفحه‌ی مدیریت «دسترسی مدیریتی» (بخش ۲۲ درخواست) — جایی که یک Super
 * Admin نقش Administrative (Super Admin/Admin/Manager) و Permission
 * های مستقیم هرکدام از ادمین‌ها را می‌بیند/تغییر می‌دهد.
 *
 * ⚠️ این لایه کاملاً مستقل از نقش اصلی کاربر (users.role) است — رجوع
 * به کامنت بالای AdminAccessService سمت بک‌اند. تمام hierarchy/
 * self-modification/delegation واقعی همان‌جا enforce می‌شود؛ فیلترهای
 * این صفحه (مخفی/غیرفعال کردن گزینه‌ها) فقط UX است.
 */

const ROLE_META: Record<AdministrativeRole, { label: string; variant: 'accent' | 'primary' | 'gray'; icon: LucideIcon }> = {
  super_admin: { label: 'Super Admin', variant: 'accent', icon: Crown },
  admin: { label: 'Admin', variant: 'primary', icon: ShieldCheck },
  manager: { label: 'Manager', variant: 'gray', icon: UserCog },
};

// ✅ نقش اصلی (users.role) — از وقتی جستجو دیگر به role=admin محدود
// نیست (بخش «فعال‌سازی تخصیص Administrative Role به کاربران غیر-admin»)،
// جدول باید این را هم نشان بدهد تا مشخص باشد کدام کاربر هنوز
// Administrative Role نگرفته است.
const USERS_ROLE_LABEL: Record<string, string> = {
  customer: 'مشتری',
  seller: 'فروشنده',
  admin: 'ادمین',
  pending_seller: 'در انتظار تایید فروشندگی',
};

const SELECT_CLASS =
  'w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm';

export function AdminAccessPage() {
  const { hasPermission, isSuperAdmin, permissions: actorPermissions } = usePermission();
  const currentUser = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleModalUser, setRoleModalUser] = useState<AdminAccessUser | null>(null);
  const [permissionsModalUser, setPermissionsModalUser] = useState<AdminAccessUser | null>(null);

  const canView = hasPermission('admin.access.view');
  const canManage = hasPermission('admin.access.manage');

  // ✅ همان الگوی debounce ۴۰۰ میلی‌ثانیه‌ای موجود در AdminCouponsPage —
  // جلوگیری از یک درخواست به ازای هر حرف تایپ‌شده.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-access-users', page, debouncedSearch],
    queryFn: () => adminAccessService.getUsers(page, 20, debouncedSearch || undefined),
    enabled: canView,
  });

  // ✅ taxonomy فقط وقتی لازم است که واقعاً بخواهد Permission ویرایش کند —
  // برای کسی که فقط admin.access.view دارد (نه manage)، این درخواست بی‌فایده است.
  const { data: taxonomyResponse } = useQuery({
    queryKey: ['admin-access-permissions-taxonomy'],
    queryFn: () => adminAccessService.getPermissionsTaxonomy(),
    enabled: canView && canManage,
  });

  const { customMutation } = useCrudMutations({ queryKeys: ['admin-access-users'] });

  if (!canView) {
    return (
      <EmptyState
        icon={<ShieldAlert className="w-10 h-10" />}
        title="دسترسی ندارید"
        description="برای مشاهده‌ی این بخش به Permission «admin.access.view» نیاز دارید."
      />
    );
  }

  const users = data?.data.data ?? [];
  const pagination = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">دسترسی مدیریتی</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          مدیریت نقش Administrative (Super Admin / Admin / Manager) و Permission های هر ادمین — این لایه کاملاً مستقل از نقش اصلی کاربر است.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="جستجوی نام، شماره موبایل یا ایمیل..."
          className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>

      <Card variant="plain" className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          debouncedSearch ? (
            <EmptyState title="نتیجه‌ای یافت نشد" description={`هیچ کاربری مطابق «${debouncedSearch}» پیدا نشد.`} />
          ) : (
            <EmptyState title="هیچ ادمینی یافت نشد" description="کاربری با نقش اصلی «ادمین» ثبت نشده است." />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-right">
                  <th className="p-4 font-semibold">کاربر</th>
                  <th className="p-4 font-semibold">نقش اصلی</th>
                  <th className="p-4 font-semibold">نقش Administrative</th>
                  <th className="p-4 font-semibold">Permission های مستقیم</th>
                  <th className="p-4 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const meta = u.administrative_role ? ROLE_META[u.administrative_role] : null;
                  // ✅ فقط Super Admin می‌تواند یک Super Admin دیگر را مدیریت
                  // کند (بخش ۱۶) — دکمه‌ها را برای این حالت اصلاً نشان نده،
                  // به‌جای اینکه مودال باز شود و بعد با ۴۰۳ رد شود.
                  const canManageThisRow = canManage && !isSelf && (u.administrative_role !== 'super_admin' || isSuperAdmin);

                  return (
                    <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/60 last:border-0">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100">{u.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{u.phone}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="gray" size="sm">
                          {USERS_ROLE_LABEL[u.users_role] ?? u.users_role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {meta ? (
                          <Badge variant={meta.variant} size="sm" icon={<meta.icon className="w-3.5 h-3.5" />}>
                            {meta.label}
                          </Badge>
                        ) : (
                          <Badge variant="gray" size="sm">بدون دسترسی مدیریتی</Badge>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {u.administrative_role === 'super_admin' ? 'همه (Super Admin)' : `${u.direct_permissions.length} مورد`}
                      </td>
                      <td className="p-4">
                        {isSelf ? (
                          <span className="text-xs text-gray-400 dark:text-gray-500">(خودتان)</span>
                        ) : canManageThisRow ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => setRoleModalUser(u)}>
                              {u.administrative_role ? 'تغییر نقش' : 'تعیین نقش'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={u.administrative_role === 'super_admin'}
                              onClick={() => setPermissionsModalUser(u)}
                            >
                              Permission ها
                            </Button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              leftIcon={<ChevronRight className="w-4 h-4" />}
            >
              قبلی
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              صفحه {pagination.current_page} از {pagination.last_page}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.last_page}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronLeft className="w-4 h-4" />}
            >
              بعدی
            </Button>
          </div>
        )}
      </Card>

      {roleModalUser && (
        <RoleModal
          user={roleModalUser}
          canAssignSuperAdmin={isSuperAdmin}
          isSaving={customMutation.isPending}
          onClose={() => setRoleModalUser(null)}
          onSave={(role) => {
            customMutation.mutate(
              { endpoint: `/admin/access/users/${roleModalUser.id}/role`, method: 'PUT', data: { role } },
              { onSuccess: () => setRoleModalUser(null) }
            );
          }}
        />
      )}

      {permissionsModalUser && taxonomyResponse && (
        <PermissionsModal
          user={permissionsModalUser}
          taxonomy={taxonomyResponse.data}
          actorPermissions={actorPermissions}
          actorIsSuperAdmin={isSuperAdmin}
          isSaving={customMutation.isPending}
          onClose={() => setPermissionsModalUser(null)}
          onSave={(permissionNames) => {
            customMutation.mutate(
              {
                endpoint: `/admin/access/users/${permissionsModalUser.id}/permissions`,
                method: 'PUT',
                data: { permissions: permissionNames },
              },
              { onSuccess: () => setPermissionsModalUser(null) }
            );
          }}
        />
      )}
    </div>
  );
}

// ==================== Role Modal ====================

function RoleModal({
  user,
  canAssignSuperAdmin,
  isSaving,
  onClose,
  onSave,
}: {
  user: AdminAccessUser;
  canAssignSuperAdmin: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (role: AdministrativeRole | null) => void;
}) {
  const [role, setRole] = useState<AdministrativeRole | 'none'>(user.administrative_role ?? 'none');

  // ✅ گزینه‌ی Super Admin فقط برای Super Admin نمایش داده می‌شود (بخش
  // ۱۵: «هیچ‌کس نمی‌تواند دسترسی بالاتر از سطح خودش اعطا کند») —
  // Backend هم مستقل همین را چک می‌کند، این فقط جلوی یک ۴۰۳ بی‌فایده را می‌گیرد.
  const options: Array<{ value: AdministrativeRole | 'none'; label: string }> = [
    { value: 'none', label: 'بدون دسترسی مدیریتی' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
    ...(canAssignSuperAdmin ? [{ value: 'super_admin' as const, label: 'Super Admin' }] : []),
  ];

  return (
    <Modal isOpen onClose={onClose} title={`تغییر نقش Administrative — ${user.name}`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
            نقش Administrative
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdministrativeRole | 'none')}
            className={SELECT_CLASS}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button fullWidth isLoading={isSaving} onClick={() => onSave(role === 'none' ? null : role)}>
            ذخیره
          </Button>
          <Button variant="outline" fullWidth onClick={onClose}>
            انصراف
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ==================== Permissions Modal ====================

function PermissionsModal({
  user,
  taxonomy,
  actorPermissions,
  actorIsSuperAdmin,
  isSaving,
  onClose,
  onSave,
}: {
  user: AdminAccessUser;
  taxonomy: AdminAccessPermissionsTaxonomy;
  actorPermissions: string[];
  actorIsSuperAdmin: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (permissions: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(user.direct_permissions));

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={`Permission های ${user.name}`} size="lg">
      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        {Object.entries(taxonomy).map(([moduleKey, module]) => (
          <div key={moduleKey}>
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">{module.label}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(module.permissions).map(([permName, meta]) => {
                // ✅ Delegation Security (بخش ۱۵): «هیچ‌کس نمی‌تواند
                // Permission ای را که خودش ندارد واگذار کند» — Super
                // Admin از این محدودیت مستثناست (Backend هم همین را
                // enforce می‌کند، این فقط پیش‌گیری UX از یک ۴۰۳ است).
                const beyondOwnAuthority = !actorIsSuperAdmin && !actorPermissions.includes(permName);

                return (
                  <label
                    key={permName}
                    className={
                      'flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 ' +
                      (beyondOwnAuthority
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(permName)}
                      disabled={beyondOwnAuthority}
                      onChange={() => toggle(permName)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{meta.label}</span>
                    {meta.sensitive && (
                      <Badge variant="warning" size="sm">
                        حساس
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
        <Button fullWidth isLoading={isSaving} onClick={() => onSave(Array.from(selected))}>
          ذخیره
        </Button>
        <Button variant="outline" fullWidth onClick={onClose}>
          انصراف
        </Button>
      </div>
    </Modal>
  );
}

export default AdminAccessPage;
