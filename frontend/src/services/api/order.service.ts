import apiClient from './client';
import type { Product } from '@/types/models';

export interface ShippingAddress {
  receiver_name: string; // ✅ تغییر یافته برای هماهنگی با بک‌اند
  phone: string;
  province: string;
  city: string;
  address: string;
  postal_code: string;
  notes?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  seller_id: number | null;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

export interface Order {
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
  shipping_address: ShippingAddress;
  tracking_number?: string;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderResponse {
  success: boolean;
  data: Order;
}

export interface OrdersResponse {
  success: boolean;
  data: {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateOrderRequest {
  shipping_address: ShippingAddress;
  // ✅ 'card_to_card' حذف شد: نه در checkoutFormSchema (zod) گزینه‌ای برایش
  // است، نه بک‌اند آن را قبول می‌کند (OrderController::store اعتبارسنجی
  // می‌کند: 'payment_method' => 'required|string|in:online,wallet').
  payment_method: 'online' | 'wallet';
  notes?: string;
}

// ✅ پاسخ واقعی OrderController::store یک آبجکت مسطح است (نه {order, order_number})
// — دقیقاً همان شکلی که OrderSuccessPage از location.state می‌خواند.
export interface CreateOrderResult {
  order_number: string;
  total: number;
  items_count: number;
  payment_method: string;
  shipping_address: ShippingAddress;
  created_at: string;
  // ✅ بک‌اند این را برمی‌گرداند ولی به /api/payment/initiate/{id} اشاره
  // می‌کند — مسیری که اصلاً در routes/api.php ثبت نشده (هیچ PaymentController
  // ای وجود ندارد). یعنی گزینه‌ی «پرداخت آنلاین» هیچ‌وقت کاربر را به درگاه
  // واقعی نمی‌فرستد؛ سفارش با payment_status: pending می‌ماند. این یک شکاف
  // واقعی و قابل‌توجه در کسب‌وکار است، نه چیزی که بشود اینجا بی‌سروصدا
  // اختراع کرد — نیاز به تصمیم محصولی (کدام درگاه، اعتبارنامه‌ها) دارد.
  payment_url?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: CreateOrderResult;
}

export const orderService = {
  /**
   * لیست سفارشات کاربر
   */
  async getOrders(page: number = 1): Promise<OrdersResponse> {
    const response = await apiClient.get<OrdersResponse>(`/orders?page=${page}`);
    return response.data;
  },

  /**
   * جزئیات یک سفارش
   */
  async getOrder(orderId: number): Promise<OrderResponse> {
    const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * ثبت سفارش جدید
   */
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await apiClient.post<CreateOrderResponse>('/orders', data);
    return response.data;
  },

  /**
   * لغو سفارش
   */
  async cancelOrder(orderId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/orders/${orderId}/cancel`);
    return response.data;
  },
};