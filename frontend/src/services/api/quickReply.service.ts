import { cancelAllRequests } from './client';

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
    const response = await cancelAllRequests.get(url);
    return response.data;
  },

  async createQuickReply(title: string, content: string) {
    const response = await cancelAllRequests.post('/seller/quick-replies', { title, content });
    return response.data;
  },

  async deleteQuickReply(id: number) {
    const response = await cancelAllRequests.delete(`/seller/quick-replies/${id}`);
    return response.data;
  },
};