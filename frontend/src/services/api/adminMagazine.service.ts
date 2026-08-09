import apiClient from './client';

// ==================== Types ====================

export interface AdminMagazineArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  featured_image: string | null;
  category: {
    key: 'news' | 'review' | 'comparison' | 'guide' | 'rumor';
    label: string;
  };
  content_source: {
    key: 'admin' | 'rss' | 'ai_generated';
    label: string;
    is_ai_rewritten: boolean;
  };
  source: {
    name: string | null;
    url: string | null;
    is_external: boolean;
  };
  author?: {
    id: number;
    name: string;
    avatar: string | null;
  };
  devices?: Array<{
    id: number;
    name: string;
    slug: string;
    image: string | null;
    release_year: number | null;
    brand?: { id: number; name: string };
    series?: { id: number; name: string };
  }>;
  stats: {
    view_count: number;
    devices_count?: number;
  };
  is_published: boolean;
  is_ai_rewritten: boolean;
  published_at: string;
  published_at_human: string;
  created_at: string;
  updated_at: string;
}

export interface AdminMagazineListParams {
  page?: number;
  per_page?: number;
  category?: string;
  content_source?: string;
  is_published?: boolean;
  has_devices?: 'yes' | 'no';
  search?: string;
  from?: string;
  to?: string;
  sort_by?: 'title' | 'published_at' | 'view_count' | 'created_at' | 'updated_at';
  sort_dir?: 'asc' | 'desc';
}

export interface AdminMagazineListResponse {
  success: boolean;
  data: AdminMagazineArticle[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AdminMagazineShowResponse {
  success: boolean;
  data: AdminMagazineArticle;
}

export interface AdminArticleFormData {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  category: 'news' | 'review' | 'comparison' | 'guide' | 'rumor';
  content_source: 'admin' | 'rss' | 'ai_generated';
  source_name?: string;
  source_url?: string;
  is_published?: boolean;
  is_ai_rewritten?: boolean;
  published_at?: string;
  device_ids?: number[];
}

export interface AdminMagazineStatsResponse {
  success: boolean;
  data: {
    total_articles: number;
    published: number;
    draft: number;
    total_views: number;
    by_source: Record<string, number>;
    by_category: Record<string, number>;
    with_devices: number;
    without_devices: number;
    latest_article: string | null;
    today_count: number;
  };
}

export interface BulkActionPayload {
  action: 'publish' | 'unpublish' | 'delete';
  ids: number[];
}

export interface ToggleResponse {
  success: boolean;
  data: {
    id: number;
    is_published: boolean;
  };
  message: string;
}

// ==================== Service ====================

/**
 * Admin Magazine Service
 * 
 * مدیریت کامل مقالات مجله در پنل ادمین
 * الگو از: adminProduct.service.ts
 */
export const adminMagazineService = {
  /**
   * دریافت لیست مقالات با فیلتر و pagination
   */
  async getArticles(params: AdminMagazineListParams = {}): Promise<AdminMagazineListResponse> {
    const response = await apiClient.get<AdminMagazineListResponse>('/admin/magazine', {
      params,
    });
    return response.data;
  },

  /**
   * دریافت جزئیات یک مقاله
   */
  async getArticle(id: number): Promise<AdminMagazineShowResponse> {
    const response = await apiClient.get<AdminMagazineShowResponse>(`/admin/magazine/${id}`);
    return response.data;
  },

  /**
   * ساخت مقاله جدید
   */
  async createArticle(data: AdminArticleFormData): Promise<AdminMagazineShowResponse> {
    const response = await apiClient.post<AdminMagazineShowResponse>('/admin/magazine', data);
    return response.data;
  },

  /**
   * ویرایش مقاله
   */
  async updateArticle(id: number, data: Partial<AdminArticleFormData>): Promise<AdminMagazineShowResponse> {
    const response = await apiClient.put<AdminMagazineShowResponse>(`/admin/magazine/${id}`, data);
    return response.data;
  },

  /**
   * حذف مقاله
   */
  async deleteArticle(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/admin/magazine/${id}`);
    return response.data;
  },

  /**
   * Toggle وضعیت انتشار (publish/unpublish)
   */
  async toggleArticle(id: number): Promise<ToggleResponse> {
    const response = await apiClient.post<ToggleResponse>(`/admin/magazine/${id}/toggle`);
    return response.data;
  },

  /**
   * عملیات گروهی (bulk action)
   */
  async bulkAction(payload: BulkActionPayload): Promise<{ success: boolean; message: string; affected: number }> {
    const response = await apiClient.post<{ success: boolean; message: string; affected: number }>(
      '/admin/magazine/bulk-action',
      payload
    );
    return response.data;
  },

  /**
   * دریافت آمار کلی مجله
   */
  async getStats(): Promise<AdminMagazineStatsResponse> {
    const response = await apiClient.get<AdminMagazineStatsResponse>('/admin/magazine/stats');
    return response.data;
  },
};