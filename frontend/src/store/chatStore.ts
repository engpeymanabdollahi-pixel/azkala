import { create } from 'zustand';
import { chatService, type ChatConversation, type ChatMessage } from '@/services/api/chat.service';
import echo from '@/lib/echo';
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
    set({ isLoading: true });
    try {
      const response = await chatService.getConversations();
      const conversations = response.data.data || response.data;
      
      set({ 
        conversations,
        unreadCount: conversations.reduce((sum: number, c: ChatConversation) => sum + (c.unread_count || 0), 0),
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      set({ isLoading: false });
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
      
      // محاسبه unread count جدید
      const conversations = get().conversations.map(c => 
        c.id === conversation.id ? { ...c, unread_count: 0 } : c
      );
      const unreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      set({ conversations, unreadCount });
      
      // 🔔 Subscribe به channel با نوتیفیکیشن
      echo.private(`conversation.${conversation.id}`)
        .listen('.message.sent', (e: any) => {
          const newMessage = e.message;
          const currentUserId = useAuthStore.getState().user?.id;
          
          // اگر پیام از طرف دیگر است (نه خودم)
          if (newMessage.sender_id !== currentUserId) {
            // 🔔 صدای اعلان
            playNotificationSound();
            
            // 🍞 Toast notification ساده (بدون JSX)
            const senderName = e.sender?.name || 'کاربر';
            const messagePreview = newMessage.content.length > 50 
              ? newMessage.content.substring(0, 50) + '...' 
              : newMessage.content;
            
            toast.success(`${senderName}: ${messagePreview}`, {
              duration: 5000,
              position: 'top-right',
              icon: '💬',
            });
            
            // 🖥️ Browser notification
            showBrowserNotification(`پیام جدید از ${senderName}`, messagePreview);
          }
          
          // 🔄 بروزرسانی state
          set(state => {
            // بروزرسانی لیست پیام‌ها
            const updatedMessages = [...state.messages, newMessage];
            
            // 🔢 بروزرسانی لیست مکالمات
            const updatedConversations = state.conversations.map(c => {
              if (c.id === conversation.id) {
                const isFromOther = newMessage.sender_id !== currentUserId;
                return {
                  ...c,
                  last_message_at: newMessage.created_at,
                  unread_count: isFromOther ? (c.unread_count || 0) + 1 : c.unread_count,
                  messages: [newMessage],
                };
              }
              return c;
            });
            
            // 🔢 محاسبه unread count کلی
            const totalUnread = updatedConversations.reduce(
              (sum, c) => sum + (c.unread_count || 0), 0
            );
            
            return {
              messages: updatedMessages,
              conversations: updatedConversations,
              unreadCount: totalUnread,
            };
          });
        });
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      set({ isLoading: false });
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

// ==================== Polling (خارج از Store) ====================
let pollingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * شروع Polling برای بروزرسانی خودکار هر 5 ثانیه
 */
export const startPolling = () => {
  if (pollingInterval) return;
  
  pollingInterval = setInterval(() => {
    const state = useChatStore.getState();
    if (state.isOpen) {
      state.loadConversations();
      
      // اگر مکالمه فعال است، پیام‌ها را هم بروزرسانی کن
      if (state.activeConversation) {
        chatService.getMessages(state.activeConversation.id)
          .then(response => {
            const newMessages = response.data.data || response.data;
            const currentMessages = useChatStore.getState().messages;
            
            // فقط اگر پیام جدیدی آمده
            if (newMessages.length > currentMessages.length) {
              useChatStore.setState({ messages: newMessages });
            }
          })
          .catch(console.error);
      }
    }
  }, 5000); // هر 5 ثانیه
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