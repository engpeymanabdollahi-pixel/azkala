import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Crown, ShieldCheck, UserCog, ShieldAlert, ChevronRight, ChevronLeft, ChevronDown, Search, Link2, CheckSquare, Square,
  LayoutGrid, Table,
} from 'lucide-react';
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
  type AdminAccessTreeNode,
  type AdminAccessPermissionsTaxonomy,
} from '@/services/api/adminAccess.service';
import type { AdministrativeRole } from '@/types/models';
import AccessTreeView from '@/components/admin/AccessTreeView';

/**
 * صفحه‌ی مدیریت «دسترسی مدیریتی» (بخش ۲۲ درخواست) — جایی که یک Super
 * Admin نقش Administrative (Super Admin/Admin/Manager) و Permission
 * های مستقیم هرکدام از ادمین‌ها را می‌بیند/تغییر می‌دهد.
 *
 * ⚠️ این لایه کاملاً مستقل از نقش اصلی کاربر (users.role) است — رجوع
 * به کامنت بالای AdminAccessService سمت بک‌اند. تمام hierarchy/
 * self-modification/delegation واقعی همان‌جا enforce می‌شود؛ فیلترهای
 * این صفحه (مخفی/غیرفعال کردن گزینه‌ها) فقط UX است.
 *
 * ✅ فاز ۷: دو حالت نمایش
 *   - table: جدول paginate با جستجو (برای پیدا کردن یک کاربر خاص)
 *   - tree: نمودار درختی گروه‌بندی‌شده بر اساس نقش (برای دید کلی)
 */

const ROLE_META: Record<AdministrativeRole, { label: string; variant: 'accent' | 'primary' | 'gray'; icon: LucideIcon }> = {
  super_admin: { label: 'Super Admin', variant: 'accent', icon: Crown },
  admin: { label: 'Admin', variant: 'primary', icon: ShieldCheck },
  manager: { label: 'Manager', variant: 'gray', icon: UserCog },
};

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
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

  // ✅ فاز ۷: فقط Super Admin می‌تواند این صفحه را ببیند
  const canView = isSuperAdmin;
  const canManage = isSuperAdmin;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-access-users', page, debouncedSearch],
    queryFn: () => adminAccessService.getUsers(page, 20, debouncedSearch || undefined),
    enabled: canView && viewMode === 'table',
  });

  const { data: taxonomyResponse } = useQuery({
    queryKey: ['admin-access-permissions-taxonomy'],
    queryFn: () => adminAccessService.getPermissionsTaxonomy(),
    enabled: canView && canManage,
  });

  const { customMutation } = useCrudMutations({ queryKeys: ['admin-access-users', 'admin-access-tree'] });

  if (!canView) {
    return (
      <EmptyState
        icon={<ShieldAlert className="w-10 h-10" />}
        title="دسترسی محدود"
        description="این بخش فقط برای Super Admin قابل دسترسی است."
      />
    );
  }

  const users = data?.data.data ?? [];
  const pagination = data?.data;

  // ✅ Adapter: AdminAccessTreeNode → AdminAccessUser برای استفاده در modal های موجود
  const handleTreeEditRole = (node: AdminAccessTreeNode) => {
    setRoleModalUser({
      id: node.id,
      name: node.name,
      phone: node.phone,
      email: node.email,
      users_role: node.users_role,
      administrative_role: node.administrative_role,
      direct_permissions: node.direct_permissions,
      effective_permissions: node.effective_permissions,
    });
  };

  const handleTreeEditPermissions = (node: AdminAccessTreeNode) => {
    setPermissionsModalUser({
      id: node.id,
      name: node.name,
      phone: node.phone,
      email: node.email,
      users_role: node.users_role,
      administrative_role: node.administrative_role,
      direct_permissions: node.direct_permissions,
      effective_permissions: node.effective_permissions,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header + View Mode Toggle */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">دسترسی مدیریتی</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت نقش Administrative (Super Admin / Admin / Manager) و Permission های هر ادمین — این لایه کاملاً مستقل از نقش اصلی کاربر است.
          </p>
        </div>

        {/* ✅ فاز ۷: View Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            aria-label="نمای جدولی"
          >
            <Table className="w-3.5 h-3.5" />
            <span>جدول</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'tree'
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            aria-label="نمای درختی"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>نمودار درختی</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'tree' ? (
        <AccessTreeView
          currentUserId={currentUser?.id}
          onEditRole={handleTreeEditRole}
          onEditPermissions={handleTreeEditPermissions}
        />
      ) : (
        <>
          {/* Search فقط برای نمای جدول */}
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
        </>
      )}

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

  const options: Array<{ value: AdministrativeRole | 'none'; label: string }> = [
    { value: 'none', label: 'بدون دسترسی مدیریتی' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
    ...(canAssignSuperAdmin ? [{ value: 'super_admin' as const, label: 'Super Admin' }] : []),
  ];

  const roleDescriptions: Record<AdministrativeRole | 'none', string> = {
    none: '⚠️ این کاربر کاملاً به حالت عادی برمی‌گردد: نقش ادمین، همه مجوزها و دسترسی به پنل ادمین حذف می‌شود. نقش اصلی او (مشتری/فروشنده) حفظ می‌شود.',
    manager:
      'شروع با صفر دسترسی. برای دسترسی محدود (مثلاً فقط یک بخش)، این را انتخاب کنید و بعد از «ذخیره»، از دکمه‌ی «مجوزها» فقط همان مورد(ها) را تیک بزنید.',
    admin:
      '⚠️ به‌صورت خودکار به تقریباً همه‌ی بخش‌های پنل ادمین دسترسی می‌دهد (جز چند مورد حساس مثل مالی و مدیریت دسترسی‌ها) — صرف‌نظر از تیک‌های Modal مجوزها. برای دسترسی محدود به یک یا چند بخش خاص، به‌جای این گزینه «Manager» را انتخاب کنید.',
    super_admin: 'دسترسی کامل و نامحدود به کل سیستم، بدون هیچ استثنا.',
  };

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
          <p
            className={`mt-2 text-xs leading-relaxed rounded-lg px-3 py-2 border ${
              role === 'none'
                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'
                : role === 'admin' || role === 'super_admin'
                  ? 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400 border-warning-200 dark:border-warning-800'
                  : 'bg-gray-50 text-gray-500 dark:bg-slate-900 dark:text-gray-400 border-gray-200 dark:border-slate-700'
            }`}
          >
            {roleDescriptions[role]}
          </p>
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
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const inheritedOnly = useMemo(
    () => new Set(user.effective_permissions.filter((p) => !user.direct_permissions.includes(p))),
    [user.effective_permissions, user.direct_permissions]
  );

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

  const q = search.trim().toLowerCase();
  const filteredTaxonomy = useMemo(() => {
    if (!q) return taxonomy;
    const result: AdminAccessPermissionsTaxonomy = {};
    for (const [moduleKey, module] of Object.entries(taxonomy)) {
      const matchedPerms = Object.entries(module.permissions).filter(
        ([permName, meta]) => permName.toLowerCase().includes(q) || meta.label.toLowerCase().includes(q)
      );
      if (module.label.toLowerCase().includes(q) || matchedPerms.length > 0) {
        result[moduleKey] = {
          label: module.label,
          permissions: module.label.toLowerCase().includes(q) ? module.permissions : Object.fromEntries(matchedPerms),
        };
      }
    }
    return result;
  }, [taxonomy, q]);

  const allPermissionNames = useMemo(
    () => Object.values(taxonomy).flatMap((m) => Object.keys(m.permissions)),
    [taxonomy]
  );
  const assignableNames = useMemo(
    () => allPermissionNames.filter((name) => actorIsSuperAdmin || actorPermissions.includes(name)),
    [allPermissionNames, actorIsSuperAdmin, actorPermissions]
  );

  const toggleModule = (permNames: string[], nextChecked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      permNames.forEach((name) => {
        const beyondOwnAuthority = !actorIsSuperAdmin && !actorPermissions.includes(name);
        if (beyondOwnAuthority) return;
        if (nextChecked) next.add(name);
        else next.delete(name);
      });
      return next;
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={`Permission های ${user.name}`} size="lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی ماژول یا Permission..."
              className="w-full pr-9 pl-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setSelected(new Set(assignableNames))}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap flex items-center gap-1"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            انتخاب همه
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:underline whitespace-nowrap flex items-center gap-1"
          >
            <Square className="w-3.5 h-3.5" />
            پاک کردن همه
          </button>
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {Object.keys(filteredTaxonomy).length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">موردی مطابق جستجو یافت نشد.</p>
          )}
          {Object.entries(filteredTaxonomy).map(([moduleKey, module]) => {
            const permNames = Object.keys(module.permissions);
            const checkedCount = permNames.filter((n) => selected.has(n)).length;
            const isCollapsed = collapsed.has(moduleKey);

            return (
              <div key={moduleKey} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-900/50">
                  <ModuleCheckbox
                    checkedCount={checkedCount}
                    total={permNames.length}
                    onChange={(next) => toggleModule(permNames, next)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((prev) => {
                        const next = new Set(prev);
                        if (next.has(moduleKey)) next.delete(moduleKey);
                        else next.add(moduleKey);
                        return next;
                      })
                    }
                    className="flex-1 flex items-center justify-between text-right"
                  >
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{module.label}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {checkedCount.toLocaleString('fa-IR')}/{permNames.length.toLocaleString('fa-IR')}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                    </span>
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2">
                    {Object.entries(module.permissions).map(([permName, meta]) => {
                      const beyondOwnAuthority = !actorIsSuperAdmin && !actorPermissions.includes(permName);
                      const isInheritedOnly = inheritedOnly.has(permName) && !selected.has(permName);

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
                          {isInheritedOnly && (
                            <Badge variant="gray" size="sm" icon={<Link2 className="w-3 h-3" />}>
                              به ارث رسیده از نقش
                            </Badge>
                          )}
                          {meta.sensitive && (
                            <Badge variant="warning" size="sm">
                              حساس
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

function ModuleCheckbox({
  checkedCount,
  total,
  onChange,
}: {
  checkedCount: number;
  total: number;
  onChange: (next: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const allChecked = total > 0 && checkedCount === total;
  const someChecked = checkedCount > 0 && checkedCount < total;

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allChecked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 flex-shrink-0"
    />
  );
}

export default AdminAccessPage;