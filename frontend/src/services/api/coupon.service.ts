import apiClient from './client';
import { type AxiosError } from 'axios';

// ==================== Types ====================

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  // ✅ min_order_amount در دیتابیس default(0) و NOT NULL است — همیشه واقعاً
  // برمی‌گردد، بنابراین اختیاری علامت‌گذاری کردنش نادرست بود.
  min_order_amount: number;
  max_discount?: number;
  description?: string;
  // ✅ start_date قبلاً از تایپ جا افتاده بود در حالی که در بکند وجود دارد
  // و صفحه‌ی مدیریت کوپن‌ها از آن استفاده می‌کند.
  start_date?: string;
  end_date?: string;
  usage_limit?: number;
  usage_limit_per_user?: number;
  used_count?: number;
  is_active?: boolean;
}

export interface CouponValidationResponse {
  success: boolean;
  data?: {
    coupon: Coupon;
    discount_amount: number;
    message: string;
  };
  message?: string;
}

export interface CouponsResponse {
  success: boolean;
  data: Coupon[];
}

// ==================== Service ====================

export const couponService = {
  /**
   * اعتبارسنجی کد تخفیف
   */
  async validate(code: string): Promise<CouponValidationResponse> {
    try {
      const response = await apiClient.post<CouponValidationResponse>('/coupons/validate', {
        code: code.toUpperCase().trim(),
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message: axiosError.response?.data?.message || 'خطا در اعتبارسنجی کد تخفیف',
      };
    }
  },

  /**
   * دریافت کوپن‌های فعال کاربر
   */
  async getMyCoupons(): Promise<CouponsResponse> {
    const response = await apiClient.get<CouponsResponse>('/coupons/my');
    return response.data;
  },

  /**
   * 🆕 دریافت همه کوپن‌ها (Admin)
   * ✅ قبلاً پاسخ فقط شامل همان یک صفحهٔ کوپن‌ها بود و هیچ آمار واقعی‌ای
   * روی کل دیتابیس وجود نداشت. search/is_active/type هم اکنون واقعاً
   * در بکند فیلتر می‌شوند، نه فقط روی صفحهٔ فعلی در سمت کلاینت.
   */
  async getAllCoupons(
    page: number = 1,
    filters: { search?: string; is_active?: boolean; type?: 'percentage' | 'fixed' } = {}
  ): Promise<{
    success: boolean;
    data: {
      coupons: Coupon[];
      pagination: { current_page: number; last_page: number; total: number; per_page: number };
      stats: { total: number; active: number; percentage: number; fixed: number; total_usage: number };
    };
  }> {
    const response = await apiClient.get('/admin/coupons', { params: { page, ...filters } });
    return response.data;
  },

  /**
   * 🆕 ساخت کوپن جدید (Admin)
   */
  async createCoupon(data: Partial<Coupon> & { code: string; type: string; value: number }): Promise<{ 
    success: boolean; 
    message: string; 
    data: Coupon 
  }> {
    const response = await apiClient.post('/admin/coupons', data);
    return response.data;
  },

  /**
   * 🆕 ویرایش کوپن (Admin)
   */
  async updateCoupon(id: number, data: Partial<Coupon>): Promise<{ 
    success: boolean; 
    message: string; 
    data: Coupon 
  }> {
    const response = await apiClient.put(`/admin/coupons/${id}`, data);
    return response.data;
  },

  /**
   * 🆕 حذف کوپن (Admin)
   */
  async deleteCoupon(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/coupons/${id}`);
    return response.data;
  },
};