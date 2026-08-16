import client from './client';

// ==================== Types ====================
// ✅ دقیقاً منطبق با backend/app/Http/Controllers/Api/ReferralController.php
// (نه حدس) — GET /user/referral و GET /user/referrals.

export interface ReferralSummary {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  pending_referrals: number;
  // ✅ Referral System Phase 3
  qualified_referrals: number;
  rewarded_referrals: number;
  total_earned_rewards: number;
}

export interface ReferralRewardInfo {
  amount: number;
  order_number: string | null;
}

// ✅ عمداً فقط status/تاریخ‌ها/اطلاعات پاداش — بک‌اند اطلاعات شخصی
// کاربر معرفی‌شده (نام/شماره موبایل/ایمیل) را برنمی‌گرداند.
export interface ReferralListItem {
  status: 'pending' | 'qualified' | 'rewarded' | 'cancelled' | 'rejected';
  registered_at: string;
  // ✅ Referral System Phase 3
  qualified_at: string | null;
  rewarded_at: string | null;
  reward: ReferralRewardInfo | null;
}

export const referralService = {
  async getMyReferral(): Promise<{ success: boolean; data: ReferralSummary }> {
    const response = await client.get('/user/referral');
    return response.data;
  },

  async getMyReferrals(): Promise<{ success: boolean; data: ReferralListItem[] }> {
    const response = await client.get('/user/referrals');
    return response.data;
  },
};
