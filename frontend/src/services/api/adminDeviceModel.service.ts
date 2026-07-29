import apiClient from './client';

export interface AdminDeviceModel {
  id: number;
  name: string;
  slug: string;
  series_id: number;
  series_name: string;
  brand_name: string;
  release_year?: number;
  is_active: boolean;
}

export interface DeviceModelFormData {
  series_id: number;
  name: string;
  slug?: string;
  release_year?: number | string;
  is_active?: boolean;
}

export const adminDeviceModelService = {
  async getModels(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]: any) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
    const response = await apiClient.get(`/admin/device-models?${params}`);
    return response.data;
  },

  async createModel(data: DeviceModelFormData) {
    const response = await apiClient.post('/admin/device-models', data);
    return response.data;
  },

  async updateModel(id: number, data: Partial<DeviceModelFormData>) {
    const response = await apiClient.put(`/admin/device-models/${id}`, data);
    return response.data;
  },

  async deleteModel(id: number) {
    const response = await apiClient.delete(`/admin/device-models/${id}`);
    return response.data;
  },

  async getSeriesDropdown(brandId?: number) {
    const params = brandId ? `?brand_id=${brandId}` : '';
    const response = await apiClient.get(`/admin/device-models/series-dropdown${params}`);
    return response.data;
  }
};