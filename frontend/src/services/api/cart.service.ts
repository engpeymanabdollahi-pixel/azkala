import apiClient from './client';
import type { Product } from '@/types/models';

export interface ApiCartItem {
  id: number;
  product_id: number;
  // ✅ Variant/Color System فاز ۳: بک‌اند اکنون variant_id + رابطه‌ی
  // variant را eager-load و برمی‌گرداند (CartController::index).
  variant_id?: number | null;
  variant?: {
    id: number;
    color_name: string | null;
    color_code: string | null;
    sku: string | null;
  } | null;
  seller_id: number | null;
  quantity: number;
  price: number;
  total: number;
  product: Product;
}

export interface CartResponse {
  success: boolean;
  data: {
    items: ApiCartItem[];
    subtotal: number;
    discount: number;
    total: number;
    items_count: number;
  };
}

export interface CartActionResponse {
  success: boolean;
  message: string;
  data: ApiCartItem | CartResponse['data'];
}

export const cartService = {
  /**
   * دریافت سبد خرید از سرور
   */
  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get<CartResponse>('/cart');
    return response.data;
  },

  /**
   * افزودن محصول به سبد (با پشتیبانی از device_model_id و variant_id)
   */
  async addToCart(productId: number, quantity: number = 1, deviceModelId?: number, variantId?: number | null): Promise<CartActionResponse> {
    const payload: { product_id: number; quantity: number; device_model_id?: number; variant_id?: number } = { product_id: productId, quantity };
    if (deviceModelId) {
      payload.device_model_id = deviceModelId;
    }
    if (variantId) {
      payload.variant_id = variantId;
    }

    const response = await apiClient.post<CartActionResponse>('/cart', payload);
    return response.data;
  },

  /**
   * به‌روزرسانی تعداد (هماهنگ با روت جدید بک‌اند: PUT /cart/{cartItemId})
   */
  async updateQuantity(cartItemId: number, quantity: number): Promise<CartActionResponse> {
    const response = await apiClient.put<CartActionResponse>(`/cart/${cartItemId}`, {
      quantity,
    });
    return response.data;
  },

  /**
   * حذف آیتم (هماهنگ با روت جدید بک‌اند: DELETE /cart/{cartItemId})
   */
  async removeItem(cartItemId: number): Promise<CartActionResponse> {
    const response = await apiClient.delete<CartActionResponse>(`/cart/${cartItemId}`);
    return response.data;
  },

  /**
   * خالی کردن کامل سبد
   */
  async clearCart(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete('/cart/clear'); // یا هر روتی که در بک‌اند برای clear تعریف کرده‌اید
    return response.data;
  },
};