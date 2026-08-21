import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText, Search, Filter, ChevronLeft, ChevronRight,
  UserCheck, UserX, ShieldCheck, ShieldX, Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { usePermission } from '@/hooks/usePermission';
import {
  adminAccessLogsService,
  type AdminAccessLogEntry,
  type AdminAccessLogsFilters,
} from '@/services/api/adminAccessLogs.service';

// ==================== Constants ====================

const ACTION_META: Record<
  AdminAccessLogEntry['action'],
  { label: string; variant: 'success' | 'warning' | 'primary' | 'destructive'; icon: typeof ShieldCheck }
> = {
  admin_role_assigned: { label: 'تخصیص نقش', variant: 'success', icon: UserCheck },
  admin_role_removed: { label: 'حذف نقش', variant: 'warning', icon: UserX },
  permission_granted: { label: 'اعطای دسترسی', variant: 'primary', icon: ShieldCheck },
  permission_revoked: { label: 'لغو دسترسی', variant: 'destructive', icon: ShieldX },
};

// ==================== Helpers ====================

function formatPersianDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function parseValue(value: string | null): string {
  if (value === null || value === '') return '—';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join('، ');
    return String(parsed);
  } catch {
    return value;
  }
}

// ==================== Component ====================

export default function AdminAccessLogsPage() {
  const { hasPermission } = usePermission();

  // Filter state
  const [filters, setFilters] = useState<AdminAccessLogsFilters>({
    per_page: 20,
    page: 1,
    sort: 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Temp filter values (قبل از apply)
  const [tempAction, setTempAction] = useState<string>('');
  const [tempDateFrom, setTempDateFrom] = useState<string>('');
  const [tempDateTo, setTempDateTo] = useState<string>('');

  // Queries
  const logsQuery = useQuery({
    queryKey: ['admin-access-logs', filters],
    queryFn: () => adminAccessLogsService.list(filters),
    staleTime: 30_000,
  });

  const actionsQuery = useQuery({
    queryKey: ['admin-access-logs-actions'],
    queryFn: () => adminAccessLogsService.actions(),
    staleTime: 300_000,
  });

  // ==================== Handlers ====================

  const handleApplyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      action: tempAction || null,
      date_from: tempDateFrom || null,
      date_to: tempDateTo || null,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setTempAction('');
    setTempDateFrom('');
    setTempDateTo('');
    setFilters({
      per_page: 20,
      page: 1,
      sort: 'desc',
      action: null,
      date_from: null,
      date_to: null,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // ==================== Render helpers ====================

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.action) count++;
    if (filters.date_from) count++;
    if (filters.date_to) count++;
    if (filters.actor_user_id) count++;
    if (filters.target_user_id) count++;
    return count;
  }, [filters]);

  // ==================== Permission check ====================

  if (!hasPermission('admin.access.view')) {
    return (
      <div className="p-8 text-center">
        <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          دسترسی غیرمجاز
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          شما مجوز مشاهده لاگ‌های دسترسی مدیریتی را ندارید.
        </p>
      </div>
    );
  }

  // ==================== Render ====================

  const logs = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;
  const actions = actionsQuery.data?.data ?? {};

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg">
            <ScrollText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              گزارش دسترسی‌های مدیریتی
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              تاریخچه تغییرات نقش و دسترسی ادمین‌ها (append-only)
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Action filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع رویداد
              </label>
              <select
                value={tempAction}
                onChange={(e) => setTempAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">همه رویدادها</option>
                {Object.entries(actions).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline ml-1" />
                از تاریخ
              </label>
              <input
                type="date"
                value={tempDateFrom}
                onChange={(e) => setTempDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline ml-1" />
                تا تاریخ
              </label>
              <input
                type="date"
                value={tempDateTo}
                onChange={(e) => setTempDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleResetFilters}>
              پاک کردن
            </Button>
            <Button onClick={handleApplyFilters}>
              <Search className="w-4 h-4 ml-2" />
              اعمال فیلتر
            </Button>
          </div>
        </Card>
      )}

      {/* Logs table */}
      <Card className="overflow-hidden">
        {logsQuery.isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner />
          </div>
        ) : logsQuery.isError ? (
          <div className="p-12 text-center">
            <p className="text-red-600 dark:text-red-400 font-bold mb-2">
              خطا در بارگذاری لاگ‌ها
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              لطفاً دوباره تلاش کنید.
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-bold mb-1">
              هیچ لاگی یافت نشد
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {activeFiltersCount > 0
                ? 'فیلترها را پاک کنید یا منتظر رویدادهای جدید باشید.'
                : 'هنوز هیچ تغییر دسترسی‌ای ثبت نشده است.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                    زمان
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                    ادمین (Actor)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                    هدف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                    رویداد
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                    جزئیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {logs.map((log) => {
                  const meta = ACTION_META[log.action];
                  const Icon = meta.icon;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Time */}
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatPersianDate(log.created_at)}
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3">
                        {log.actor ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {log.actor.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {log.actor.email || log.actor.phone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            (حذف شده)
                          </span>
                        )}
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3">
                        {log.target ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {log.target.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {log.target.email || log.target.phone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            (حذف شده)
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <Badge variant={meta.variant} className="flex items-center gap-1 w-fit">
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </Badge>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 max-w-xs">
                        {log.action === 'admin_role_assigned' || log.action === 'admin_role_removed' ? (
                          <div>
                            <span className="font-bold">نقش: </span>
                            <span className="font-mono bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {parseValue(log.new_value || log.old_value)}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {log.old_value && (
                              <div className="flex items-center gap-1">
                                <span className="text-red-500">−</span>
                                <span className="font-mono text-[11px]">
                                  {parseValue(log.old_value)}
                                </span>
                              </div>
                            )}
                            {log.new_value && (
                              <div className="flex items-center gap-1">
                                <span className="text-green-500">+</span>
                                <span className="font-mono text-[11px]">
                                  {parseValue(log.new_value)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              صفحه {meta.current_page} از {meta.last_page} (جمعاً {meta.total} رکورد)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page <= 1}
                onClick={() => handlePageChange(meta.current_page - 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={meta.current_page === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => handlePageChange(meta.current_page + 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}