import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Crown, ShieldCheck, UserCog, UserX, ChevronDown, ChevronLeft,
  Search, Clock, Phone, Mail, Users as UsersIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminAccessService, type AdminAccessTreeNode } from '@/services/api/adminAccess.service';
import type { AdministrativeRole } from '@/types/models';

/**
 * ✅ فاز ۷ (Tree View): نمودار درختی کاربران دارای دسترسی مدیریتی.
 *
 * Design System ازکالا:
 *   - semantic tokens (primary/warning/success) از ROLE_META موجود
 *   - Lucide icons (Crown/ShieldCheck/UserCog/UserX)
 *   - rounded-xl برای Card، rounded-lg برای node
 *   - RTL-first، Light/Dark
 *   - Expand/Collapse با aria-label برای accessibility
 */

const ROLE_CONFIG: Record<
  AdministrativeRole | 'none',
  {
    label: string;
    variant: 'accent' | 'primary' | 'warning' | 'gray';
    icon: LucideIcon;
    description: string;
    gradient: string;
    defaultExpanded: boolean;
  }
> = {
  super_admin: {
    label: 'Super Admin',
    variant: 'accent',
    icon: Crown,
    description: 'دسترسی کامل و نامحدود به کل سیستم',
    gradient: 'from-purple-500 to-pink-500',
    defaultExpanded: true,
  },
  admin: {
    label: 'Admin سراسری',
    variant: 'primary',
    icon: ShieldCheck,
    description: 'دسترسی به همه بخش‌های غیرحساس',
    gradient: 'from-blue-500 to-indigo-500',
    defaultExpanded: true,
  },
  manager: {
    label: 'Manager',
    variant: 'gray',
    icon: UserCog,
    description: 'دسترسی محدود به بخش‌های خاص',
    gradient: 'from-gray-500 to-slate-500',
    defaultExpanded: true,
  },
  none: {
    label: 'بدون دسترسی مدیریتی',
    variant: 'gray',
    icon: UserX,
    description: 'نقش ادمین ندارند (فقط users.role=admin)',
    gradient: 'from-gray-300 to-gray-400',
    defaultExpanded: false,
  },
};

const GROUP_ORDER: Array<AdministrativeRole | 'none'> = [
  'super_admin',
  'admin',
  'manager',
  'none',
];

interface AccessTreeViewProps {
  onEditRole: (user: AdminAccessTreeNode) => void;
  onEditPermissions: (user: AdminAccessTreeNode) => void;
  currentUserId?: number;
}

export default function AccessTreeView({
  onEditRole,
  onEditPermissions,
  currentUserId,
}: AccessTreeViewProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      GROUP_ORDER.map((key) => [key, ROLE_CONFIG[key].defaultExpanded])
    )
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-access-tree'],
    queryFn: () => adminAccessService.getAccessTree(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const toggleGroup = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setExpanded(Object.fromEntries(GROUP_ORDER.map((k) => [k, true])));
  };

  const collapseAll = () => {
    setExpanded(Object.fromEntries(GROUP_ORDER.map((k) => [k, false])));
  };

  // فیلتر کاربران بر اساس جستجو
  const filteredGroups = useMemo(() => {
    const tree = data?.data;
    if (!tree) return null;

    const q = search.trim().toLowerCase();
    if (!q) return tree.groups;

    const result: typeof tree.groups = {
      super_admin: [],
      admin: [],
      manager: [],
      none: [],
    };

    for (const role of GROUP_ORDER) {
      result[role] = tree.groups[role].filter((u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [data, search]);

  const filteredCounts = useMemo(() => {
    if (!filteredGroups) return { super_admin: 0, admin: 0, manager: 0, none: 0 };
    return {
      super_admin: filteredGroups.super_admin.length,
      admin: filteredGroups.admin.length,
      manager: filteredGroups.manager.length,
      none: filteredGroups.none.length,
    };
  }, [filteredGroups]);

  const totalFiltered = Object.values(filteredCounts).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ShieldCheck className="w-10 h-10" />}
        title="خطا در بارگذاری"
        description="دریافت درخت دسترسی مدیریتی با خطا مواجه شد."
      />
    );
  }

  if (!filteredGroups) return null;

  return (
    <div className="space-y-4">
      {/* Header: Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام، شماره یا ایمیل..."
            className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={expandAll}>
            باز کردن همه
          </Button>
          <Button size="sm" variant="outline" onClick={collapseAll}>
            بستن همه
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {GROUP_ORDER.map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          return (
            <div
              key={role}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {filteredCounts[role].toLocaleString('fa-IR')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {config.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Results Info */}
      {search && (
        <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {totalFiltered.toLocaleString('fa-IR')} نتیجه از{' '}
          {data?.data.total.toLocaleString('fa-IR')} کاربر
        </div>
      )}

      {/* Tree Groups */}
      <div className="space-y-3">
        {GROUP_ORDER.map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          const users = filteredGroups[role];
          const isExpanded = expanded[role];
          const count = filteredCounts[role];

          return (
            <Card key={role} variant="plain" className="overflow-hidden">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(role)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-right"
                aria-expanded={isExpanded}
                aria-label={`${config.label} - ${count} کاربر`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {config.label}
                      </span>
                      <Badge variant={config.variant} size="sm">
                        {count.toLocaleString('fa-IR')}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {config.description}
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-slate-800">
                  {users.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
                      {search
                        ? 'هیچ کاربری مطابق جستجو یافت نشد'
                        : 'هیچ کاربری در این گروه نیست'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-slate-800">
                      {users.map((user) => (
                        <UserNode
                          key={user.id}
                          user={user}
                          isSelf={user.id === currentUserId}
                          onEditRole={() => onEditRole(user)}
                          onEditPermissions={() => onEditPermissions(user)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ==================== User Node ====================

function UserNode({
  user,
  isSelf,
  onEditRole,
  onEditPermissions,
}: {
  user: AdminAccessTreeNode;
  isSelf: boolean;
  onEditRole: () => void;
  onEditPermissions: () => void;
}) {
  const lastActive = useMemo(() => {
    if (!user.last_login_at) return 'هرگز وارد نشده';
    const diff = Date.now() - new Date(user.last_login_at).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${minutes.toLocaleString('fa-IR')} دقیقه پیش`;
    if (hours < 24) return `${hours.toLocaleString('fa-IR')} ساعت پیش`;
    if (days < 30) return `${days.toLocaleString('fa-IR')} روز پیش`;
    return 'بیش از یک ماه';
  }, [user.last_login_at]);

  const canEdit = !isSelf && user.administrative_role !== 'super_admin';
  const permissionsCount =
    user.administrative_role === 'super_admin'
      ? 'همه'
      : `${user.direct_permissions.length} مستقیم`;

  return (
    <div className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        {/* User Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {user.name}
              </span>
              {isSelf && (
                <Badge variant="primary" size="sm">
                  شما
                </Badge>
              )}
            </div>

            <div className="mt-1.5 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span dir="ltr" className="font-mono">{user.phone}</span>
              </div>
              {user.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <UsersIcon className="w-3 h-3" />
                  <span>
                    نقش اصلی:{' '}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {user.users_role}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{lastActive}</span>
                </span>
                <span>
                  مجوزها:{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {permissionsCount}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isSelf && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onEditRole}
              disabled={!canEdit}
            >
              تغییر نقش
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEditPermissions}
              disabled={user.administrative_role === 'super_admin'}
            >
              مجوزها
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}