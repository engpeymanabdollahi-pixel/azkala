import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSellerStore } from '@/store/sellerStore';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Download,
  Printer,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  FileText,
  Copy,
  CreditCard,
  ShoppingBag,
  Shield,
  TrendingUp,
  DollarSign,
  Sparkles,
  XCircle,
  ChevronLeft,
  Receipt,
  Tag,
  MessageSquare,
  Star,
  Award,
  Info,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { SellerOrder, OrderItem } from '@/types/models';
import toast from 'react-hot-toast';

export function SellerOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useSellerStore();
  const [order, setOrder] = useState<SellerOrder | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const foundOrder = orders.find((o) => o.id === Number(orderId));
      if (foundOrder) {
        const mockItems: OrderItem[] = [
          {
            id: 1,
            order_id: foundOrder.order_id,
            product_id: 1,
            seller_id: foundOrder.seller_id,
            quantity: 2,
            price: 450000,
            total: 900000,
            product: {
              id: 1,
              seller_id: 1,
              category_id: 1,
              name: 'کاور سیلیکونی iPhone 15 Pro Max',
              slug: 'silicone-case-iphone-15-pro-max',
              description: 'کاور سیلیکونی با کیفیت بالا و طراحی زیبا',
              price: 450000,
              compare_price: 550000,
              stock: 50,
              status: 'active',
              images: [],
              main_image: '',
              rating: 4.5,
              reviews_count: 23,
              discount_percentage: 18,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-20T14:30:00Z',
            },
            created_at: foundOrder.created_at,
            updated_at: foundOrder.updated_at,
          },
          {
            id: 2,
            order_id: foundOrder.order_id,
            product_id: 2,
            seller_id: foundOrder.seller_id,
            quantity: 1,
            price: 1200000,
            total: 1200000,
            product: {
              id: 2,
              seller_id: 1,
              category_id: 3,
              name: 'شارژر فست Anker 65W',
              slug: 'anker-charger-65w',
              description: 'شارژر سریع با قدرت ۶۵ وات',
              price: 1200000,
              compare_price: 1450000,
              stock: 25,
              status: 'active',
              images: [],
              main_image: '',
              rating: 4.9,
              reviews_count: 102,
              discount_percentage: 17,
              created_at: '2024-01-05T12:00:00Z',
              updated_at: '2024-01-23T09:00:00Z',
            },
            created_at: foundOrder.created_at,
            updated_at: foundOrder.updated_at,
          },
          {
            id: 3,
            order_id: foundOrder.order_id,
            product_id: 3,
            seller_id: foundOrder.seller_id,
            quantity: 3,
            price: 280000,
            total: 840000,
            product: {
              id: 3,
              seller_id: 1,
              category_id: 1,
              name: 'گلس محافظ تمام صفحه Galaxy S24',
              slug: 'screen-protector-s24',
              description: 'گلس با پوشش کامل و کیفیت بالا',
              price: 280000,
              stock: 100,
              status: 'active',
              images: [],
              main_image: '',
              rating: 4.7,
              reviews_count: 56,
              created_at: '2024-01-10T08:00:00Z',
              updated_at: '2024-01-22T16:00:00Z',
            },
            created_at: foundOrder.created_at,
            updated_at: foundOrder.updated_at,
          },
        ];
        setOrder({ ...foundOrder, items: mockItems });
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [orderId, orders]);

  const getStatusConfig = useCallback((status: string) => {
    const config = {
      pending: {
        label: 'در انتظار تایید',
        variant: 'warning' as const,
        icon: Clock,
        color: 'from-warning-500 to-warning-600',
        bgColor: 'bg-warning-50',
        textColor: 'text-warning-700',
      },
      preparing: {
        label: 'در حال آماده‌سازی',
        variant: 'primary' as const,
        icon: Package,
        color: 'from-primary-500 to-primary-600',
        bgColor: 'bg-primary-50',
        textColor: 'text-primary-700',
      },
      ready_for_shipment: {
        label: 'آماده ارسال',
        variant: 'accent' as const,
        icon: Truck,
        color: 'from-accent-500 to-accent-600',
        bgColor: 'bg-accent-50',
        textColor: 'text-accent-700',
      },
      shipped: {
        label: 'ارسال شده',
        variant: 'success' as const,
        icon: Truck,
        color: 'from-success-500 to-success-600',
        bgColor: 'bg-success-50',
        textColor: 'text-success-700',
      },
      delivered: {
        label: 'تحویل داده شده',
        variant: 'success' as const,
        icon: CheckCircle,
        color: 'from-success-500 to-success-600',
        bgColor: 'bg-success-50',
        textColor: 'text-success-700',
      },
      cancelled: {
        label: 'لغو شده',
        variant: 'error' as const,
        icon: XCircle,
        color: 'from-error-500 to-error-600',
        bgColor: 'bg-error-50',
        textColor: 'text-error-700',
      },
    };
    return config[status as keyof typeof config] || config.pending;
  }, []);

  const handleStatusChange = useCallback(async () => {
    if (!newStatus || !order) return;

    setIsSubmitting(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      setOrder({ ...order, status: newStatus as any });
      setShowStatusModal(false);
      setNewStatus('');
      toast.success('وضعیت سفارش با موفقیت تغییر کرد', { icon: '✅' });
    } catch (error) {
      toast.error('خطا در تغییر وضعیت سفارش');
    } finally {
      setIsSubmitting(false);
    }
  }, [newStatus, order, updateOrderStatus]);

  const handleCopyTracking = useCallback((trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success('کد رهگیری کپی شد', { icon: '📋' });
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
    toast.success('در حال آماده‌سازی برای چاپ...');
  }, []);

  const handleDownloadInvoice = useCallback(() => {
    toast.success('فاکتور در حال دانلود...', { icon: '📥' });
  }, []);

  const availableStatuses = useMemo(() => ({
    pending: [
      { value: 'preparing', label: 'در حال آماده‌سازی', icon: Package, color: 'from-primary-500 to-primary-600' },
      { value: 'cancelled', label: 'لغو سفارش', icon: XCircle, color: 'from-error-500 to-error-600' },
    ],
    preparing: [
      { value: 'ready_for_shipment', label: 'آماده ارسال', icon: Truck, color: 'from-accent-500 to-accent-600' },
      { value: 'cancelled', label: 'لغو سفارش', icon: XCircle, color: 'from-error-500 to-error-600' },
    ],
    ready_for_shipment: [
      { value: 'shipped', label: 'ارسال شده', icon: Truck, color: 'from-success-500 to-success-600' },
    ],
    shipped: [
      { value: 'delivered', label: 'تحویل داده شده', icon: CheckCircle, color: 'from-success-500 to-success-600' },
    ],
    delivered: [],
    cancelled: [],
  }), []);

  const timelineSteps = useMemo(() => {
    if (!order) return [];
    return [
      {
        status: 'pending',
        label: 'ثبت سفارش',
        description: 'سفارش توسط مشتری ثبت شد',
        time: order.created_at,
        active: true,
        icon: ShoppingBag,
      },
      {
        status: 'preparing',
        label: 'در حال آماده‌سازی',
        description: 'سفارش در حال بسته‌بندی است',
        time: order.status === 'preparing' ? order.updated_at : null,
        active: ['preparing', 'ready_for_shipment', 'shipped', 'delivered'].includes(order.status),
        icon: Package,
      },
      {
        status: 'ready_for_shipment',
        label: 'آماده ارسال',
        description: 'سفارش بسته‌بندی شده و آماده ارسال',
        time: order.status === 'ready_for_shipment' ? order.updated_at : null,
        active: ['ready_for_shipment', 'shipped', 'delivered'].includes(order.status),
        icon: Truck,
      },
      {
        status: 'shipped',
        label: 'ارسال شده',
        description: 'سفارش به شرکت پستی تحویل داده شد',
        time: order.shipped_at || null,
        active: ['shipped', 'delivered'].includes(order.status),
        icon: Truck,
      },
      {
        status: 'delivered',
        label: 'تحویل داده شده',
        description: 'سفارش به مشتری تحویل داده شد',
        time: order.delivered_at || null,
        active: order.status === 'delivered',
        icon: CheckCircle,
      },
    ];
  }, [order]);

  const canChangeStatus = useMemo(() => {
    if (!order) return false;
    return (availableStatuses[order.status as keyof typeof availableStatuses]?.length || 0) > 0;
  }, [order, availableStatuses]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 bg-gray-200 rounded-xl w-48 mb-6 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-96 bg-gray-200 rounded-3xl animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-64 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-48 bg-gray-200 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-error-500 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-error-500 to-error-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-error-500/30">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">سفارش یافت نشد</h2>
          <p className="text-gray-600 mb-6">سفارش مورد نظر شما وجود ندارد یا حذف شده است</p>
          <Button className="w-full" size="lg" onClick={() => navigate('/seller/orders')}>
            <ArrowLeft className="w-5 h-5 ml-2" />
            بازگشت به لیست سفارشات
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate('/seller/orders')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به لیست سفارشات
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-14 h-14 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg',
                statusConfig.color
              )}>
                <StatusIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                    سفارش #{order.order_id}
                  </h1>
                  <Badge variant={statusConfig.variant} className="gap-1.5">
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  ثبت شده در{' '}
                  {new Date(order.created_at).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">چاپ</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadInvoice}>
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">دانلود فاکتور</span>
              </Button>
              {canChangeStatus && (
                <Button size="sm" className="gap-1.5" onClick={() => setShowStatusModal(true)}>
                  <Package className="w-4 h-4" />
                  <span className="hidden md:inline">تغییر وضعیت</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  وضعیت سفارش
                </h2>
              </div>

              <div className="relative">
                <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  {timelineSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={index} className="flex items-start gap-4 relative">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-lg',
                            step.active
                              ? `bg-gradient-to-br ${statusConfig.color} text-white scale-100`
                              : 'bg-white border-2 border-gray-300 text-gray-400'
                          )}
                        >
                          {step.active ? (
                            <Icon className="w-5 h-5" />
                          ) : (
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                          )}
                        </div>
                        <div className={cn(
                          'flex-1 pt-1 pb-2',
                          step.active ? 'opacity-100' : 'opacity-50'
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn(
                              'font-black',
                              step.active ? 'text-gray-900' : 'text-gray-400'
                            )}>
                              {step.label}
                            </p>
                            {step.active && order.status === step.status && (
                              <Badge variant={statusConfig.variant} size="sm">
                                فعلی
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            'text-sm mb-1',
                            step.active ? 'text-gray-600' : 'text-gray-400'
                          )}>
                            {step.description}
                          </p>
                          {step.time && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(step.time).toLocaleDateString('fa-IR', {
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="p-6 border-b border-gray-100 bg-gradient-to-l from-gray-50/50 to-white">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-md">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  آیتم‌های سفارش
                  <Badge variant="primary" size="sm">
                    {order.items?.length || 0} محصول
                  </Badge>
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {order.items?.map((item, index) => (
                  <div key={index} className="p-6 hover:bg-primary-50/30 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 group-hover:scale-105 transition-transform shadow-md">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                          {item.product?.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2 font-mono">
                          SKU: {item.product?.slug}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                            <Package className="w-3.5 h-3.5 text-primary-500" />
                            <span className="font-semibold">{item.quantity}</span> عدد
                          </span>
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                            <Tag className="w-3.5 h-3.5 text-accent-500" />
                            {formatPrice(item.price)}
                          </span>
                          {item.product?.discount_percentage && item.product.discount_percentage > 0 && (
                            <Badge variant="error" size="sm">
                              <Flame className="w-3 h-3" />
                              {item.product.discount_percentage}٪ تخفیف
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-xl text-primary-700">{formatPrice(item.total)}</p>
                        {item.product?.compare_price && item.product.compare_price > item.price && (
                          <p className="text-xs text-gray-400 line-through mt-1">
                            {formatPrice(item.product.compare_price * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="p-6 bg-gradient-to-l from-primary-50/50 to-white border-t border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      جمع کالاها
                    </span>
                    <span className="font-bold">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      هزینه ارسال
                    </span>
                    <span className="font-bold">
                      {order.shipping === 0 ? (
                        <Badge variant="success" size="sm">رایگان</Badge>
                      ) : (
                        formatPrice(order.shipping)
                      )}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex items-center justify-between text-success-600">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        تخفیف
                      </span>
                      <span className="font-bold flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" />
                        {formatPrice(order.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xl font-black pt-4 border-t-2 border-primary-200">
                    <span className="text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary-600" />
                      مبلغ نهایی
                    </span>
                    <span className="text-primary-700">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Tracking Info */}
            {order.tracking_number && (
              <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-primary-500/30 animate-fade-in">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-lg">اطلاعات ارسال</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-white/80 text-xs mb-1">شرکت پستی</p>
                      <p className="font-black">{order.courier_name || 'نامشخص'}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-white/80 text-xs mb-1">کد رهگیری</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono font-black text-lg" dir="ltr">{order.tracking_number}</p>
                        <button
                          onClick={() => handleCopyTracking(order.tracking_number!)}
                          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                          title="کپی کد رهگیری"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {order.shipped_at && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                        <p className="text-white/80 text-xs mb-1">تاریخ ارسال</p>
                        <p className="font-black flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.shipped_at).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-gray-900">اطلاعات مشتری</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-black shadow-md">
                    ع
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">نام و نام خانوادگی</p>
                    <p className="font-black text-gray-900">علی رضایی</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center shadow-md">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">شماره تماس</p>
                    <p className="font-black text-gray-900" dir="ltr">09123456789</p>
                  </div>
                  <button className="p-2 bg-success-100 hover:bg-success-200 rounded-lg transition-colors">
                    <Phone className="w-4 h-4 text-success-600" />
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center shadow-md">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">ایمیل</p>
                    <p className="font-black text-gray-900 text-sm">ali.rezaei@example.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-gray-900">آدرس تحویل</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <Shield className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">استان / شهر</p>
                    <p className="font-bold text-gray-900">تهران، تهران</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <p className="text-xs text-gray-500">آدرس کامل</p>
                  </div>
                  <p className="text-gray-900 leading-relaxed font-medium pr-6">
                    خیابان ولیعصر، نرسیده به میدان ونک، پلاک 123، واحد 4
                  </p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">کد پستی</p>
                    <p className="font-mono font-black text-gray-900" dir="ltr">1234567890</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('1234567890');
                      toast.success('کد پستی کپی شد');
                    }}
                    className="p-2 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-primary-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-gradient-to-br from-warning-50 to-accent-50 border-2 border-warning-200 rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-warning-900">یادداشت مشتری</h3>
                </div>
                <p className="text-warning-800 leading-relaxed bg-white/50 rounded-xl p-3">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                اقدامات سریع
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrint}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Printer className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">چاپ سفارش</span>
                </button>
                <button
                  onClick={handleDownloadInvoice}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">دانلود فاکتور</span>
                </button>
                <button
                  onClick={() => toast.success('پیامک ارسال شد', { icon: '📱' })}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">پیامک به مشتری</span>
                </button>
                <button
                  onClick={() => toast.success('ایمیل ارسال شد', { icon: '📧' })}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">ایمیل به مشتری</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setNewStatus('');
        }}
        size="md"
        title="تغییر وضعیت سفارش"
      >
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-primary-500/30">
              <Package className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            وضعیت جدید سفارش #{order.order_id} را انتخاب کنید
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {availableStatuses[order.status as keyof typeof availableStatuses]?.map((status) => {
            const StatusIcon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => setNewStatus(status.value)}
                className={cn(
                  'w-full text-right px-4 py-4 rounded-2xl border-2 transition-all flex items-center gap-3 group',
                  newStatus === status.value
                    ? 'border-primary-500 bg-gradient-to-l from-primary-50 to-white shadow-md'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 transition-transform',
                  status.color
                )}>
                  <StatusIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900 flex-1">{status.label}</span>
                {newStatus === status.value && (
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            size="lg"
            onClick={() => {
              setShowStatusModal(false);
              setNewStatus('');
            }}
          >
            انصراف
          </Button>
          <Button
            className="flex-1"
            size="lg"
            onClick={handleStatusChange}
            disabled={!newStatus || isSubmitting}
            isLoading={isSubmitting}
          >
            <CheckCircle className="w-5 h-5 ml-2" />
            ثبت تغییر
          </Button>
        </div>
      </Modal>
    </div>
  );
}