import apiClient from './client';

// ✅ دقیقاً منطبق با backend/app/Http/Controllers/Api/AdminReferralController.php
// (نه حدس) — GET /admin/referrals و GET /admin/referrals/{referral}.

export interface AdminReferralFilters {
  status?: 'pending' | 'qualified' | 'rewarded' | 'cancelled' | 'rejected' | '';
  reward_status?: 'rewarded' | 'not_rewarded' | '';
  referrer_search?: string;
  referred_search?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

export interface AdminReferralUserRef {
  id: number;
  name: string;
}

export interface AdminReferralRewardInfo {
  amount: number;
  type: string;
  status: string;
  rewarded_at: string | null;
  order_number: string | null;
}

export interface AdminReferralListItem {
  id: number;
  referral_code: string;
  status: 'pending' | 'qualified' | 'rewarded' | 'cancelled' | 'rejected';
  referrer: AdminReferralUserRef | null;
  referred: AdminReferralUserRef | null;
  registered_at: string;
  qualified_at: string | null;
  rewarded_at: string | null;
  reward: AdminReferralRewardInfo | null;
}

export interface AdminReferralDetail extends AdminReferralListItem {
  qualifying_order: { id: number; order_number: string; status: string } | null;
}

export interface AdminReferralSummary {
  total_referrals: number;
  pending: number;
  qualified: number;
  rewarded: number;
  cancelled: number;
  rejected: number;
  total_reward_amount: number;
}

export interface AdminReferralListResponse {
  success: boolean;
  data: {
    referrals: {
      data: AdminReferralListItem[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    summary: AdminReferralSummary;
  };
}

export const adminReferralService = {
  async list(filters: AdminReferralFilters = {}): Promise<AdminReferralListResponse['data']> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AdminReferralListResponse>(`/admin/referrals?${params}`);
    return response.data.data;
  },

  async detail(id: number): Promise<AdminReferralDetail> {
    const response = await apiClient.get<{ success: boolean; data: AdminReferralDetail }>(`/admin/referrals/${id}`);
    return response.data.data;
  },
};
