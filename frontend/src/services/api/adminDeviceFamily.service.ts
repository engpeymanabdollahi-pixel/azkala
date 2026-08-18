import apiClient from './client';

// ✅ Device-First Architecture فاز ۱E: سرویس ادمین برای CRUD خانواده‌های
// دستگاه — تنها منبع اکوسیستم دستگاه (جایگزین enum ثابتِ mobile/laptop/
// tablet/accessory).

export interface AdminDeviceFamily {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  brands_count?: number;
  created_at: string;
}

export interface AdminDeviceFamiliesResponse {
  success: boolean;
  data: {
    families: AdminDeviceFamily[];
    pagination: {
      current_page: number;
      last_page: number;
      total: number;
    };
  };
}

export interface DeviceFamilyFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface DeviceFamilyFormData {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const adminDeviceFamilyService = {
  async getFamilies(filters: DeviceFamilyFilters = {}): Promise<AdminDeviceFamiliesResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AdminDeviceFamiliesResponse>(`/admin/device-families?${params}`);
    return response.data;
  },

  async createFamily(data: DeviceFamilyFormData) {
    const response = await apiClient.post('/admin/device-families', data);
    return response.data;
  },

  async updateFamily(id: number, data: Partial<DeviceFamilyFormData>) {
    const response = await apiClient.put(`/admin/device-families/${id}`, data);
    return response.data;
  },

  async deleteFamily(id: number) {
    const response = await apiClient.delete(`/admin/device-families/${id}`);
    return response.data;
  },
};
