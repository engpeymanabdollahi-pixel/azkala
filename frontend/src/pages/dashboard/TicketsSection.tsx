import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ticket, Plus, MessageCircle, Clock, CheckCircle, XCircle,
  Loader2, Send, TrendingUp, User, Tag,
  ChevronLeft, ChevronRight, XCircle as XIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import type { BadgeProps } from '@/components/ui/Badge';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory = 'general' | 'technical' | 'payment' | 'shipping' | 'product' | 'account' | 'other';

interface UserTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  messages_count: number;
  created_at: string;
  assignedUser?: { id: number; name: string };
  messages?: Array<{
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    user?: { id: number; name: string; avatar: string | null };
  }>;
}

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
}

interface TicketsListResponse {
  tickets: UserTicket[];
  pagination: { current_page: number; last_page: number; total: number };
  stats: TicketStats;
}

const fetchTickets = async (statusFilter: string, page: number): Promise<TicketsListResponse> => {
  const res = await apiClient.get('/tickets', {
    params: {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
    },
  });
  return res.data.data;
};

export function TicketsSection() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState<{ subject: string; description: string; priority: TicketPriority; category: TicketCategory }>({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ✅ اصلاح حیاتی دو باگ واقعی که قبلاً اینجا بودند:
  // ۱) بارگذاری فقط با useState(() => loadTickets()) انجام می‌شد — این
  //    فراخوانی فقط یک‌بار در mount اجرا می‌شود (چون useState یک initializer
  //    است، نه افکت)، پس با تغییر فیلتر/صفحه دوباره اجرا نمی‌شد مگر جایی
  //    دستی صداش بزند.
  // ۲) کلیک روی فیلتر وضعیت بلافاصله بعد از setStatusFilter خودِ
  //    loadTickets() را صدا می‌زد — ولی چون setState آسنکرون است،
  //    loadTickets هنوز مقدار قدیمیِ statusFilter را از closure می‌خواند
  //    (یک درخواست با فیلتر اشتباه). دکمه‌های صفحه‌بندی هم اصلاً
  //    loadTickets را صدا نمی‌زدند — یعنی تغییر شماره صفحه، لیست را
  //    هیچ‌وقت واقعاً رفرش نمی‌کرد.
  // با useQuery و queryKey شامل [statusFilter, currentPage]، هر تغییر
  // خودکار و با مقدار درست رفتچ می‌شود.
  const { data, isLoading } = useQuery({
    queryKey: ['user-tickets', statusFilter, currentPage],
    queryFn: () => fetchTickets(statusFilter, currentPage),
  });

  const tickets = data?.tickets || [];
  const stats = data?.stats || null;
  const totalPages = data?.pagination.last_page || 1;

  const refetchTickets = () => queryClient.invalidateQueries({ queryKey: ['user-tickets'] });

  // ==================== Handlers ====================
  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('لطفاً موضوع و توضیحات را وارد کنید');
      return;
    }

    setIsCreating(true);
    try {
      const res = await apiClient.post('/tickets', newTicket);
      if (res.data.success) {
        toast.success('تیکت با موفقیت ایجاد شد');
        setShowCreateModal(false);
        setNewTicket({ subject: '', description: '', priority: 'medium', category: 'general' });
        refetchTickets();
      }
    } catch {
      toast.error('خطا در ایجاد تیکت');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewDetail = async (ticket: UserTicket) => {
    try {
      const res = await apiClient.get(`/tickets/${ticket.id}`);
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        setShowDetailModal(true);
      }
    } catch {
      toast.error('خطا در بارگذاری جزئیات');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setIsSending(true);
    try {
      const res = await apiClient.post(`/tickets/${selectedTicket.id}/message`, {
        message: newMessage,
      });
      if (res.data.success) {
        setSelectedTicket(prev => prev ? {
          ...prev,
          messages: [...(prev.messages || []), res.data.data],
          messages_count: prev.messages_count + 1,
        } : null);
        setNewMessage('');
        toast.success('پیام ارسال شد');
      }
    } catch {
      toast.error('خطا در ارسال پیام');
    } finally {
      setIsSending(false);
    }
  };

  const STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps['variant']; icon: ComponentType<{ className?: string }> }> = {
    open: { label: 'باز', variant: 'warning', icon: Clock },
    in_progress: { label: 'در حال بررسی', variant: 'primary', icon: TrendingUp },
    resolved: { label: 'حل شده', variant: 'success', icon: CheckCircle },
    closed: { label: 'بسته شده', variant: 'gray', icon: XCircle },
  };

  const PRIORITY_CONFIG: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    low: { label: 'کم', variant: 'gray' },
    medium: { label: 'متوسط', variant: 'primary' },
    high: { label: 'بالا', variant: 'warning' },
    urgent: { label: 'فوری', variant: 'error' },
  };

  const getStatusBadge = (status: string) => {
    const item = STATUS_CONFIG[status] || STATUS_CONFIG.open;
    const Icon = item.icon;
    return (
      <Badge variant={item.variant} size="sm" className="gap-1">
        <Icon className="w-3 h-3" />
        {item.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const item = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
    return <Badge variant={item.variant} size="sm">{item.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'عمومی',
      technical: 'فنی',
      payment: 'پرداخت',
      shipping: 'ارسال',
      product: 'محصول',
      account: 'حساب کاربری',
      other: 'سایر',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-orange-500" />
            تیکت‌های پشتیبانی
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">پیگیری درخواست‌های پشتیبانی شما</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4" />
          تیکت جدید
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">کل</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{stats.open}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">باز</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.in_progress}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">در حال بررسی</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.resolved}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">حل شده</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'همه' },
          { value: 'open', label: 'باز' },
          { value: 'in_progress', label: 'در حال بررسی' },
          { value: 'resolved', label: 'حل شده' },
          { value: 'closed', label: 'بسته شده' },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => {
              setStatusFilter(item.value);
              setCurrentPage(1);
            }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-bold transition-all',
              statusFilter === item.value
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Ticket className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-bold">تیکتی یافت نشد</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="outline"
              className="mt-4 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              ایجاد اولین تیکت
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(ticket)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {ticket.ticket_number}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <Badge variant="gray" size="sm">
                        <Tag className="w-3 h-3" />
                        {getCategoryLabel(ticket.category)}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-1">{ticket.subject}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{ticket.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {ticket.messages_count} پیام
                      </span>
                      {ticket.assignedUser && (
                        <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                          <User className="w-3 h-3" />
                          {ticket.assignedUser.name}
                        </span>
                      )}
                      <span>{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>

                  <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              صفحه {currentPage} از {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-6 h-6" />
                <h2 className="font-black text-lg">تیکت جدید</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-2 rounded-lg">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">موضوع</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="موضوع تیکت..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="مشکل خود را با جزئیات توضیح دهید..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">اولویت</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as TicketPriority })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="low">کم</option>
                    <option value="medium">متوسط</option>
                    <option value="high">بالا</option>
                    <option value="urgent">فوری</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">دسته‌بندی</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as TicketCategory })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="general">عمومی</option>
                    <option value="technical">فنی</option>
                    <option value="payment">پرداخت</option>
                    <option value="shipping">ارسال</option>
                    <option value="product">محصول</option>
                    <option value="account">حساب کاربری</option>
                    <option value="other">سایر</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1">
                  انصراف
                </Button>
                <Button
                  onClick={handleCreateTicket}
                  disabled={isCreating}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  ارسال تیکت
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDetailModal(false)} className="hover:bg-white/20 p-1.5 rounded-lg">
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <h2 className="font-black text-lg">{selectedTicket.subject}</h2>
                  <p className="text-xs opacity-90">{selectedTicket.ticket_number}</p>
                </div>
              </div>
              {getStatusBadge(selectedTicket.status)}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">اولویت</p>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">دسته‌بندی</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{getCategoryLabel(selectedTicket.category)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">تاریخ ایجاد</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{new Date(selectedTicket.created_at).toLocaleDateString('fa-IR')}</p>
                  </div>
                  {selectedTicket.assignedUser && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">پشتیبان</p>
                      <p className="font-bold text-primary-600 dark:text-primary-400">{selectedTicket.assignedUser.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">توضیحات</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  پیام‌ها ({selectedTicket.messages_count})
                </h3>
                <div className="space-y-3">
                  {(selectedTicket.messages || []).map((msg) => {
                    const isUser = msg.user_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'p-3 rounded-lg',
                          isUser ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : 'bg-gray-50 dark:bg-slate-900'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold">
                              {msg.user?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                              {msg.user?.name || 'ناشناس'}
                            </span>
                            {isUser && <Badge variant="primary" size="sm">شما</Badge>}
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {new Date(msg.created_at).toLocaleString('fa-IR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedTicket.status !== 'closed' && (
              <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    disabled={isSending}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="gap-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    ارسال
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default TicketsSection;
