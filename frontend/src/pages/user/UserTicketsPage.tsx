import { useState, useEffect } from 'react';
import {
  Ticket, Plus, MessageCircle, Clock, CheckCircle, XCircle,
  Loader2, Send, ArrowLeft, AlertTriangle, TrendingUp,
  User, Tag, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface UserTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  messages_count: number;
  created_at: string;
  assignedUser?: {
    id: number;
    name: string;
  };
  messages?: Array<{
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    user?: {
      id: number;
      name: string;
      avatar: string | null;
    };
  }>;
}

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
}

// ==================== Main Component ====================

export function UserTicketsPage() {
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
    category: 'general' as const,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ==================== Loaders ====================
  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/tickets', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page: currentPage,
        },
      });
      if (res.data.success) {
        setTickets(res.data.data.tickets);
        setTotalPages(res.data.data.pagination.last_page);
        setStats(res.data.data.stats);
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری تیکت‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [currentPage, statusFilter]);

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
        setNewTicket({
          subject: '',
          description: '',
          priority: 'medium',
          category: 'general',
        });
        loadTickets();
      }
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      toast.error('خطا در ارسال پیام');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      open: { label: 'باز', variant: 'warning', icon: Clock },
      in_progress: { label: 'در حال بررسی', variant: 'primary', icon: TrendingUp },
      resolved: { label: 'حل شده', variant: 'success', icon: CheckCircle },
      closed: { label: 'بسته شده', variant: 'gray', icon: XCircle },
    };
    const item = config[status] || config.open;
    const Icon = item.icon;
    return (
      <Badge variant={item.variant} size="sm" className="gap-1">
        <Icon className="w-3 h-3" />
        {item.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; variant: any }> = {
      low: { label: 'کم', variant: 'gray' },
      medium: { label: 'متوسط', variant: 'primary' },
      high: { label: 'بالا', variant: 'warning' },
      urgent: { label: 'فوری', variant: 'error' },
    };
    const item = config[priority] || config.medium;
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

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">تیکت‌های پشتیبانی</h1>
            <p className="text-sm text-gray-500 mt-1">پیگیری و مدیریت درخواست‌های پشتیبانی</p>
          </div>
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
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">کل تیکت‌ها</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-yellow-600">{stats.open}</p>
                <p className="text-xs text-gray-500">باز</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-blue-600">{stats.in_progress}</p>
                <p className="text-xs text-gray-500">در حال بررسی</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-green-600">{stats.resolved}</p>
                <p className="text-xs text-gray-500">حل شده</p>
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
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
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
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(ticket)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {ticket.ticket_number}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <Badge variant="gray" size="sm">
                        <Tag className="w-3 h-3" />
                        {getCategoryLabel(ticket.category)}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-black text-gray-900 mb-1">{ticket.subject}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {ticket.messages_count} پیام
                      </span>
                      {ticket.assignedUser && (
                        <span className="flex items-center gap-1 text-primary-600">
                          <User className="w-3 h-3" />
                          {ticket.assignedUser.name}
                        </span>
                      )}
                      <span>{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>

                  <ChevronLeft className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
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
            <span className="text-sm text-gray-600">
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-6 h-6" />
                <h2 className="font-black text-lg">تیکت جدید</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="hover:bg-white/20 p-2 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">موضوع</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="موضوع تیکت را وارد کنید..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">توضیحات</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="مشکل خود را با جزئیات توضیح دهید..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">اولویت</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="low">کم</option>
                    <option value="medium">متوسط</option>
                    <option value="high">بالا</option>
                    <option value="urgent">فوری</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">دسته‌بندی</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
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
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="flex-1"
                >
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
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="hover:bg-white/20 p-1.5 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="font-black text-lg">{selectedTicket.subject}</h2>
                  <p className="text-xs opacity-90">{selectedTicket.ticket_number}</p>
                </div>
              </div>
              {getStatusBadge(selectedTicket.status)}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Ticket Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">اولویت</p>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">دسته‌بندی</p>
                    <p className="font-bold">{getCategoryLabel(selectedTicket.category)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">تاریخ ایجاد</p>
                    <p className="font-bold">{new Date(selectedTicket.created_at).toLocaleDateString('fa-IR')}</p>
                  </div>
                  {selectedTicket.assignedUser && (
                    <div>
                      <p className="text-gray-600 text-xs">پشتیبان</p>
                      <p className="font-bold text-primary-600">{selectedTicket.assignedUser.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-2">توضیحات</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Messages */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary-600" />
                  پیام‌ها ({selectedTicket.messages_count})
                </h3>
                <div className="space-y-3">
                  {(selectedTicket.messages || []).map((msg) => {
                    const isUser = msg.user_id === selectedTicket.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'p-3 rounded-lg',
                          isUser ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                              {msg.user?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-xs font-bold text-gray-900">
                              {msg.user?.name || 'ناشناس'}
                            </span>
                            {isUser && (
                              <Badge variant="primary" size="sm">شما</Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {new Date(msg.created_at).toLocaleString('fa-IR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Send Message */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
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