import apiClient from './client';

// ==================== Types ====================

export interface SearchProduct {
  id: number;
  name: string;
  slug: string;
  main_image?: string;
  price: number;
  compare_price?: number | null;
  discount_percentage?: number;
  rating?: number;
  reviews_count?: number;
  seller?: {
    id: number;
    shop_name: string;
    slug: string;
  };
}

export interface SearchDeviceBrand {
  id: number;
  name: string;
  slug: string;
  type: string;
}

export interface SearchDeviceModel {
  id: number;
  name: string;
  slug: string;
  series_id?: number;
  release_year?: number;
  series?: {
    brand?: {
      id: number;
      name: string;
      slug: string;
      type: string;
    };
  };
}

export interface SearchCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: number | null;
}

export interface SearchSeller {
  id: number;
  shop_name: string;
  slug: string;
  logo?: string | null;
  rating?: number;
  products_count?: number;
  followers_count?: number;
  verified_at?: string | null;
}

export interface SearchResult {
  query: string;
  products: {
    count: number;
    items: SearchProduct[];
  };
  devices: {
    brands_count: number;
    brands: SearchDeviceBrand[];
    models_count: number;
    models: SearchDeviceModel[];
  };
  categories: {
    count: number;
    items: SearchCategory[];
  };
  sellers: {
    count: number;
    items: SearchSeller[];
  };
}

export interface SearchFilters {
  device_model_id?: number;
  category_id?: number;
  limit?: number;
}

// ==================== Service ====================

export const searchService = {
  /**
   * جستجوی global - ترکیب همه entity ها
   * مطابق سند مرجع (بخش ۱۰ Search System):
   * "برای ازکالا Search باید یک Component بسیار جدی باشد"
   */
  async globalSearch(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const response = await apiClient.get<{ success: boolean; data: SearchResult }>(
      '/search/global',
      { params: { q: query, ...filters } }
    );
    return response.data.data;
  },

  // ✅ Device-First Architecture فاز ۶: متد deviceSearch() (و کلاینتش برای
  // GET /search/devices) به‌عنوان کد کاملاً مرده حذف شد — صفر caller در
  // کل frontend داشت (نه در هیچ کامپوننت/hook/تستی). خودِ endpoint بک‌اند
  // (SearchController::devices()) دست‌نخورده ماند، چون یک API عمومی و
  // فنی-reachable است و امکان رد کردن مصرف‌کننده‌ی خارجی احتمالی صرفاً با
  // بررسی این ریپازیتوری وجود ندارد.

  /**
   * Popular suggestions
   */
  async getPopularSuggestions(): Promise<string[]> {
    try {
      const response = await apiClient.get('/search/popular');
      return response.data.data;
    } catch {
      // fallback به hardcoded
      return [
        'قاب آیفون 15',
        'شارژر سامسونگ',
        'AirPods Pro 2',
        'گلس گوشی',
        'هندزفری بلوتوثی',
        'پاوربانک',
      ];
    }
  },
};