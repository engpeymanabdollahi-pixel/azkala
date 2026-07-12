import apiClient from './client';

export interface SellerOrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  product?: {
    id: number;
    name: string;
    main_image: string | null;
  };
}

export interface SellerOrder {
  id: number;
  order_number: string;
  user_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shipping_address: any;
  tracking_number?: string;
  notes?: string;
  items?: SellerOrderItem[];
  items_count?: number;
  customer_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OrdersResponse {
  success: boolean;
  data: SellerOrder[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

export const sellerOrderService = {
  /**
   * دریافت لیست سفارشات فروشنده
   */
  async getOrders(page: number = 1, perPage: number = 10): Promise<OrdersResponse> {
    const response = await apiClient.get('/seller/orders', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  /**
   * دریافت جزئیات سفارش
   */
  async getOrder(orderId: number) {
    const response = await apiClient.get(`/seller/orders/${orderId}`);
    return response.data;
  },

  /**
   * بروزرسانی وضعیت سفارش
   */
  async updateStatus(orderId: number, status: string, trackingNumber?: string, courierName?: string) {
    const response = await apiClient.put(`/seller/orders/${orderId}/status`, {
      status,
      tracking_number: trackingNumber,
      courier_name: courierName,
    });
    return response.data;
  },

  /**
   * آمار سفارشات فروشنده
   */
  async getStats() {
    const response = await apiClient.get('/seller/orders/stats');
    return response.data;
  },
};