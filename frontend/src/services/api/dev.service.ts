import apiClient from './client';

/**
 * Dev Service - فقط در APP_ENV=local کار می‌کند
 * 
 * برای تست بدون نیاز به پیامک واقعی
 */
export const devService = {
  /**
   * دریافت OTP از cache (فقط در dev)
   */
  async getOtp(phone: string): Promise<{ otp: string; phone: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; otp: string; phone: string }>(
        `/dev/otp/${phone}`
      );
      return {
        otp: response.data.otp,
        phone: response.data.phone,
      };
    } catch (error) {
      throw new Error('خطا در دریافت OTP (فقط در محیط local فعال است)');
    }
  },

  /**
   * Login سریع ادمین (فقط در dev)
   */
  async adminLogin(): Promise<{ user: any; token: string }> {
    const response = await apiClient.post('/dev/admin-login');
    return response.data.data;
  },
};