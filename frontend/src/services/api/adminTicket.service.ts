import { apiClient } from './client';

export interface AdminTicket {
  id: number;
  user_id: number;
  subject: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
  user?: {
    name: string;
  };
}

export const adminTicketService = {
  // دریافت لیست تیکت‌ها با قابلیت فیلتر وضعیت
  getTickets: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/admin/tickets', { params });
    return response.data;
  },

  // دریافت جزئیات یک تیکت به همراه پیام‌ها
  getTicketDetails: async (id: number) => {
    const response = await apiClient.get(`/admin/tickets/${id}`);
    return response.data;
  },

  // ارسال پاسخ توسط ادمین
  sendMessage: async (id: number, message: string) => {
    const response = await apiClient.post(`/admin/tickets/${id}/message`, { message });
    return response.data;
  },

  // تغییر وضعیت تیکت (مثلاً بستن تیکت)
  updateStatus: async (id: number, status: 'open' | 'pending' | 'closed') => {
    const response = await apiClient.put(`/admin/tickets/${id}`, { status });
    return response.data;
  },
};