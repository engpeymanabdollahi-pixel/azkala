import { create } from 'zustand';
import { productService } from '@/services/api/product.service';
import { orderService } from "@/services/api/order.service";
// statsService فعلاً کامنت می‌شود (بعداً می‌سازیم)
// import { statsService } from "@/services/statsService";

export interface SellerOrder {
  id: number;
  order_id: number;
  seller_id: number;
  status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  tracking_number?: string;
  courier_name?: string;
  shipped_at?: string;
  delivered_at?: string;
  items?: any[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: string;
  sku?: string;
  images?: string[];
  sales_count?: number;
  views_count?: number;
  compare_price?: number;
}

interface SellerState {
  orders: SellerOrder[];
  products: Product[];
  stats: any;
  loading: boolean;
  error: string | null;
  orderStatusFilter: string;
  productStatusFilter: string;

  // Orders
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: number, status: string, trackingNumber?: string) => Promise<void>;
  setOrderStatusFilter: (status: string) => void;
  getFilteredOrders: () => SellerOrder[];

  // Products
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productId: number, data: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  setProductStatusFilter: (status: string) => void;
  getFilteredProducts: () => Product[];

  // Stats
  refreshStats: () => Promise<void>;

  // UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSellerStore = create<SellerState>((set, get) => ({
  orders: [],
  products: [],
  stats: null,
  loading: false,
  error: null,
  orderStatusFilter: 'all',
  productStatusFilter: 'all',

  // ==================== Orders ====================
  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await orderService.getSellerOrders();
      set({ orders: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'خطا در دریافت سفارشات', loading: false });
    }
  },

  updateOrderStatus: async (orderId, status, trackingNumber) => {
    set({ loading: true, error: null });
    try {
      await orderService.updateOrderStatus(orderId, status, trackingNumber);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: status as any,
                tracking_number: trackingNumber || order.tracking_number,
                updated_at: new Date().toISOString(),
              }
            : order
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'خطا در به‌روزرسانی وضعیت سفارش', loading: false });
    }
  },

  setOrderStatusFilter: (status) => set({ orderStatusFilter: status }),

  getFilteredOrders: () => {
    const { orders, orderStatusFilter } = get();
    if (orderStatusFilter === 'all') return orders;
    return orders.filter((order) => order.status === orderStatusFilter);
  },

  // ==================== Products ====================
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await productService.getSellerProducts();
      set({ products: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'خطا در دریافت محصولات', loading: false });
    }
  },

  addProduct: async (product) => {
    set({ loading: true, error: null });
    try {
      const response = await productService.createProduct(product);
      set((state) => ({
        products: [response.data, ...state.products],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'خطا در افزودن محصول', loading: false });
      throw error;
    }
  },

  updateProduct: async (productId, data) => {
    set({ loading: true, error: null });
    try {
      await productService.updateProduct(productId, data);
      set((state) => ({
        products: state.products.map((product) =>
          product.id === productId ? { ...product, ...data } : product
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'خطا در ویرایش محصول', loading: false });
      throw error;
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true, error: null });
    try {
      await productService.deleteProduct(productId);
      set((state) => ({
        products: state.products.filter((product) => product.id !== productId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'خطا در حذف محصول', loading: false });
      throw error;
    }
  },

  setProductStatusFilter: (status) => set({ productStatusFilter: status }),

  getFilteredProducts: () => {
    const { products, productStatusFilter } = get();
    if (productStatusFilter === 'all') return products;
    return products.filter((product) => product.status === productStatusFilter);
  },

  // ==================== Stats ====================
  refreshStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await statsService.getSellerStats();
      set({ stats: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'خطا در دریافت آمار', loading: false });
    }
  },

  // ==================== UI ====================
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));