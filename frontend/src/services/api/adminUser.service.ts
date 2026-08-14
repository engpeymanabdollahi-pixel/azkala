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
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  shop_name?: string;
  proposed_shop_name?: string;
  full_name?: string;
  national_code?: string;
  phone?: string;
  description?: string;
  status: 'pending_initial' | 'pending_documents' | 'pending_final' | 'approved' | 'rejected' | 'pending';
  rejection_reason?: string;
  id_card_image?: string | null;
  business_license_image?: string | null;
  bank_account?: string;
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

// ✅ اصلاح شده: مطابقت کامل با خروجی بک‌اند
export interface SellerRequestsResponse {
  success: boolean;
  data: {
    requests: SellerRequest[]; 
  };
  message?: string;
}

export interface SellerCommissionInfo {
  seller_id: number;
  override_rate: number | null;
  current_rate: number;
  current_source: 'override' | 'score_rule' | 'default';
  current_level: string | null;
  score: {
    value: number;
    level: string | null;
    is_new_seller: boolean;
    calculated_at: string | null;
    breakdown: {
      rating: number;
      success_rate: number;
      cancellation: number;
      quality: number;
      reliability: number;
    };
    total_orders: number;
    successful_orders: number;
    cancelled_orders: number;
  };
}

export interface CommissionRule {
  id: number;
  level: string;
  label: string;
  min_score: string | number;
  max_score: string | number | null;
  commission_rate: string | number;
  is_active: boolean;
  sort_order: number;
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

  // ❌ approveSeller() («تایید یک‌کلیکی فروشنده») حذف شد — این مکانیزم
  // کاملاً موازی و مستقل از خط‌لولهٔ واقعی درخواست فروشندگی بود و چون هیچ
  // shop_name/مدارک/اطلاعات بانکی‌ای هیچ‌وقت جمع‌آوری نمی‌شد، فروشندهٔ
  // «تاییدشده» با آن هیچ‌وقت slug نمی‌گرفت و صفحه‌ی عمومی‌اش ۴۰۴ می‌داد.
  // تنها راه واقعی، initialApproveRequest/finalApproveRequest زیر است.

  async rejectSeller(id: number, reason: string) {
    const response = await client.post(`/admin/users/${id}/reject-seller`, { reason });
    return response.data;
  },

  async getSellerRequests(): Promise<SellerRequestsResponse> {
    const response = await client.get<SellerRequestsResponse>('/admin/users/seller-requests');
    return response.data;
  },

  // ✅ حذف تکرار و اصلاح نام متد برای هماهنگی با روت جدید
  async rejectSellerRequest(id: number, reason: string) {
    const response = await client.post(`/admin/users/${id}/reject`, { reason });
    return response.data;
  },

  async initialApproveRequest(id: number) {
    const response = await client.post(`/admin/users/${id}/initial-approve`);
    return response.data;
  },

  async finalApproveRequest(id: number) {
    const response = await client.post(`/admin/users/${id}/final-approve`);
    return response.data;
  },

  // 💹 سیستم کمیسیون هوشمند
  async getSellerCommission(id: number): Promise<{ success: boolean; data: SellerCommissionInfo }> {
    const response = await client.get(`/admin/users/${id}/commission`);
    return response.data;
  },

  async setSellerCommissionOverride(id: number, rate: number | null) {
    const response = await client.put(`/admin/users/${id}/commission-override`, { rate });
    return response.data;
  },

  async getCommissionRules(): Promise<{ success: boolean; data: CommissionRule[] }> {
    const response = await client.get('/admin/commission-rules');
    return response.data;
  },

  async updateCommissionRule(id: number, data: Partial<Pick<CommissionRule, 'label' | 'min_score' | 'max_score' | 'commission_rate' | 'is_active'>>) {
    const response = await client.put(`/admin/commission-rules/${id}`, data);
    return response.data;
  },
};