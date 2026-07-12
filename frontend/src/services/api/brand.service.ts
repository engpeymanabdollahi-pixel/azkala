import apiClient from './client';

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description?: string;
  is_active: boolean;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BrandsResponse {
  success: boolean;
  data: Brand[];
}

export const brandService = {
  /**
   * دریافت لیست همه برندها
   */
  async getBrands(): Promise<BrandsResponse> {
    const response = await apiClient.get<BrandsResponse>('/brands');
    return response.data;
  },

  /**
   * دریافت اطلاعات یک برند خاص
   */
  async getBrand(id: number): Promise<{ success: boolean; data: Brand }> {
    const response = await apiClient.get(`/brands/${id}`);
    return response.data;
  },

  /**
   * دریافت اطلاعات یک برند با slug
   */
  async getBrandBySlug(slug: string): Promise<{ success: boolean; data: Brand }> {
    const response = await apiClient.get(`/brands/slug/${slug}`);
    return response.data;
  },
};