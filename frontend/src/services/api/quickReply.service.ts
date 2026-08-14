// ✅ قبلاً { cancelAllRequests } ایمپورت می‌شد — یک تابع void برای لغو
// درخواست‌ها، نه instance واقعی axios. یعنی هر سه متد این سرویس با فراخوانی
// cancelAllRequests.get/.post/.delete (که وجود نداشتند) با TypeError واقعی
// کرش می‌کردند: فیچر «پاسخ‌های آماده» در چت فروشنده (ChatWidget.tsx،
// SellerChatPage.tsx) همین الان صد در صد شکسته است. apiClient (default
// export) همان چیزی است که بقیه‌ی سرویس‌های این پوشه استفاده می‌کنند.
import apiClient from './client';

export interface QuickReply {
  id: number;
  seller_id: number;
  title: string;
  content: string;
  sort_order: number;
}

export const quickReplyService = {
  async getQuickReplies(sellerId?: number) {
    const url = sellerId ? `/seller/quick-replies?seller_id=${sellerId}` : '/seller/quick-replies';
    const response = await apiClient.get(url);
    return response.data;
  },

  async createQuickReply(title: string, content: string) {
    const response = await apiClient.post('/seller/quick-replies', { title, content });
    return response.data;
  },

  async deleteQuickReply(id: number) {
    const response = await apiClient.delete(`/seller/quick-replies/${id}`);
    return response.data;
  },
};