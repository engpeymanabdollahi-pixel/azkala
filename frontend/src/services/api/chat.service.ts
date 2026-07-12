import apiClient from './client';

export interface ChatUser {
  id: number;
  name: string;
  avatar: string | null;
}

export interface ChatProduct {
  id: number;
  name: string;
  main_image: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  file_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: ChatUser;
}

export interface ChatConversation {
  id: number;
  buyer_id: number;
  seller_id: number;
  product_id: number | null;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
  buyer?: ChatUser;
  seller?: ChatUser;
  product?: ChatProduct;
  messages?: ChatMessage[];
  unread_count?: number;
  other_user?: ChatUser;
}

export interface OnlineStatus {
  id: number;
  name: string;
  is_online: boolean;
  last_seen: string;
  last_seen_at: string | null;
}

export const chatService = {
  async getConversations() {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },

  async startConversation(sellerId: number, productId?: number) {
    const response = await apiClient.post('/chat/conversations/start', {
      seller_id: sellerId,
      product_id: productId,
    });
    return response.data;
  },

  async getConversation(conversationId: number) {
    const response = await apiClient.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  async getMessages(conversationId: number) {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  async sendMessage(conversationId: number, content: string, type: 'text' | 'image' | 'file' = 'text') {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      type,
    });
    return response.data;
  },

  async getOnlineStatus(userIds: number[]): Promise<{ success: boolean; data: OnlineStatus[] }> {
    const response = await apiClient.post('/chat/online-status', { user_ids: userIds });
    return response.data;
  },
async deleteConversation(conversationId: number) {
  const response = await apiClient.delete(`/chat/conversations/${conversationId}`);
  return response.data;
},
async getSentimentStats(conversationId: number) {
  const response = await apiClient.get(`/chat/conversations/${conversationId}/sentiment`);
  return response.data;
},
async getProductSuggestions(conversationId: number) {
  const response = await apiClient.get(`/chat/conversations/${conversationId}/suggestions`);
  return response.data;
},

async suggestProduct(conversationId: number, productId: number) {
  const response = await apiClient.post(`/chat/conversations/${conversationId}/suggest`, {
    product_id: productId,
  });
  return response.data;
},
};