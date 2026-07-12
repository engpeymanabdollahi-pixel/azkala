import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// 📦 INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface OrderUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface OrderSeller {
  id: number;
  name: string;
  shop_name: string;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postal_code?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug?: string;
  product_image?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'online' | 'wallet' | 'cash';
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  tracking_number?: string;
  coupon_code?: string;
  notes?: string;
  shipping_address?: ShippingAddress;
  user?: OrderUser;
  sellers: OrderSeller[];
  items_count: number;
  created_at: string;
  created_at_fa: string;
}

export interface AdminOrdersResponse {
  success: boolean;
  data: {
    orders: AdminOrder[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    stats: {
      total: number;
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
      returned: number;
      total_revenue: number;
      today_orders: number;
      today_revenue: number;
      pending_payment: number;
    };
    sellers: OrderSeller[];
  };
}

export interface OrderFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  seller_id?: number;
  date_from?: string;
  date_to?: string;
  min_total?: number;
  max_total?: number;
  sort_by?: 'created_at' | 'total' | 'status' | 'order_number';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface OrderDetailResponse {
  success: boolean;
  data: {
    order: Omit<AdminOrder, 'user' | 'items_count' | 'created_at_fa'>;
    user: OrderUser | null;
    items: OrderItem[];
  };
}

// ═══════════════════════════════════════════════════════════════
// 🚀 SERVICE
// ═══════════════════════════════════════════════════════════════

export const adminOrderService = {
  /**
   * دریافت لیست سفارشات
   */
  async getOrders(filters: OrderFilters = {}): Promise<AdminOrdersResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AdminOrdersResponse>(
      `/admin/orders?${params}`
    );
    return response.data;
  },

  /**
   * دریافت جزئیات سفارش
   */
  async getOrderDetail(id: number): Promise<OrderDetailResponse> {
    const response = await apiClient.get<OrderDetailResponse>(`/admin/orders/${id}`);
    return response.data;
  },

  /**
   * تغییر وضعیت سفارش
   */
  async updateStatus(id: number, data: {
    status: string;
    tracking_number?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/admin/orders/${id}/status`, data);
    return response.data;
  },

  /**
   * تغییر وضعیت پرداخت
   */
  async updatePaymentStatus(id: number, payment_status: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.put(`/admin/orders/${id}/payment-status`, {
      payment_status,
    });
    return response.data;
  },

  /**
   * آمار تفصیلی
   */
  async getStats(): Promise<{
    success: boolean;
    data: {
      last_7_days: Array<{
        date: string;
        day_name: string;
        orders: number;
        revenue: number;
      }>;
      payment_methods: Record<string, number>;
    };
  }> {
    const response = await apiClient.get('/admin/orders/stats');
    return response.data;
  },
};