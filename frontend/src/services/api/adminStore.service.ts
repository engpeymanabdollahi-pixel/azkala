import apiClient from './client';
import type { Store } from '@/types/models';

export interface AdminStoreFilters {
  status?: 'pending' | 'verified';
  search?: string;
  per_page?: number;
  page?: number;
}

export interface AdminStorePaginated {
  data: Store[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const adminStoreService = {
  async list(filters: AdminStoreFilters = {}): Promise<AdminStorePaginated> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<{ success: boolean; data: AdminStorePaginated }>(`/admin/stores?${params}`);
    return response.data.data;
  },

  async verify(id: number): Promise<Store> {
    const response = await apiClient.post<{ success: boolean; data: Store }>(`/admin/stores/${id}/verify`);
    return response.data.data;
  },

  async reject(id: number): Promise<void> {
    await apiClient.post(`/admin/stores/${id}/reject`);
  },

  async deactivate(id: number): Promise<Store> {
    const response = await apiClient.post<{ success: boolean; data: Store }>(`/admin/stores/${id}/deactivate`);
    return response.data.data;
  },

  async activate(id: number): Promise<Store> {
    const response = await apiClient.post<{ success: boolean; data: Store }>(`/admin/stores/${id}/activate`);
    return response.data.data;
  },
};
