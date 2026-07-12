import apiClient from './client';

// ==================== Types ====================

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount?: number;
  max_discount?: number;
  description?: string;
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
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در اعتبارسنجی کد تخفیف',
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
   */
  async getAllCoupons(page: number = 1): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get(`/admin/coupons?page=${page}`);
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