import apiClient from './client';
import type { ProductAlert, AlertStatusResponse } from '@/types/models';

export interface CreateAlertPayload {
  product_id: number;
  type: 'restock' | 'price_drop' | 'target_price';
  target_price?: number;
  discount_percentage?: number; // ✅ جدید: درصد تخفیف (۱ تا ۹۹)
  channels?: ('database' | 'email')[];
}

export interface AlertResponse {
  success: boolean;
  message?: string;
  data?: ProductAlert;
}

export interface AlertListResponse {
  success: boolean;
  data: {
    data: ProductAlert[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * سرویس API برای مدیریت هشدارهای محصول
 */
export const alertService = {
  /**
   * دریافت لیست هشدارهای کاربر
   */
  async getAlerts(page: number = 1): Promise<AlertListResponse> {
    const response = await apiClient.get<AlertListResponse>('/alerts', {
      params: { page },
    });
    return response.data;
  },

  /**
   * ساخت هشدار جدید
   */
  async createAlert(data: CreateAlertPayload): Promise<AlertResponse> {
    const response = await apiClient.post<AlertResponse>('/alerts', data);
    return response.data;
  },

  /**
   * حذف هشدار
   */
  async deleteAlert(alertId: number): Promise<AlertResponse> {
    const response = await apiClient.delete<AlertResponse>(`/alerts/${alertId}`);
    return response.data;
  },

  /**
   * تغییر وضعیت فعال/غیرفعال هشدار
   */
  async toggleAlert(alertId: number): Promise<AlertResponse> {
    const response = await apiClient.patch<AlertResponse>(`/alerts/${alertId}/toggle`);
    return response.data;
  },

  /**
   * بررسی وضعیت هشدار برای یک محصول
   */
  async getAlertStatus(productId: number): Promise<{ success: boolean; data: AlertStatusResponse }> {
    const response = await apiClient.get(`/products/${productId}/alert-status`);
    return response.data;
  },
};