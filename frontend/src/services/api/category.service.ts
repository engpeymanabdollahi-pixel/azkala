import apiClient from './client';

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  parent_id?: number;
  children?: Category[];
  products_count?: number;
}

export const categoryService = {
  async getAll(): Promise<{ success: boolean; data: Category[] }> {
    const response = await apiClient.get('/categories?with_products_count=1');
    return response.data;
  },

  async getCategories(withProductsCount = true): Promise<{ success: boolean; data: Category[] }> {
    const params = withProductsCount ? '?with_products_count=1' : '';
    const response = await apiClient.get(`/categories${params}`);
    return response.data;
  },

  async getCategory(id: number): Promise<{ success: boolean; data: Category }> {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },
};