import apiClient from './client';
import type { Store, StoreHour, StoreInventoryItem } from '@/types/models';

/**
 * مدیریت فروشگاه‌های فیزیکی فروشنده — Nearby Physical Stores.
 * همه‌ی endpoint ها زیر /seller/stores/* هستند و نیاز به ورود با نقش
 * seller دارند (middleware سمت بک‌اند enforce می‌کند).
 */

export interface StoreFormData {
  name: string;
  phone?: string;
  province?: string;
  city?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}

export const storeService = {
  async list(): Promise<Store[]> {
    const response = await apiClient.get<{ success: boolean; data: Store[] }>('/seller/stores');
    return response.data.data;
  },

  async get(id: number): Promise<Store> {
    const response = await apiClient.get<{ success: boolean; data: Store }>(`/seller/stores/${id}`);
    return response.data.data;
  },

  async create(data: StoreFormData): Promise<Store> {
    const response = await apiClient.post<{ success: boolean; data: Store }>('/seller/stores', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<StoreFormData>): Promise<Store> {
    const response = await apiClient.put<{ success: boolean; data: Store }>(`/seller/stores/${id}`, data);
    return response.data.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/seller/stores/${id}`);
  },

  /** جایگزینی کامل ساعات کاری هفتگی (نه افزودن/حذف تکی) */
  async setHours(id: number, hours: StoreHour[]): Promise<Store> {
    const response = await apiClient.put<{ success: boolean; data: Store }>(`/seller/stores/${id}/hours`, { hours });
    return response.data.data;
  },

  async listInventory(storeId: number): Promise<StoreInventoryItem[]> {
    const response = await apiClient.get<{ success: boolean; data: StoreInventoryItem[] }>(`/seller/stores/${storeId}/inventory`);
    return response.data.data;
  },

  async upsertInventory(storeId: number, productId: number, stock: number, pickupEnabled = true): Promise<StoreInventoryItem> {
    const response = await apiClient.post<{ success: boolean; data: StoreInventoryItem }>(`/seller/stores/${storeId}/inventory`, {
      product_id: productId,
      stock,
      pickup_enabled: pickupEnabled,
    });
    return response.data.data;
  },

  async removeInventory(storeId: number, productId: number): Promise<void> {
    await apiClient.delete(`/seller/stores/${storeId}/inventory/${productId}`);
  },
};
