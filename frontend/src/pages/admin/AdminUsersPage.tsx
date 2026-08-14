import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Users, User, Search, Eye, Shield, ShieldAlert,
  X, Package, DollarSign, Calendar,
  Phone, Star, Award, RefreshCw, Store,
  CheckCircle, XCircle, UserCheck, Clock,
  MessageSquare, FileText,
  Crown, Medal, Gem, Smile, Meh, Frown, Flag,
  Hash, CreditCard, Percent, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { STORAGE_URL } from '@/lib/apiConfig';
import {
  adminUserService,
  type AdminUser,
  type UserFilters,
} from '@/services/api/adminUser.service';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { ExportButton } from '@/components/admin/ExportButton';

// ==================== Types ====================
type RoleFilter = 'all' | 'customer' | 'seller' | 'admin';
type StatusFilter = 'all' | 'active' | 'inactive';
type OnlineFilter = 'all' | 'online' | 'offline';
type ConversationsFilter = 'all' | 'none' | 'few' | 'medium' | 'many';
type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';
type ReportsFilter = 'all' | 'none' | 'few' | 'many';
type TabType = 'users' | 'requests';

// ==================== Helper Functions ====================
const getRoleInfo = (role: string) => {
  const map: Record<string, { label: string; color: string; icon: any; bg: string }> = {
    customer: { label: 'مشتری', color: 'primary', icon: Users, bg: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800' },
    seller: { label: 'فروشنده', color: 'success', icon: Store, bg: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800' },
    admin: { label: 'مدیر', color: 'error', icon: Shield, bg: 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 border-error-200 dark:border-error-800' },
    pending_seller: { label: 'درخواست فروشنده', color: 'warning', icon: Clock, bg: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800' },
  };
  return map[role] || map.customer;
};

const getBadgeInfo = (badge: string) => {
  const map: Record<string, { label: string; color: string; icon: any }> = {
    none: { label: 'بدون نشان', color: 'gray', icon: Award },
    bronze: { label: 'برنزی', color: 'warning', icon: Medal },
    silver: { label: 'نقره‌ای', color: 'primary', icon: Medal },
    gold: { label: 'طلایی', color: 'warning', icon: Crown },
    platinum: { label: 'پلاتینیوم', color: 'accent', icon: Gem },
  };
  return map[badge] || map.none;
};

const getRatingStars = (rating: number | string) => {
  const numRating = Number(rating) || 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(numRating)) {
      stars.push(<Star key={i} className="w-3 h-3 fill-warning-400 text-warning-400" />);
    } else if (i - 0.5 <= numRating) {
      stars.push(<Star key={i} className="w-3 h-3 fill-warning-400/50 text-warning-400" />);
    } else {
      stars.push(<Star key={i} className="w-3 h-3 text-gray-300 dark:text-gray-600" />);
    }
  }
  return stars;
};

const getSentimentIcon = (label?: string) => {
  if (label === 'positive') return <Smile className="w-4 h-4 text-green-600 dark:text-green-400" />;
  if (label === 'negative') return <Frown className="w-4 h-4 text-red-600 dark:text-red-400" />;
  return <Meh className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
};

// ==================== Main Component ====================
export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // Filters
  const [filters, setFilters] = useState<UserFilters>({ page: 1, per_page: 20, sort_by: 'created_at', sort_order: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [onlineFilter, setOnlineFilter] = useState<OnlineFilter>('all');
  const [conversationsFilter, setConversationsFilter] = useState<ConversationsFilter>('all');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [reportsFilter, setReportsFilter] = useState<ReportsFilter>('all');

  // Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // ✅ Stateهای جدید برای مودال بررسی درخواست فروشندگی
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Queries
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => adminUserService.getUsers(filters),
    placeholderData: keepPreviousData,
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-seller-requests'],
    queryFn: () => adminUserService.getSellerRequests(),
    enabled: activeTab === 'requests',
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;
  const stats = data?.data?.stats;
  const requests = Array.isArray(requestsData?.data?.requests) ? requestsData.data.requests : [];

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => adminUserService.updateStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('وضعیت کاربر تغییر کرد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  });

  // ❌ approveSellerMutation («تایید یک‌کلیکی فروشنده») حذف شد — این دکمه
  // کاملاً موازی و مستقل از خط‌لولهٔ واقعی درخواست فروشندگی (تب «درخواست‌های
  // فروشندگی» پایین‌تر) بود؛ چون shop_name/مدارک/اطلاعات بانکی هیچ‌وقت از
  // این مسیر جمع‌آوری نمی‌شد، فروشندهٔ «تاییدشده» با آن هیچ‌وقت slug
  // نمی‌گرفت و صفحه‌ی عمومی‌اش برای همیشه ۴۰۴ می‌داد.

  const rejectSellerMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminUserService.rejectSeller(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('فروشنده رد شد', { icon: '✅' });
      setShowRejectModal(null);
      setRejectReason('');
    },
    onError: () => toast.error('خطا در رد فروشنده'),
  });

  // ✅ Mutationهای جدید برای فرآیند ۴ مرحله‌ای
  const initialApproveMutation = useMutation({
    mutationFn: (id: number) => adminUserService.initialApproveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
      toast.success('تایید اولیه انجام شد و نوتیفیکیشن ارسال گردید', { icon: '✅' });
      setShowRequestModal(false);
    },
    onError: () => toast.error('خطا در تایید اولیه'),
  });

  const finalApproveMutation = useMutation({
    mutationFn: (id: number) => adminUserService.finalApproveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('فروشندگی تایید نهایی شد و شعبه افتتاح گردید', { icon: '🎉' });
      setShowRequestModal(false);
    },
    onError: () => toast.error('خطا در تایید نهایی'),
  });

  const rejectRequestMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminUserService.rejectSellerRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
      toast.success('درخواست رد شد', { icon: '✅' });
      setShowRequestModal(false);
    },
    onError: () => toast.error('خطا در رد درخواست'),
  });

  // Handlers
  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeout = setTimeout(() => setFilters(prev => ({ ...prev, search: value, page: 1 })), 500);
    return () => clearTimeout(timeout);
  };

  const handleRoleFilter = (role: RoleFilter) => {
    setRoleFilter(role);
    setFilters(prev => ({ ...prev, role: role === 'all' ? undefined : role, page: 1 }));
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setFilters(prev => ({ ...prev, is_active: status === 'all' ? undefined : status === 'active', page: 1 }));
  };

  // ✅ قبلاً این ۴ فیلتر (آنلاین/تعداد مکالمات/احساسات/گزارش‌های تخلف) state
  // و handler داشتند و حتی توسط بکند (AdminUserRepository::getUsers) کاملاً
  // پشتیبانی می‌شدند، اما هیچ کنترل UI‌ای برایشان رندر نمی‌شد — یک کامنت
  // جاافتاده («فیلترها را همانند کد قبلی نگه دارید») به‌جای پیاده‌سازی
  // واقعی باقی مانده بود.
  const handleOnlineFilter = (online: OnlineFilter) => {
    setOnlineFilter(online);
    setFilters(prev => ({ ...prev, online: online === 'all' ? undefined : online, page: 1 }));
  };

  const handleConversationsFilter = (conversations: ConversationsFilter) => {
    setConversationsFilter(conversations);
    setFilters(prev => ({ ...prev, conversations: conversations === 'all' ? undefined : conversations, page: 1 }));
  };

  const handleSentimentFilter = (sentiment: SentimentFilter) => {
    setSentimentFilter(sentiment);
    setFilters(prev => ({ ...prev, sentiment: sentiment === 'all' ? undefined : sentiment, page: 1 }));
  };

  const handleReportsFilter = (reports: ReportsFilter) => {
    setReportsFilter(reports);
    setFilters(prev => ({ ...prev, reports: reports === 'all' ? undefined : reports, page: 1 }));
  };

  const activeFilterCount = [roleFilter, statusFilter, onlineFilter, conversationsFilter, sentimentFilter, reportsFilter]
    .filter(f => f !== 'all').length;

  const handleClearAllFilters = () => {
    setRoleFilter('all'); setStatusFilter('all'); setOnlineFilter('all');
    setConversationsFilter('all'); setSentimentFilter('all'); setReportsFilter('all');
    setSearchInput('');
    setFilters({ page: 1, per_page: 20, sort_by: 'created_at', sort_order: 'desc' });
  };

  const handleViewDetail = (user: AdminUser) => { setSelectedUser(user); setShowDetailModal(true); };
  const handleToggleStatus = (user: AdminUser) => { updateStatusMutation.mutate({ id: user.id, is_active: !user.is_active }); };
  const handleRejectSeller = (user: AdminUser) => { setShowRejectModal(user); };
  const handleConfirmReject = () => {
    if (!rejectReason.trim()) { toast.error('لطفاً دلیل رد را وارد کنید'); return; }
    if (showRejectModal) {
      rejectSellerMutation.mutate({ id: showRejectModal.id, reason: rejectReason });
    }
  };

  // ==================== Render ====================
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            مدیریت کاربران
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">مدیریت کاربران، فروشندگان و درخواست‌های فروشندگی</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" /> بروزرسانی
        </Button>
      </div>

      <ExportButton type="users" label="خروجی" filters={{ role: roleFilter !== 'all' ? roleFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined }} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setActiveTab('users')} className={cn('px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px', activeTab === 'users' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300')}>
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> کاربران {stats && <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">{stats.total}</span>}</span>
        </button>
        <button onClick={() => setActiveTab('requests')} className={cn('px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px', activeTab === 'requests' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300')}>
          <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> درخواست‌های فروشندگی {stats?.pending_sellers ? <span className="bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full text-xs">{stats.pending_sellers}</span> : null}</span>
        </button>
      </div>

      {/* ==================== Users Tab ==================== */}
      {activeTab === 'users' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatCard label="کل کاربران" value={stats?.total || 0} icon={Users} color="primary" />
            <StatCard label="مشتریان" value={stats?.customers || 0} icon={UserCheck} color="primary" />
            <StatCard label="فروشندگان" value={stats?.sellers || 0} icon={Store} color="success" />
            <StatCard label="مدیران" value={stats?.admins || 0} icon={Shield} color="error" />
            <StatCard label="در انتظار" value={stats?.pending_sellers || 0} icon={Clock} color="warning" />
            <StatCard label="فعال" value={stats?.active || 0} icon={CheckCircle} color="success" />
            <StatCard label="غیرفعال" value={stats?.inactive || 0} icon={XCircle} color="gray" />
            <StatCard label="امروز" value={stats?.today || 0} icon={Calendar} color="accent" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input type="text" placeholder="جستجو بر اساس نام، ایمیل، تلفن یا نام فروشگاه..." value={searchInput} onChange={(e) => handleSearch(e.target.value)} className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all" />
              </div>
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearAllFilters} className="gap-1.5">
                  <X className="w-4 h-4" /> پاک کردن فیلترها ({activeFilterCount})
                </Button>
              )}
            </div>

            {/* ✅ فیلترهای نقش/وضعیت/آنلاین/مکالمات/احساسات/گزارش‌ها — قبلاً
                این ۶ فیلتر state و handler داشتند و بکند کاملاً پشتیبانی
                می‌کرد، اما هیچ کنترل UI‌ای رندر نمی‌شد. */}
            <div className="flex flex-wrap gap-3">
              <FilterGroup label="نقش">
                {(['all', 'customer', 'seller', 'admin'] as RoleFilter[]).map((r) => (
                  <FilterPill key={r} active={roleFilter === r} onClick={() => handleRoleFilter(r)}>
                    {r === 'all' ? 'همه' : r === 'customer' ? 'مشتری' : r === 'seller' ? 'فروشنده' : 'مدیر'}
                  </FilterPill>
                ))}
              </FilterGroup>

              <FilterGroup label="وضعیت">
                {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
                  <FilterPill key={s} active={statusFilter === s} onClick={() => handleStatusFilter(s)}>
                    {s === 'all' ? 'همه' : s === 'active' ? 'فعال' : 'غیرفعال'}
                  </FilterPill>
                ))}
              </FilterGroup>

              <FilterGroup label="آنلاین بودن">
                {(['all', 'online', 'offline'] as OnlineFilter[]).map((o) => (
                  <FilterPill key={o} active={onlineFilter === o} onClick={() => handleOnlineFilter(o)}>
                    {o === 'all' ? 'همه' : o === 'online' ? 'آنلاین' : 'آفلاین'}
                  </FilterPill>
                ))}
              </FilterGroup>

              <FilterGroup label="تعداد مکالمات">
                {(['all', 'none', 'few', 'medium', 'many'] as ConversationsFilter[]).map((c) => (
                  <FilterPill key={c} active={conversationsFilter === c} onClick={() => handleConversationsFilter(c)}>
                    {c === 'all' ? 'همه' : c === 'none' ? 'بدون مکالمه' : c === 'few' ? 'کم (۱-۵)' : c === 'medium' ? 'متوسط (۶-۲۰)' : 'زیاد (۲۰+)'}
                  </FilterPill>
                ))}
              </FilterGroup>

              <FilterGroup label="احساسات">
                {(['all', 'positive', 'neutral', 'negative'] as SentimentFilter[]).map((s) => (
                  <FilterPill key={s} active={sentimentFilter === s} onClick={() => handleSentimentFilter(s)}>
                    {s !== 'all' && s !== 'neutral' && getSentimentIcon(s)}
                    {s === 'all' ? 'همه' : s === 'positive' ? 'مثبت' : s === 'neutral' ? 'خنثی' : 'منفی'}
                  </FilterPill>
                ))}
              </FilterGroup>

              <FilterGroup label="گزارش‌های تخلف">
                {(['all', 'none', 'few', 'many'] as ReportsFilter[]).map((r) => (
                  <FilterPill key={r} active={reportsFilter === r} onClick={() => handleReportsFilter(r)}>
                    {r === 'all' ? 'همه' : r === 'none' ? 'بدون گزارش' : r === 'few' ? 'کم (۱-۲)' : 'زیاد (۲+)'}
                  </FilterPill>
                ))}
              </FilterGroup>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}</div>
            ) : users.length === 0 ? (
              <EmptyState icon={<Users className="w-12 h-12" />} title="کاربری یافت نشد" description="با فیلترهای فعلی هیچ کاربری وجود ندارد" action={<Button onClick={handleClearAllFilters} variant="outline">پاک کردن فیلترها</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400">کاربر</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400">نقش</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400">وضعیت</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-400">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      const RoleIcon = roleInfo.icon;
                      return (
                        <tr key={user.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {user.avatar ? <SafeImage src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{user.name}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold', roleInfo.bg)}>
                              <RoleIcon className="w-3 h-3" /> {roleInfo.label}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <button onClick={() => handleToggleStatus(user)} disabled={updateStatusMutation.isPending} className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all', user.is_active ? 'bg-success-50 text-success-700 border-success-200' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700')}>
                              {user.is_active ? <><CheckCircle className="w-3 h-3" /> فعال</> : <><XCircle className="w-3 h-3" /> غیرفعال</>}
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleViewDetail(user)} className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="مشاهده جزئیات"><Eye className="w-4 h-4" /></button>
                              {/* ✅ «تایید به عنوان فروشنده» یک‌کلیکی حذف شد — تنها راه واقعی
                                  تبدیل به فروشنده، مسیر کامل تب «درخواست‌های فروشندگی» است. */}
                              {user.role === 'seller' && <button onClick={() => handleRejectSeller(user)} disabled={rejectSellerMutation.isPending} className="p-1.5 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 transition-colors" title="لغو فروشندگی"><ShieldAlert className="w-4 h-4" /></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ✅ صفحه‌بندی — قبلاً pagination از پاسخ بکند خوانده می‌شد اما
              هیچ‌جا رندر نمی‌شد؛ یعنی ادمین برای هر فروشگاهی با بیش از ۲۰
              کاربر، هیچ‌وقت نمی‌توانست فراتر از صفحه‌ی اول را ببیند. */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                disabled={pagination.current_page === 1}
              >
                قبلی
              </Button>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                صفحه {pagination.current_page} از {pagination.last_page} ({pagination.total} کاربر)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.last_page, (prev.page || 1) + 1) }))}
                disabled={pagination.current_page === pagination.last_page}
              >
                بعدی
              </Button>
            </div>
          )}
        </>
      )}

      {/* ==================== Requests Tab ==================== */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {requestsLoading ? (
            <div className="p-8 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-12 h-12" />} title="درخواست فروشندگی وجود ندارد" description="هنوز هیچ درخواستی برای فروشندگی ثبت نشده است" />
          ) : (
            <div className="p-4 space-y-4">
              {requests.map((request: any) => {
                const statusConfig = {
                  pending_initial: { color: 'warning', label: 'در انتظار تایید اولیه', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
                  pending_documents: { color: 'primary', label: 'در انتظار تکمیل مدارک', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
                  pending_final: { color: 'accent', label: 'مدارک ارسال شده (بررسی نهایی)', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
                  approved: { color: 'success', label: 'تایید شده و فعال', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
                  rejected: { color: 'error', label: 'رد شده', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
                  // ✅ بدون as const مقدار color به string عمومی widen می‌شد
                  // و با یونیون variant واقعی Badge جور نبود.
                } as const;
                const config = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending_initial;

                return (
                  <div key={request.id} className={cn("p-5 border rounded-xl transition-all", config.bg)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", request.status === 'approved' ? 'bg-gradient-to-br from-success-500 to-success-600' : request.status === 'rejected' ? 'bg-gradient-to-br from-error-500 to-error-600' : 'bg-gradient-to-br from-warning-500 to-warning-600')}>
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-gray-900 dark:text-gray-100">{request.shop_name || request.proposed_shop_name || 'نام فروشگاه ثبت نشده'}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" /> ثبت شده در: {new Date(request.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={config.color} size="sm" className="px-3 py-1">{config.label}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                      <DetailItem icon={User} label="نام متقاضی" value={request.user?.name || request.full_name || 'نامشخص'} />
                      <DetailItem icon={Hash} label="کد ملی" value={request.national_code || 'ثبت نشده'} />
                      <DetailItem icon={Phone} label="شماره تماس" value={request.phone || request.user?.phone || 'ثبت نشده'} />
                      <DetailItem icon={Store} label="نام فروشگاه" value={request.shop_name || request.proposed_shop_name || 'ثبت نشده'} />
                      {request.id_card_image && <DetailItem icon={FileText} label="کارت ملی" value="✅ آپلود شده" />}
                      {request.business_license_image && <DetailItem icon={FileText} label="جواز کسب" value="✅ آپلود شده" />}
                    </div>

                    {/* ✅ دکمه واحد برای باز کردن مودال بررسی */}
                    {(request.status === 'pending_initial' || request.status === 'pending_final') && (
                      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button size="sm" variant="default" className="gap-2 shadow-lg shadow-primary-500/20" onClick={() => { setSelectedRequest(request); setShowRequestModal(true); }}>
                          <Eye className="w-4 h-4" /> بررسی مدارک و اقدام
                        </Button>
                      </div>
                    )}
                    
                    {request.status === 'pending_documents' && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Clock className="w-4 h-4 animate-pulse" /> در انتظار آپلود مدارک توسط فروشنده
                      </p>
                    )}

                    {request.status === 'approved' && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-bold flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <CheckCircle className="w-4 h-4" /> شعبه با موفقیت افتتاح شده است
                      </p>
                    )}

                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">دلیل رد:</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{request.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== Modals ==================== */}
      {showDetailModal && selectedUser && <UserDetailModal user={selectedUser} onClose={() => { setShowDetailModal(false); setSelectedUser(null); }} />}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-l from-error-50/50 to-white dark:from-error-900/10 dark:to-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-error-600" /> لغو فروشندگی</h3>
              <button onClick={() => { setShowRejectModal(null); setRejectReason(''); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-800"><strong>{showRejectModal.name}</strong> از حالت فروشنده خارج شده و به مشتری تبدیل می‌شود.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">دلیل لغو فروشندگی <span className="text-error-500">*</span></label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="دلیل را وارد کنید..." rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-error-500 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <Button variant="outline" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>انصراف</Button>
              <Button variant="destructive" onClick={handleConfirmReject} disabled={rejectSellerMutation.isPending} isLoading={rejectSellerMutation.isPending} className="gap-1.5"><ShieldAlert className="w-4 h-4" /> لغو فروشندگی</Button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ مودال جدید بررسی درخواست فروشندگی — قبلاً این مودال به‌جای
          استفاده از initialApproveMutation/finalApproveMutation/
          rejectRequestMutation (که در بالا تعریف شده بودند)، منطق
          تکراری خودش را با .then()/.catch() مستقیم صدا می‌زد؛ یعنی هیچ
          isPending‌ای برای غیرفعال‌کردن دکمه در حین درخواست وجود نداشت و
          کاربر می‌توانست با کلیک مکرر یک درخواست تایید/رد را چند بار ارسال
          کند. حالا از همان mutationهای واقعی parent استفاده می‌کند. */}
      {showRequestModal && selectedRequest && (
        <SellerRequestDetailModal
          request={selectedRequest}
          onClose={() => { setShowRequestModal(false); setSelectedRequest(null); }}
          onInitialApprove={() => initialApproveMutation.mutate(selectedRequest.id)}
          isInitialApproving={initialApproveMutation.isPending}
          onFinalApprove={() => finalApproveMutation.mutate(selectedRequest.id)}
          isFinalApproving={finalApproveMutation.isPending}
          onReject={(reason) => rejectRequestMutation.mutate({ id: selectedRequest.id, reason })}
          isSubmittingReject={rejectRequestMutation.isPending}
        />
      )}
    </div>
  );
}

// ==================== Sub Components ====================

// ✅ کامپوننت‌های فیلتر جدید — قبلاً roleFilter/statusFilter و ۴ فیلتر
// پیشرفته‌ی دیگر (آنلاین/مکالمات/احساسات/گزارش‌ها) هیچ کنترل UI‌ای نداشتند
// با اینکه بکند کاملاً پشتیبانی‌شان می‌کرد.
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{label}:</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1',
        active
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      )}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray' }) {
  const colors = {
    primary: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30',
    success: 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30',
    error: 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/30',
    warning: 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/30',
    accent: 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30',
    gray: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2"><div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors[color])}><Icon className="w-4 h-4" /></div></div>
      <p className="text-xl font-black text-gray-900 dark:text-gray-100">{value.toLocaleString('fa-IR')}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700/50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon className="w-4 h-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate dir-ltr text-left" title={value}>{value}</p>
      </div>
    </div>
  );
}

// ✅ کامپوننت InfoCard اصلاح‌شده و ضدخطا
function InfoCard({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        {/* ✅ فقط اگر آیکون وجود داشت آن را رندر کن */}
        {Icon && <Icon className="w-4 h-4 text-primary-600 flex-shrink-0" />}
        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;
  const badgeInfo = getBadgeInfo(user.seller_badge);
  const BadgeIcon = badgeInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-l from-primary-50/50 to-white dark:from-primary-900/10 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl">
              {user.avatar ? <SafeImage src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
              {/* ✅ وضعیت آنلاین/آفلاین واقعی (is_online) قبلاً هیچ‌جای این
                  مودال نمایش داده نمی‌شد با اینکه بکند محاسبه‌اش می‌کرد. */}
              {user.is_online !== undefined && (
                <span
                  className={cn(
                    'absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800',
                    user.is_online ? 'bg-success-500' : 'bg-gray-400 dark:bg-gray-600'
                  )}
                  title={user.is_online ? 'آنلاین' : 'آفلاین'}
                />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">{user.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="نقش" value={<span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold', roleInfo.bg)}><RoleIcon className="w-3 h-3" /> {roleInfo.label}</span>} />
            <InfoCard label="وضعیت" value={<Badge variant={user.is_active ? 'success' : 'gray'} size="sm">{user.is_active ? 'فعال' : 'غیرفعال'}</Badge>} />
            <InfoCard label="وضعیت آنلاین" value={user.is_online ? 'آنلاین' : 'آفلاین'} />
            <InfoCard label="تاریخ عضویت" value={new Date(user.created_at).toLocaleDateString('fa-IR')} icon={Calendar} />
            {user.phone && <InfoCard label="شماره تماس" value={user.phone} icon={Phone} />}
            {user.national_code && <InfoCard label="کد ملی" value={user.national_code} icon={Hash} />}
            {/* ✅ آمار فروشندگی (نشان، امتیاز، فروش، محصولات) قبلاً هیچ‌جای
                این مودال نمایش داده نمی‌شد با اینکه بکند این مقادیر را
                واقعاً محاسبه و برمی‌گرداند. */}
            {user.role === 'seller' && (
              <>
                <InfoCard
                  label="نشان فروشنده"
                  value={<span className="flex items-center gap-1"><BadgeIcon className="w-3.5 h-3.5" /> {badgeInfo.label}</span>}
                />
                <InfoCard
                  label="امتیاز فروشنده"
                  value={<span className="flex items-center gap-0.5">{getRatingStars(user.seller_rating)}</span>}
                />
                <InfoCard label="کل فروش" value={formatPrice(user.total_sales || 0)} icon={DollarSign} />
                <InfoCard label="تعداد محصولات" value={String(user.products_count || 0)} icon={Package} />
              </>
            )}
            {/* ✅ احساسات مکالمات و تعداد گزارش‌های تخلف نیز قبلاً محاسبه
                می‌شدند ولی هیچ‌جا نمایش داده نمی‌شدند. */}
            {user.sentiment_label && (
              <InfoCard
                label="احساس مکالمات"
                value={<span className="flex items-center gap-1">{getSentimentIcon(user.sentiment_label)} {user.sentiment_label === 'positive' ? 'مثبت' : user.sentiment_label === 'negative' ? 'منفی' : 'خنثی'}</span>}
              />
            )}
            {typeof user.report_count === 'number' && user.report_count > 0 && (
              <InfoCard
                label="گزارش‌های تخلف"
                value={<span className="text-error-600 dark:text-error-400 font-black">{user.report_count}</span>}
                icon={Flag}
              />
            )}
          </div>

          {/* 💹 سیستم کمیسیون هوشمند: امتیاز عملکرد، سطح، نرخ فعلی و override دستی */}
          {user.role === 'seller' && <SellerCommissionSection sellerId={user.id} />}
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <Button variant="outline" onClick={onClose}>بستن</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ بخش جدید: نمایش امتیاز عملکرد/سطح/نرخ فعلی کمیسیون یک فروشنده، و
 * فرم تنظیم/پاک‌کردن override دستی. قبلاً هیچ نشانه‌ای از نرخ واقعی
 * کمیسیون یا امتیاز عملکرد در پنل ادمین دیده نمی‌شد — نرخ هاردکد ۵٪ در
 * بک‌اند بود و هیچ ادمینی راهی برای دیدن/تغییرش نداشت.
 */
function SellerCommissionSection({ sellerId }: { sellerId: number }) {
  const queryClient = useQueryClient();
  const [overrideInput, setOverrideInput] = useState('');
  const [isEditingOverride, setIsEditingOverride] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'seller-commission', sellerId],
    queryFn: () => adminUserService.getSellerCommission(sellerId),
  });

  const overrideMutation = useMutation({
    mutationFn: (rate: number | null) => adminUserService.setSellerCommissionOverride(sellerId, rate),
    onSuccess: () => {
      toast.success('کمیسیون فروشنده به‌روزرسانی شد');
      queryClient.invalidateQueries({ queryKey: ['admin', 'seller-commission', sellerId] });
      setIsEditingOverride(false);
    },
    onError: () => toast.error('خطا در ثبت کمیسیون'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const info = data?.data;
  if (!info) return null;

  const sourceLabel = {
    override: 'Override دستی',
    score_rule: 'بر اساس امتیاز عملکرد',
    default: 'نرخ پیش‌فرض',
  }[info.current_source];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
        <Percent className="w-4 h-4 text-primary-600" /> سیستم کمیسیون هوشمند
      </h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard label="نرخ کمیسیون فعلی" value={`${info.current_rate}%`} />
        <InfoCard label="منبع نرخ" value={sourceLabel} />
        <InfoCard label="امتیاز عملکرد" value={info.score.is_new_seller ? 'فروشنده جدید' : info.score.value.toFixed(1)} />
        <InfoCard label="سطح" value={info.current_level ? getBadgeInfo(info.current_level).label : '—'} />
      </div>

      {!info.score.is_new_seller && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <MiniStat label="رتبه مشتریان" value={info.score.breakdown.rating} />
          <MiniStat label="نرخ موفقیت" value={info.score.breakdown.success_rate} />
          <MiniStat label="عدم لغو" value={info.score.breakdown.cancellation} />
          <MiniStat label="کیفیت" value={info.score.breakdown.quality} />
          <MiniStat label="قابلیت‌اطمینان" value={info.score.breakdown.reliability} />
        </div>
      )}

      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
        {!isEditingOverride ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {info.override_rate !== null
                ? `Override دستی فعال: ${info.override_rate}%`
                : 'بدون Override — نرخ بر اساس امتیاز عملکرد محاسبه می‌شود.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setOverrideInput(info.override_rate !== null ? String(info.override_rate) : ''); setIsEditingOverride(true); }}
            >
              تنظیم Override
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={overrideInput}
              onChange={(e) => setOverrideInput(e.target.value)}
              placeholder="مثلاً 3.5"
              className="w-28 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
            <Button
              size="sm"
              variant="default"
              disabled={overrideMutation.isPending}
              onClick={() => overrideMutation.mutate(overrideInput === '' ? null : parseFloat(overrideInput))}
            >
              ذخیره
            </Button>
            {info.override_rate !== null && (
              <Button
                size="sm"
                variant="outline"
                disabled={overrideMutation.isPending}
                onClick={() => overrideMutation.mutate(null)}
              >
                پاک‌کردن Override
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setIsEditingOverride(false)}>انصراف</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 text-center">
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-bold text-gray-900 dark:text-gray-100">{value.toFixed(0)}</p>
    </div>
  );
}

// ✅ کامپوننت مودال بررسی درخواست فروشندگی (اصلاح شده و بدون تکرار)
function SellerRequestDetailModal({
  request,
  onClose,
  onInitialApprove,
  isInitialApproving,
  onFinalApprove,
  isFinalApproving,
  onReject,
  isSubmittingReject,
}: {
  request: any;
  onClose: () => void;
  onInitialApprove: () => void;
  isInitialApproving: boolean;
  onFinalApprove: () => void;
  isFinalApproving: boolean;
  onReject: (reason: string) => void;
  isSubmittingReject: boolean;
}) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // ✅ تابع کمکی برای تبدیل مسیر نسبی دیتابیس به آدرس کامل (فقط یک بار تعریف شده است)
  const getImageUrl = (path: string | null | undefined) => {
    // ✅ فقط در href/src استفاده می‌شود که string|undefined می‌خواهند نه
    // string|null (تمام فراخوانی‌ها هم پشت `request.xxx_image ?` گارد شده‌اند).
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${STORAGE_URL}/${path}`;
  };

  const handleInitialApprove = () => {
    if (window.confirm('آیا از تایید اولیه و ارسال نوتیفیکیشن برای تکمیل مدارک مطمئن هستید؟')) {
      onInitialApprove();
    }
  };

  const handleFinalApprove = () => {
    if (window.confirm('آیا از تایید نهایی مدارک و افتتاح شعبه مطمئن هستید؟')) {
      onFinalApprove();
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error('لطفاً دلیل رد را وارد کنید'); return; }
    onReject(rejectReason);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-l from-primary-50/50 to-white dark:from-primary-900/10 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">{request.shop_name || request.proposed_shop_name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">متقاضی: {request.user?.name || request.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label="کد ملی" value={request.national_code || 'ثبت نشده'} icon={Hash} />
            <InfoCard label="شماره تماس" value={request.phone || request.user?.phone || 'ثبت نشده'} icon={Phone} />
            <InfoCard label="شماره حساب/شبا" value={request.bank_account || 'ثبت نشده'} icon={CreditCard} />
            <InfoCard label="تاریخ ثبت" value={new Date(request.created_at).toLocaleDateString('fa-IR')} icon={Calendar} />
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" /> مدارک بارگذاری شده
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* نمایش تصویر کارت ملی */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">تصویر کارت ملی</p>
                {request.id_card_image ? (
                  <a href={getImageUrl(request.id_card_image)} target="_blank" rel="noopener noreferrer" className="block group">
                    <img 
                      src={getImageUrl(request.id_card_image)} 
                      alt="کارت ملی" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-primary-500 transition-all cursor-zoom-in"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=خطا+در+بارگذاری+تصویر'; 
                      }}
                    />
                    <p className="text-[10px] text-center text-primary-600 mt-1 group-hover:underline">برای بزرگنمایی کلیک کنید</p>
                  </a>
                ) : (
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">بارگذاری نشده</div>
                )}
              </div>

              {/* نمایش تصویر جواز کسب */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">جواز کسب / مجوز فعالیت</p>
                {request.business_license_image ? (
                  <a href={getImageUrl(request.business_license_image)} target="_blank" rel="noopener noreferrer" className="block group">
                    <img 
                      src={getImageUrl(request.business_license_image)} 
                      alt="جواز کسب" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-primary-500 transition-all cursor-zoom-in"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=خطا+در+بارگذاری+تصویر'; 
                      }}
                    />
                    <p className="text-[10px] text-center text-primary-600 mt-1 group-hover:underline">برای بزرگنمایی کلیک کنید</p>
                  </a>
                ) : (
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">بارگذاری نشده (اختیاری)</div>
                )}
              </div>
            </div>
          </div>

          {isRejecting && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl space-y-3 animate-fade-in">
              <label className="block text-sm font-bold text-red-800">دلیل رد درخواست (الزامی):</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="مثال: تصویر کارت ملی ناخوانا است..." rows={3} className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-none" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setIsRejecting(false); setRejectReason(''); }} disabled={isSubmittingReject}>انصراف</Button>
                <Button variant="destructive" size="sm" onClick={handleReject} disabled={!rejectReason.trim() || isSubmittingReject} isLoading={isSubmittingReject}>ثبت رد درخواست</Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isRejecting && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <Button variant="outline" onClick={onClose}>بستن</Button>
            {request.status === 'pending_initial' && (
              <Button variant="default" onClick={handleInitialApprove} disabled={isInitialApproving} isLoading={isInitialApproving} className="gap-2">
                <CheckCircle className="w-4 h-4" /> تایید اولیه و درخواست مدارک
              </Button>
            )}
            {request.status === 'pending_final' && (
              <>
                <Button variant="destructive" onClick={() => setIsRejecting(true)} disabled={isFinalApproving} className="gap-2">
                  <XCircle className="w-4 h-4" /> رد درخواست
                </Button>
                <Button variant="success" onClick={handleFinalApprove} disabled={isFinalApproving} isLoading={isFinalApproving} className="gap-2 shadow-lg shadow-success-500/20">
                  <CheckCircle className="w-4 h-4" /> تایید نهایی و افتتاح شعبه
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminUsersPage;
