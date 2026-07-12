import apiClient from './client';

export interface BlockedUser {
  id: number;
  user_id: number;
  blocked_user_id: number;
  reason: string | null;
  created_at: string;
  blocked_user?: {
    id: number;
    name: string;
    avatar: string | null;
  };
}

export interface ChatReport {
  id: number;
  reporter_id: number;
  reported_user_id: number;
  conversation_id: number | null;
  message_id: number | null;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

export const chatModerationService = {
  async getBlockedUsers() {
    const response = await apiClient.get('/chat/blocked-users');
    return response.data;
  },

  async blockUser(blockedUserId: number, reason?: string) {
    const response = await apiClient.post('/chat/block', {
      blocked_user_id: blockedUserId,
      reason,
    });
    return response.data;
  },

  async unblockUser(blockedUserId: number) {
    const response = await apiClient.delete(`/chat/unblock/${blockedUserId}`);
    return response.data;
  },

  async checkBlockStatus(userId: number) {
    const response = await apiClient.get(`/chat/check-block/${userId}`);
    return response.data;
  },

  async reportUser(data: {
    reported_user_id: number;
    conversation_id?: number;
    message_id?: number;
    reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
    description?: string;
  }) {
    const response = await apiClient.post('/chat/report', data);
    return response.data;
  },
};