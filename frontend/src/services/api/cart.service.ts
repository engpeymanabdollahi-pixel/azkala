import apiClient from './client';

export interface ApiCartItem {
  id: number;
  product_id: number;
  seller_id: number | null;
  quantity: number;
  price: number;
  total: number;
  product: any;
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
  data: any; // می‌تواند CartItem یا اطلاعات به‌روزرسانی شده سبد باشد
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
   * افزودن محصول به سبد (با پشتیبانی از device_model_id)
   */
  async addToCart(productId: number, quantity: number = 1, deviceModelId?: number): Promise<CartActionResponse> {
    const payload: any = { product_id: productId, quantity };
    if (deviceModelId) {
      payload.device_model_id = deviceModelId;
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