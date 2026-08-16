import apiClient from './client';

// ✅ دقیقاً منطبق با backend/app/Http/Controllers/Api/AdminReferralRuleController.php
// (Referral Rule Engine — Part 4 audit).

export type ReferralRewardType = 'fixed_credit' | 'fixed_coupon' | 'percentage_coupon';

export interface ReferralRewardRule {
  id: number;
  milestone: number;
  reward_type: ReferralRewardType;
  reward_value: string;
  min_order_amount: string | null;
  max_discount: string | null;
  coupon_expiration_days: number | null;
  usage_limit: number;
  repeatable: boolean;
  priority: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  triggers_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralRuleStats {
  total_rules: number;
  active_rules: number;
  total_triggers: number;
  coupons_issued: number;
}

export interface ReferralRuleTrigger {
  id: number;
  referral_reward_rule_id: number;
  referrer_user_id: number;
  successful_referrals_count_at_trigger: number;
  reward_type: ReferralRewardType;
  reward_value: string;
  coupon_id: number | null;
  created_at: string;
  rule?: { id: number; milestone: number } | null;
  referrer?: { id: number; name: string; phone?: string } | null;
  coupon?: { id: number; code: string } | null;
}

export interface ReferralRuleFormInput {
  milestone: number;
  reward_type: ReferralRewardType;
  reward_value: number;
  min_order_amount?: number | null;
  max_discount?: number | null;
  coupon_expiration_days?: number | null;
  usage_limit?: number | null;
  repeatable?: boolean;
  priority?: number;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
}

export const adminReferralRuleService = {
  async list(): Promise<{ data: ReferralRewardRule[]; stats: ReferralRuleStats }> {
    const response = await apiClient.get<{ success: boolean; data: ReferralRewardRule[]; stats: ReferralRuleStats }>(
      '/admin/referral-rules'
    );
    return { data: response.data.data, stats: response.data.stats };
  },

  async create(payload: ReferralRuleFormInput): Promise<ReferralRewardRule> {
    const response = await apiClient.post<{ success: boolean; data: ReferralRewardRule }>('/admin/referral-rules', payload);
    return response.data.data;
  },

  async update(id: number, payload: ReferralRuleFormInput): Promise<ReferralRewardRule> {
    const response = await apiClient.put<{ success: boolean; data: ReferralRewardRule }>(`/admin/referral-rules/${id}`, payload);
    return response.data.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/admin/referral-rules/${id}`);
  },

  async toggle(id: number): Promise<ReferralRewardRule> {
    const response = await apiClient.post<{ success: boolean; data: ReferralRewardRule }>(`/admin/referral-rules/${id}/toggle`);
    return response.data.data;
  },

  async triggerHistory(page = 1, perPage = 20): Promise<{ data: ReferralRuleTrigger[]; pagination: { current_page: number; last_page: number; total: number } }> {
    const response = await apiClient.get<{
      success: boolean;
      data: ReferralRuleTrigger[];
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    }>(`/admin/referral-rules/triggers/history?page=${page}&per_page=${perPage}`);
    return { data: response.data.data, pagination: response.data.pagination };
  },
};
