import apiClient from './client';
import type { Product, PhoneModel } from '@/types/models';

export interface ProductFilters {
  category_id?: number;
  brand_id?: number;
  search?: string;
  featured?: boolean;
  special_offers?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const productService = {
  /**
   * دریافت لیست محصولات با فیلترها
   */
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<ProductsResponse>(`/products?${params}`);
    return response.data;
  },

  /**
   * دریافت یک محصول بر اساس ID
   */
  async getProduct(id: number): Promise<{ 
    success: boolean; 
    data: { 
      product: Product; 
      related_products: Product[];
    } 
  }> {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  /**
   * دریافت محصولات ویژه (featured)
   */
  async getFeatured(): Promise<{ success: boolean; data: Product[] }> {
    const response = await apiClient.get('/products/featured');
    return response.data;
  },

  /**
   * دریافت محصولات تخفیف‌دار (special offers)
   */
  async getSpecialOffers(): Promise<{ success: boolean; data: Product[] }> {
    const response = await apiClient.get('/products/special-offers');
    return response.data;
  },

  /**
   * دریافت محصول بر اساس slug
   */
  async getProductBySlug(slug: string): Promise<{
    success: boolean;
    data: {
      product: Product;
      related_products: Product[];
      // ✅ ProductService::getProductBySlug واقعاً این کلید را در ریشه‌ی
      // پاسخ برمی‌گرداند (نه داخل product) — تایپ قبلی نداشتنش باعث می‌شد
      // مصرف‌کننده مجبور شود با as any این خطا را دور بزند.
      compatible_models?: PhoneModel[];
      // ✅ Product Relationship Phase 2: «همراه این محصول» (complement) —
      // عمداً یک کلید جدا از related_products، هرگز merge نمی‌شود.
      complementary_products?: Product[];
    }
  }> {
    const response = await apiClient.get(`/products/slug/${slug}`);
    return response.data;
  },

  /**
   * دریافت محصولات سازگار با یک مدل گوشی
   */
  async getCompatibleProducts(modelId: number): Promise<ProductsResponse> {
    const response = await apiClient.get<ProductsResponse>(`/products/compatible/${modelId}`);
    return response.data;
  },

  /**
   * 🆕 دریافت محصولات سازگار با چندین مدل (Union)
   */
  async getCompatibleProductsMulti(modelIds: number[]): Promise<ProductsResponse> {
    const response = await apiClient.post<ProductsResponse>('/products/compatible-multi', {
      model_ids: modelIds,
    });
    return response.data;
  },

  /**
   * 🆕 محصولات خریداری شده توسط کاربر
   */
  async getMyProducts(page: number = 1): Promise<ProductsResponse> {
    const response = await apiClient.get<ProductsResponse>(
      `/products/my-products?page=${page}`
    );
    return response.data;
  },
};