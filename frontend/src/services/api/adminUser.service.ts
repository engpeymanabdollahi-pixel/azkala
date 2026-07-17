import client from './client';

// ==================== Types ====================

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'seller' | 'admin' | 'pending_seller';
  shop_name?: string;
  avatar?: string;
  is_active: boolean;
  seller_rating: number;
  seller_badge: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  seller_verified_at?: string;
  total_sales: number;
  products_count: number;
  last_login_at?: string;
  bio?: string;
  national_code?: string;
  created_at: string;
  email_verified_at?: string;
  is_online?: boolean;
  last_seen_at?: string | null;
  total_conversations?: number;
  sentiment_score?: number;
  sentiment_label?: 'positive' | 'neutral' | 'negative';
  report_count?: number;
}

export interface SellerRequest {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  shop_name: string;
  national_code: string;
  phone: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

export interface AdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    stats: {
      total: number;
      customers: number;
      sellers: number;
      admins: number;
      pending_sellers: number;
      active: number;
      inactive: number;
      today: number;
    };
  };
}

// ✅ اصلاح شده: data مستقیماً آرایه است، نه یک آبجکت با پراپرتی requests
export interface SellerRequestsResponse {
  success: boolean;
  data: SellerRequest[]; 
  message?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
  sort_by?: 'created_at' | 'name' | 'seller_rating' | 'total_sales' | 'products_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  online?: 'online' | 'offline';
  conversations?: 'none' | 'few' | 'medium' | 'many';
  sentiment?: 'positive' | 'neutral' | 'negative';
  reports?: 'none' | 'few' | 'many';
}

// ==================== Service ====================

export const adminUserService = {
  async getUsers(filters: UserFilters = {}): Promise<AdminUsersResponse> {
    const response = await client.get<AdminUsersResponse>('/admin/users', { params: filters });
    return response.data;
  },

  async getUser(id: number) {
    const response = await client.get(`/admin/users/${id}`);
    return response.data;
  },

  async updateRole(id: number, role: string) {
    const response = await client.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  async updateStatus(id: number, is_active: boolean) {
    const response = await client.put(`/admin/users/${id}/status`, { is_active });
    return response.data;
  },

  async approveSeller(id: number) {
    const response = await client.post(`/admin/users/${id}/approve-seller`);
    return response.data;
  },

  async rejectSeller(id: number, reason: string) {
    const response = await client.post(`/admin/users/${id}/reject-seller`, { reason });
    return response.data;
  },

  /**
   * دریافت درخواست‌های فروشندگی
   */
  async getSellerRequests(): Promise<SellerRequestsResponse> {
    const response = await client.get<SellerRequestsResponse>('/admin/users/seller-requests');
    return response.data;
  },

  /**
   * تأیید درخواست فروشندگی (هماهنگ با روت api.php)
   */
  async approveSellerRequest(id: number) {
    const response = await client.post(`/admin/users/${id}/approve-seller-request`);
    return response.data;
  },

  /**
   * رد درخواست فروشندگی (هماهنگ با روت api.php)
   */
  async rejectSellerRequest(id: number, reason: string) {
    const response = await client.post(`/admin/users/${id}/reject-seller-request`, { reason });
    return response.data;
  },
};