import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, User, Search, Eye, Edit2, Shield, ShieldCheck, ShieldAlert,
  X, ChevronLeft, ChevronRight, Package, DollarSign, Calendar,
  Mail, Phone, Star, Award, TrendingUp, RefreshCw, Store,
  CheckCircle, XCircle, Ban, UserCheck, UserX, Clock,
  MessageSquare, FileText, Filter, Download, MoreVertical,
  Crown, Medal, Gem, Smile, Meh, Frown, MessageCircle, Flag,
  Hash, Building2, CreditCard, Globe
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

const toNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
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
    keepPreviousData: true,
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

  const handleClearAllFilters = () => {
    setRoleFilter('all'); setStatusFilter('all'); setOnlineFilter('all');
    setConversationsFilter('all'); setSentimentFilter('all'); setReportsFilter('all');
    setSearchInput('');
    setFilters({ page: 1, per_page: 20, sort_by: 'created_at', sort_order: 'desc' });
  };

  const handleViewDetail = (user: AdminUser) => { setSelectedUser(user); setShowDetailModal(true); };
  const handleToggleStatus = (user: AdminUser) => { updateStatusMutation.mutate({ id: user.id, is_active: !user.is_active }); };
  const handleApproveSeller = (user: AdminUser) => {
    if (window.confirm(`آیا از تایید "${user.name}" به عنوان فروشنده مطمئن هستید؟`)) approveSellerMutation.mutate(user.id);
  };
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
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            مدیریت کاربران
          </h1>
          <p className="text-sm text-gray-500 mt-1">مدیریت کاربران، فروشندگان و درخواست‌های فروشندگی</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" /> بروزرسانی
        </Button>
      </div>

      <ExportButton type="users" label="خروجی" filters={{ role: roleFilter !== 'all' ? roleFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined }} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('users')} className={cn('px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px', activeTab === 'users' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> کاربران {stats && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{stats.total}</span>}</span>
        </button>
        <button onClick={() => setActiveTab('requests')} className={cn('px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px', activeTab === 'requests' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
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

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="جستجو بر اساس نام، ایمیل، تلفن یا نام فروشگاه..." value={searchInput} onChange={(e) => handleSearch(e.target.value)} className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all" />
              </div>
              <Button variant="outline" size="sm" onClick={handleClearAllFilters} className="gap-1.5"><X className="w-4 h-4" /> پاک کردن فیلترها</Button>
            </div>
            {/* (فیلترهای نقش و وضعیت و پیشرفته را همانند کد قبلی خود نگه دارید تا فضای پاسخ طولانی نشود) */}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : users.length === 0 ? (
              <EmptyState icon={<Users className="w-12 h-12" />} title="کاربری یافت نشد" description="با فیلترهای فعلی هیچ کاربری وجود ندارد" action={<Button onClick={handleClearAllFilters} variant="outline">پاک کردن فیلترها</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">کاربر</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">نقش</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-gray-600">وضعیت</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-600">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      const RoleIcon = roleInfo.icon;
                      return (
                        <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {user.avatar ? <SafeImage src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 line-clamp-1">{user.name}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-1">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold', roleInfo.bg)}>
                              <RoleIcon className="w-3 h-3" /> {roleInfo.label}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <button onClick={() => handleToggleStatus(user)} disabled={updateStatusMutation.isPending} className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all', user.is_active ? 'bg-success-50 text-success-700 border-success-200' : 'bg-gray-50 text-gray-700 border-gray-200')}>
                              {user.is_active ? <><CheckCircle className="w-3 h-3" /> فعال</> : <><XCircle className="w-3 h-3" /> غیرفعال</>}
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleViewDetail(user)} className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-500 hover:text-primary-600 transition-colors" title="مشاهده جزئیات"><Eye className="w-4 h-4" /></button>
                              {user.role === 'customer' && <button onClick={() => handleApproveSeller(user)} disabled={approveSellerMutation.isPending} className="p-1.5 hover:bg-success-50 rounded-lg text-gray-500 hover:text-success-600 transition-colors" title="تایید به عنوان فروشنده"><ShieldCheck className="w-4 h-4" /></button>}
                              {user.role === 'seller' && <button onClick={() => handleRejectSeller(user)} disabled={rejectSellerMutation.isPending} className="p-1.5 hover:bg-error-50 rounded-lg text-gray-500 hover:text-error-600 transition-colors" title="لغو فروشندگی"><ShieldAlert className="w-4 h-4" /></button>}
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
        </>
      )}

      {/* ==================== Requests Tab ==================== */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {requestsLoading ? (
            <div className="p-8 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-12 h-12" />} title="درخواست فروشندگی وجود ندارد" description="هنوز هیچ درخواستی برای فروشندگی ثبت نشده است" />
          ) : (
            <div className="p-4 space-y-4">
              {requests.map((request: any) => {
                const statusConfig = {
                  pending_initial: { color: 'warning', label: 'در انتظار تایید اولیه', bg: 'bg-yellow-50 border-yellow-200' },
                  pending_documents: { color: 'primary', label: 'در انتظار تکمیل مدارک', bg: 'bg-blue-50 border-blue-200' },
                  pending_final: { color: 'accent', label: 'مدارک ارسال شده (بررسی نهایی)', bg: 'bg-purple-50 border-purple-200' },
                  approved: { color: 'success', label: 'تایید شده و فعال', bg: 'bg-green-50 border-green-200' },
                  rejected: { color: 'error', label: 'رد شده', bg: 'bg-red-50 border-red-200' },
                };
                const config = statusConfig[request.status] || statusConfig.pending_initial;

                return (
                  <div key={request.id} className={cn("p-5 border rounded-xl transition-all", config.bg)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", request.status === 'approved' ? 'bg-gradient-to-br from-success-500 to-success-600' : request.status === 'rejected' ? 'bg-gradient-to-br from-error-500 to-error-600' : 'bg-gradient-to-br from-warning-500 to-warning-600')}>
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-gray-900">{request.shop_name || request.proposed_shop_name || 'نام فروشگاه ثبت نشده'}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" /> ثبت شده در: {new Date(request.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={config.color} size="sm" className="px-3 py-1">{config.label}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <DetailItem icon={User} label="نام متقاضی" value={request.user?.name || request.full_name || 'نامشخص'} />
                      <DetailItem icon={Hash} label="کد ملی" value={request.national_code || 'ثبت نشده'} />
                      <DetailItem icon={Phone} label="شماره تماس" value={request.phone || request.user?.phone || 'ثبت نشده'} />
                      <DetailItem icon={Store} label="نام فروشگاه" value={request.shop_name || request.proposed_shop_name || 'ثبت نشده'} />
                      {request.id_card_image && <DetailItem icon={FileText} label="کارت ملی" value="✅ آپلود شده" />}
                      {request.business_license_image && <DetailItem icon={FileText} label="جواز کسب" value="✅ آپلود شده" />}
                    </div>

                    {/* ✅ دکمه واحد برای باز کردن مودال بررسی */}
                    {(request.status === 'pending_initial' || request.status === 'pending_final') && (
                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <Button size="sm" variant="primary" className="gap-2 shadow-lg shadow-primary-500/20" onClick={() => { setSelectedRequest(request); setShowRequestModal(true); }}>
                          <Eye className="w-4 h-4" /> بررسی مدارک و اقدام
                        </Button>
                      </div>
                    )}
                    
                    {request.status === 'pending_documents' && (
                      <p className="text-sm text-blue-600 font-bold flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                        <Clock className="w-4 h-4 animate-pulse" /> در انتظار آپلود مدارک توسط فروشنده
                      </p>
                    )}

                    {request.status === 'approved' && (
                      <p className="text-sm text-green-600 font-bold flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                        <CheckCircle className="w-4 h-4" /> شعبه با موفقیت افتتاح شده است
                      </p>
                    )}

                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="mt-4 pt-4 border-t border-gray-200 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs font-bold text-red-700 mb-1">دلیل رد:</p>
                        <p className="text-sm text-red-600">{request.rejection_reason}</p>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-error-50/50 to-white">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-error-600" /> لغو فروشندگی</h3>
              <button onClick={() => { setShowRejectModal(null); setRejectReason(''); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-800"><strong>{showRejectModal.name}</strong> از حالت فروشنده خارج شده و به مشتری تبدیل می‌شود.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">دلیل لغو فروشندگی <span className="text-error-500">*</span></label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="دلیل را وارد کنید..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-error-500 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
              <Button variant="outline" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>انصراف</Button>
              <Button variant="error" onClick={handleConfirmReject} disabled={rejectSellerMutation.isPending} isLoading={rejectSellerMutation.isPending} className="gap-1.5"><ShieldAlert className="w-4 h-4" /> لغو فروشندگی</Button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ مودال جدید بررسی درخواست فروشندگی */}
      {showRequestModal && selectedRequest && (
        <SellerRequestDetailModal request={selectedRequest} onClose={() => { setShowRequestModal(false); setSelectedRequest(null); }} />
      )}
    </div>
  );
}

// ==================== Sub Components ====================
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray' }) {
  const colors = { primary: 'text-primary-600 bg-primary-50', success: 'text-success-600 bg-success-50', error: 'text-error-600 bg-error-50', warning: 'text-warning-600 bg-warning-50', accent: 'text-accent-600 bg-accent-50', gray: 'text-gray-600 bg-gray-50' };
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2"><div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors[color])}><Icon className="w-4 h-4" /></div></div>
      <p className="text-xl font-black text-gray-900">{value.toLocaleString('fa-IR')}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon className="w-4 h-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 font-medium mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate dir-ltr text-left" title={value}>{value}</p>
      </div>
    </div>
  );
}

// ✅ کامپوننت InfoCard اصلاح‌شده و ضدخطا
function InfoCard({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <p className="text-[10px] text-gray-500 mb-1.5 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        {/* ✅ فقط اگر آیکون وجود داشت آن را رندر کن */}
        {Icon && <Icon className="w-4 h-4 text-primary-600 flex-shrink-0" />}
        <div className="text-sm font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl">
              {user.avatar ? <SafeImage src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{user.name}</h3>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="نقش" value={<span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold', roleInfo.bg)}><RoleIcon className="w-3 h-3" /> {roleInfo.label}</span>} />
            <InfoCard label="وضعیت" value={<Badge variant={user.is_active ? 'success' : 'gray'} size="sm">{user.is_active ? 'فعال' : 'غیرفعال'}</Badge>} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
          <Button variant="outline" onClick={onClose}>بستن</Button>
        </div>
      </div>
    </div>
  );
}

// ✅ کامپوننت مودال بررسی درخواست فروشندگی (اصلاح شده و بدون تکرار)
function SellerRequestDetailModal({ request, onClose }: { request: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // ✅ تابع کمکی برای تبدیل مسیر نسبی دیتابیس به آدرس کامل (فقط یک بار تعریف شده است)
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000/storage/${path}`;
  };

  const handleInitialApprove = () => {
    if (window.confirm('آیا از تایید اولیه و ارسال نوتیفیکیشن برای تکمیل مدارک مطمئن هستید؟')) {
      adminUserService.initialApproveRequest(request.id).then(() => {
        toast.success('تایید اولیه انجام شد و نوتیفیکیشن ارسال گردید', { icon: '✅' });
        queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
        onClose();
      }).catch(() => toast.error('خطا در تایید اولیه'));
    }
  };

  const handleFinalApprove = () => {
    if (window.confirm('آیا از تایید نهایی مدارک و افتتاح شعبه مطمئن هستید؟')) {
      adminUserService.finalApproveRequest(request.id).then(() => {
        toast.success('فروشندگی تایید نهایی شد و شعبه افتتاح گردید', { icon: '🎉' });
        queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        onClose();
      }).catch(() => toast.error('خطا در تایید نهایی'));
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error('لطفاً دلیل رد را وارد کنید'); return; }
    adminUserService.rejectSellerRequest(request.id, rejectReason).then(() => {
      toast.success('درخواست با موفقیت رد شد', { icon: '✅' });
      queryClient.invalidateQueries({ queryKey: ['admin-seller-requests'] });
      onClose();
    }).catch(() => toast.error('خطا در رد درخواست'));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{request.shop_name || request.proposed_shop_name}</h3>
              <p className="text-xs text-gray-500">متقاضی: {request.user?.name || request.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
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
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" /> مدارک بارگذاری شده
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* نمایش تصویر کارت ملی */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                <p className="text-xs font-bold text-gray-600 mb-2">تصویر کارت ملی</p>
                {request.id_card_image ? (
                  <a href={getImageUrl(request.id_card_image)} target="_blank" rel="noopener noreferrer" className="block group">
                    <img 
                      src={getImageUrl(request.id_card_image)} 
                      alt="کارت ملی" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 group-hover:border-primary-500 transition-all cursor-zoom-in"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=خطا+در+بارگذاری+تصویر'; 
                      }}
                    />
                    <p className="text-[10px] text-center text-primary-600 mt-1 group-hover:underline">برای بزرگنمایی کلیک کنید</p>
                  </a>
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">بارگذاری نشده</div>
                )}
              </div>

              {/* نمایش تصویر جواز کسب */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                <p className="text-xs font-bold text-gray-600 mb-2">جواز کسب / مجوز فعالیت</p>
                {request.business_license_image ? (
                  <a href={getImageUrl(request.business_license_image)} target="_blank" rel="noopener noreferrer" className="block group">
                    <img 
                      src={getImageUrl(request.business_license_image)} 
                      alt="جواز کسب" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 group-hover:border-primary-500 transition-all cursor-zoom-in"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=خطا+در+بارگذاری+تصویر'; 
                      }}
                    />
                    <p className="text-[10px] text-center text-primary-600 mt-1 group-hover:underline">برای بزرگنمایی کلیک کنید</p>
                  </a>
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">بارگذاری نشده (اختیاری)</div>
                )}
              </div>
            </div>
          </div>

          {isRejecting && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-fade-in">
              <label className="block text-sm font-bold text-red-800">دلیل رد درخواست (الزامی):</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="مثال: تصویر کارت ملی ناخوانا است..." rows={3} className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-none" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setIsRejecting(false); setRejectReason(''); }}>انصراف</Button>
                <Button variant="error" size="sm" onClick={handleReject} disabled={!rejectReason.trim()}>ثبت رد درخواست</Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isRejecting && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
            <Button variant="outline" onClick={onClose}>بستن</Button>
            {request.status === 'pending_initial' && (
              <Button variant="primary" onClick={handleInitialApprove} className="gap-2">
                <CheckCircle className="w-4 h-4" /> تایید اولیه و درخواست مدارک
              </Button>
            )}
            {request.status === 'pending_final' && (
              <>
                <Button variant="error" onClick={() => setIsRejecting(true)} className="gap-2">
                  <XCircle className="w-4 h-4" /> رد درخواست
                </Button>
                <Button variant="success" onClick={handleFinalApprove} className="gap-2 shadow-lg shadow-success-500/20">
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
