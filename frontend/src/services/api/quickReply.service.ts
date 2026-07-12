import apiClient from './client';

export interface QuickReply {
  id: number;
  seller_id: number;
  title: string;
  content: string;
  sort_order: number;
}

export const quickReplyService = {
  async getQuickReplies() {
    const response = await apiClient.get('/seller/quick-replies');
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