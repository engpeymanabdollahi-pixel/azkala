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
    slug?: string;
    discount_percentage?: number;
    compare_price?: number;
  };
}

export interface SellerOrder {
  id: number;
  order_number: string;
  user_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'preparing' | 'ready_for_shipment';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  seller_total?: number; // مبلغ سهم فروشنده
  shipping_address: any;
  tracking_number?: string | null;
  courier_name?: string | null;
  notes?: string | null;
  items?: SellerOrderItem[];
  items_count?: number;
  customer_name?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

// ✅ اینترفیس استاندارد و دقیق برای پاسخ‌های صفحه‌بندی‌شده لاراول
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    current_page: number;
    data: T[]; // <-- آرایه اصلی سفارشات اینجاست
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
  };
}

export const sellerOrderService = {
  /**
   * دریافت لیست سفارشات فروشنده با صفحه‌بندی صحیح
   */
  async getOrders(page: number = 1, perPage: number = 20): Promise<PaginatedResponse<SellerOrder>> {
    // اطمینان از اینکه page و perPage عدد معتبر هستند
    const safePage = Number(page) >= 1 ? Number(page) : 1;
    const safePerPage = Number(perPage) >= 1 ? Number(perPage) : 20;

    const response = await apiClient.get('/seller/orders', {
      params: { 
        page: safePage, 
        per_page: safePerPage 
      },
    });
    
    return response.data;
  },

  /**
   * دریافت جزئیات یک سفارش خاص
   */
  async getOrder(orderId: number | string) {
    const response = await apiClient.get(`/seller/orders/${orderId}`);
    return response.data;
  },

  /**
   * بروزرسانی وضعیت سفارش و ثبت اطلاعات ارسال
   */
  async updateStatus(orderId: number | string, status: string, trackingNumber?: string, courierName?: string) {
    const response = await apiClient.put(`/seller/orders/${orderId}/status`, {
      status,
      tracking_number: trackingNumber || null,
      courier_name: courierName || null,
    });
    return response.data;
  },

  /**
   * دریافت آمار کلی سفارشات فروشنده
   */
  async getStats() {
    const response = await apiClient.get('/seller/orders/stats');
    return response.data;
  },
};