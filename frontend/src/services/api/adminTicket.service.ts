// ✅ قبلاً به‌جای کلاینت axios واقعی، تابع cancelAllRequests (که فقط
// درخواست‌های در حال اجرا را لغو می‌کند و هیچ متد get/post/put ندارد)
// ایمپورت شده بود — یعنی هر فراخوانی این سرویس بلافاصله با
// TypeError: cancelAllRequests.get is not a function کرش می‌کرد و کل
// بخش مدیریت تیکت‌های پشتیبانی هیچ‌وقت واقعاً کار نمی‌کرد.
import apiClient from './client';

// ✅ قبلاً همهٔ متدها به مسیر ناموجود «/admin/tickets» درخواست می‌زدند، در
// حالی که روت واقعی بکند زیر «/admin/chat-management/tickets» ثبت شده
// (routes/api.php) — یعنی حتی بعد از رفع باگ cancelAllRequests، هر
// درخواست با ۴۰۴ برمی‌گشت و این بخش هیچ‌وقت واقعاً کار نمی‌کرد.
const BASE = '/admin/chat-management/tickets';

export interface AdminTicket {
  id: number;
  user_id: number;
  subject: string;
  // ✅ قبلاً 'pending' اینجا بود که هیچ‌وقت مقدار واقعی وضعیت تیکت در بکند
  // نبود (وضعیت واقعی enum: open/in_progress/resolved/closed است) — یعنی
  // به‌محض پاسخ ادمین (که خودکار به in_progress تغییر می‌کند)، بج وضعیت در
  // فرانت‌اند ناپدید می‌شد چون هیچ case ای برای آن مقدار وجود نداشت.
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
  is_internal: boolean;
  created_at: string;
  user?: {
    name: string;
    // ✅ role اضافه شد — قبلاً پیام‌ها به فیلد ناموجود is_admin تکیه
    // می‌کردند و هیچ‌وقت پشتیبانی از کاربر متمایز نمی‌شد.
    role?: string;
  };
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  urgent: number;
  unassigned: number;
  escalated: number;
  avg_response_time: number;
}

export const adminTicketService = {
  getTickets: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await apiClient.get(BASE, { params });
    return response.data;
  },

  getTicketDetails: async (id: number) => {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  sendMessage: async (id: number, message: string) => {
    const response = await apiClient.post(`${BASE}/${id}/message`, { message });
    return response.data;
  },

  updateStatus: async (id: number, status: AdminTicket['status']) => {
    const response = await apiClient.put(`${BASE}/${id}`, { status });
    return response.data;
  },
};
