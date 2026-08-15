import client from './client';

// ==================== Types ====================
// ✅ دقیقاً منطبق با backend/app/Http/Controllers/Api/ReferralController.php
// (نه حدس) — GET /user/referral و GET /user/referrals.

export interface ReferralSummary {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  pending_referrals: number;
}

// ✅ عمداً فقط status/registered_at — بک‌اند اطلاعات شخصی کاربر
// معرفی‌شده (نام/شماره موبایل/ایمیل) را برنمی‌گرداند.
export interface ReferralListItem {
  status: 'pending' | 'qualified' | 'rewarded' | 'cancelled' | 'rejected';
  registered_at: string;
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
