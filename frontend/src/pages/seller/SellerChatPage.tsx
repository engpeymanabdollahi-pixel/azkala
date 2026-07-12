import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, Search, Loader2, Send,
  ChevronLeft, Zap, Trash2, X, MoreVertical,
  Ban, Flag, Package, Bot, Plus, Edit2,
  ToggleLeft, ToggleRight, Sparkles,
  TrendingUp, Smile, Frown, Meh,
      ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { chatService, type ChatConversation, type ChatMessage } from '@/services/api/chat.service';
import { quickReplyService, type QuickReply } from '@/services/api/quickReply.service';
import { chatModerationService } from '@/services/api/chatModeration.service';
import { chatFaqService, type ChatFaq } from '@/services/api/chatFaq.service';
import { OnlineIndicator } from '@/components/chat/OnlineIndicator';
import toast from 'react-hot-toast';

export function SellerChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ==================== State ====================
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showModerationMenu, setShowModerationMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other'>('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<number, any>>({});
const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // 🤖 FAQ State
  const [showFaqPanel, setShowFaqPanel] = useState(false);
  const [faqs, setFaqs] = useState<ChatFaq[]>([]);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<ChatFaq | null>(null);
  const [faqForm, setFaqForm] = useState({
    question_pattern: '',
    answer: '',
    category: 'general' as const,
    priority: 0,
  });

  // 🧠 Sentiment State
  const [sentimentStats, setSentimentStats] = useState<any>(null);
  const [showSentimentPanel, setShowSentimentPanel] = useState(false);
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 🔄 Refs for Polling
  const selectedConvRef = useRef<number | null>(null);
  const messagesCountRef = useRef<number>(0);

  // ==================== Helper ====================
  const getOtherUser = (conv: ChatConversation) => conv.other_user || conv.buyer;
  const getOtherUserId = (conv: ChatConversation): number | undefined => conv.other_user?.id || conv.buyer_id;

  // ==================== Loaders ====================
  const loadConversations = useCallback(async () => {
    try {
      const response = await chatService.getConversations();
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
    }
  }, []);

  const loadMessages = useCallback(async (convId: number) => {
    try {
      console.log('📥 Loading messages for conversation:', convId);
      const response = await chatService.getMessages(convId);
      const data = response.data?.data || response.data;
      
      console.log('📬 Messages received:', data?.length || 0);
      
      if (Array.isArray(data)) {
        setMessages(data);
        messagesCountRef.current = data.length;
      }
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
    }
  }, []);

  // 🧠 Load Sentiment Stats
  const loadSentimentStats = useCallback(async () => {
    if (!selectedConversation) {
      console.log('⚠️ No selected conversation');
      return;
    }
    
    setIsLoadingSentiment(true);
    try {
      console.log('🧠 Loading sentiment stats for conv:', selectedConversation.id);
      const res = await chatService.getSentimentStats(selectedConversation.id);
      console.log('📊 Sentiment response:', res);
      
      if (res.success && res.data) {
        console.log('✅ Setting sentiment stats');
        setSentimentStats(res.data);
      } else {
        console.warn('⚠️ No data in response');
      }
    } catch (error: any) {
      console.error('❌ Error loading sentiment stats:', error);
      console.error('❌ Response:', error.response?.data);
      toast.error('خطا در بارگذاری آمار احساسات');
    } finally {
      setIsLoadingSentiment(false);
    }
  }, [selectedConversation]);

  // ==================== Effects ====================
  useEffect(() => {
    console.log('🚀 SellerChatPage mounted');
    loadConversations();
    loadQuickReplies();
    loadFaqs();
  }, []);

  // 🔄 Polling
  useEffect(() => {
    console.log('🔄 Polling started');
    
    const poll = async () => {
      await loadConversations();
      
      const currentConvId = selectedConvRef.current;
      if (currentConvId) {
        try {
          const response = await chatService.getMessages(currentConvId);
          const data = response.data?.data || response.data;
          
          if (Array.isArray(data) && data.length !== messagesCountRef.current) {
            console.log('🆕 New messages detected:', data.length);
            setMessages(data);
            messagesCountRef.current = data.length;
          }
        } catch (error) {
          console.error('❌ Polling messages error:', error);
        }
      }
      
      setTimeout(poll, 10000);
    };
    
    poll();
    
    return () => {
      console.log('🛑 Polling stopped');
    };
  }, []);

  useEffect(() => {
    selectedConvRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  // Load sentiment when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      console.log('🔄 Conversation changed, loading sentiment...');
      loadSentimentStats();
    } else {
      setSentimentStats(null);
    }
  }, [selectedConversation?.id]);

  // Load online statuses
  useEffect(() => {
    if (conversations.length === 0) return;
    
    const userIds = conversations
      .map(c => getOtherUserId(c))
      .filter((id): id is number => !!id);
    
    if (userIds.length === 0) return;
    
    const loadStatuses = async () => {
      try {
        const res = await chatService.getOnlineStatus(userIds);
        if (res.success) {
          const statusMap: Record<number, any> = {};
          res.data.forEach((status: any) => {
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
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ==================== Handlers ====================
  const selectConversation = async (conv: ChatConversation) => {
    console.log('👆 Selecting conversation:', conv.id);
    selectedConvRef.current = conv.id;
    setSelectedConversation(conv);
    setIsLoading(true);
    
    await loadMessages(conv.id);
    
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? { ...c, unread_count: 0 } : c
    ));
    
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    setIsSending(true);
    try {
      const response = await chatService.sendMessage(selectedConversation.id, messageInput);
      const newMessage = response.data;
      
      setMessages(prev => [...prev, newMessage]);
      messagesCountRef.current += 1;
      setMessageInput('');
      
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, last_message_at: newMessage.created_at }
          : c
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('خطا در ارسال پیام');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUseQuickReply = (content: string) => {
    setMessageInput(content);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    if (!confirm('آیا مطمئن هستید که می‌خواهید این مکالمه را حذف کنید؟')) return;

    try {
      await chatService.deleteConversation(selectedConversation.id);
      toast.success('مکالمه حذف شد');
      setSelectedConversation(null);
      setMessages([]);
      selectedConvRef.current = null;
      loadConversations();
    } catch (error) {
      toast.error('خطا در حذف مکالمه');
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation) return;
    const otherUserId = getOtherUserId(selectedConversation);
    if (!otherUserId) return;
    if (!confirm('آیا مطمئن هستید؟')) return;

    try {
      await chatModerationService.blockUser(otherUserId);
      toast.success('کاربر بلاک شد');
      setSelectedConversation(null);
      setMessages([]);
      selectedConvRef.current = null;
      loadConversations();
    } catch (error) {
      toast.error('خطا در بلاک کردن');
    }
  };

  const handleReportUser = async () => {
    if (!selectedConversation) return;
    const otherUserId = getOtherUserId(selectedConversation);
    if (!otherUserId) return;
    if (!reportReason) {
      toast.error('لطفاً دلیل را انتخاب کنید');
      return;
    }

    setIsReporting(true);
    try {
      await chatModerationService.reportUser({
        reported_user_id: otherUserId,
        conversation_id: selectedConversation.id,
        reason: reportReason,
        description: reportDescription || undefined,
      });
      toast.success('گزارش ثبت شد');
      setShowReportModal(false);
      setReportReason('spam');
      setReportDescription('');
    } catch (error) {
      toast.error('خطا در ثبت گزارش');
    } finally {
      setIsReporting(false);
    }
  };
const loadProductSuggestions = async () => {
  if (!selectedConversation) return;
  
  setIsLoadingSuggestions(true);
  try {
    const res = await chatService.getProductSuggestions(selectedConversation.id);
    if (res.success) {
      setProductSuggestions(res.data);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoadingSuggestions(false);
  }
};

const handleSuggestProduct = async (productId: number) => {
  if (!selectedConversation) return;
  
  try {
    const res = await chatService.suggestProduct(selectedConversation.id, productId);
    if (res.success) {
      setMessages(prev => [...prev, res.data.message]);
      toast.success('محصول پیشنهاد شد');
    }
  } catch (error) {
    toast.error('خطا در پیشنهاد محصول');
  }
};

useEffect(() => {
  if (selectedConversation) {
    loadProductSuggestions();
  }
}, [selectedConversation?.id]);

  // Loaders
  const loadQuickReplies = async () => {
    try {
      const res = await quickReplyService.getQuickReplies();
      if (res.success) setQuickReplies(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadFaqs = async () => {
    try {
      const res = await chatFaqService.getFaqs();
      if (res.success) setFaqs(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // 🤖 FAQ Handlers
  const handleSaveFaq = async () => {
    if (!faqForm.question_pattern.trim() || !faqForm.answer.trim()) {
      toast.error('الگو و پاسخ الزامی است');
      return;
    }
    try {
      if (editingFaq) {
        const res = await chatFaqService.updateFaq(editingFaq.id, faqForm);
        if (res.success) {
          setFaqs(faqs.map(f => f.id === editingFaq.id ? res.data : f));
          toast.success('FAQ بروزرسانی شد');
        }
      } else {
        const res = await chatFaqService.createFaq(faqForm);
        if (res.success) {
          setFaqs([...faqs, res.data]);
          toast.success('FAQ ساخته شد');
        }
      }
      setShowFaqForm(false);
      setEditingFaq(null);
      setFaqForm({ question_pattern: '', answer: '', category: 'general', priority: 0 });
    } catch (error) {
      toast.error('خطا در ذخیره FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('حذف شود؟')) return;
    try {
      await chatFaqService.deleteFaq(id);
      setFaqs(faqs.filter(f => f.id !== id));
      toast.success('FAQ حذف شد');
    } catch (error) {
      toast.error('خطا در حذف');
    }
  };

  const handleToggleFaq = async (faq: ChatFaq) => {
    try {
      const res = await chatFaqService.updateFaq(faq.id, { is_active: !faq.is_active });
      if (res.success) {
        setFaqs(faqs.map(f => f.id === faq.id ? res.data : f));
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('FAQ های پیش‌فرض اضافه شوند؟')) return;
    try {
      const res = await chatFaqService.seedDefaults();
      if (res.success) {
        loadFaqs();
        toast.success('FAQ های پیش‌فرض اضافه شدند');
      } else {
        toast.error(res.message || 'خطا');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا');
    }
  };

  // ==================== Computed ====================
  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherUser(conv);
    const matchesSearch = otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'unread' && (conv.unread_count || 0) > 0) ||
                         (filterStatus === 'read' && (conv.unread_count || 0) === 0);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: conversations.length,
    unread: conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
  };

  // ==================== Render ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/seller/dashboard')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900">پیام‌ها</h1>
              <p className="text-sm text-gray-600">مدیریت مکالمات با مشتریان</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <MessageCircle className="w-5 h-5 text-primary-500" />
              <div>
                <p className="text-xs text-gray-600">کل مکالمات</p>
                <p className="font-black text-gray-900">{stats.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <Badge variant="error" size="sm" className="w-6 h-6 flex items-center justify-center">
                {stats.unread}
              </Badge>
              <div>
                <p className="text-xs text-gray-600">خوانده نشده</p>
                <p className="font-black text-gray-900">{stats.unread}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو..."
                  className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'unread', 'read'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors',
                      filterStatus === status
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {status === 'all' ? 'همه' : status === 'unread' ? 'خوانده نشده' : 'خوانده شده'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[600px]">
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">مکالمه‌ای یافت نشد</p>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const otherUser = getOtherUser(conv);
                  const otherUserId = getOtherUserId(conv);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={cn(
                        'p-3 border-b border-gray-100 cursor-pointer transition-colors',
                        selectedConversation?.id === conv.id
                          ? 'bg-primary-50 border-r-4 border-r-primary-500'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                            {otherUser?.name?.charAt(0) || '?'}
                          </div>
                          {otherUserId && onlineStatuses[otherUserId] && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
                              <OnlineIndicator 
                                isOnline={onlineStatuses[otherUserId].is_online}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="font-bold text-sm text-gray-900 truncate">
                              {otherUser?.name || 'کاربر'}
                            </p>
                            {(conv.unread_count || 0) > 0 && (
                              <Badge variant="error" size="sm" className="text-[10px]">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          {conv.product && (
                            <p className="text-[10px] text-primary-600 truncate mb-0.5">
                              {conv.product.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 truncate">
                            {conv.last_message?.content || conv.messages?.[0]?.content || 'شروع مکالمه...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[700px]">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">یک مکالمه را انتخاب کنید</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                {(() => {
                  const otherUser = getOtherUser(selectedConversation);
                  const otherUserId = getOtherUserId(selectedConversation);
                  
                  return (
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                            {otherUser?.name?.charAt(0) || '?'}
                          </div>
                          {otherUserId && onlineStatuses[otherUserId] && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
                              <OnlineIndicator 
                                isOnline={onlineStatuses[otherUserId].is_online}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900">
                            {otherUser?.name || 'کاربر'}
                          </h3>
                          {otherUserId && onlineStatuses[otherUserId] && (
                            <OnlineIndicator 
                              isOnline={onlineStatuses[otherUserId].is_online}
                              lastSeen={onlineStatuses[otherUserId].last_seen}
                              size="sm"
                              showText
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                       {/* 🧠 دکمه آمار احساسات */}
                                    <button
                                  onClick={async () => {
                                console.log('👆 دکمه احساسات کلیک شد!');
                                  console.log('🔍 showSentimentPanel:', showSentimentPanel);
    
                          // هر بار که کلیک می‌شود، داده‌ها را دوباره load کن
                             console.log('🔄 Reloading sentiment stats...');
                             await loadSentimentStats();
    
                           // بعد از load، panel را باز کن
                         setShowSentimentPanel(true);
                                   }}
                         className="p-2 hover:bg-white rounded-lg transition-colors text-gray-700 hover:text-purple-600"
                                   title="آمار احساسات"
                              >
                             <TrendingUp className="w-5 h-5" />
                             </button>
{/* 💡 دکمه پیشنهادات محصول */}
<button
  onClick={() => {
    setShowSuggestionsPanel(!showSuggestionsPanel);
    if (!showSuggestionsPanel) {
      loadProductSuggestions();
    }
  }}
  className="p-2 hover:bg-white rounded-lg transition-colors text-gray-700 hover:text-accent-600"
  title="پیشنهادات محصول"
>
  <ShoppingBag className="w-5 h-5" />
</button>

                        {/* 🤖 دکمه FAQ */}
                        <button
                          onClick={() => setShowFaqPanel(true)}
                          className="p-2 hover:bg-white rounded-lg transition-colors text-gray-700 hover:text-primary-600"
                          title="مدیریت ربات FAQ"
                        >
                          <Bot className="w-5 h-5" />
                        </button>

                        {/* ⋮ دکمه More */}
                        <div className="relative">
                          <button
                            onClick={() => setShowModerationMenu(!showModerationMenu)}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {showModerationMenu && (
                            <div className="absolute top-10 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[180px]">
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
                                  handleDeleteConversation();
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
                      </div>
                    </div>
                  );
                })()}

                {/* Product Info */}
                {selectedConversation.product && (
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    {selectedConversation.product.main_image && (
                      <img
                        src={selectedConversation.product.main_image}
                        alt={selectedConversation.product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {selectedConversation.product.name}
                      </p>
                      <p className="text-xs text-gray-500">درباره این محصول</p>
                    </div>
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {isLoading && messages.length === 0 ? (
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
                      const isOwn = msg.sender_id === user?.id;
                      const isSystem = msg.type === 'system';
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
                              isSystem
                                ? 'bg-gradient-to-br from-accent-100 to-primary-100 text-gray-800 border border-accent-200 rounded-br-sm'
                                : isOwn
                                ? 'bg-primary-500 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                            )}
                          >
                            {isSystem && (
                              <div className="flex items-center gap-1 mb-1 text-[10px] text-accent-700 font-bold">
                                <Bot className="w-3 h-3" />
                                <span>پاسخ خودکار</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={cn(
                              'text-[10px] mt-1',
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

                {/* Quick Replies */}
                {quickReplies.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-yellow-50">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                      <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      {quickReplies.map(reply => (
                        <button
                          key={reply.id}
                          onClick={() => handleUseQuickReply(reply.content)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all whitespace-nowrap flex-shrink-0 shadow-sm"
                          title={reply.content}
                        >
                          {reply.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="پیام خود را بنویسید..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                      disabled={isSending}
                      autoComplete="off"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isSending}
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                        messageInput.trim() && !isSending
                          ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 🧠 Sentiment Panel */}
      {showSentimentPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                <div>
                  <h2 className="font-black text-lg">تحلیل احساسات</h2>
                  <p className="text-xs text-white/80">بررسی احساسات مشتری در این مکالمه</p>
                </div>
              </div>
              <button
                onClick={() => setShowSentimentPanel(false)}
                className="hover:bg-white/20 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingSentiment && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">در حال بارگذاری آمار احساسات...</p>
                </div>
              )}

              {!isLoadingSentiment && !sentimentStats && (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-bold text-gray-600">آمار احساسات موجود نیست</p>
                  <p className="text-xs text-gray-500 mt-1">پیام‌ها هنوز تحلیل نشده‌اند</p>
                  <button
                    onClick={loadSentimentStats}
                    className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-600"
                  >
                    تلاش مجدد
                  </button>
                </div>
              )}

              {!isLoadingSentiment && sentimentStats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 text-center">
                      <Smile className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-3xl font-black text-green-700">
                        {sentimentStats.stats?.positive_percent || 0}%
                      </p>
                      <p className="text-xs text-green-600 font-semibold mt-1">مثبت</p>
                      <p className="text-[10px] text-green-500">
                        {sentimentStats.stats?.positive || 0} پیام
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 text-center">
                      <Meh className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-3xl font-black text-gray-700">
                        {sentimentStats.stats?.neutral_percent || 0}%
                      </p>
                      <p className="text-xs text-gray-600 font-semibold mt-1">خنثی</p>
                      <p className="text-[10px] text-gray-500">
                        {sentimentStats.stats?.neutral || 0} پیام
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 text-center">
                      <Frown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-3xl font-black text-red-700">
                        {sentimentStats.stats?.negative_percent || 0}%
                      </p>
                      <p className="text-xs text-red-600 font-semibold mt-1">منفی</p>
                      <p className="text-[10px] text-red-500">
                        {sentimentStats.stats?.negative || 0} پیام
                      </p>
                    </div>
                  </div>

                  {sentimentStats.stats && (
                    <div className={cn(
                      'rounded-xl p-4 border-2',
                      sentimentStats.stats.overall_sentiment === 'positive' ? 'bg-green-50 border-green-200' :
                      sentimentStats.stats.overall_sentiment === 'negative' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-1">احساس کلی مشتری</p>
                          <p className={cn(
                            'text-2xl font-black',
                            sentimentStats.stats.overall_sentiment === 'positive' ? 'text-green-700' :
                            sentimentStats.stats.overall_sentiment === 'negative' ? 'text-red-700' :
                            'text-gray-700'
                          )}>
                            {sentimentStats.stats.overall_sentiment === 'positive' ? '😊 راضی' :
                             sentimentStats.stats.overall_sentiment === 'negative' ? '😞 ناراضی' :
                             '😐 خنثی'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">امتیاز</p>
                          <p className="text-3xl font-black text-gray-900">
                            {sentimentStats.stats.average_score.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-red-500 to-red-600 text-white">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                <h3 className="font-bold">گزارش تخلف</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="hover:bg-white/20 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">دلیل گزارش</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="spam">اسپم و تبلیغات</option>
                  <option value="harassment">آزار و اذیت</option>
                  <option value="inappropriate">محتوای نامناسب</option>
                  <option value="scam">کلاهبرداری</option>
                  <option value="other">سایر</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">توضیحات (اختیاری)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="توضیحات بیشتر..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 resize-none"
                  maxLength={1000}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50">
                  انصراف
                </button>
                <button
                  onClick={handleReportUser}
                  disabled={isReporting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-50"
                >
                  {isReporting ? 'در حال ارسال...' : 'ارسال گزارش'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{/* 💡 Product Suggestions Panel */}
{showSuggestionsPanel && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
      <div className="p-4 border-b bg-gradient-to-r from-accent-500 to-primary-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          <div>
            <h2 className="font-black text-lg">پیشنهادات محصول</h2>
            <p className="text-xs text-white/80">محصولات مرتبط برای پیشنهاد به مشتری</p>
          </div>
        </div>
        <button
          onClick={() => setShowSuggestionsPanel(false)}
          className="hover:bg-white/20 p-2 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingSuggestions && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-accent-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">در حال بارگذاری پیشنهادات...</p>
          </div>
        )}

        {!isLoadingSuggestions && productSuggestions.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-bold text-gray-600">پیشنهادی یافت نشد</p>
            <p className="text-xs text-gray-500 mt-1">محصولی برای پیشنهاد وجود ندارد</p>
          </div>
        )}

        {!isLoadingSuggestions && productSuggestions.length > 0 && (
          <div className="space-y-3">
            {productSuggestions.map((product) => (
              <div
                key={product.id}
                className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:border-accent-300 transition-all"
              >
                <div className="flex gap-3">
                  {product.main_image && (
                    <img
                      src={product.main_image}
                      alt={product.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 truncate">
                      {product.name}
                    </h3>
                  <div className="flex items-center gap-2 mb-2">
  <span className="text-lg font-black text-accent-600">
    {product.discount_price 
      ? `${Number(product.discount_price).toLocaleString('fa-IR')} تومان`
      : `${Number(product.price || 0).toLocaleString('fa-IR')} تومان`
    }
  </span>
  {product.discount_price && (
    <span className="text-xs text-gray-500 line-through">
      {Number(product.price || 0).toLocaleString('fa-IR')}
    </span>
  )}
</div>
                   <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
  <span className="flex items-center gap-1">
    ⭐ {Number(product.rating || 0).toFixed(1)}
  </span>
  <span className="flex items-center gap-1">
    🛒 {Number(product.sales_count || 0)} فروش
  </span>
</div>
<div className="flex items-center gap-2">
  <span className="text-[10px] px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full font-semibold">
    {product.reason}
  </span>
  <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
    امتیاز: {(Number(product.score || 0) * 100).toFixed(0)}%
  </span>
</div>
                  </div>
                  <button
                    onClick={() => handleSuggestProduct(product.id)}
                    className="flex-shrink-0 px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-bold hover:bg-accent-600 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    پیشنهاد
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* 🤖 FAQ Panel */}
      {showFaqPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b bg-gradient-to-r from-primary-500 to-accent-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <div>
                  <h2 className="font-black text-lg">ربات پاسخ خودکار (FAQ)</h2>
                  <p className="text-xs text-white/80">پاسخ خودکار به سوالات متداول مشتریان</p>
                </div>
              </div>
              <button onClick={() => setShowFaqPanel(false)} className="hover:bg-white/20 p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setEditingFaq(null);
                    setFaqForm({ question_pattern: '', answer: '', category: 'general', priority: 0 });
                    setShowFaqForm(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-bold hover:bg-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  FAQ جدید
                </button>
                <button
                  onClick={handleSeedDefaults}
                  className="flex items-center gap-1.5 px-3 py-2 bg-accent-500 text-white rounded-lg text-sm font-bold hover:bg-accent-600"
                >
                  <Sparkles className="w-4 h-4" />
                  FAQ های پیش‌فرض
                </button>
              </div>

              {showFaqForm && (
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-primary-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary-600" />
                    {editingFaq ? 'ویرایش FAQ' : 'FAQ جدید'}
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      الگوی سوال (Regex)
                      <span className="text-gray-500 font-normal mr-1">- کلمات با | جدا شوند</span>
                    </label>
                    <input
                      type="text"
                      value={faqForm.question_pattern}
                      onChange={(e) => setFaqForm({ ...faqForm, question_pattern: e.target.value })}
                      placeholder="مثال: قیمت|چند|هزینه"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">پاسخ خودکار</label>
                    <textarea
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      placeholder="پاسخ ربات..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">دسته‌بندی</label>
                      <select
                        value={faqForm.category}
                        onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="general">عمومی</option>
                        <option value="shipping">ارسال</option>
                        <option value="payment">پرداخت</option>
                        <option value="product">محصول</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">اولویت (0-100)</label>
                      <input
                        type="number"
                        value={faqForm.priority}
                        onChange={(e) => setFaqForm({ ...faqForm, priority: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowFaqForm(false);
                        setEditingFaq(null);
                      }}
                      className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleSaveFaq}
                      className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-bold hover:bg-primary-600"
                    >
                      ذخیره
                    </button>
                  </div>
                </div>
              )}

              {faqs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bot className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">هنوز FAQ ای نساخته‌اید</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {faqs.map(faq => (
                    <div
                      key={faq.id}
                      className={cn(
                        'bg-white border rounded-xl p-3 transition-all',
                        faq.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="primary" size="sm" className="text-[10px]">
                              {faq.category === 'general' ? 'عمومی' :
                               faq.category === 'shipping' ? 'ارسال' :
                               faq.category === 'payment' ? 'پرداخت' : 'محصول'}
                            </Badge>
                            <span className="text-[10px] text-gray-500">اولویت: {faq.priority}</span>
                            <span className="text-[10px] text-gray-500">استفاده: {faq.usage_count}x</span>
                          </div>
                          <p className="text-xs font-mono text-primary-600 bg-primary-50 px-2 py-1 rounded mb-1" dir="ltr">
                            /{faq.question_pattern}/
                          </p>
                          <p className="text-sm text-gray-700">{faq.answer}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleToggleFaq(faq)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              faq.is_active ? 'text-success-600 hover:bg-success-50' : 'text-gray-400 hover:bg-gray-50'
                            )}
                          >
                            {faq.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingFaq(faq);
                              setFaqForm({
                                question_pattern: faq.question_pattern,
                                answer: faq.answer,
                                category: faq.category,
                                priority: faq.priority,
                              });
                              setShowFaqForm(true);
                            }}
                            className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="text-error-600 hover:bg-error-50 p-1.5 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}