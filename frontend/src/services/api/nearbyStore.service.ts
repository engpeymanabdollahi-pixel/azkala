import apiClient from './client';
import type { NearbyStore, NearbyStoreSearchMeta } from '@/types/models';

export interface NearbyStoreSearchParams {
  productId: number;
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  perPage?: number;
}

export interface NearbyStoreSearchResult {
  stores: NearbyStore[];
  meta: NearbyStoreSearchMeta;
}

/**
 * جستجوی عمومی «فروشگاه‌های نزدیک این محصول» — بدون نیاز به ورود.
 */
export const nearbyStoreService = {
  async search({ productId, lat, lng, radius, page, perPage }: NearbyStoreSearchParams): Promise<NearbyStoreSearchResult> {
    const params = new URLSearchParams();
    params.append('lat', String(lat));
    params.append('lng', String(lng));
    if (radius) params.append('radius', String(radius));
    if (page) params.append('page', String(page));
    if (perPage) params.append('per_page', String(perPage));

    const response = await apiClient.get<{ success: boolean; data: NearbyStore[]; meta: NearbyStoreSearchMeta }>(
      `/products/${productId}/nearby-stores?${params}`
    );

    return { stores: response.data.data, meta: response.data.meta };
  },
};
