import apiClient from './client';
import type {
  MagazineArticle,
  MagazineListResponse,
  MagazineShowResponse,
  MagazineDeviceNewsResponse,
  MagazineFeaturedResponse,
  MagazineStatsResponse,
  MagazineCategoryFilter,
  MagazineQueryParams,
} from '@/types/magazine.types';

/**
 * Service برای API مجله ازکالا
 * 
 * همه endpoints عمومی (نیازی به auth ندارند)
 * الگو از: alert.service.ts
 */
export const magazineService = {
  /**
   * دریافت لیست مقالات با pagination و فیلتر
   * 
   * GET /magazine
   */
  async getArticles(params: MagazineQueryParams = {}): Promise<MagazineListResponse> {
    const response = await apiClient.get<MagazineListResponse>('/magazine', {
      params,
    });
    return response.data;
  },

  /**
   * دریافت جزئیات کامل یک مقاله
   * 
   * GET /magazine/{slug}
   * 
   * نکته: این endpoint view_count را افزایش می‌دهد
   */
  async getArticle(slug: string): Promise<MagazineShowResponse> {
    const response = await apiClient.get<MagazineShowResponse>(`/magazine/${slug}`);
    return response.data;
  },

  /**
   * فیلتر مقالات بر اساس دسته‌بندی
   * 
   * GET /magazine/category/{category}
   */
  async getArticlesByCategory(
    category: Exclude<MagazineCategoryFilter, 'all'>,
    params: Omit<MagazineQueryParams, 'category'> = {}
  ): Promise<MagazineListResponse & { category_label: string }> {
    const response = await apiClient.get<MagazineListResponse & { category_label: string }>(
      `/magazine/category/${category}`,
      { params }
    );
    return response.data;
  },

  /**
   * دریافت اخبار مرتبط با یک دستگاه خاص
   * 
   * GET /magazine/device/{modelId}/news
   * 
   * برای استفاده در DeviceNewsWidget (HomePage)
   */
  async getDeviceNews(modelId: number, limit: number = 8): Promise<MagazineDeviceNewsResponse> {
    const response = await apiClient.get<MagazineDeviceNewsResponse>(
      `/magazine/device/${modelId}/news`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * دریافت مقالات ویژه (برای hero یا sidebar)
   * 
   * GET /magazine/featured
   */
  async getFeatured(
    limit: number = 5,
    deviceId?: number
  ): Promise<MagazineFeaturedResponse> {
    const response = await apiClient.get<MagazineFeaturedResponse>('/magazine/featured', {
      params: {
        limit,
        ...(deviceId && { device_id: deviceId }),
      },
    });
    return response.data;
  },

  /**
   * دریافت آمار کلی مجله
   * 
   * GET /magazine/stats
   */
  async getStats(): Promise<MagazineStatsResponse> {
    const response = await apiClient.get<MagazineStatsResponse>('/magazine/stats');
    return response.data;
  },

  /**
   * جستجوی مقالات
   * 
   * GET /magazine?search={keyword}
   */
  async searchArticles(
    keyword: string,
    params: Omit<MagazineQueryParams, 'search'> = {}
  ): Promise<MagazineListResponse> {
    return this.getArticles({ ...params, search: keyword });
  },

  /**
   * Helper: دریافت صفحه بعدی مقالات
   */
  async getNextPage(currentPage: number, params: Omit<MagazineQueryParams, 'page'> = {}): Promise<MagazineListResponse> {
    return this.getArticles({ ...params, page: currentPage + 1 });
  },
};

/**
 * Type guard برای بررسی موفقیت response
 */
export function isMagazineListResponse(data: unknown): data is MagazineListResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'data' in data &&
    'meta' in data
  );
}

export function isMagazineShowResponse(data: unknown): data is MagazineShowResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'data' in data &&
    'related' in data
  );
}