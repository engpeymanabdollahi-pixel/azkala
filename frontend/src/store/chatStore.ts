import { create } from 'zustand';
import { chatService, type ChatConversation, type ChatMessage } from '@/services/api/chat.service';
// ❌ حذف: import echo from '@/lib/echo';
import { playNotificationSound, showBrowserNotification } from '@/lib/notification';
import { useAuthStore } from './authStore';
import toast from 'react-hot-toast';

interface ChatState {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  unreadCount: number;
  isOpen: boolean;

  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (conversation: ChatConversation) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  startConversation: (sellerId: number, productId?: number) => Promise<ChatConversation>;
  refreshMessages: () => Promise<void>; // ✅ جدید
}

// ==================== Store ====================
export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  unreadCount: 0,
  isOpen: false,

  loadConversations: async () => {
    // از تنظیم مجدد isLoading به true خودداری می‌کنیم تا UI در حین polling ثابت بماند
    try {
      const response = await chatService.getConversations();
      const newConversations = response.data.data || response.data;
      const prevConversations = get().conversations;

      // 🔔 تشخیص پیام‌های جدید برای نمایش نوتیفیکیشن
      const currentUserId = useAuthStore.getState().user?.id;
      const newUnreadMessages: { conversation: ChatConversation; message: ChatMessage }[] = [];

      newConversations.forEach((newConv: ChatConversation) => {
        const prevConv = prevConversations.find(c => c.id === newConv.id);
        if (prevConv && newConv.last_message_at !== prevConv.last_message_at) {
          // پیام جدید آمده است
          if (newConv.messages && newConv.messages.length > 0) {
            const lastMessage = newConv.messages[0];
            if (lastMessage.sender_id !== currentUserId) {
              newUnreadMessages.push({ conversation: newConv, message: lastMessage });
            }
          }
        }
      });

      // نمایش نوتیفیکیشن برای پیام‌های جدید (فقط اگر چت باز نیست یا مکالمه فعال نیست)
      const activeConvId = get().activeConversation?.id;
      newUnreadMessages.forEach(({ conversation, message }) => {
        if (conversation.id !== activeConvId) {
          playNotificationSound();
          const senderName = conversation.other_user?.name || 'کاربر';
          const preview = message.content.length > 50 
            ? message.content.substring(0, 50) + '...' 
            : message.content;
          toast.success(`${senderName}: ${preview}`, {
            duration: 5000,
            position: 'top-right',
            icon: '💬',
          });
          showBrowserNotification(`پیام جدید از ${senderName}`, preview);
        }
      });

      set({
        conversations: newConversations,
        unreadCount: newConversations.reduce((sum: number, c: ChatConversation) => sum + (c.unread_count || 0), 0),
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  },

  selectConversation: async (conversation) => {
    set({ activeConversation: conversation, isLoading: true });
    try {
      const response = await chatService.getMessages(conversation.id);
      set({
        messages: response.data.data || response.data,
        activeConversation: { ...conversation, unread_count: 0 },
      });

      // محاسبه مجدد unread count
      const conversations = get().conversations.map(c =>
        c.id === conversation.id ? { ...c, unread_count: 0 } : c
      );
      const unreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      set({ conversations, unreadCount });

      // ❌ حذف کامل: کد echo.private(...) که دیگر کار نمی‌کند
      // ✅ Polling از قبل فعال است و پیام‌های جدید را خودکار دریافت می‌کند
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ متد جدید: بروزرسانی دستی پیام‌ها (برای Polling)
  refreshMessages: async () => {
    const { activeConversation, messages: currentMessages } = get();
    if (!activeConversation) return;

    try {
      const response = await chatService.getMessages(activeConversation.id);
      const newMessages = response.data.data || response.data;
      const currentUserId = useAuthStore.getState().user?.id;

      // 🔔 تشخیص پیام‌های جدید برای نوتیفیکیشن
      if (newMessages.length > currentMessages.length) {
        const newOnes = newMessages.slice(currentMessages.length);
        newOnes.forEach((msg: ChatMessage) => {
          if (msg.sender_id !== currentUserId) {
            playNotificationSound();
            const senderName = msg.sender?.name || 'کاربر';
            const preview = msg.content.length > 50 
              ? msg.content.substring(0, 50) + '...' 
              : msg.content;
            toast.success(`${senderName}: ${preview}`, {
              duration: 4000,
              position: 'top-right',
              icon: '💬',
            });
          }
        });
      }

      set({ messages: newMessages });
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  },

  sendMessage: async (content) => {
    const { activeConversation } = get();
    if (!activeConversation || !content.trim()) return;

    set({ isSending: true });
    try {
      const response = await chatService.sendMessage(activeConversation.id, content);
      const newMessage = response.data;

      set(state => ({
        messages: [...state.messages, newMessage],
        conversations: state.conversations.map(c =>
          c.id === activeConversation.id
            ? { ...c, last_message_at: newMessage.created_at }
            : c
        ),
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('خطا در ارسال پیام');
    } finally {
      set({ isSending: false });
    }
  },

  markAsRead: () => {
    const { activeConversation, conversations } = get();
    if (!activeConversation) return;

    const updated = conversations.map(c =>
      c.id === activeConversation.id ? { ...c, unread_count: 0 } : c
    );
    const unreadCount = updated.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    set({ conversations: updated, unreadCount });
  },

  toggleChat: () => set(state => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  startConversation: async (sellerId, productId) => {
    try {
      const response = await chatService.startConversation(sellerId, productId);
      const conversation = response.data;

      set(state => ({
        conversations: [conversation, ...state.conversations.filter(c => c.id !== conversation.id)],
        activeConversation: conversation,
        isOpen: true,
      }));

      await get().selectConversation(conversation);
      return conversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  },
}));

// ==================== Smart Polling (بهینه‌شده) ====================
let pollingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * شروع Polling هوشمند - هر ۳ ثانیه
 * ✅ بهینه‌سازی: فقط وقتی چت باز است اجرا می‌شود
 * ✅ بهینه‌سازی: اگر مکالمه فعال است، پیام‌ها را هم چک می‌کند
 */
export const startPolling = () => {
  if (pollingInterval) return;

  pollingInterval = setInterval(async () => {
    const state = useChatStore.getState();

    // فقط وقتی چت باز است، بررسی کن (بهینه‌سازی مصرف منابع)
    // ✅ همین‌طور وقتی تب مرورگر پس‌زمینه/مخفی است — قبلاً حتی با تب مخفی
    // (کاربر روی تب دیگری) هر ۳ ثانیه ادامه می‌داد چون isOpen عوض نمی‌شد.
    if (!state.isOpen || document.hidden) return;

    // ۱. بروزرسانی لیست مکالمات
    await state.loadConversations();

    // ۲. اگر مکالمه فعال است، پیام‌ها را هم بروزرسانی کن
    if (state.activeConversation) {
      await state.refreshMessages();
    }
  }, 3000); // ✅ کاهش از ۵ به ۳ ثانیه برای حس "بلادرنگ" بودن
};

/**
 * توقف Polling
 */
export const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};