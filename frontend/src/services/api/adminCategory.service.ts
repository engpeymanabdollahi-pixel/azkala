import apiClient from './client';

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon?: string;
  image?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  products_count: number;
  is_temporary: boolean;
  campaign_name?: string;
  start_date?: string;
  end_date?: string;
  bg_color?: string;
  text_color?: string;
  is_expired: boolean;
  is_campaign_active: boolean;
  created_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  tags?: string[];
  parent?: { id: number; name: string } | null;
  // ✅ Marketplace Unification فاز B4: خانواده‌های دستگاهِ متصل — آرایه‌ی
  // خالی یعنی دسته‌ی «سراسری».
  device_families: { id: number; name: string; slug: string }[];
  is_global: boolean;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  icon?: string;
  image?: string;
  is_active: boolean;
  is_temporary: boolean;
  sort_order: number;
  products_count: number;
  children: CategoryTreeNode[];
}

export interface AdminCategoriesResponse {
  success: boolean;
  data: {
    categories: AdminCategory[];
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
      temporary: number;
      root: number;
      with_products: number;
    };
  };
}

export interface CategoryTreeResponse {
  success: boolean;
  data: {
    tree: CategoryTreeNode[];
  };
}

export interface CategoryFilters {
  search?: string;
  type?: 'temporary' | 'permanent';
  is_active?: boolean;
  parent_id?: number | 'root';
  sort_by?: 'name' | 'sort_order' | 'products_count' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  parent_id?: number | null;
  icon?: string;
  image?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  tags?: string[];
  is_temporary?: boolean;
  campaign_name?: string;
  start_date?: string;
  end_date?: string;
  bg_color?: string;
  text_color?: string;
  // ✅ Marketplace Unification فاز B4: از قبل در بک‌اند (store()/update())
  // پشتیبانی می‌شد؛ فقط تایپ فرانت‌اند نداشتش.
  device_family_ids?: number[];
}

export const adminCategoryService = {
  async getCategories(filters: CategoryFilters = {}): Promise<AdminCategoriesResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AdminCategoriesResponse>(`/admin/categories?${params}`);
    return response.data;
  },

  async getCategoryTree(): Promise<CategoryTreeResponse> {
    const response = await apiClient.get<CategoryTreeResponse>('/admin/categories/tree');
    return response.data;
  },

  async getCategory(id: number) {
    const response = await apiClient.get(`/admin/categories/${id}`);
    return response.data;
  },

  async createCategory(data: CategoryFormData) {
    const response = await apiClient.post('/admin/categories', data);
    return response.data;
  },

  async updateCategory(id: number, data: Partial<CategoryFormData>) {
    const response = await apiClient.put(`/admin/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number) {
    const response = await apiClient.delete(`/admin/categories/${id}`);
    return response.data;
  },

  async reorderCategories(items: Array<{ id: number; sort_order: number; parent_id?: number | null }>) {
    const response = await apiClient.put('/admin/categories/reorder', { items });
    return response.data;
  },

  async bulkAction(ids: number[], action: 'activate' | 'deactivate' | 'delete') {
    const response = await apiClient.post('/admin/categories/bulk-action', { ids, action });
    return response.data;
  },
};