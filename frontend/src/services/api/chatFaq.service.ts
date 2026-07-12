import apiClient from './client';

export interface ChatFaq {
  id: number;
  seller_id: number;
  question_pattern: string;
  answer: string;
  category: 'general' | 'shipping' | 'payment' | 'product';
  priority: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export const chatFaqService = {
  async getFaqs() {
    const response = await apiClient.get('/chat/faq');
    return response.data;
  },

  async createFaq(data: {
    question_pattern: string;
    answer: string;
    category?: string;
    priority?: number;
  }) {
    const response = await apiClient.post('/chat/faq', data);
    return response.data;
  },

  async updateFaq(id: number, data: Partial<ChatFaq>) {
    const response = await apiClient.put(`/chat/faq/${id}`, data);
    return response.data;
  },

  async deleteFaq(id: number) {
    const response = await apiClient.delete(`/chat/faq/${id}`);
    return response.data;
  },

  async seedDefaults() {
    const response = await apiClient.post('/chat/faq/seed-defaults');
    return response.data;
  },
};