import apiClient from './client';
import { AdminDeviceBrand } from './adminDeviceBrand.service';

export interface AdminDeviceSeries {
  id: number;
  name: string;
  slug: string;
  brand_id: number;
  brand_name: string;
  is_active: boolean;
  created_at: string;
}

export interface DeviceSeriesFormData {
  brand_id: number;
  name: string;
  slug?: string;
  is_active?: boolean;
}

export const adminDeviceSeriesService = {
  async getSeries(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]: any) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
    const response = await apiClient.get(`/admin/device-series?${params}`);
    return response.data;
  },

  async createSeries(data: DeviceSeriesFormData) {
    const response = await apiClient.post('/admin/device-series', data);
    return response.data;
  },

  async updateSeries(id: number, data: Partial<DeviceSeriesFormData>) {
    const response = await apiClient.put(`/admin/device-series/${id}`, data);
    return response.data;
  },

  async deleteSeries(id: number) {
    const response = await apiClient.delete(`/admin/device-series/${id}`);
    return response.data;
  },

  async getBrandsDropdown() {
    const response = await apiClient.get('/admin/device-series/brands-dropdown');
    return response.data;
  }
};