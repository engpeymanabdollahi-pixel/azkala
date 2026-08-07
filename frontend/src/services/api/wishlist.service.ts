import apiClient from './client';
import type { Product } from '@/types/product';

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  product: Product;
  created_at: string;
}

export interface WishlistResponse {
  success: boolean;
  data: {
    data: WishlistItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

export const wishlistService = {
  async getWishlist(): Promise<WishlistResponse> {
    const response = await apiClient.get<WishlistResponse>('/wishlist');
    return response.data;
  },

  async addToWishlist(productId: number) {
    const response = await apiClient.post('/wishlist', { product_id: productId });
    return response.data;
  },

  async removeFromWishlist(productId: number) {
    const response = await apiClient.delete(`/wishlist/${productId}`);
    return response.data;
  },

  async checkWishlist(productId: number) {
    const response = await apiClient.get(`/wishlist/check/${productId}`);
    return response.data;
  },
};