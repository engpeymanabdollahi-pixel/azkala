import apiClient from './client';
import type { Product } from '@/types/models';

export interface AdminProduct extends Product {
  sku?: string;
  compare_price?: number;
  is_active: boolean;
  is_featured: boolean;
  is_special_offer: boolean;
  // ✅ override محلی seller قبلاً یک شکل جعلی و ناقص (id/name/shop_name)
  // داشت که با Seller واقعی (از Product ارثی) ناسازگار بود (TS2430) —
  // تنها فیلدی که واقعاً در AdminProductsPage.tsx خوانده می‌شود
  // shop_name است که در Seller واقعی هم هست، پس نیازی به override نیست.
  performance_score: number;
}

export interface AdminProductsResponse {
  success: boolean;
  data: {
    products: AdminProduct[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    stats: {
      total: number;
      active: number;
      inactive: number;
      featured: number;
      special_offers: number;
      low_stock: number;
      out_of_stock: number;
      total_value: number;
    };
  };
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  brand_id?: number;
  seller_id?: number;
  status?: 'active' | 'inactive' | 'featured' | 'special' | 'low_stock' | 'out_of_stock';
  min_price?: number;
  max_price?: number;
  sort_by?: 'created_at' | 'price' | 'sales_count' | 'rating' | 'stock' | 'views_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export const adminProductService = {
  /**
   * دریافت لیست محصولات با فیلتر
   */
  async getProducts(filters: ProductFilters = {}): Promise<AdminProductsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AdminProductsResponse>(
      `/admin/products?${params}`
    );
    return response.data;
  },

  /**
   * به‌روزرسانی سریع محصول
   */
  async quickUpdate(id: number, data: Partial<AdminProduct>): Promise<{
    success: boolean;
    message: string;
    data: AdminProduct;
  }> {
    const response = await apiClient.put(`/admin/products/${id}/quick-update`, data);
    return response.data;
  },

  /**
   * عملیات دسته‌جمعی
   */
  async bulkAction(ids: number[], action: 'activate' | 'deactivate' | 'delete' | 'feature' | 'unfeature'): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post('/admin/products/bulk-action', { ids, action });
    return response.data;
  },

  /**
   * حذف محصول
   */
  async deleteProduct(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/admin/products/${id}`);
    return response.data;
  },

  /**
   * آمار محصول
   */
  async getProductStats(id: number): Promise<{
    success: boolean;
    data: {
      product: AdminProduct;
      last_30_days: { sales: number; revenue: number };
      performance_score: number;
    };
  }> {
    const response = await apiClient.get(`/admin/products/${id}/stats`);
    return response.data;
  },
};