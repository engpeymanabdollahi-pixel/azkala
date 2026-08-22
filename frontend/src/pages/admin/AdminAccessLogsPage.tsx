import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText, Search, Filter, ChevronLeft, ChevronRight,
  UserCheck, UserX, ShieldCheck, ShieldX, Calendar,
  Activity, ShieldAlert, ShoppingCart, Server, Search as SearchIcon,
  TrendingUp, AlertTriangle, Zap, Package,UserSearch,
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
import {
  observabilityService,
  type LogEntry,
  type ObservabilityFilters,
} from '@/services/api/observability.service';
import ShamsiDatePicker from '@/components/ui/ShamsiDatePicker';

// ==================== Constants ====================

type TabKey = 'access' | 'security' | 'payment' | 'api' | 'user' | 'search';

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: typeof ShieldCheck;
  description: string;
  superAdminOnly?: boolean;  // ✅ فاز ۷
}> = [
    { key: 'access', label: 'دسترسی ادمین‌ها', icon: ShieldCheck, description: 'تغییرات نقش و دسترسی' },
  { key: 'security', label: 'امنیت', icon: ShieldAlert, description: 'Login، OTP، Permission', superAdminOnly: true },
  { key: 'payment', label: 'سفارشات', icon: ShoppingCart, description: 'Order lifecycle و Commission' },
  { key: 'api', label: 'API / Queue', icon: Server, description: 'خطاهای API و Queue' },
  { key: 'user', label: 'جستجوی کاربر', icon: UserSearch, description: 'بر اساس شماره تلفن', superAdminOnly: true },
  { key: 'search', label: 'جستجو', icon: SearchIcon, description: 'بر اساس Request ID', superAdminOnly: true },
];

const ACCESS_ACTION_META: Record<
  AdminAccessLogEntry['action'],
  { label: string; variant: 'success' | 'warning' | 'primary' | 'destructive'; icon: typeof ShieldCheck }
> = {
  admin_role_assigned: { label: 'تخصیص نقش', variant: 'success', icon: UserCheck },
  admin_role_removed: { label: 'حذف نقش', variant: 'warning', icon: UserX },
  permission_granted: { label: 'اعطای دسترسی', variant: 'primary', icon: ShieldCheck },
  permission_revoked: { label: 'لغو دسترسی', variant: 'destructive', icon: ShieldX },
};

// Color mapping برای log levels
const LEVEL_COLORS: Record<string, 'success' | 'warning' | 'destructive' | 'primary' | 'gray'> = {
  INFO: 'primary',
  WARNING: 'warning',
  ERROR: 'destructive',
  DEBUG: 'gray',
};

// ==================== Helpers ====================

function formatPersianDate(isoString: string): string {
  // ✅ guard برای timestamp خالی یا نامعتبر
  if (!isoString || typeof isoString !== 'string') return '—';
  try {
    // ✅ space را به T تبدیل می‌کنیم تا new Date() همه فرمت‌ها را parse کند
    const normalized = isoString.replace(' ', 'T');
    const d = new Date(normalized);
    // ✅ اگر parse ناموفق بود، ISO را خام نشان بده
    if (Number.isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

function formatShortTime(isoString: string): string {
  if (!isoString || typeof isoString !== 'string') return '—';
  try {
    const normalized = isoString.replace(' ', 'T');
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

function parseValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.join('، ');
      return String(parsed);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.join('، ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// ==================== Main Component ====================

export default function AdminAccessLogsPage() {
  const { hasPermission, isSuperAdmin } = usePermission();
  const [activeTab, setActiveTab] = useState<TabKey>('access');
    // ✅ فاز ۷: اگر activeTab روی یک تب superAdminOnly است و کاربر non-super-admin است،
  // به تب پیش‌فرض ('access') برگردان
  useEffect(() => {
    const currentTab = TABS.find((t) => t.key === activeTab);
    if (currentTab?.superAdminOnly && !isSuperAdmin) {
      setActiveTab('access');
    }
  }, [activeTab, isSuperAdmin]);

  // Permission check
  if (!hasPermission('admin.access.view')) {
    return (
      <div className="p-8 text-center">
        <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          دسترسی غیرمجاز
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          شما مجوز مشاهده Observability Center را ندارید.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Observability Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            مرکز مشاهده‌پذیری یکپارچه سیستم
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-700">
        {TABS.filter((tab) => {
          // ✅ فاز ۷: تب‌های Super Admin Only را برای non-super-admin مخفی کن
          if (tab.superAdminOnly && !isSuperAdmin) return false;
          return true;
        }).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'access' && <AccessLogsTab />}
        {activeTab === 'security' && <ChannelTab channel="security" />}
        {activeTab === 'payment' && <ChannelTab channel="payment" />}
        {activeTab === 'api' && <ChannelTab channel="api" />}
        {activeTab === 'user' && <UserSearchTab />}
        {activeTab === 'search' && <SearchTab />}
      </div>
    </div>
  );
}

// ==================== Stats Cards ====================

function StatsCards() {
  const statsQuery = useQuery({
    queryKey: ['observability-stats'],
    queryFn: () => observabilityService.stats(),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  const stats = statsQuery.data;

  const cards = [
    {
      label: 'سفارشات امروز',
      value: stats?.orders_today ?? 0,
      icon: Package,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'ورودهای امروز',
      value: stats?.security_today ?? 0,
      icon: ShieldCheck,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'ورود ناموفق',
      value: stats?.failed_logins_today ?? 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600',
    },
    {
      label: 'Rate Limits',
      value: stats?.rate_limits_today ?? 0,
      icon: Zap,
      color: 'from-yellow-500 to-orange-600',
    },
    {
      label: 'تغییرات دسترسی',
      value: stats?.admin_access_total ?? 0,
      icon: UserCheck,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-4 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.color} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
            <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
              {statsQuery.isLoading ? (
                <div className="h-7 w-12 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : (
                card.value.toLocaleString('fa-IR')
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {card.label}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ==================== Access Logs Tab (original) ====================

function AccessLogsTab() {
  const [filters, setFilters] = useState<AdminAccessLogsFilters>({
    per_page: 20,
    page: 1,
    sort: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tempAction, setTempAction] = useState<string>('');
  const [tempDateFrom, setTempDateFrom] = useState<string>('');
  const [tempDateTo, setTempDateTo] = useState<string>('');

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

  const logs = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;
  const actions = actionsQuery.data?.data ?? {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          تاریخچه تغییرات دسترسی
        </h3>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">نوع رویداد</label>
              <select
                value={tempAction}
                onChange={(e) => setTempAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
              >
                <option value="">همه</option>
                {Object.entries(actions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">از تاریخ</label>
              <input
                type="date"
                value={tempDateFrom}
                onChange={(e) => setTempDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">تا تاریخ</label>
              <input
                type="date"
                value={tempDateTo}
                onChange={(e) => setTempDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleResetFilters}>پاک کردن</Button>
            <Button onClick={handleApplyFilters}>اعمال فیلتر</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {logsQuery.isLoading ? (
          <div className="p-12 flex justify-center"><Spinner /></div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            هیچ لاگی یافت نشد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">زمان</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">ادمین</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">هدف</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">رویداد</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">جزئیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {logs.map((log) => {
                  const meta = ACCESS_ACTION_META[log.action];
                  const Icon = meta.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {formatPersianDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {log.actor ? (
                          <div className="text-sm">{log.actor.name}</div>
                        ) : (
                          <span className="text-xs italic text-gray-400">(حذف شده)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.target ? (
                          <div className="text-sm">{log.target.name}</div>
                        ) : (
                          <span className="text-xs italic text-gray-400">(حذف شده)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={meta.variant} className="flex items-center gap-1 w-fit">
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs">
                        <span className="font-mono bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {parseValue(log.new_value || log.old_value)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ==================== Channel Tab (Security/Payment/API) ====================

interface ChannelTabProps {
  channel: 'security' | 'payment' | 'api';
}

function ChannelTab({ channel }: ChannelTabProps) {
  const [filters, setFilters] = useState<ObservabilityFilters>({
    limit: 100,
  });
  const [tempEvent, setTempEvent] = useState<string>('');

  const queryFn = () => {
    if (channel === 'security') return observabilityService.security(filters);
    if (channel === 'payment') return observabilityService.payment(filters);
    return observabilityService.api(filters.limit ?? 100);
  };

  const query = useQuery({
    queryKey: ['observability', channel, filters],
    queryFn,
    staleTime: 30_000,
  });

  const eventsQuery = useQuery({
    queryKey: ['observability-events', channel],
    queryFn: () => observabilityService.events(channel),
    staleTime: 300_000,
  });

  const events = (eventsQuery.data ?? []) as string[];
  const entries = (query.data?.data ?? []) as LogEntry[];

  const handleApply = () => {
    setFilters((prev) => ({ ...prev, event: tempEvent || null }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
          رویدادهای {channel === 'security' ? 'امنیتی' : channel === 'payment' ? 'سفارش/پرداخت' : 'API'}
        </h3>
        <div className="flex gap-2">
          {channel !== 'api' && (
            <>
              <select
                value={tempEvent}
                onChange={(e) => setTempEvent(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
              >
                <option value="">همه event ها</option>
                {events.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleApply}>
                <Filter className="w-4 h-4" />
              </Button>
            </>
          )}
          <select
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
          >
            <option value={50}>۵۰ تای آخر</option>
            <option value={100}>۱۰۰ تای آخر</option>
            <option value={200}>۲۰۰ تای آخر</option>
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        {query.isLoading ? (
          <div className="p-12 flex justify-center"><Spinner /></div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            هیچ رویدادی یافت نشد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">زمان</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">سطح</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Event</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">User</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Request ID</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {formatShortTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={LEVEL_COLORS[entry.level] ?? 'gray'}>
                        {entry.level}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {entry.event || entry.message?.substring(0, 30)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.user_id ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {entry.request_id ? (
                        <span className="cursor-pointer text-primary-600 hover:underline" title={entry.request_id}>
                          {entry.request_id.substring(0, 8)}...
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {entry.ip ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-gray-500 text-center">
        {entries.length} رویداد نمایش داده شده • داده‌ها از فایل‌های log خوانده می‌شوند
      </p>
    </div>
  );
}

// ==================== Search Tab ====================

function SearchTab() {
  const [requestId, setRequestId] = useState('');
  const [searchTrigger, setSearchTrigger] = useState<string | null>(null);

  const searchQuery = useQuery({
    queryKey: ['observability-search', searchTrigger],
    queryFn: () => observabilityService.searchByRequestId(searchTrigger!),
    enabled: !!searchTrigger,
    staleTime: 0,
  });

  const handleSearch = () => {
    const trimmed = requestId.trim();
    if (trimmed.length >= 8) {
      setSearchTrigger(trimmed);
    }
  };

  const results = (searchQuery.data?.data ?? []) as LogEntry[];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🔍 جستجوی Cross-Channel بر اساس Request ID
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Request ID را از Response Header (X-Request-Id) در DevTools Browser کپی کنید.
          همه لاگ‌های مربوط به آن request در همه کانال‌ها (security, payment, api, queue) یافت می‌شوند.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="550e8400-e29b-41d4-a716-446655440000"
            dir="ltr"
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-mono text-sm"
          />
          <Button onClick={handleSearch} disabled={!requestId.trim()}>
            <Search className="w-4 h-4 ml-2" />
            جستجو
          </Button>
        </div>
      </Card>

      {searchTrigger && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">جستجو برای: </span>
                <code className="text-sm font-mono bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                  {searchTrigger}
                </code>
              </div>
              <Badge variant="primary">
                {searchQuery.isLoading ? 'در حال جستجو...' : `${results.length} نتیجه`}
              </Badge>
            </div>
          </div>

          {searchQuery.isLoading ? (
            <div className="p-12 flex justify-center"><Spinner /></div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              هیچ لاگی با این Request ID یافت نشد
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {results.map((entry, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={LEVEL_COLORS[entry.level] ?? 'gray'}>
                        {entry.level}
                      </Badge>
                      <Badge variant="primary">{entry.channel}</Badge>
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                        {formatPersianDate(entry.timestamp)}
                      </span>
                    </div>
                    <code className="text-xs font-mono bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {entry.event || '—'}
                    </code>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-all text-xs">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(entry).filter(([k]) => !['timestamp', 'level', 'environment', 'channel'].includes(k))
                        ),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
// ==================== User Search Tab ====================

interface UserSearchFilters {
  phone: string;
  date_from: string;
  date_to: string;
  channel: string;
  event: string;
}

function UserSearchTab() {
  const [filters, setFilters] = useState<UserSearchFilters>({
    phone: '',
    date_from: '',
    date_to: '',
    channel: '',
    event: '',
  });
  const [searchTrigger, setSearchTrigger] = useState<UserSearchFilters | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = useQuery({
    queryKey: ['observability-user-search', searchTrigger],
    queryFn: () => observabilityService.searchByUser({
      phone: searchTrigger!.phone || undefined,
      date_from: searchTrigger!.date_from || null,
      date_to: searchTrigger!.date_to || null,
      channel: (searchTrigger!.channel || null) as 'security' | 'payment' | null,
      event: searchTrigger!.event || null,
    }),
    enabled: !!searchTrigger,
    staleTime: 0,
  });

  // لیست event های موجود برای dropdown
  const securityEvents = ['auth.register.request', 'auth.otp.verify.success', 'auth.otp.verify.failure', 'auth.login.success', 'auth.login.failure', 'auth.logout', 'auth.password.change', 'auth.permission.denied', 'auth.authentication.failed', 'abuse.rate_limit.hit'];
  const paymentEvents = ['order.created', 'order.cancelled', 'order.status.changed', 'order.payment.changed', 'commission.processed', 'commission.failed', 'order.settlement.done'];

  const availableEvents = useMemo(() => {
    if (filters.channel === 'security') return securityEvents;
    if (filters.channel === 'payment') return paymentEvents;
    return [...securityEvents, ...paymentEvents].sort();
  }, [filters.channel]);

  const handleSearch = () => {
    const trimmed = filters.phone.trim();
    if (trimmed.length >= 10) {
      setSearchTrigger({ ...filters });
    }
  };

  const handleReset = () => {
    setFilters({ phone: filters.phone, date_from: '', date_to: '', channel: '', event: '' });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.date_from) count++;
    if (filters.date_to) count++;
    if (filters.channel) count++;
    if (filters.event) count++;
    return count;
  }, [filters]);

  const results = (searchQuery.data?.data ?? []) as LogEntry[];
  const meta = searchQuery.data?.meta;

  return (
    <div className="space-y-4">
      {/* Search Input Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            🔍 جستجوی لاگ‌های کاربر بر اساس شماره تلفن
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="w-4 h-4 ml-2" />
            فیلترها
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          شماره تلفن کاربر را وارد کنید. همه لاگ‌های مربوط به آن کاربر
          (ورودها، سفارشات، تغییرات دسترسی) در همه کانال‌ها یافت می‌شوند.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="09123456789"
            dir="ltr"
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-mono text-sm"
          />
          <Button onClick={handleSearch} disabled={!filters.phone.trim() || filters.phone.trim().length < 10}>
            <UserSearch className="w-4 h-4 ml-2" />
            جستجو
          </Button>
        </div>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4 md:p-6">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">فیلترهای پیشرفته</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Date From — شمسی */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline ml-1" />
                از تاریخ (شمسی)
              </label>
              <ShamsiDatePicker
                value={filters.date_from}
                onChange={(g) => setFilters({ ...filters, date_from: g })}
              />
            </div>

                        {/* Date To — شمسی */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline ml-1" />
                تا تاریخ (شمسی)
              </label>
              <ShamsiDatePicker
                value={filters.date_to}
                onChange={(g) => setFilters({ ...filters, date_to: g })}
              />
            </div>

            {/* Channel Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع کانال
              </label>
              <select
                value={filters.channel}
                onChange={(e) => setFilters({ ...filters, channel: e.target.value, event: '' })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm"
              >
                <option value="">همه کانال‌ها</option>
                <option value="security">امنیت (security)</option>
                <option value="payment">سفارشات (payment)</option>
              </select>
            </div>

            {/* Event Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع رویداد
              </label>
              <select
                value={filters.event}
                onChange={(e) => setFilters({ ...filters, event: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm"
              >
                <option value="">همه رویدادها</option>
                {availableEvents.map((evt) => (
                  <option key={evt} value={evt}>{evt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleReset}>
              پاک کردن فیلترها
            </Button>
            <Button size="sm" onClick={handleSearch} disabled={!filters.phone.trim() || filters.phone.trim().length < 10}>
              <Search className="w-4 h-4 ml-2" />
              اعمال و جستجو
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {searchTrigger && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">جستجو برای:</span>
                <code className="text-sm font-mono bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                  {meta?.phone_mask || searchTrigger.phone}
                </code>
                {meta?.user_id && (
                  <Badge variant="primary">User ID: {meta.user_id}</Badge>
                )}
                {searchTrigger.channel && (
                  <Badge variant="gray">کانال: {searchTrigger.channel}</Badge>
                )}
                {searchTrigger.event && (
                  <Badge variant="gray">رویداد: {searchTrigger.event}</Badge>
                )}
              </div>
              <Badge variant="primary">
                {searchQuery.isLoading ? 'در حال جستجو...' : `${results.length} نتیجه`}
              </Badge>
            </div>
          </div>

          {searchQuery.isLoading ? (
            <div className="p-12 flex justify-center"><Spinner /></div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <UserSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
              هیچ لاگی با این فیلترها یافت نشد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">زمان</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">کانال</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">سطح</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Event</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">جزئیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {results.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-xs whitespace-nowrap" dir="rtl">
                        {entry.timestamp ? formatPersianDate(entry.timestamp) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.channel === 'security' ? 'warning' : entry.channel === 'payment' ? 'success' : 'gray'}>
                          {entry.channel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={LEVEL_COLORS[entry.level] ?? 'gray'}>
                          {entry.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {entry.event || entry.message?.substring(0, 30)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                        <span className="line-clamp-1">
                          {entry.request_id && `req: ${String(entry.request_id).substring(0, 8)}... `}
                          {entry.ip && `ip: ${entry.ip} `}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}