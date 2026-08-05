import { Clock, Package, Truck, CheckCircle, XCircle, ShoppingBag, type LucideIcon } from 'lucide-react';

/**
 * enum واقعی وضعیت سفارش — دقیقاً همان چیزی که ستون orders.status در
 * migration می‌پذیرد: pending/processing/shipped/delivered/cancelled.
 *
 * قبل از این فایل، هر صفحه‌ی سفارشاتِ فروشنده (SellerOrders، SellerOrderDetail،
 * SellerOrderDetailModal، SellerDashboard) این پیکربندی را جدا و دستی
 * می‌نوشت. دو تا از آن‌ها (SellerOrderDetail و SellerDashboard، پیش از این
 * فیکس) از یک enum جعلی با «preparing» و «ready_for_shipment» استفاده
 * می‌کردند — دو مقداری که اصلاً در دیتابیس وجود ندارند؛ سفارشی که واقعاً در
 * وضعیت «processing» بود با برچسب غلط «در انتظار» نشان داده می‌شد. یک منبع
 * واحد برای این enum، تکرار این باگ را در صفحه‌ی بعدی سخت‌تر می‌کند.
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderStatusConfig {
  label: string;
  variant: 'warning' | 'primary' | 'success' | 'error';
  icon: LucideIcon;
  color: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: { label: 'در انتظار تأیید', variant: 'warning', icon: Clock, color: 'from-warning-500 to-warning-600' },
  processing: { label: 'در حال پردازش', variant: 'primary', icon: Package, color: 'from-primary-500 to-primary-600' },
  shipped: { label: 'ارسال شده', variant: 'success', icon: Truck, color: 'from-success-500 to-success-600' },
  delivered: { label: 'تحویل داده شده', variant: 'success', icon: CheckCircle, color: 'from-success-500 to-success-600' },
  cancelled: { label: 'لغو شده', variant: 'error', icon: XCircle, color: 'from-error-500 to-error-600' },
};

/** برای وضعیت نامشخص/قدیمی، به‌جای گمراه‌کردن با یک برچسب دلبخواه، «در انتظار» برمی‌گرداند. */
export function getOrderStatusConfig(status: string): OrderStatusConfig {
  return ORDER_STATUS_CONFIG[status as OrderStatus] || ORDER_STATUS_CONFIG.pending;
}

export interface OrderStatusTransition {
  value: OrderStatus;
  label: string;
  icon: LucideIcon;
  color: string;
}

/** گذارهای واقعی مجاز — دقیقاً همان چیزی که SellerOrderController::updateStatus می‌پذیرد. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatusTransition[]> = {
  pending: [
    { value: 'processing', label: 'شروع پردازش', icon: Package, color: ORDER_STATUS_CONFIG.processing.color },
    { value: 'cancelled', label: 'لغو سفارش', icon: XCircle, color: ORDER_STATUS_CONFIG.cancelled.color },
  ],
  processing: [
    { value: 'shipped', label: 'ارسال شده', icon: Truck, color: ORDER_STATUS_CONFIG.shipped.color },
    { value: 'cancelled', label: 'لغو سفارش', icon: XCircle, color: ORDER_STATUS_CONFIG.cancelled.color },
  ],
  shipped: [
    { value: 'delivered', label: 'تحویل داده شده', icon: CheckCircle, color: ORDER_STATUS_CONFIG.delivered.color },
  ],
  delivered: [],
  cancelled: [],
};

export function getAvailableTransitions(status: string): OrderStatusTransition[] {
  return ORDER_STATUS_TRANSITIONS[status as OrderStatus] || [];
}

export interface OrderTimelineStep {
  status: OrderStatus;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** مراحل ثابت مسیر سفارش برای نمایش Timeline — «لغو شده» بیرون از این مسیر خطی است و جدا نشان داده می‌شود. */
export const ORDER_TIMELINE_STEPS: OrderTimelineStep[] = [
  { status: 'pending', label: 'ثبت سفارش', description: 'سفارش توسط مشتری ثبت شد', icon: ShoppingBag },
  { status: 'processing', label: 'در حال پردازش', description: 'سفارش در حال آماده‌سازی است', icon: Package },
  { status: 'shipped', label: 'ارسال شده', description: 'سفارش به شرکت پستی تحویل داده شد', icon: Truck },
  { status: 'delivered', label: 'تحویل داده شده', description: 'سفارش به مشتری تحویل داده شد', icon: CheckCircle },
];

const TIMELINE_ORDER: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

/** آیا این مرحله از Timeline، با توجه به وضعیت فعلی سفارش، «طی‌شده» حساب می‌شود؟ */
export function isTimelineStepActive(step: OrderStatus, currentStatus: string): boolean {
  const currentIndex = TIMELINE_ORDER.indexOf(currentStatus as OrderStatus);
  const stepIndex = TIMELINE_ORDER.indexOf(step);
  if (currentIndex === -1 || stepIndex === -1) return step === 'pending';
  return stepIndex <= currentIndex;
}
