import { useState, useEffect } from 'react';
import {
  MessageCircle, Search, Filter, Loader2, X, Eye, Send,
  Lock, ChevronLeft, ChevronRight, Users, Calendar,
  TrendingUp, Clock, Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface Conversation {
  id: number;
  buyer_id: number;
  seller_id: number;
  product_id: number | null;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
  messages_count: number;
  buyer?: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  seller?: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    shop_name: string | null;
  };
  product?: {
    id: number;
    name: string;
    main_image: string | null;
  };
  last_message?: {
    id: number;
    content: string;
    sender?: {
      id: number;
      name: string;
    };
    created_at: string;
  };
  buyer_online?: boolean;
  seller_online?: boolean;
}

interface ConversationMessage {
  id: number;
  content: string;
  type: 'text' | 'image' | 'system';
  sender_id: number;
  sender?: { id: number; name: string };
  created_at: string;
}

interface ConversationDetailStats {
  total_messages: number;
  buyer_messages: number;
  seller_messages: number;
  system_messages: number;
  duration_days: number;
  last_activity: string | null;
}

interface ChatStats {
  total_conversations: number;
  active_conversations: number;
  total_messages: number;
  messages_today: number;
  avg_response_time: number;
  conversion_rate: number;
  daily_stats: Array<{
    date: string;
    label: string;
    count: number;
  }>;
  top_sellers: Array<{
    id: number;
    name: string;
    shop_name: string | null;
    conversations_count: number;
  }>;
}

// ==================== Main Component ====================

export function AdminChatMonitorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // فیلترها
  const [statusFilter, setStatusFilter] = useState('all');
  const [messagesCountFilter, setMessagesCountFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [conversationStats, setConversationStats] = useState<ConversationDetailStats | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ==================== Loaders ====================
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/chat-management/monitor', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          messages_count: messagesCountFilter !== 'all' ? messagesCountFilter : undefined,
          search: searchQuery || undefined,
          page: currentPage,
        },
      });
      if (res.data.success) {
        setConversations(res.data.data.conversations);
        setTotalPages(Math.ceil(res.data.data.pagination.total / 20));
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری مکالمات');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiClient.get('/admin/chat-management/monitor/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadConversations();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, messagesCountFilter]);

  // ==================== Handlers ====================
  const handleSearch = () => {
    setCurrentPage(1);
    loadConversations();
  };

  const handleViewDetail = async (conv: Conversation) => {
    try {
      const res = await apiClient.get(`/admin/chat-management/monitor/${conv.id}`);
      if (res.data.success) {
        setSelectedConversation(conv);
        setConversationMessages(res.data.data.messages);
        setConversationStats(res.data.data.stats);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error('خطا در بارگذاری جزئیات');
    }
  };

  const handleSendMessage = async () => {
    if (!adminMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const res = await apiClient.post(`/admin/chat-management/monitor/${selectedConversation.id}/intervene`, {
        message: adminMessage,
      });
      if (res.data.success) {
        setConversationMessages(prev => [...prev, res.data.data]);
        setAdminMessage('');
        toast.success('پیام ارسال شد');
      }
    } catch (error) {
      toast.error('خطا در ارسال پیام');
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;
    if (!confirm('آیا مطمئن هستید که می‌خواهید این مکالمه را ببندید؟')) return;

    try {
      const res = await apiClient.post(`/admin/chat-management/monitor/${selectedConversation.id}/close`);
      if (res.data.success) {
        toast.success('مکالمه بسته شد');
        setShowDetailModal(false);
        loadConversations();
      }
    } catch (error) {
      toast.error('خطا در بستن مکالمه');
    }
  };

  const maxDailyCount = stats ? Math.max(1, ...stats.daily_stats.map(d => d.count)) : 1;

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">نظارت بر چت‌ها</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              مشاهده و مدیریت مکالمات بین خریداران و فروشندگان
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.total_conversations}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">کل مکالمات</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.active_conversations}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">مکالمات فعال</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.total_messages}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">کل پیام‌ها</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-accent-50 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-accent-600 dark:text-accent-400">{stats.messages_today}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">پیام‌های امروز</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-warning-50 dark:bg-warning-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-warning-600 dark:text-warning-400">{stats.avg_response_time} دقیقه</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">میانگین پاسخ</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-success-50 dark:bg-success-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success-600 dark:text-success-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-success-600 dark:text-success-400">{stats.conversion_rate}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">نرخ تبدیل به خرید</p>
          </div>
        </div>
      )}

      {/* ✅ قبلاً daily_stats و top_sellers از بکند می‌آمدند ولی هیچ‌جای این
          صفحه رندر نمی‌شدند — کاملاً محاسبه می‌شدند و دور ریخته می‌شدند. */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              روند پیام‌های ۷ روز اخیر
            </h3>
            <div className="flex items-end gap-2 h-24">
              {stats.daily_stats.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t"
                      style={{ height: `${Math.max(4, (day.count / maxDailyCount) * 100)}%` }}
                      title={`${day.count} پیام`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              فروشندگان پرمکالمه
            </h3>
            {stats.top_sellers.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">داده‌ای موجود نیست</p>
            ) : (
              <div className="space-y-2">
                {stats.top_sellers.map((seller, idx) => (
                  <div key={seller.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4">{idx + 1}</span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {seller.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1 truncate">
                      {seller.shop_name || seller.name}
                    </span>
                    <Badge variant="accent" size="sm">{seller.conversations_count} مکالمه</Badge>
                  </div>
                ))}
              </div>
            )}
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
              placeholder="جستجو در نام کاربران یا محصول..."
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
            <option value="active">فعال</option>
            <option value="inactive">بسته شده</option>
          </select>
          <select
            value={messagesCountFilter}
            onChange={(e) => {
              setMessagesCountFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
          >
            <option value="all">تعداد پیام: همه</option>
            <option value="low">کم (۱-۵)</option>
            <option value="medium">متوسط (۶-۲۰)</option>
            <option value="high">زیاد (بیش از ۲۰)</option>
          </select>
          <Button onClick={handleSearch} className="w-full">
            <Filter className="w-4 h-4" />
            اعمال فیلتر
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-bold">مکالمه‌ای یافت نشد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={conv.is_active ? 'success' : 'gray'} size="sm">
                        {conv.is_active ? 'فعال' : 'بسته شده'}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {conv.messages_count} پیام
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(conv.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {conv.buyer?.name?.charAt(0) || '?'}
                          </div>
                          {conv.buyer_online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">خریدار</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{conv.buyer?.name || 'ناشناس'}</p>
                        </div>
                      </div>

                      <div className="text-gray-400 dark:text-gray-500">↔</div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {conv.seller?.name?.charAt(0) || '?'}
                          </div>
                          {conv.seller_online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">فروشنده</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{conv.seller?.name || 'ناشناس'}</p>
                        </div>
                      </div>
                    </div>

                    {conv.product && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <span>محصول:</span>
                        <span className="font-bold">{conv.product.name}</span>
                      </div>
                    )}

                    {conv.last_message && (
                      <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-2 text-xs">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{conv.last_message.sender?.name}:</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-1">{conv.last_message.content}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(conv)}
                    className="gap-1 flex-shrink-0"
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
      {showDetailModal && selectedConversation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                <h2 className="font-black text-lg">مکالمه #{selectedConversation.id}</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="hover:bg-white/20 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Conversation Info */}
              <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">خریدار</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{selectedConversation.buyer?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">فروشنده</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{selectedConversation.seller?.name}</p>
                  </div>
                  {selectedConversation.product && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">محصول</p>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{selectedConversation.product.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">وضعیت</p>
                    <Badge variant={selectedConversation.is_active ? 'success' : 'gray'} size="sm">
                      {selectedConversation.is_active ? 'فعال' : 'بسته شده'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stats */}
              {conversationStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{conversationStats.total_messages}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">کل پیام‌ها</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-green-600 dark:text-green-400">{conversationStats.buyer_messages}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">پیام خریدار</p>
                  </div>
                  <div className="bg-accent-50 dark:bg-accent-900/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-accent-600 dark:text-accent-400">{conversationStats.seller_messages}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">پیام فروشنده</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{conversationStats.duration_days} روز</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">مدت مکالمه</p>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-3 mb-4">
                {conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.sender_id === selectedConversation.buyer_id ? 'justify-start' :
                      msg.sender_id === selectedConversation.seller_id ? 'justify-end' :
                      'justify-center'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
                        msg.type === 'system'
                          ? 'bg-gradient-to-br from-accent-100 to-primary-100 dark:from-accent-900/30 dark:to-primary-900/30 text-gray-800 dark:text-gray-100 border border-accent-200 dark:border-accent-800'
                          : msg.sender_id === selectedConversation.buyer_id
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                          : 'bg-primary-500 text-white'
                      )}
                    >
                      <p className="text-xs font-bold mb-1 opacity-70">
                        {msg.sender?.name || 'سیستم'}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-60">
                        {new Date(msg.created_at).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {selectedConversation.is_active && (
              <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="پیام ادمین..."
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!adminMessage.trim() || isSending}
                    className="gap-1"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    ارسال
                  </Button>
                </div>
                <Button
                  onClick={handleCloseConversation}
                  variant="outline"
                  className="w-full gap-1 bg-red-500 text-white hover:bg-red-600 border-red-500"
                >
                  <Lock className="w-4 h-4" />
                  بستن مکالمه
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminChatMonitorPage;
