import apiClient from '@/services/api/client';

export interface DeviceBrand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
}

export interface DeviceSeries {
  id: number;
  name: string;
  slug: string;
  image?: string;
  brand_id: number;
}

export interface DeviceModel {
  id: number;
  name: string;
  slug: string;
  image?: string;
  series_id: number;
  brand_id: number;
}

export const deviceService = {
  getBrands: async (): Promise<DeviceBrand[]> => {
    const response = await apiClient.get('/devices/brands');
    return response.data.data || [];
  },

  getSeries: async (brandId: number): Promise<DeviceSeries[]> => {
    const response = await apiClient.get(`/devices/brands/${brandId}/series`);
    return response.data.data || [];
  },

  getModels: async (seriesId: number): Promise<DeviceModel[]> => {
    const response = await apiClient.get(`/devices/series/${seriesId}/models`);
    return response.data.data || [];
  },
};