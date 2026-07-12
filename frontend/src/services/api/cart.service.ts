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
  data: {
    items_count: number;
    total: number;
  };
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
   * افزودن محصول به سبد
   */
  async addToCart(productId: number, quantity: number = 1): Promise<CartActionResponse> {
    const response = await apiClient.post<CartActionResponse>('/cart', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  /**
   * به‌روزرسانی تعداد
   */
  async updateQuantity(itemId: number, quantity: number): Promise<CartActionResponse> {
    const response = await apiClient.put<CartActionResponse>(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data;
  },

  /**
   * حذف آیتم
   */
  async removeItem(itemId: number): Promise<CartActionResponse> {
    const response = await apiClient.delete<CartActionResponse>(`/cart/items/${itemId}`);
    return response.data;
  },

  /**
   * خالی کردن سبد
   */
  async clearCart(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete('/cart');
    return response.data;
  },
};