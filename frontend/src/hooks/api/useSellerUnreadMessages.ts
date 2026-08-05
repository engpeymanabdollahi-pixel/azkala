import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/client';

interface ConversationWithUnread {
  unread_count: number;
}

const fetchSellerUnreadMessages = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/chat/conversations');
    const conversations: ConversationWithUnread[] = response.data.data?.data || response.data.data || [];
    return conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  } catch {
    return 0;
  }
};

/**
 * تعداد پیام‌های نخوانده‌ی فروشنده — واقعی، از /chat/conversations.
 * قبلاً در SellerLayout عدد ۵ به‌صورت ثابت هاردکد شده بود.
 */
export function useSellerUnreadMessages() {
  return useQuery({
    queryKey: ['seller-unread-messages'],
    queryFn: fetchSellerUnreadMessages,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
