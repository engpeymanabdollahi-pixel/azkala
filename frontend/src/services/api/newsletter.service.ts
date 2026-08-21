import apiClient from './client';

export interface NewsletterStatus {
  success: boolean;
  data: {
    is_subscribed: boolean;
    email: string | null;
    subscribed_at: string | null;
  };
}

export interface SubscribeResponse {
  success: boolean;
  message: string;
  data?: {
    subscriber_id: number;
    email: string;
  };
}

export const newsletterService = {
  async getStatus(): Promise<NewsletterStatus> {
    const response = await apiClient.get('/newsletter/status');
    return response.data;
  },

  async subscribe(): Promise<SubscribeResponse> {
    const response = await apiClient.post('/newsletter/subscribe');
    return response.data;
  },

  async unsubscribe(): Promise<SubscribeResponse> {
    const response = await apiClient.post('/newsletter/unsubscribe');
    return response.data;
  },
};