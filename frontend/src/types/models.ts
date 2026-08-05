// ==================== Enums ====================

export type Role = 'customer' | 'seller' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock' | 'draft';

export type SellerStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export type PaymentMethod = 'online' | 'wallet' | 'card_to_card';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ComplaintStatus =
  | 'pending'
  | 'investigating'
  | 'resolved'
  | 'rejected';

// ==================== User & Auth ====================

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// ==================== Brand & Model ====================

export interface Brand {
  id: number;
  name: string;
  slug: string;
  // برندهایی که کاربر از مدال هدر انتخاب می‌کند لوگو ندارند — device_brands
  // اصلاً چنین ستونی ندارد. اجباری‌بودنِ قبلی همیشه با null نقض می‌شد.
  logo: string | null;
  // نوعِ برند (موبایل/لپ‌تاپ/تبلت/...) — پیام‌های سازگاری در سراسر اپ برای
  // ساختن جمله‌ی درست («با لپ‌تاپ سازگار نیست» به‌جای فرض همیشگیِ «گوشی») به
  // این فیلد نیاز دارند.
  type?: 'mobile' | 'laptop' | 'tablet' | 'accessory' | null;
  is_active: boolean;
  series_count?: number;
  models_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PhoneSeries {
  id: number;
  brand_id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  models_count?: number;
  brand?: Brand;
  created_at: string;
  updated_at: string;
}

export interface PhoneModel {
  id: number;
  series_id: number;
  brand_id: number;
  name: string;
  slug: string;
  // هر دو ستون واقعی و در device_models قابل‌نال‌اند؛ اجباری‌بودن این دو
  // فیلد اینجا با مقدار واقعیِ API سازگار نبود.
  image: string | null;
  release_year?: number | null;
  is_active: boolean;
  specs?: PhoneSpecs;
  compatible_products_count?: number;
  brand?: Brand;
  series?: PhoneSeries;
  created_at: string;
  updated_at: string;
}

export interface PhoneSpecs {
  screen_size?: string;
  dimensions?: string;
  weight?: string;
  colors?: string[];
}

// ==================== Category ====================

export type CategoryType = 
  | 'mobile_accessory' 
  | 'gadget' 
  | 'laptop_accessory'
  | 'home_appliance'
  | 'kitchen'
  | 'personal_care'
  | 'electronics'
  | 'sports'
  | 'books'
  | 'other';

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  icon?: string;
  type: CategoryType;
  is_active: boolean;
  requires_model_selection?: boolean;
  products_count?: number;
  children?: Category[];
  parent?: Category;
  created_at: string;
  updated_at: string;
}

/**
 * Helper function to check if category requires phone/laptop model selection
 */
export const categoryRequiresModel = (category: Category | null): boolean => {
  if (!category) return false;
  return ['mobile_accessory', 'laptop_accessory'].includes(category.type);
};

// ==================== Seller ====================

export interface SellerBankInfo {
  iban?: string;
  bank_name?: string;
  account_holder_name?: string;
  national_id?: string;
  card_number?: string;
}

export interface SellerPolicies {
  shipping_policy?: string;
  return_policy?: string;
  support_phone?: string;
  support_email?: string;
  working_hours?: string;
}

export interface Seller {
  id: number;
  user_id: number;
  shop_name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  status: SellerStatus;
  health_score: number;
  rating?: number;
  reviews_count?: number;
  products_count?: number;
  orders_count?: number;
  user?: User;
  // ✅ ProductResource@toArray از قبل این سه فیلد را در آبجکت seller هر
  // محصول برمی‌گرداند (avatar، seller_verified_at→is_verified،
  // total_sales) ولی در تایپ Seller تعریف نشده بودند — فرانت‌اند مجبور
  // می‌شد safeProduct را as any کست کند تا این خطاهای کامپایل را دور بزند.
  avatar?: string | null;
  is_verified?: boolean;
  total_sales?: number;

  // ✅ اضافه شده برای مارکت‌پلیس
  bank_info?: SellerBankInfo;
  policies?: SellerPolicies;
  commission_rate?: number;
  warehouse_city?: string;
  warehouse_address?: string;
  min_order_amount?: number;
  verified_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface SellerStats {
  total_sales: number;
  total_orders: number;
  pending_orders: number;
  active_products: number;
  total_revenue: number;
  pending_settlements: number;
}

// ==================== Product ====================

export interface Product {
  id: number;
  seller_id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  stock: number;
  sku?: string;
  status: ProductStatus;
  images: string[];
  main_image: string;
  specifications?: Record<string, string>;
  meta_title?: string;
  meta_description?: string;
  seller?: Seller;
  category?: Category;
  // ✅ ProductController@show/index از قبل رابطه‌ی brand را eager-load
  // می‌کرد (ProductResource آن را واقعاً برمی‌گرداند) ولی این فیلد در تایپ
  // Product هیچ‌وقت تعریف نشده بود — هرجا فرانت‌اند سعی می‌کرد
  // product.brand?.name را بخواند، تایپ‌اسکریپت خطا می‌داد یا کسی مجبور
  // می‌شد از any استفاده کند.
  brand?: Brand;
  compatible_models?: PhoneModel[];
  rating?: number;
  reviews_count?: number;
  discount_percentage?: number;
  views_count?: number;
  sales_count?: number;
  // ✅ ستون واقعی products.is_bestseller و ProductResource آن را برمی‌گرداند
  // ولی قبلاً در تایپ Product تعریف نشده بود؛ فرانت‌اند مجبور بود با
  // (product as any).is_bestseller بخواندش.
  is_bestseller?: boolean;
  
  // ✅ اضافه شده برای مارکت‌پلیس پیشرفته
  weight_gram?: number;
  dimensions_cm?: { w: number; h: number; l: number };
  variants?: ProductVariant[];
  
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  attributes: Record<string, string>; // { color: 'red', size: 'XL' }
  price: number;
  compare_price?: number;
  stock: number;
  image?: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title?: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  user?: User;
  created_at: string;
  updated_at: string;
}

// ==================== Cart ====================

export interface CartItem {
  id: number;
  user_id?: number;
  session_id?: string;
  product_id: number;
  seller_id: number; // ✅ اضافه شده برای گروه‌بندی چندفروشنده‌ای
  quantity: number;
  price: number;
  total?: number; // ✅ اضافه شده برای راحتی UI
  product: Product;
  variant_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

// ✅ گروه‌بندی سبد برای UI چندفروشنده‌ای
export interface CartSellerGroup {
  seller_id: number;
  shop_name: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

// ==================== Order ====================

export interface ShippingAddress {
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postal_code: string;
  notes?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shipping_address: ShippingAddress;
  tracking_number?: string;
  notes?: string;
  items?: OrderItem[];
  timeline?: OrderTimeline[];
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
  seller?: Seller;
  variant_id?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderTimeline {
  id: number;
  order_id: number;
  status: OrderStatus;
  description: string;
  created_by?: User;
  created_at: string;
}

// ==================== Complaint ====================

export interface Complaint {
  id: number;
  order_id: number;
  user_id: number;
  seller_id: number;
  type: 'product_quality' | 'delivery' | 'seller_behavior' | 'other';
  status: ComplaintStatus;
  subject: string;
  description: string;
  attachments?: string[];
  resolution?: string;
  resolved_at?: string;
  order?: Order;
  user?: User;
  seller?: Seller;
  created_at: string;
  updated_at: string;
}

// ==================== Waiting List ====================

export interface WaitingList {
  id: number;
  user_id: number;
  product_id: number;
  is_notified: boolean;
  notified_at?: string;
  product?: Product;
  created_at: string;
  updated_at: string;
}

// ==================== Marketplace Extensions ====================

// ✅ سفارش زیرمجموعه هر فروشنده (برای مدیریت جداگانه)
export type SellerOrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready_for_shipment'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface SellerOrder {
  id: number;
  order_id: number;
  seller_id: number;
  status: SellerOrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  tracking_number?: string;
  courier_name?: string;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
  items?: OrderItem[];
  seller?: Seller;
  created_at: string;
  updated_at: string;
}

// ✅ محموله (Shipment) - برای رهگیری ارسال
export type ShipmentStatus =
  | 'label_created'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface Shipment {
  id: number;
  seller_order_id: number;
  tracking_number: string;
  courier_name: string;
  status: ShipmentStatus;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ✅ تراکنش پرداخت
export interface PaymentTransaction {
  id: number;
  order_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  gateway_ref?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// ✅ تسویه با فروشنده
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface SellerPayout {
  id: number;
  seller_id: number;
  amount: number;
  status: PayoutStatus;
  period_start?: string;
  period_end?: string;
  reference?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// ✅ مرجوعی کالا (Return/RMA)
export type ReturnReason =
  | 'defective'
  | 'not_as_described'
  | 'wrong_item'
  | 'damaged_in_shipping'
  | 'other';

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'received'
  | 'refunded'
  | 'closed';

export interface ReturnRequest {
  id: number;
  order_id: number;
  order_item_id: number;
  user_id: number;
  seller_id: number;
  reason: ReturnReason;
  status: ReturnStatus;
  description?: string;
  attachments?: string[];
  refund_amount?: number;
  approved_by?: number;
  approved_at?: string;
  received_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}

// ==================== API Helpers (Optional) ====================

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status_code: number;
}