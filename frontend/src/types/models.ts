// ==================== Enums ====================

export type Role = 'customer' | 'seller' | 'admin';

// ✅ سیستم Multi-Admin/Manager: نقش «Administrative» یک لایه‌ی کاملاً جدا
// از Role بالاست — روی جدول جداگانه‌ی spatie زندگی می‌کند و هرگز
// جایگزین role اصلی کاربر (customer/seller/admin) نمی‌شود. فقط برای
// role === 'admin' معنا دارد؛ بقیه همیشه null هستند.
export type AdministrativeRole = 'super_admin' | 'admin' | 'manager';

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
  // ✅ این چهار فیلد واقعاً روی ستون‌های users هستند (User::$fillable
  // سمت بک‌اند) و برای role=seller توسط AuthController/UserResource
  // برگردانده می‌شوند؛ فقط در این تایپ تعریف نشده بودند —
  // SellerSettings.tsx/SellerDashboard.tsx/SellerLayout.tsx مجبور بودند
  // یا کامپایل خطا بدهند یا user را as any کست کنند.
  shop_name?: string;
  slug?: string;
  bio?: string;
  banner?: string | null;
  created_at: string;
  updated_at: string;
  // ✅ سیستم Multi-Admin/Manager (بخش ۱۸ درخواست) — همیشه توسط
  // AuthController::userPayload برگردانده می‌شوند؛ برای role !== 'admin'
  // همیشه null/[] هستند. اختیاری فقط برای سازگاری با پاسخ‌های قدیمی‌تر
  // (مثلاً /profile update که این فیلدها را برنمی‌گرداند).
  administrative_role?: AdministrativeRole | null;
  permissions?: string[];
  // ✅ Referral System Phase 2 — همیشه توسط AuthController::userPayload
  // برگردانده می‌شود (users.toArray() آن را شامل می‌شود)؛ برای کاربران
  // قدیمی‌تر که هنوز lazy تولید نشده تا وقتی GET /user/referral زده
  // نشود null است.
  referral_code?: string | null;
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
  // ✅ Device-First Architecture — حذف نهایی type: family منبع حقیقتِ
  // یگانه‌ی آیکون/برچسب/طبقه‌بندی است. اختیاری چون همه‌ی مسیرهای API آن
  // را نمی‌فرستند (مثلاً compatible_models محصول).
  family?: { id: number; name: string; slug: string; icon: string | null } | null;
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
  // ✅ ستون واقعی categories.image که CategoryResource برمی‌گرداند، ولی
  // تایپ اینجا نداشت — MegaMenu.tsx و MobileMenu.tsx از قبل category.image
  // را می‌خواندند و tsc همیشه روی همین دو خطا می‌داد.
  image?: string | null;
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
  // ✅ فیلدهای واقعی که ProductResource برمی‌گرداند (is_active/
  // discount_price/is_featured/is_special_offer/is_in_stock/final_price)
  // اینجا تعریف نشده بودند — status از بالا هم دیگر روی جدول products
  // اصلاً وجود ندارد (ستون واقعی is_active بولین است) و هیچ‌جای فرانت‌اند
  // هم خوانده نمی‌شود؛ برای عدم شکستن مصرف‌کننده‌های فعلی status حذف
  // نشد، فقط فیلدهای واقعی زیر اضافه شدند.
  is_active?: boolean;
  discount_price?: number | null;
  final_price?: number;
  is_in_stock?: boolean;
  is_featured?: boolean;
  is_special_offer?: boolean;
  is_new?: boolean;
  images: string[];
  main_image: string;
  // ✅ قبلاً Record<string, string> بود، ولی این ستون در بک‌اند یک JSON
  // آزاد است (هر نوع مقداری می‌تواند داشته باشد)، نه فقط رشته؛ محل‌های
  // مصرف هم فقط با Object.entries رندر می‌کنند (React با هر primitive
  // کار می‌کند)، پس محدودکردن به string فقط باعث خطای کامپایل کاذب می‌شد.
  specifications?: Record<string, unknown>;
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
  // ✅ Variant/Color System فاز ۳: قبلاً این تایپ (از یک کامیت خیلی قدیمی‌تر،
  // پیش از پیاده‌سازی واقعی سیستم رنگ در فاز ۲.۱) کاملاً با schema واقعی
  // بک‌اند ناهم‌خوان بود (فیلدهایی مثل name/status که هرگز وجود نداشتند،
  // و color_name/color_code/is_in_stock/final_price که وجود داشتند غایب
  // بودند) — هیچ‌جای فرانت‌اند هم واقعاً از آن استفاده نمی‌کرد، پس این
  // ناهم‌خوانی تا امروز خطای کامپایل تولید نکرده بود. has_variants هم از
  // قلم افتاده بود با اینکه ProductResource از فاز ۲.۱ آن را برمی‌گرداند.
  has_variants?: boolean;
  variants?: ProductVariant[];

  created_at: string;
  updated_at: string;
}

/**
 * ✅ دقیقاً همان شکلی که ProductVariantResource (بک‌اند) سریالایز می‌کند —
 * چه از مسیر GET /products (لیست، از طریق ProductResource)، چه از مسیر
 * GET /products/slug/{slug} (جزئیات محصول، از طریق
 * ProductService::getProductBySlug که همین Resource را دستی صدا می‌زند).
 */
export interface ProductVariant {
  id: number;
  color_name: string | null;
  color_code: string | null;
  sku: string | null;
  price: number | null;
  compare_price: number | null;
  discount_price: number | null;
  /** قیمتی که واقعاً پرداخت می‌شود: discount_price اگر ست شده وگرنه price */
  final_price: number | null;
  stock: number;
  is_in_stock: boolean;
  image: string | null;
  attributes: Record<string, unknown>;
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
  // ✅ Variant/Color System فاز ۳: این فیلد از یک کامیت خیلی قدیمی‌تر
  // (پیش از پیاده‌سازی واقعی سیستم رنگ) در تایپ بود ولی هیچ‌جا استفاده
  // نمی‌شد؛ الان واقعاً توسط بک‌اند پر می‌شود (CartItem.variant_id).
  variant_id?: number | null;
  // یک نسخه‌ی سبک از رنگ انتخاب‌شده، فقط برای نمایش («رنگ: مشکی» زیر نام
  // محصول در سبد) — بدون نیاز به lookup جداگانه در product.variants.
  variant?: {
    id: number;
    color_name: string | null;
    color_code: string | null;
    sku: string | null;
  } | null;
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
// ==================== Product Alerts ====================

export type AlertType = 'restock' | 'price_drop' | 'target_price';
export type AlertChannel = 'database' | 'email';

export interface ProductAlert {
  id: number;
  user_id: number;
  product_id: number;
  type: AlertType;
  target_price?: number;
  discount_percentage?: number; // ✅ جدید: درصد تخفیف برای price_drop
  original_price: number;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at?: string;
  channels: AlertChannel[];
  product?: Product;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface AlertStatusResponse {
  has_alert: boolean;
  alerts: ProductAlert[];
  restock_alert: boolean;
  price_drop_alert: boolean;
  target_price_alert: boolean;
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

// ==================== Nearby Physical Stores ====================
// یک seller می‌تواند صفر یا چند فروشگاه فیزیکی داشته باشد؛ این کاملاً
// مستقل از Product.stock (موجودی آنلاین) است — رجوع به کامنت
// StoreInventory بک‌اند.

export interface Store {
  id: number;
  seller_id: number | null;
  name: string;
  phone?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  verified_at?: string | null;
  hours?: StoreHour[];
  inventory_count?: number;
  // ✅ فقط در پاسخ‌های ادمین eager-load می‌شود (AdminStoreService::list)
  seller?: { id: number; name: string; email?: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface StoreHour {
  id?: number;
  store_id?: number;
  // ۰=یکشنبه ... ۶=شنبه (مطابق ستون day_of_week بک‌اند)
  day_of_week: number;
  opens_at?: string | null;
  closes_at?: string | null;
  is_closed?: boolean;
}

export interface StoreInventoryItem {
  id: number;
  store_id: number;
  product_id: number;
  stock: number;
  pickup_enabled: boolean;
  product?: {
    id: number;
    name: string;
    slug: string;
    main_image: string;
    price: number;
    discount_price?: number | null;
  };
}

/** یک ردیف نتیجه‌ی جستجوی «فروشگاه‌های نزدیک این محصول» */
export interface NearbyStore {
  id: number;
  name: string;
  city?: string | null;
  province?: string | null;
  address?: string | null;
  phone?: string | null;
  latitude: number;
  longitude: number;
  stock: number;
  pickup_enabled: boolean;
  distance_meters: number;
  // ✅ Nearby Stores Completion Phase — batch-loaded در NearbyStoreService
  // (نه N+1)؛ همان shape عمومی StoreHour بالا (بدون id/store_id داخلی).
  hours?: Pick<StoreHour, 'day_of_week' | 'opens_at' | 'closes_at' | 'is_closed'>[];
  // ✅ فاز ۴.۱ (Product Detail → Nearby Stores): seller_id همیشه واقعی است
  // (ستون stores.seller_id، NOT NULL)؛ seller_slug فقط وقتی پر است که
  // فروشنده هنوز واقعاً یک seller فعال باشد (NearbyStoreService::attachSellerInfo)
  // — وقتی null است یعنی فروشنده حذف/غیرفعال شده، پس UI نباید لینک بسازد.
  seller_id: number;
  seller_slug: string | null;
}

export interface NearbyStoreSearchMeta {
  total: number;
  page: number;
  per_page: number;
  radius: number;
}