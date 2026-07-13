import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, X, Send, Minus, ChevronLeft, Loader2,
  Zap, Trash2, MoreVertical, Ban, Flag, Ticket,
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { chatService, type OnlineStatus } from '@/services/api/chat.service';
import { quickReplyService, type QuickReply } from '@/services/api/quickReply.service';
import { chatModerationService } from '@/services/api/chatModeration.service';
import { OnlineIndicator } from './OnlineIndicator';
import toast from 'react-hot-toast';
import apiClient from '@/services/api/client';

export function ChatWidget() {
  const { isAuthenticated } = useAuthStore();
  const {
    conversations, activeConversation, messages,
    isLoading, isSending, unreadCount, isOpen,
    loadConversations, selectConversation, sendMessage,
    toggleChat, closeChat
  } = useChatStore();

  // ==================== State ====================
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Moderation State
  const [showModerationMenu, setShowModerationMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other'>('spam');
  const [reportDescription, setReportDescription] = useState('');
const [isReporting, setIsReporting] = useState(false);
const [showTicketModal, setShowTicketModal] = useState(false);
const [ticketSubject, setTicketSubject] = useState('');
const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Quick Replies State
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showManageQuickReplies, setShowManageQuickReplies] = useState(false);
  const [newReplyTitle, setNewReplyTitle] = useState('');
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isCreatingReply, setIsCreatingReply] = useState(false);

  // Online Status State
  const [onlineStatuses, setOnlineStatuses] = useState<Record<number, OnlineStatus>>({});

  // بررسی اینکه کاربر فعلی فروشنده است یا خریدار
  const isSeller = activeConversation && useAuthStore.getState().user?.id === activeConversation.seller_id;

  // ==================== Effects ====================
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadConversations();
    }
  }, [isAuthenticated, isOpen]);

  // 🔄 Polling بهینه - فقط وقتی Widget باز است (هر 10 ثانیه)
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await chatService.getConversations();
        const newConversations = response.data.data || response.data;
        useChatStore.setState({ conversations: newConversations });
        
        const currentConv = useChatStore.getState().activeConversation;
        if (currentConv) {
          const msgResponse = await chatService.getMessages(currentConv.id);
          const newMessages = msgResponse.data.data || msgResponse.data;
          
          useChatStore.setState(state => {
            if (newMessages.length !== state.messages.length) {
              return { messages: newMessages };
            }
            return {};
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeConversation && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversation]);

  // Load Quick Replies برای فروشنده
  useEffect(() => {
    if (isSeller && isOpen) {
      quickReplyService.getQuickReplies(activeConversation?.seller_id)
        .then(res => {
          if (res.success) setQuickReplies(res.data);
        })
        .catch(console.error);
    }
  }, [isSeller, isOpen]);

  // Load Online Statuses
  useEffect(() => {
    if (!isOpen || conversations.length === 0) return;
    
    const userIds = conversations
      .map(c => c.other_user?.id)
      .filter((id): id is number => !!id);
    
    if (userIds.length === 0) return;
    
    const loadStatuses = async () => {
      try {
        const res = await chatService.getOnlineStatus(userIds);
        if (res.success) {
          const statusMap: Record<number, OnlineStatus> = {};
          res.data.forEach(status => {
            statusMap[status.id] = status;
          });
          setOnlineStatuses(statusMap);
        }
      } catch (error) {
        console.error('Failed to load online statuses:', error);
      }
    };
    
    loadStatuses();
    const interval = setInterval(loadStatuses, 30000);
    return () => clearInterval(interval);
  }, [isOpen, conversations]);

  // ==================== Handlers ====================
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    await sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBlockUser = async () => {
    if (!activeConversation?.other_user?.id) return;
    if (!confirm(`آیا مطمئن هستید که می‌خواهید ${activeConversation.other_user.name} را بلاک کنید؟`)) return;

    try {
      await chatModerationService.blockUser(activeConversation.other_user.id);
      toast.success('کاربر بلاک شد');
      useChatStore.setState({ activeConversation: null, messages: [] });
    } catch (error) {
      toast.error('خطا در بلاک کردن کاربر');
    }
  };

  const handleReportUser = async () => {
    if (!activeConversation?.other_user?.id) return;
    if (!reportReason) {
      toast.error('لطفاً دلیل گزارش را انتخاب کنید');
      return;
    }

    setIsReporting(true);
    try {
      await chatModerationService.reportUser({
        reported_user_id: activeConversation.other_user.id,
        conversation_id: activeConversation.id,
        reason: reportReason,
        description: reportDescription || undefined,
      });
      toast.success('گزارش شما ثبت شد');
      setShowReportModal(false);
      setReportReason('spam');
      setReportDescription('');
    } catch (error) {
      toast.error('خطا در ثبت گزارش');
    } finally {
      setIsReporting(false);
    }
  };
const handleConvertToTicket = async () => {
  if (!activeConversation) return;
  if (!ticketSubject.trim()) {
    toast.error('لطفاً موضوع تیکت را وارد کنید');
    return;
  }

  setIsCreatingTicket(true);
  try {
    const res = await apiClient.post(`/tickets/convert/${activeConversation.id}`, {
      subject: ticketSubject,
      priority: 'medium',
      category: 'general',
    });
    if (res.data.success) {
      toast.success('مکالمه با موفقیت به تیکت تبدیل شد');
      setShowTicketModal(false);
      setTicketSubject('');
    }
  } catch (error) {
    toast.error('خطا در تبدیل به تیکت');
  } finally {
    setIsCreatingTicket(false);
  }
};

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    try {
      await chatService.deleteConversation(activeConversation.id);
      toast.success('مکالمه حذف شد');
      useChatStore.setState({ activeConversation: null, messages: [] });
      loadConversations();
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error('خطا در حذف مکالمه');
    }
  };

  // Quick Replies Handlers
  const handleUseQuickReply = (content: string) => {
    setMessageInput(content);
    inputRef.current?.focus();
  };

  const handleCreateQuickReply = async () => {
    if (!newReplyTitle.trim() || !newReplyContent.trim()) return;
    setIsCreatingReply(true);
    try {
      const res = await quickReplyService.createQuickReply(newReplyTitle, newReplyContent);
      if (res.success) {
        setQuickReplies([...quickReplies, res.data]);
        setNewReplyTitle('');
        setNewReplyContent('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'خطا در ساخت پاسخ سریع');
    } finally {
      setIsCreatingReply(false);
    }
  };

  const handleDeleteQuickReply = async (id: number) => {
    if (!confirm('این پاسخ سریع حذف شود؟')) return;
    try {
      await quickReplyService.deleteQuickReply(id);
      setQuickReplies(quickReplies.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge
              variant="error"
              size="sm"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] rounded-full"
            >
              {unreadCount}
            </Badge>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {activeConversation && (
                <button
                  onClick={() => useChatStore.setState({ activeConversation: null, messages: [] })}
                  className="hover:bg-white/20 p-1 rounded flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-sm truncate">
                  {activeConversation
                    ? activeConversation.other_user?.name || 'چت'
                    : 'پیام‌ها'}
                </h3>
                {activeConversation?.other_user?.id && onlineStatuses[activeConversation.other_user.id] && (
                  <OnlineIndicator 
                    isOnline={onlineStatuses[activeConversation.other_user.id].is_online}
                    lastSeen={onlineStatuses[activeConversation.other_user.id].last_seen}
                    size="sm"
                    showText
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
{activeConversation && (
  <button
    onClick={() => {
      setTicketSubject(`مشکل در مکالمه با ${activeConversation.other_user?.name}`);
      setShowTicketModal(true);
    }}
    className="hover:bg-white/20 p-1 rounded"
    title="تبدیل به تیکت پشتیبانی"
  >
    <Ticket className="w-4 h-4" />
  </button>
)}
              {activeConversation && (
                <div className="relative">
                  <button 
                    onClick={() => setShowModerationMenu(!showModerationMenu)}
                    className="hover:bg-white/20 p-1 rounded"
                    title="گزینه‌ها"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showModerationMenu && (
                    <div className="absolute top-8 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-30 min-w-[180px]">
                      <button
                        onClick={() => {
                          setShowReportModal(true);
                          setShowModerationMenu(false);
                        }}
                        className="w-full px-3 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-end gap-2"
                      >
                        <span>گزارش تخلف</span>
                        <Flag className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          handleBlockUser();
                          setShowModerationMenu(false);
                        }}
                        className="w-full px-3 py-2 text-right text-sm text-orange-600 hover:bg-orange-50 flex items-center justify-end gap-2"
                      >
                        <span>بلاک کردن</span>
                        <Ban className="w-4 h-4" />
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true);
                          setShowModerationMenu(false);
                        }}
                        className="w-full px-3 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2"
                      >
                        <span>حذف مکالمه</span>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button onClick={closeChat} className="hover:bg-white/20 p-1 rounded" title="کوچک کردن">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={closeChat} className="hover:bg-white/20 p-1 rounded" title="بستن">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {!activeConversation ? (
              /* Conversations List */
              <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-bold">هنوز مکالمه‌ای ندارید</p>
                    <p className="text-xs mt-1">از صفحه محصول با فروشنده چت کنید</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                            {conv.other_user?.name?.charAt(0) || '?'}
                          </div>
                          {conv.other_user?.id && onlineStatuses[conv.other_user.id] && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
                              <OnlineIndicator 
                                isOnline={onlineStatuses[conv.other_user.id].is_online}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-sm text-gray-900 truncate">
                              {conv.other_user?.name || 'کاربر'}
                            </p>
                            {(conv.unread_count || 0) > 0 && (
                              <Badge variant="error" size="sm" className="text-[10px]">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          {conv.product && (
                            <p className="text-[10px] text-primary-600 truncate">
                              درباره: {conv.product.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {conv.messages?.[0]?.content || 'شروع مکالمه...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Messages View */
              <>
                {/* Product Info */}
                {activeConversation.product && (
                  <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
                    {activeConversation.product.main_image && (
                      <img
                        src={activeConversation.product.main_image}
                        alt={activeConversation.product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {activeConversation.product.name}
                      </p>
                      <p className="text-[10px] text-gray-500">درباره این محصول</p>
                    </div>
                  </div>
                )}

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">اولین پیام را ارسال کنید!</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isOwn = msg.sender_id === useAuthStore.getState().user?.id;
                      const isSystem = msg.type === 'system';
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[75%] rounded-2xl px-3 py-2 shadow-sm',
                              isSystem
                                ? 'bg-gradient-to-br from-accent-100 to-primary-100 text-gray-800 border border-accent-200 rounded-br-sm'
                                : isOwn
                                ? 'bg-primary-500 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                            )}
                          >
                            {isSystem && (
                              <div className="flex items-center gap-1 mb-1 text-[10px] text-accent-700 font-bold">
                                <MessageCircle className="w-3 h-3" />
                                <span>پاسخ خودکار</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={cn(
                              'text-[10px] mt-0.5',
                              isSystem ? 'text-accent-600' :
                              isOwn ? 'text-primary-100' : 'text-gray-400'
                            )}>
                              {new Date(msg.created_at).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies - فقط برای فروشنده */}
                {isSeller && quickReplies.length > 0 && (
                  <div className="px-3 py-2 border-t border-gray-100 bg-gradient-to-r from-yellow-50 to-white flex-shrink-0">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                      {quickReplies.map(reply => (
                        <button
                          key={reply.id}
                          onClick={() => handleUseQuickReply(reply.content)}
                          className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[11px] font-semibold text-gray-700 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all whitespace-nowrap flex-shrink-0 shadow-sm"
                          title={reply.content}
                        >
                          {reply.title}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowManageQuickReplies(true)}
                        className="px-2 py-1 text-[10px] text-gray-500 hover:text-primary-600 flex-shrink-0 font-semibold"
                      >
                        + مدیریت
                      </button>
                    </div>
                  </div>
                )}

                {isSeller && quickReplies.length === 0 && (
                  <div className="px-3 py-2 border-t border-gray-100 bg-yellow-50 flex-shrink-0">
                    <button
                      onClick={() => setShowManageQuickReplies(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-yellow-700 hover:text-yellow-800"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      پاسخ‌های سریع خود را بسازید
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="پیام خود را بنویسید..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                      disabled={isSending}
                      autoComplete="off"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isSending}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        messageInput.trim() && !isSending
                          ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Delete Confirm Modal */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
                  <div className="p-3 border-b bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      <h3 className="font-bold text-sm">حذف مکالمه</h3>
                    </div>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="hover:bg-white/20 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 mb-4">
                      آیا مطمئن هستید که می‌خواهید این مکالمه را حذف کنید؟
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={handleDeleteConversation}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
                  <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      <h3 className="font-bold text-sm">گزارش تخلف</h3>
                    </div>
                    <button 
                      onClick={() => setShowReportModal(false)}
                      className="hover:bg-white/20 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">دلیل گزارش</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="spam">اسپم و تبلیغات</option>
                        <option value="harassment">آزار و اذیت</option>
                        <option value="inappropriate">محتوای نامناسب</option>
                        <option value="scam">کلاهبرداری</option>
                        <option value="other">سایر</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">توضیحات (اختیاری)</label>
                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="توضیحات بیشتر..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 resize-none"
                        maxLength={1000}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowReportModal(false)}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={handleReportUser}
                        disabled={isReporting}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-50"
                      >
                        {isReporting ? 'در حال ارسال...' : 'ارسال گزارش'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies Management Modal */}
            {showManageQuickReplies && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-sm max-h-[80%] overflow-hidden flex flex-col shadow-2xl">
                  <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600 text-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <h3 className="font-bold text-sm">مدیریت پاسخ‌های سریع</h3>
                    </div>
                    <button 
                      onClick={() => setShowManageQuickReplies(false)}
                      className="hover:bg-white/20 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {quickReplies.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-bold text-gray-700">پاسخ‌های شما:</p>
                        {quickReplies.map(reply => (
                          <div key={reply.id} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-bold text-xs text-gray-900">{reply.title}</p>
                              <button 
                                onClick={() => handleDeleteQuickReply(reply.id)} 
                                className="text-red-500 hover:text-red-600 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-gray-600 line-clamp-2">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="pt-2 border-t">
                      <p className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                        <span>➕</span>
                        افزودن پاسخ جدید
                      </p>
                      <input
                        type="text"
                        value={newReplyTitle}
                        onChange={(e) => setNewReplyTitle(e.target.value)}
                        placeholder="عنوان (مثلاً: خوش‌آمدگویی)"
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs mb-1.5 focus:outline-none focus:border-primary-500"
                        maxLength={50}
                      />
                      <textarea
                        value={newReplyContent}
                        onChange={(e) => setNewReplyContent(e.target.value)}
                        placeholder="متن پاسخ..."
                        rows={2}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs mb-1.5 resize-none focus:outline-none focus:border-primary-500"
                        maxLength={500}
                      />
                      <button
                        onClick={handleCreateQuickReply}
                        disabled={!newReplyTitle.trim() || !newReplyContent.trim() || isCreatingReply}
                        className="w-full py-1.5 bg-primary-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
                      >
                        {isCreatingReply ? 'در حال ساخت...' : 'افزودن پاسخ'}
                      </button>
                      <p className="text-[10px] text-gray-500 text-center mt-1.5">
                        حداکثر ۱۰ پاسخ سریع
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
{/* Convert to Ticket Modal */}
{showTicketModal && activeConversation && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
      <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          <h3 className="font-black">تبدیل به تیکت پشتیبانی</h3>
        </div>
        <button
          onClick={() => setShowTicketModal(false)}
          className="hover:bg-white/20 p-1.5 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-800">
            ⚠️ این مکالمه به تیکت پشتیبانی تبدیل می‌شود و تیم پشتیبانی آن را بررسی خواهد کرد.
          </p>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">موضوع تیکت</label>
          <input
            type="text"
            value={ticketSubject}
            onChange={(e) => setTicketSubject(e.target.value)}
            placeholder="موضوع مشکل را وارد کنید..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowTicketModal(false)}
            variant="outline"
            className="flex-1"
          >
            انصراف
          </Button>
          <Button
            onClick={handleConvertToTicket}
            disabled={isCreatingTicket}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isCreatingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
            تبدیل به تیکت
          </Button>
        </div>
      </div>
    </div>
  </div>
)}
        </div>
      )}
    </>
  );
}