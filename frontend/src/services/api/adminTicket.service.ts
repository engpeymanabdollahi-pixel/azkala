import { cancelAllRequests } from './client';

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
  getTickets: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await cancelAllRequests.get('/admin/tickets', { params });
    return response.data;
  },

  getTicketDetails: async (id: number) => {
    const response = await cancelAllRequests.get(`/admin/tickets/${id}`);
    return response.data;
  },

  sendMessage: async (id: number, message: string) => {
    const response = await cancelAllRequests.post(`/admin/tickets/${id}/message`, { message });
    return response.data;
  },

  updateStatus: async (id: number, status: 'open' | 'pending' | 'closed') => {
    const response = await cancelAllRequests.put(`/admin/tickets/${id}`, { status });
    return response.data;
  },
};