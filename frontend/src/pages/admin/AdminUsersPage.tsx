import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, Eye, Edit2, Shield, ShieldCheck, ShieldAlert,
  X, ChevronLeft, ChevronRight, Package, DollarSign, Calendar,
  Mail, Phone, Star, Award, TrendingUp, RefreshCw, Store,
  CheckCircle, XCircle, Ban, UserCheck, UserX, Clock,
  MessageSquare, FileText, Filter, Download, MoreVertical,
  Crown, Medal, Gem, Smile, Meh, Frown, MessageCircle, Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  adminUserService,
  type AdminUser,
  type UserFilters,
  type SellerRequest,
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
    customer: { label: 'مشتری', color: 'primary', icon: Users, bg: 'bg-primary-50 text-primary-700 border-primary-200' },
    seller: { label: 'فروشنده', color: 'success', icon: Store, bg: 'bg-success-50 text-success-700 border-success-200' },
    admin: { label: 'مدیر', color: 'error', icon: Shield, bg: 'bg-error-50 text-error-700 border-error-200' },
    pending_seller: { label: 'درخواست فروشنده', color: 'warning', icon: Clock, bg: 'bg-warning-50 text-warning-700 border-warning-200' },
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
      stars.push(<Star key={i} className="w-3 h-3 text-gray-300" />);
    }
  }
  return stars;
};

const getSentimentIcon = (label?: string) => {
  if (label === 'positive') return <Smile className="w-4 h-4 text-green-600" />;
  if (label === 'negative') return <Frown className="w-4 h-4 text-red-600" />;
  return <Meh className="w-4 h-4 text-gray-600" />;
};

// ✅ تابع کمکی برای تبدیل به عدد
const toNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// ==================== Main Component ====================

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // 🆕 فیلترهای جدید
  const [onlineFilter, setOnlineFilter] = useState<OnlineFilter>('all');
  const [conversationsFilter, setConversationsFilter] = useState<ConversationsFilter>('all');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [reportsFilter, setReportsFilter] = useState<ReportsFilter>('all');

  // Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ==================== Queries ====================

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => adminUserService.getUsers(filters),
    keepPreviousData: true,
  });

  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['admin-seller-requests'],
    queryFn: () => adminUserService.getSellerRequests(),
    enabled: activeTab === 'requests',
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;
  const stats = data?.data?.stats;
  const requests = requestsData?.data?.requests || [];

  // ==================== Mutations ====================

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminUserService.updateStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('وضعیت کاربر تغییر کرد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminUserService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('نقش کاربر تغییر کرد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در تغییر نقش'),
  });

  const approveSellerMutation = useMutation({
    mutationFn: (id: number) => adminUserService.approveSeller(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
      toast.success('فروشنده تایید شد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در تایید فروشنده'),
  });

  const rejectSellerMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminUserService.rejectSeller(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('فروشنده رد شد', { icon: '✅' });
      setShowRejectModal(null);
      setRejectReason('');
    },
    onError: () => toast.error('خطا در رد فروشنده'),
  });

  const approveRequestMutation = useMutation({
    mutationFn: (id: number) => adminUserService.approveSellerRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('درخواست تایید شد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در تایید درخواست'),
  });

  const rejectRequestMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminUserService.rejectSellerRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
      toast.success('درخواست رد شد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در رد درخواست'),
  });

  // ==================== Handlers ====================

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 500);
    return () => clearTimeout(timeout);
  };

  const handleRoleFilter = (role: RoleFilter) => {
    setRoleFilter(role);
    setFilters(prev => ({
      ...prev,
      role: role === 'all' ? undefined : role,
      page: 1,
    }));
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setFilters(prev => ({
      ...prev,
      is_active: status === 'all' ? undefined : status === 'active',
      page: 1,
    }));
  };

  const handleOnlineFilter = (value: OnlineFilter) => {
    setOnlineFilter(value);
    setFilters(prev => ({
      ...prev,
      online: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  const handleConversationsFilter = (value: ConversationsFilter) => {
    setConversationsFilter(value);
    setFilters(prev => ({
      ...prev,
      conversations: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  const handleSentimentFilter = (value: SentimentFilter) => {
    setSentimentFilter(value);
    setFilters(prev => ({
      ...prev,
      sentiment: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  const handleReportsFilter = (value: ReportsFilter) => {
    setReportsFilter(value);
    setFilters(prev => ({
      ...prev,
      reports: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  const handleClearAllFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
    setOnlineFilter('all');
    setConversationsFilter('all');
    setSentimentFilter('all');
    setReportsFilter('all');
    setSearchInput('');
    setFilters({ page: 1, per_page: 20, sort_by: 'created_at', sort_order: 'desc' });
  };

  const handleViewDetail = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleToggleStatus = (user: AdminUser) => {
    updateStatusMutation.mutate({
      id: user.id,
      is_active: !user.is_active,
    });
  };

  const handleApproveSeller = (user: AdminUser) => {
    if (window.confirm(`آیا از تایید "${user.name}" به عنوان فروشنده مطمئن هستید؟`)) {
      approveSellerMutation.mutate(user.id);
    }
  };

  const handleRejectSeller = (user: AdminUser) => {
    setShowRejectModal(user);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('لطفاً دلیل رد را وارد کنید');
      return;
    }
    if (showRejectModal) {
      rejectSellerMutation.mutate({
        id: showRejectModal.id,
        reason: rejectReason,
      });
    }
  };

  // ==================== Render ====================

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            مدیریت کاربران
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            مدیریت کاربران، فروشندگان و درخواست‌های فروشندگی
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </Button>
      </div>
<ExportButton 
  type="users" 
  label="خروجی" 
  filters={{
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }}
/>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px',
            activeTab === 'users'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            کاربران
            {stats && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {stats.total}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            'px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px',
            activeTab === 'requests'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            درخواست‌های فروشندگی
            {stats?.pending_sellers ? (
              <span className="bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full text-xs">
                {stats.pending_sellers}
              </span>
            ) : null}
          </span>
        </button>
      </div>

      {/* ==================== Users Tab ==================== */}
      {activeTab === 'users' && (
        <>
          {/* Stats Cards */}
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

          {/* Search & Filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام، ایمیل، تلفن یا نام فروشگاه..."
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="gap-1.5"
              >
                <X className="w-4 h-4" />
                پاک کردن فیلترها
              </Button>
            </div>

            {/* Role Filter */}
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 px-2">
                <Filter className="w-3.5 h-3.5" />
                نقش:
              </span>
              {[
                { value: 'all', label: 'همه', icon: Users },
                { value: 'customer', label: 'مشتریان', icon: UserCheck },
                { value: 'seller', label: 'فروشندگان', icon: Store },
                { value: 'admin', label: 'مدیران', icon: Shield },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    onClick={() => handleRoleFilter(item.value as RoleFilter)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                      roleFilter === item.value
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Status Filter */}
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 px-2">
                <Filter className="w-3.5 h-3.5" />
                وضعیت:
              </span>
              {[
                { value: 'all', label: 'همه', icon: Users },
                { value: 'active', label: 'فعال', icon: CheckCircle },
                { value: 'inactive', label: 'غیرفعال', icon: XCircle },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    onClick={() => handleStatusFilter(item.value as StatusFilter)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                      statusFilter === item.value
                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* 🆕 Advanced Filters */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                فیلترهای پیشرفته:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select
                  value={onlineFilter}
                  onChange={(e) => handleOnlineFilter(e.target.value as OnlineFilter)}
                  className={cn(
                    'px-3 py-2 border rounded-lg text-xs font-bold focus:outline-none focus:border-primary-500',
                    onlineFilter !== 'all' ? 'border-green-400 bg-green-50' : 'border-gray-200'
                  )}
                >
                  <option value="all">🟢 آنلاین: همه</option>
                  <option value="online">🟢 آنلاین</option>
                  <option value="offline">⚫ آفلاین</option>
                </select>

                <select
                  value={conversationsFilter}
                  onChange={(e) => handleConversationsFilter(e.target.value as ConversationsFilter)}
                  className={cn(
                    'px-3 py-2 border rounded-lg text-xs font-bold focus:outline-none focus:border-primary-500',
                    conversationsFilter !== 'all' ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  )}
                >
                  <option value="all">💬 مکالمات: همه</option>
                  <option value="none">بدون مکالمه</option>
                  <option value="few">۱-۵ مکالمه</option>
                  <option value="medium">۶-۲۰ مکالمه</option>
                  <option value="many">بیش از ۲۰</option>
                </select>

                <select
                  value={sentimentFilter}
                  onChange={(e) => handleSentimentFilter(e.target.value as SentimentFilter)}
                  className={cn(
                    'px-3 py-2 border rounded-lg text-xs font-bold focus:outline-none focus:border-primary-500',
                    sentimentFilter !== 'all' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                  )}
                >
                  <option value="all">🧠 احساسات: همه</option>
                  <option value="positive">😊 مثبت</option>
                  <option value="neutral">😐 خنثی</option>
                  <option value="negative">😞 منفی</option>
                </select>

                <select
                  value={reportsFilter}
                  onChange={(e) => handleReportsFilter(e.target.value as ReportsFilter)}
                  className={cn(
                    'px-3 py-2 border rounded-lg text-xs font-bold focus:outline-none focus:border-primary-500',
                    reportsFilter !== 'all' ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  )}
                >
                  <option value="all">🚩 گزارش‌ها: همه</option>
                  <option value="none">بدون گزارش</option>
                  <option value="few">۱-۲ گزارش</option>
                  <option value="many">بیش از ۲ گزارش</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                icon={<Users className="w-12 h-12" />}
                title="کاربری یافت نشد"
                description="با فیلترهای فعلی هیچ کاربری وجود ندارد"
                action={
                  <Button onClick={handleClearAllFilters} variant="outline">
                    پاک کردن فیلترها
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">کاربر</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">نقش</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">🟢 آنلاین</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">💬 مکالمات</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">🧠 احساسات</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">🚩 گزارش‌ها</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">امتیاز</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">نشان</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">فروش کل</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">وضعیت</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">عضویت</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-600">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      const badgeInfo = getBadgeInfo(user.seller_badge);
                      const RoleIcon = roleInfo.icon;
                      const BadgeIcon = badgeInfo.icon;
                      const ratingNum = toNumber(user.seller_rating);

                      return (
                        <tr
                          key={user.id}
                          className={cn(
                            'border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
                            user.report_count && user.report_count > 2 && 'bg-red-50/30',
                            user.is_online && 'bg-green-50/20'
                          )}
                        >
                          {/* User Info */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                  {user.avatar ? (
                                    <SafeImage src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    user.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                {user.is_online && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 line-clamp-1">
                                  {user.name}
                                </p>
                                <p className="text-[10px] text-gray-500 line-clamp-1 flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" />
                                  {user.email}
                                </p>
                                {user.shop_name && (
                                  <p className="text-[10px] text-accent-600 line-clamp-1 flex items-center gap-1 mt-0.5">
                                    <Store className="w-2.5 h-2.5" />
                                    {user.shop_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-3 py-3">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold',
                              roleInfo.bg
                            )}>
                              <RoleIcon className="w-3 h-3" />
                              {roleInfo.label}
                            </span>
                          </td>

                          {/* Online Status */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className={cn(
                                'w-2 h-2 rounded-full',
                                user.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                              )} />
                              <span className={cn(
                                'text-xs font-bold',
                                user.is_online ? 'text-green-600' : 'text-gray-500'
                              )}>
                                {user.is_online ? 'آنلاین' : 'آفلاین'}
                              </span>
                            </div>
                          </td>

                          {/* Conversations */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-sm font-bold text-gray-900">
                                {toNumber(user.total_conversations)}
                              </span>
                            </div>
                          </td>

                          {/* Sentiment */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              {getSentimentIcon(user.sentiment_label)}
                              <span className={cn(
                                'text-xs font-bold',
                                user.sentiment_label === 'positive' ? 'text-green-600' :
                                user.sentiment_label === 'negative' ? 'text-red-600' :
                                'text-gray-600'
                              )}>
                                {toNumber(user.sentiment_score).toFixed(2)}
                              </span>
                            </div>
                          </td>

                          {/* Reports */}
                          <td className="px-3 py-3">
                            {user.report_count && user.report_count > 0 ? (
                              <div className="flex items-center gap-1">
                                <Flag className="w-3.5 h-3.5 text-red-500" />
                                <Badge 
                                  variant={user.report_count > 2 ? 'error' : 'warning'} 
                                  size="sm"
                                >
                                  {user.report_count}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>

                          {/* Rating */}
                          <td className="px-3 py-3">
                            {(user.role === 'seller' || user.role === 'admin') ? (
                              <div className="flex items-center gap-1">
                                <div className="flex">{getRatingStars(user.seller_rating)}</div>
                                <span className="text-xs font-bold text-gray-700">
                                  {ratingNum.toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>

                          {/* Badge */}
                          <td className="px-3 py-3">
                            {user.role === 'seller' && user.seller_badge !== 'none' ? (
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold',
                                user.seller_badge === 'gold' && 'bg-warning-100 text-warning-700',
                                user.seller_badge === 'silver' && 'bg-gray-100 text-gray-700',
                                user.seller_badge === 'bronze' && 'bg-amber-100 text-amber-700',
                                user.seller_badge === 'platinum' && 'bg-accent-100 text-accent-700',
                              )}>
                                <BadgeIcon className="w-3 h-3" />
                                {badgeInfo.label}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>

                          {/* Total Sales */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm font-bold text-gray-700">
                                {formatPrice(toNumber(user.total_sales))}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={updateStatusMutation.isPending}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all',
                                user.is_active
                                  ? 'bg-success-50 text-success-700 border-success-200 hover:bg-success-100'
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              )}
                            >
                              {user.is_active ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  فعال
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  غیرفعال
                                </>
                              )}
                            </button>
                          </td>

                          {/* Join Date */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-700">
                                {new Date(user.created_at).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewDetail(user)}
                                className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
                                title="مشاهده جزئیات"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {user.role === 'customer' && (
                                <button
                                  onClick={() => handleApproveSeller(user)}
                                  disabled={approveSellerMutation.isPending}
                                  className="p-1.5 hover:bg-success-50 rounded-lg text-gray-500 hover:text-success-600 transition-colors"
                                  title="تایید به عنوان فروشنده"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}
                              {user.role === 'seller' && (
                                <button
                                  onClick={() => handleRejectSeller(user)}
                                  disabled={rejectSellerMutation.isPending}
                                  className="p-1.5 hover:bg-error-50 rounded-lg text-gray-500 hover:text-error-600 transition-colors"
                                  title="لغو فروشندگی"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleStatus(user)}
                                disabled={updateStatusMutation.isPending}
                                className={cn(
                                  'p-1.5 rounded-lg transition-colors',
                                  user.is_active
                                    ? 'hover:bg-warning-50 text-gray-500 hover:text-warning-600'
                                    : 'hover:bg-success-50 text-gray-500 hover:text-success-600'
                                )}
                                title={user.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                              >
                                {user.is_active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-500">
                  نمایش {(pagination.current_page - 1) * pagination.per_page + 1} تا{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} از{' '}
                  <span className="font-bold text-gray-900">{pagination.total}</span> کاربر
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                    disabled={pagination.current_page === 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="px-3 text-xs font-bold text-gray-700">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.last_page, prev.page! + 1) }))}
                    disabled={pagination.current_page === pagination.last_page}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== Requests Tab ==================== */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {requestsLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12" />}
              title="درخواست فروشندگی وجود ندارد"
              description="هنوز هیچ درخواستی برای فروشندگی ثبت نشده است"
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-gray-900">{request.shop_name}</h4>
                          <Badge
                            variant={
                              request.status === 'pending' ? 'warning' :
                              request.status === 'approved' ? 'success' : 'error'
                            }
                            size="sm"
                          >
                            {request.status === 'pending' ? 'در انتظار' :
                             request.status === 'approved' ? 'تایید شده' : 'رد شده'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{request.user.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{request.user.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{request.phone}</span>
                          </div>
                        </div>
                        {request.description && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            {request.description}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(request.created_at).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => approveRequestMutation.mutate(request.id)}
                          disabled={approveRequestMutation.isPending}
                          className="gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          تایید
                        </Button>
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => {
                            const reason = prompt('دلیل رد درخواست:');
                            if (reason) {
                              rejectRequestMutation.mutate({ id: request.id, reason });
                            }
                          }}
                          disabled={rejectRequestMutation.isPending}
                          className="gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          رد
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== User Detail Modal ==================== */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* ==================== Reject Modal ==================== */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-error-50/50 to-white">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-error-600" />
                لغو فروشندگی
              </h3>
              <button onClick={() => { setShowRejectModal(null); setRejectReason(''); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-800">
                  <strong>{showRejectModal.name}</strong> از حالت فروشنده خارج شده و به مشتری تبدیل می‌شود.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  دلیل لغو فروشندگی <span className="text-error-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="دلیل را وارد کنید..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-error-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
              <Button variant="outline" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>
                انصراف
              </Button>
              <Button
                variant="error"
                onClick={handleConfirmReject}
                disabled={rejectSellerMutation.isPending}
                isLoading={rejectSellerMutation.isPending}
                className="gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                لغو فروشندگی
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Sub Components ====================

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: any;
  color: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray';
}) {
  const colors = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    error: 'text-error-600 bg-error-50',
    warning: 'text-warning-600 bg-warning-50',
    accent: 'text-accent-600 bg-accent-50',
    gray: 'text-gray-600 bg-gray-50',
  };

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-black text-gray-900">{value.toLocaleString('fa-IR')}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const roleInfo = getRoleInfo(user.role);
  const badgeInfo = getBadgeInfo(user.seller_badge);
  const RoleIcon = roleInfo.icon;
  const ratingNum = toNumber(user.seller_rating);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl">
                {user.avatar ? (
                  <SafeImage src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              {user.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                {user.name}
                {user.is_online && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    آنلاین
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Role & Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard
              label="نقش"
              value={
                <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold', roleInfo.bg)}>
                  <RoleIcon className="w-3 h-3" />
                  {roleInfo.label}
                </span>
              }
            />
            <InfoCard
              label="وضعیت"
              value={
                <Badge variant={user.is_active ? 'success' : 'gray'} size="sm">
                  {user.is_active ? 'فعال' : 'غیرفعال'}
                </Badge>
              }
            />
            <InfoCard
              label="امتیاز"
              value={
                <div className="flex items-center gap-1">
                  <div className="flex">{getRatingStars(user.seller_rating)}</div>
                  <span className="text-xs font-bold">{ratingNum.toFixed(1)}</span>
                </div>
              }
            />
            <InfoCard
              label="نشان"
              value={
                user.seller_badge !== 'none' ? (
                  <span className="text-xs font-bold">{badgeInfo.label}</span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )
              }
            />
          </div>

          {/* Chat & Sentiment Stats */}
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-600" />
              آمار چت و احساسات
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] text-gray-500">مکالمات</p>
                <p className="text-lg font-black text-blue-600">{toNumber(user.total_conversations)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] text-gray-500">احساسات</p>
                <div className="flex items-center gap-1 mt-1">
                  {getSentimentIcon(user.sentiment_label)}
                  <p className={cn(
                    'text-lg font-black',
                    user.sentiment_label === 'positive' ? 'text-green-600' :
                    user.sentiment_label === 'negative' ? 'text-red-600' :
                    'text-gray-600'
                  )}>
                    {toNumber(user.sentiment_score).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] text-gray-500">گزارش‌ها</p>
                <p className={cn(
                  'text-lg font-black',
                  (user.report_count || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                )}>
                  {user.report_count || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary-600" />
              اطلاعات تماس
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-500">ایمیل</p>
                  <p className="text-sm font-bold text-gray-900">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-500">تلفن</p>
                    <p className="text-sm font-bold text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
              {user.shop_name && (
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-500">نام فروشگاه</p>
                    <p className="text-sm font-bold text-gray-900">{user.shop_name}</p>
                  </div>
                </div>
              )}
              {user.national_code && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-500">کد ملی</p>
                    <p className="text-sm font-bold text-gray-900">{user.national_code}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seller Stats */}
          {user.role === 'seller' && (
            <div className="bg-gradient-to-br from-success-50 to-white rounded-xl p-4 border border-success-100">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success-600" />
                آمار فروشندگی
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-500">محصولات</p>
                  <p className="text-lg font-black text-gray-900">{user.products_count}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-500">فروش کل</p>
                  <p className="text-lg font-black text-success-600">{formatPrice(toNumber(user.total_sales))}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-500">امتیاز</p>
                  <p className="text-lg font-black text-warning-600">{ratingNum.toFixed(1)}/5</p>
                </div>
              </div>
              {user.bio && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                  <p className="text-[10px] text-gray-500 mb-1">درباره فروشنده</p>
                  <p className="text-sm text-gray-700">{user.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* Account Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-600" />
              اطلاعات حساب
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-gray-500">تاریخ عضویت</p>
                <p className="font-bold text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
              {user.last_seen_at && (
                <div>
                  <p className="text-[10px] text-gray-500">آخرین فعالیت</p>
                  <p className="font-bold text-gray-900">
                    {new Date(user.last_seen_at).toLocaleString('fa-IR')}
                  </p>
                </div>
              )}
              {user.email_verified_at && (
                <div>
                  <p className="text-[10px] text-gray-500">تایید ایمیل</p>
                  <p className="font-bold text-success-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    تایید شده
                  </p>
                </div>
              )}
              {user.seller_verified_at && (
                <div>
                  <p className="text-[10px] text-gray-500">تایید فروشندگی</p>
                  <p className="font-bold text-success-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {new Date(user.seller_verified_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <div>{value}</div>
    </div>
  );
}