import apiClient from './client';

export interface SocialMedia {
  instagram?: string;
  telegram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
}

export interface AdminBrand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  is_active: boolean;
  country?: string;
  website?: string;
  founded_year?: number;
  is_featured: boolean;
  verified_at?: string;
  verification_badge: 'none' | 'gold' | 'platinum' | 'diamond';
  primary_color?: string;
  secondary_color?: string;
  sort_order: number;
  products_count: number;
  models_count: number;
  series_count: number;
  rating: number;
  reviews_count: number;
  created_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  social_media?: SocialMedia;
  gallery?: string[];
}

export interface PhoneSeries {
  id: number;
  name: string;
  slug: string;
  image?: string;
  models_count: number;
}

export interface PhoneModel {
  id: number;
  name: string;
  slug: string;
  image?: string;
  series_id?: number;
  release_year?: number;
}

export interface AdminBrandsResponse {
  success: boolean;
  data: {
    brands: AdminBrand[];
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
      verified: number;
      with_products: number;
    };
    countries: string[];
  };
}

export interface BrandDetailResponse {
  success: boolean;
  data: {
    brand: AdminBrand;
    series: PhoneSeries[];
    models: PhoneModel[];
  };
}

export interface BrandFilters {
  search?: string;
  is_active?: boolean;
  is_featured?: boolean;
  verified?: boolean;
  country?: string;
  sort_by?: 'name' | 'sort_order' | 'products_count' | 'models_count' | 'rating' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface BrandFormData {
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  is_active?: boolean;
  country?: string;
  website?: string;
  founded_year?: number;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  social_media?: SocialMedia;
  gallery?: string[];
  primary_color?: string;
  secondary_color?: string;
  sort_order?: number;
}

export const adminBrandService = {
  async getBrands(filters: BrandFilters = {}): Promise<AdminBrandsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AdminBrandsResponse>(`/admin/brands?${params}`);
    return response.data;
  },

  async getBrand(id: number): Promise<BrandDetailResponse> {
    const response = await apiClient.get<BrandDetailResponse>(`/admin/brands/${id}`);
    return response.data;
  },

  async createBrand(data: BrandFormData) {
    const response = await apiClient.post('/admin/brands', data);
    return response.data;
  },

  async updateBrand(id: number, data: Partial<BrandFormData>) {
    const response = await apiClient.put(`/admin/brands/${id}`, data);
    return response.data;
  },

  async deleteBrand(id: number) {
    const response = await apiClient.delete(`/admin/brands/${id}`);
    return response.data;
  },

  async verifyBrand(id: number) {
    const response = await apiClient.post(`/admin/brands/${id}/verify`);
    return response.data;
  },

  async unverifyBrand(id: number) {
    const response = await apiClient.post(`/admin/brands/${id}/unverify`);
    return response.data;
  },

  async bulkAction(ids: number[], action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete') {
    const response = await apiClient.post('/admin/brands/bulk-action', { ids, action });
    return response.data;
  },
};