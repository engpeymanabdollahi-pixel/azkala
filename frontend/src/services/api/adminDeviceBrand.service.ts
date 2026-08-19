import apiClient from './client';

export interface AdminDeviceBrand {
  id: number;
  name: string;
  slug: string;
  family_id: number | null;
  family: { id: number; name: string; slug: string } | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminDeviceBrandsResponse {
  success: boolean;
  data: {
    brands: AdminDeviceBrand[];
    pagination: {
      current_page: number;
      last_page: number;
      total: number;
    };
  };
}

export interface DeviceBrandFilters {
  search?: string;
  family_id?: number;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface DeviceBrandFormData {
  name: string;
  slug?: string;
  // ✅ فاز ۱E: خانواده‌ی دستگاه اکنون فیلد الزامیِ فرم است — انتخابی
  // داده‌محور از فهرست خانواده‌های واقعی، نه enum ثابت.
  family_id: number | null;
  is_active?: boolean;
}

export const adminDeviceBrandService = {
  async getBrands(filters: DeviceBrandFilters = {}): Promise<AdminDeviceBrandsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AdminDeviceBrandsResponse>(`/admin/device-brands?${params}`);
    return response.data;
  },

  async createBrand(data: DeviceBrandFormData) {
    const response = await apiClient.post('/admin/device-brands', data);
    return response.data;
  },

  async updateBrand(id: number, data: Partial<DeviceBrandFormData>) {
    const response = await apiClient.put(`/admin/device-brands/${id}`, data);
    return response.data;
  },

  async deleteBrand(id: number) {
    const response = await apiClient.delete(`/admin/device-brands/${id}`);
    return response.data;
  },
};