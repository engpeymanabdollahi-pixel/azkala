import { useState, useEffect } from 'react';
import {
  Ticket, Search, Filter, Loader2, X, Plus, Eye, Send,
  User, Clock, AlertTriangle, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, MessageCircle, Tag,
  ArrowUp, ArrowDown, Minus, Users, TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface SupportTicket {
  id: number;
  ticket_number: string;
  conversation_id: number | null;
  user_id: number;
  assigned_to: number | null;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  response_time_minutes: number | null;
  is_escalated: boolean;
  created_at: string;
  messages_count: number;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  assignedUser?: {
    id: number;
    name: string;
    avatar: string | null;
  };
  messages?: Array<{
    id: number;
    user_id: number;
    message: string;
    is_internal: boolean;
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
  closed: number;
  urgent: number;
  unassigned: number;
  escalated: number;
  avg_response_time: number;
}

// ==================== Main Component ====================

export function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // فیلترها
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ==================== Loaders ====================
  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/tickets', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          assigned_to: assignedFilter !== 'all' ? assignedFilter : undefined,
          search: searchQuery || undefined,
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
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, assignedFilter]);

  // ==================== Handlers ====================
  const handleSearch = () => {
    setCurrentPage(1);
    loadTickets();
  };

  const handleViewDetail = async (ticket: SupportTicket) => {
    try {
      const res = await apiClient.get(`/admin/tickets/${ticket.id}`);
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        setTicketMessages(res.data.data.messages || []);
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
      const res = await apiClient.post(`/admin/tickets/${selectedTicket.id}/message`, {
        message: newMessage,
        is_internal: isInternal,
      });
      if (res.data.success) {
        setTicketMessages(prev => [...prev, res.data.data]);
        setNewMessage('');
        toast.success('پیام ارسال شد');
      }
    } catch (error) {
      toast.error('خطا در ارسال پیام');
    } finally {
      setIsSending(false);
    }
  };

  const handleAssign = async (ticketId: number, userId: number) => {
    try {
      const res = await apiClient.post(`/admin/tickets/${ticketId}/assign`, {
        assigned_to: userId,
      });
      if (res.data.success) {
        toast.success('تیکت اختصاص داده شد');
        loadTickets();
        if (selectedTicket?.id === ticketId) {
          handleViewDetail(selectedTicket);
        }
      }
    } catch (error) {
      toast.error('خطا در اختصاص');
    }
  };

  const handleUpdateStatus = async (ticketId: number, status: string) => {
    try {
      const res = await apiClient.put(`/admin/tickets/${ticketId}`, { status });
      if (res.data.success) {
        toast.success('وضعیت بروزرسانی شد');
        loadTickets();
        if (selectedTicket?.id === ticketId) {
          handleViewDetail(selectedTicket);
        }
      }
    } catch (error) {
      toast.error('خطا در بروزرسانی');
    }
  };

  const handleEscalate = async (ticketId: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این تیکت را به مدیر ارجاع دهید؟')) return;

    try {
      const res = await apiClient.post(`/admin/tickets/${ticketId}/escalate`);
      if (res.data.success) {
        toast.success('تیکت ارجاع شد');
        loadTickets();
      }
    } catch (error) {
      toast.error('خطا');
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
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      low: { label: 'کم', variant: 'gray', icon: ArrowDown },
      medium: { label: 'متوسط', variant: 'primary', icon: Minus },
      high: { label: 'بالا', variant: 'warning', icon: ArrowUp },
      urgent: { label: 'فوری', variant: 'error', icon: AlertTriangle },
    };
    const item = config[priority] || config.medium;
    const Icon = item.icon;
    return (
      <Badge variant={item.variant} size="sm" className="gap-1">
        <Icon className="w-3 h-3" />
        {item.label}
      </Badge>
    );
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
            <p className="text-sm text-gray-500 mt-1">مدیریت و پیگیری تیکت‌های کاربران</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">کل تیکت‌ها</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-yellow-600">{stats.open.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">باز</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-600">{stats.in_progress.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">در حال بررسی</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-red-600">{stats.urgent.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">فوری</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-purple-600">{stats.unassigned.toLocaleString('fa-IR')}</p>
            <p className="text-xs text-gray-500 mt-1">بدون پشتیبان</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در شماره تیکت، موضوع یا نام کاربر..."
              className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="open">باز</option>
            <option value="in_progress">در حال بررسی</option>
            <option value="resolved">حل شده</option>
            <option value="closed">بسته شده</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="all">همه اولویت‌ها</option>
            <option value="low">کم</option>
            <option value="medium">متوسط</option>
            <option value="high">بالا</option>
            <option value="urgent">فوری</option>
          </select>
          <Button onClick={handleSearch} className="w-full">
            <Filter className="w-4 h-4" />
            اعمال فیلتر
          </Button>
        </div>
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
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={cn(
                  'p-4 hover:bg-gray-50 transition-colors',
                  ticket.is_escalated && 'bg-red-50/30',
                  ticket.priority === 'urgent' && 'border-r-4 border-r-red-500'
                )}
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
                      {ticket.is_escalated && (
                        <Badge variant="error" size="sm">
                          <AlertTriangle className="w-3 h-3" />
                          ارجاع شده
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {ticket.messages_count}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-gray-900 mb-1">{ticket.subject}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{ticket.user?.name || 'ناشناس'}</span>
                      </div>
                      {ticket.assignedUser ? (
                        <div className="flex items-center gap-1 text-primary-600">
                          <Users className="w-3 h-3" />
                          <span>{ticket.assignedUser.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-warning-600">
                          <Users className="w-3 h-3" />
                          <span>بدون پشتیبان</span>
                        </div>
                      )}
                      <span>{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(ticket)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      مشاهده
                    </Button>
                    {ticket.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEscalate(ticket.id)}
                        className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        ارجاع
                      </Button>
                    )}
                  </div>
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

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-6 h-6" />
                <div>
                  <h2 className="font-black text-lg">{selectedTicket.subject}</h2>
                  <p className="text-xs opacity-90">{selectedTicket.ticket_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="hover:bg-white/20 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Ticket Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">کاربر</p>
                    <p className="font-bold">{selectedTicket.user?.name}</p>
                    <p className="text-xs text-gray-500">{selectedTicket.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">وضعیت</p>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">اولویت</p>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">دسته‌بندی</p>
                    <p className="font-bold">{getCategoryLabel(selectedTicket.category)}</p>
                  </div>
                </div>
                {selectedTicket.assignedUser && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600 text-xs">پشتیبان مسئول</p>
                    <p className="font-bold text-primary-600">{selectedTicket.assignedUser.name}</p>
                  </div>
                )}
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
                  پیام‌ها ({ticketMessages.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'p-3 rounded-lg',
                        msg.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                            {msg.user?.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs font-bold text-gray-900">{msg.user?.name}</span>
                          {msg.is_internal && (
                            <Badge variant="warning" size="sm">داخلی</Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {new Date(msg.created_at).toLocaleString('fa-IR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-4 border-t bg-gray-50">
                {/* Quick Actions */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {selectedTicket.status === 'open' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                      className="gap-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <TrendingUp className="w-4 h-4" />
                      شروع بررسی
                    </Button>
                  )}
                  {selectedTicket.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                      className="gap-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="w-4 h-4" />
                      حل شده
                    </Button>
                  )}
                  {selectedTicket.status !== 'closed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                      className="gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      بستن تیکت
                    </Button>
                  )}
                </div>

                {/* Send Message */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="پیام پاسخ..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                    disabled={isSending}
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="w-4 h-4"
                    />
                    داخلی
                  </label>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="gap-1"
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