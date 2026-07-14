import apiClient from './client';

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
  // 🆕 فیلدهای جدید
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

export interface SellerRequestsResponse {
  success: boolean;
  data: {
    requests: SellerRequest[];
    pagination: {
      current_page: number;
      last_page: number;
      total: number;
    };
  };
}

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
  sort_by?: 'created_at' | 'name' | 'seller_rating' | 'total_sales' | 'products_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  // 🆕 فیلترهای جدید
  online?: 'online' | 'offline';
  conversations?: 'none' | 'few' | 'medium' | 'many';
  sentiment?: 'positive' | 'neutral' | 'negative';
  reports?: 'none' | 'few' | 'many';
}

// ==================== Service ====================

export const adminUserService = {
  /**
   * دریافت لیست کاربران
   */
  async getUsers(filters: UserFilters = {}): Promise<AdminUsersResponse> {
    const response = await apiClient.get<AdminUsersResponse>('/admin/users', { 
      params: filters 
    });
    return response.data;
  },

  /**
   * دریافت جزئیات کاربر
   */
  async getUser(id: number) {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * تغییر نقش کاربر
   */
  async updateRole(id: number, role: string) {
    const response = await apiClient.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * تغییر وضعیت کاربر (فعال/غیرفعال)
   */
  async updateStatus(id: number, is_active: boolean) {
    const response = await apiClient.put(`/admin/users/${id}/status`, { is_active });
    return response.data;
  },

  /**
   * تایید فروشنده
   */
  async approveSeller(id: number) {
    const response = await apiClient.post(`/admin/users/${id}/approve-seller`);
    return response.data;
  },

  /**
   * رد فروشنده
   */
  async rejectSeller(id: number, reason: string) {
    const response = await apiClient.post(`/admin/users/${id}/reject-seller`, { reason });
    return response.data;
  },

  /**
   * دریافت درخواست‌های فروشندگی
   */
  async getSellerRequests(): Promise<SellerRequestsResponse> {
    const response = await apiClient.get<SellerRequestsResponse>('/admin/users/seller-requests');
    return response.data;
  },

  /**
   * تایید درخواست فروشندگی
   */
  async approveSellerRequest(id: number) {
    const response = await apiClient.post(`/admin/seller-requests/${id}/approve`);
    return response.data;
  },

  /**
   * رد درخواست فروشندگی
   */
  async rejectSellerRequest(id: number, reason: string) {
    const response = await apiClient.post(`/admin/seller-requests/${id}/reject`, { reason });
    return response.data;
  },
};