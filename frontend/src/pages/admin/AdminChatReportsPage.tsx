import { useState, useEffect } from 'react';
import {
  Flag, AlertTriangle, CheckCircle, XCircle, Clock,
  Search, Filter, Loader2, X, Eye, MessageCircle,
  User, Shield, Ban, Send, ChevronLeft, ChevronRight, type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

type BadgeVariant = NonNullable<BadgeProps['variant']>;

interface ChatReport {
  id: number;
  reporter_id: number;
  reported_user_id: number;
  conversation_id: number | null;
  message_id: number | null;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  reporter?: { id: number; name: string; avatar: string | null };
  reportedUser?: { id: number; name: string; avatar: string | null };
  conversation?: {
    id: number;
    buyer_id: number;
    seller_id: number;
    product?: { id: number; name: string; main_image: string | null };
    buyer?: { id: number; name: string; avatar: string | null };
    seller?: { id: number; name: string; avatar: string | null };
  };
  message?: {
    id: number;
    content: string;
    type: string;
    created_at: string;
    sender?: { id: number; name: string; avatar: string | null };
  };
}

interface ReportStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  today: number;
  week: number;
  month: number;
}

// ==================== Main Component ====================

export function AdminChatReportsPage() {
  const [reports, setReports] = useState<ChatReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // فیلترها
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedReport, setSelectedReport] = useState<ChatReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionReason, setActionReason] = useState('');

  // ==================== Loaders ====================
  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/chat-management/reports', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          reason: reasonFilter !== 'all' ? reasonFilter : undefined,
          search: searchQuery || undefined,
          page: currentPage,
        },
      });
      if (res.data.success) {
        setReports(res.data.data.data);
        setTotalPages(Math.ceil(res.data.data.total / 20));
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری گزارش‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiClient.get('/admin/chat-management/reports/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadReports();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, reasonFilter]);

  // ==================== Handlers ====================
  const handleSearch = () => {
    setCurrentPage(1);
    loadReports();
  };

  const handleViewDetail = async (report: ChatReport) => {
    try {
      const res = await apiClient.get(`/admin/chat-management/reports/${report.id}`);
      if (res.data.success) {
        setSelectedReport(res.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('خطا در بارگذاری جزئیات');
    }
  };

  const handleTakeAction = async (action: 'warn' | 'block' | 'close_conversation' | 'dismiss') => {
    if (!selectedReport) return;

    try {
      const res = await apiClient.post(`/admin/chat-management/reports/${selectedReport.id}/action`, {
        action,
        reason: actionReason || undefined,
      });
      if (res.data.success) {
        toast.success('اقدام با موفقیت انجام شد');
        setShowActionModal(false);
        setShowDetailModal(false);
        setActionReason('');
        loadReports();
        loadStats();
      }
    } catch (error) {
      toast.error('خطا در انجام اقدام');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: BadgeVariant; icon: LucideIcon }> = {
      pending: { label: 'در انتظار', variant: 'warning', icon: Clock },
      reviewed: { label: 'بررسی شده', variant: 'primary', icon: Eye },
      resolved: { label: 'حل شده', variant: 'success', icon: CheckCircle },
      dismissed: { label: 'رد شده', variant: 'error', icon: XCircle },
    };
    const item = config[status] || config.pending;
    const Icon = item.icon;
    return (
      <Badge variant={item.variant} size="sm" className="gap-1">
        <Icon className="w-3 h-3" />
        {item.label}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'اسپم',
      harassment: 'آزار و اذیت',
      inappropriate: 'محتوای نامناسب',
      scam: 'کلاهبرداری',
      other: 'سایر',
    };
    return labels[reason] || reason;
  };

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <Flag className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">مدیریت گزارش‌های تخلف چت</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">بررسی و مدیریت گزارش‌های کاربران</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.total}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">کل گزارش‌ها</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.pending}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">در انتظار</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.resolved}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">حل شده</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.today}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">امروز</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو..."
              className="w-full pr-10 pl-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="reviewed">بررسی شده</option>
            <option value="resolved">حل شده</option>
            <option value="dismissed">رد شده</option>
          </select>
          <select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
          >
            <option value="all">همه دلایل</option>
            <option value="spam">اسپم</option>
            <option value="harassment">آزار و اذیت</option>
            <option value="inappropriate">محتوای نامناسب</option>
            <option value="scam">کلاهبرداری</option>
            <option value="other">سایر</option>
          </select>
          <Button onClick={handleSearch} className="w-full">
            <Filter className="w-4 h-4" />
            اعمال فیلتر
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Flag className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-bold">گزارشی یافت نشد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(report.status)}
                      <Badge variant="primary" size="sm">
                        {getReasonLabel(report.reason)}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(report.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {report.reporter?.name || 'ناشناس'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">گزارش داد:</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {report.reportedUser?.name || 'ناشناس'}
                      </span>
                    </div>

                    {report.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {report.description}
                      </p>
                    )}

                    {report.conversation?.product && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <MessageCircle className="w-3 h-3" />
                        <span>محصول: {report.conversation.product.name}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(report)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    مشاهده
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              صفحه {currentPage} از {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= totalPages}
              className="gap-1"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-6 h-6" />
                <h2 className="font-black text-lg">جزئیات گزارش #{selectedReport.id}</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="hover:bg-white/20 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Report Info */}
              <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  اطلاعات گزارش
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">وضعیت</p>
                    <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">دلیل</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">{getReasonLabel(selectedReport.reason)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">گزارش‌دهنده</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">{selectedReport.reporter?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">متخلف</p>
                    <p className="font-bold text-red-600 dark:text-red-400 mt-1">{selectedReport.reportedUser?.name}</p>
                  </div>
                </div>
                {selectedReport.description && (
                  <div className="mt-3">
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">توضیحات</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-3 rounded-lg">
                      {selectedReport.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Conversation Info */}
              {selectedReport.conversation && (
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary-500" />
                    اطلاعات مکالمه
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">خریدار:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{selectedReport.conversation.buyer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">فروشنده:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{selectedReport.conversation.seller?.name}</span>
                    </div>
                    {selectedReport.conversation.product && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">محصول:</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">{selectedReport.conversation.product.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message Info */}
              {selectedReport.message && (
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Send className="w-5 h-5 text-accent-500" />
                    پیام گزارش شده
                  </h3>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {selectedReport.message.sender?.name} - {new Date(selectedReport.message.created_at).toLocaleString('fa-IR')}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedReport.message.content}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedReport.admin_notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    یادداشت ادمین
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedReport.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setShowActionModal(true)}
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                >
                  <AlertTriangle className="w-4 h-4" />
                  ارسال هشدار
                </Button>
                <Button
                  onClick={() => handleTakeAction('block')}
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-red-500 text-white hover:bg-red-600 border-red-500"
                >
                  <Ban className="w-4 h-4" />
                  بلاک کاربر
                </Button>
                <Button
                  onClick={() => handleTakeAction('close_conversation')}
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
                >
                  <XCircle className="w-4 h-4" />
                  بستن مکالمه
                </Button>
                <Button
                  onClick={() => handleTakeAction('dismiss')}
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-gray-500 text-white hover:bg-gray-600 border-gray-500"
                >
                  <XCircle className="w-4 h-4" />
                  رد گزارش
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">یادداشت ادمین (اختیاری)</h3>
            </div>
            <div className="p-4">
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="دلیل اقدام..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                maxLength={500}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowActionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  انصراف
                </Button>
                <Button
                  onClick={() => handleTakeAction('warn')}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  ارسال هشدار
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminChatReportsPage;
