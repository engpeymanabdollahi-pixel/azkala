import apiClient from './client';

// ==================== Types ====================

export interface Ad {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  position: 'sidebar' | 'between_articles' | 'footer';
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdListResponse {
  success: boolean;
  data: Ad[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AdFormData {
  title: string;
  image_url: string;
  link_url: string;
  position: 'sidebar' | 'between_articles' | 'footer';
  is_active?: boolean;
  priority?: number;
  starts_at?: string;
  expires_at?: string;
}

export interface ActiveAdsResponse {
  success: boolean;
  data: Ad[];
  count: number;
}

// ==================== Service ====================

/**
 * Ad Service
 * 
 * مدیریت تبلیغات در frontend
 * الگو از: adminMagazine.service.ts
 */
export const adService = {
  // ==================== Public Endpoints ====================

  /**
   * دریافت تبلیغات فعال برای نمایش در frontend
   */
  async getActiveAds(position: string = 'sidebar', limit: number = 5): Promise<ActiveAdsResponse> {
    const response = await apiClient.get<ActiveAdsResponse>('/ads/active', {
      params: { position, limit },
    });
    return response.data;
  },

  // ==================== Admin Endpoints ====================

  /**
   * دریافت لیست همه تبلیغات (برای ادمین)
   */
  async getAds(params: {
    page?: number;
    per_page?: number;
    position?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_dir?: string;
  } = {}): Promise<AdListResponse> {
    const response = await apiClient.get<AdListResponse>('/admin/ads', { params });
    return response.data;
  },

  /**
   * ساخت تبلیغ جدید
   */
  async createAd(data: AdFormData): Promise<{ success: boolean; data: Ad; message: string }> {
    const response = await apiClient.post<{ success: boolean; data: Ad; message: string }>('/admin/ads', data);
    return response.data;
  },

  /**
   * ویرایش تبلیغ
   */
  async updateAd(id: number, data: Partial<AdFormData>): Promise<{ success: boolean; data: Ad; message: string }> {
    const response = await apiClient.put<{ success: boolean; data: Ad; message: string }>(`/admin/ads/${id}`, data);
    return response.data;
  },

  /**
   * حذف تبلیغ
   */
  async deleteAd(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/admin/ads/${id}`);
    return response.data;
  },

  /**
   * Toggle وضعیت فعال/غیرفعال
   */
  async toggleAd(id: number): Promise<{ success: boolean; data: { id: number; is_active: boolean }; message: string }> {
    const response = await apiClient.post<{ success: boolean; data: { id: number; is_active: boolean }; message: string }>(`/admin/ads/${id}/toggle`);
    return response.data;
  },
};