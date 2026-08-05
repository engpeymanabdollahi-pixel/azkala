import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Printer,
  AlertCircle,
  AlertTriangle,
  Phone,
  Calendar,
  FileText,
  Copy,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Sparkles,
  Tag,
  MessageSquare,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { sellerOrderService, type SellerOrder, type SellerOrderShippingAddress } from '@/services/api/sellerOrder.service';
import { getOrderStatusConfig, getAvailableTransitions, ORDER_TIMELINE_STEPS, isTimelineStepActive } from '@/utils/orderStatus';
import toast from 'react-hot-toast';

export function SellerOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // این صفحه قبلاً هیچ داده‌ی واقعی‌ای نمی‌خواند — سفارش را از
  // useSellerStore().orders می‌گرفت، فروشگاهی که هیچ‌جای دیگر برنامه پر
  // نمی‌شد (fetchOrders هیچ‌وقت صدا زده نمی‌شد)، پس orders همیشه [] بود و
  // این صفحه برای هر سفارشی «سفارش یافت نشد» نشان می‌داد. آیتم‌های سفارش،
  // نام/تلفن/ایمیل مشتری و آدرس هم داده‌ی کاملاً ساختگیِ هاردکد بودند —
  // یکسان برای هر سفارشی. اینجا از همان سرویس واقعی که SellerOrders و
  // SellerOrderDetailModal با موفقیت استفاده می‌کنند می‌خوانیم.
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['seller-order', orderId],
    queryFn: () => sellerOrderService.getOrder(orderId!),
    enabled: !!orderId,
  });

  const order = data?.data as SellerOrder | undefined;

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => sellerOrderService.updateStatus(orderId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders-fresh'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders-stats'] });
    },
  });

  const handleStatusChange = useCallback(async () => {
    if (!newStatus) return;
    try {
      await updateStatusMutation.mutateAsync({ status: newStatus });
      setShowStatusModal(false);
      setNewStatus('');
      toast.success('وضعیت سفارش با موفقیت تغییر کرد', { icon: '✅' });
    } catch {
      toast.error('خطا در تغییر وضعیت سفارش');
    }
  }, [newStatus, updateStatusMutation]);

  const handleCopy = useCallback((text: string, label: string = 'کد') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} کپی شد`, { icon: '📋' });
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const shippingAddress = useMemo<SellerOrderShippingAddress | null>(() => {
    if (!order?.shipping_address) return null;
    if (typeof order.shipping_address === 'string') {
      try {
        return JSON.parse(order.shipping_address);
      } catch {
        return null;
      }
    }
    return order.shipping_address;
  }, [order?.shipping_address]);

  const availableStatuses = useMemo(() => (order ? getAvailableTransitions(order.status) : []), [order]);

  const timelineSteps = useMemo(() => {
    if (!order) return [];
    return ORDER_TIMELINE_STEPS.map((step) => ({
      ...step,
      time: order.status === step.status ? order.updated_at : (step.status === 'pending' ? order.created_at : (step.status === 'shipped' ? order.shipped_at : step.status === 'delivered' ? order.delivered_at : null)),
      active: isTimelineStepActive(step.status, order.status),
    }));
  }, [order]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-xl w-48 mb-6 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-3xl animate-pulse" />
              <div className="h-96 bg-gray-200 dark:bg-slate-700 rounded-3xl animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded-3xl animate-pulse" />
              <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-10 text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-error-500 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-error-500 to-error-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-error-500/30">
              {error ? <AlertTriangle className="w-10 h-10 text-white" /> : <AlertCircle className="w-10 h-10 text-white" />}
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
            {error ? 'خطا در بارگذاری سفارش' : 'سفارش یافت نشد'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error ? 'مشکلی در ارتباط با سرور رخ داد' : 'سفارش مورد نظر شما وجود ندارد یا متعلق به شما نیست'}
          </p>
          <div className="flex gap-2">
            {error && (
              <Button variant="outline" className="flex-1" size="lg" onClick={() => refetch()}>
                تلاش مجدد
              </Button>
            )}
            <Button className="flex-1" size="lg" onClick={() => navigate('/seller/orders')}>
              <ArrowLeft className="w-5 h-5 ml-2" />
              بازگشت به لیست سفارشات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getOrderStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900 min-h-screen transition-colors duration-300">
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
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                    سفارش #{order.order_number}
                  </h1>
                  <Badge variant={statusConfig.variant} className="gap-1.5">
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
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
              {availableStatuses.length > 0 && (
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
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  وضعیت سفارش
                </h2>
              </div>

              <div className="relative">
                <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700"></div>
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
                              : 'bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500'
                          )}
                        >
                          {step.active ? (
                            <Icon className="w-5 h-5" />
                          ) : (
                            <div className="w-3 h-3 bg-gray-300 dark:bg-slate-600 rounded-full"></div>
                          )}
                        </div>
                        <div className={cn(
                          'flex-1 pt-1 pb-2',
                          step.active ? 'opacity-100' : 'opacity-50'
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn(
                              'font-black',
                              step.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
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
                            step.active ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                          )}>
                            {step.description}
                          </p>
                          {step.time && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
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
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-l from-gray-50/50 to-white dark:from-slate-900/50 dark:to-slate-800">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-md">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  آیتم‌های سفارش
                  <Badge variant="primary" size="sm">
                    {order.items?.length || 0} محصول
                  </Badge>
                </h2>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {order.items?.map((item, index) => (
                  <div key={index} className="p-6 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors group">
                    <div className="flex items-start gap-4">
                      <SafeImage
                        src={item.product?.main_image}
                        alt={item.product?.name || 'محصول'}
                        className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform shadow-md bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600"
                        showEmojiOnError
                        fallbackEmoji="📦"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {item.product?.name || 'محصول'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-gray-700 dark:text-gray-300">
                            <Package className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
                            <span className="font-semibold">{item.quantity}</span> عدد
                          </span>
                          <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-gray-700 dark:text-gray-300">
                            <Tag className="w-3.5 h-3.5 text-accent-500 dark:text-accent-400" />
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
                        <p className="font-black text-xl text-primary-700 dark:text-primary-400">{formatPrice(item.total)}</p>
                        {item.product?.compare_price && item.product.compare_price > item.price && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-through mt-1">
                            {formatPrice(item.product.compare_price * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="p-6 bg-gradient-to-l from-primary-50/50 to-white dark:from-primary-900/10 dark:to-slate-800 border-t border-gray-100 dark:border-slate-700">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      جمع کالاها
                    </span>
                    <span className="font-bold">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
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
                    <div className="flex items-center justify-between text-success-600 dark:text-success-400">
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
                  <div className="flex items-center justify-between text-xl font-black pt-4 border-t-2 border-primary-200 dark:border-primary-800">
                    <span className="text-gray-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      مبلغ نهایی سهم شما
                    </span>
                    <span className="text-primary-700 dark:text-primary-400">{formatPrice(order.seller_total || order.total)}</span>
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
                          onClick={() => handleCopy(order.tracking_number!, 'کد رهگیری')}
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
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-gray-900 dark:text-white">اطلاعات مشتری</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-black shadow-md">
                    {(order.customer_name || order.user?.name || 'م')[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">نام و نام خانوادگی</p>
                    <p className="font-black text-gray-900 dark:text-white">{order.customer_name || order.user?.name || 'مشتری'}</p>
                  </div>
                </div>
                {order.user?.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center shadow-md">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">شماره تماس</p>
                      <p className="font-black text-gray-900 dark:text-white" dir="ltr">{order.user.phone}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(order.user!.phone!, 'شماره تماس')}
                      className="p-2 bg-success-100 dark:bg-success-900/30 hover:bg-success-200 dark:hover:bg-success-900/50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-success-600 dark:text-success-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {shippingAddress && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white">آدرس تحویل</h3>
                </div>
                <div className="space-y-3">
                  {(shippingAddress.province || shippingAddress.city) && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                      <MapPin className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">استان / شهر</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {[shippingAddress.province, shippingAddress.city].filter(Boolean).join('، ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {shippingAddress.address && (
                    <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">آدرس کامل</p>
                      </div>
                      <p className="text-gray-900 dark:text-white leading-relaxed font-medium pr-6">
                        {shippingAddress.address}
                      </p>
                    </div>
                  )}
                  {shippingAddress.postal_code && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                      <FileText className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">کد پستی</p>
                        <p className="font-mono font-black text-gray-900 dark:text-white" dir="ltr">{shippingAddress.postal_code}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(shippingAddress.postal_code!, 'کد پستی')}
                        className="p-2 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="bg-gradient-to-br from-warning-50 to-accent-50 dark:from-warning-900/20 dark:to-accent-900/20 border-2 border-warning-200 dark:border-warning-800/40 rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-warning-900 dark:text-warning-300">یادداشت مشتری</h3>
                </div>
                <p className="text-warning-800 dark:text-warning-200 leading-relaxed bg-white/50 dark:bg-black/20 rounded-xl p-3">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Quick Actions — قبلاً اینجا «پیامک به مشتری» و «ایمیل به مشتری»
                هم بود که فقط toast «ارسال شد» نشان می‌داد، بدون اینکه هیچ
                پیامکی یا ایمیلی واقعاً ارسال شود (چنین endpoint‌ای اصلاً وجود
                ندارد) — به فروشنده دروغ می‌گفت. «دانلود فاکتور» هم همین‌طور
                حذف شد؛ فقط چاپ که واقعاً کار می‌کند مانده است. */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <h3 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                اقدامات سریع
              </h3>
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors group"
              >
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Printer className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">چاپ سفارش</span>
              </button>
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
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            وضعیت جدید سفارش #{order.order_number} را انتخاب کنید
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {availableStatuses.map((status) => {
            const StatusIcon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => setNewStatus(status.value)}
                className={cn(
                  'w-full text-right px-4 py-4 rounded-2xl border-2 transition-all flex items-center gap-3 group',
                  newStatus === status.value
                    ? 'border-primary-500 bg-gradient-to-l from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 shadow-md'
                    : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 transition-transform',
                  status.color
                )}>
                  <StatusIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white flex-1">{status.label}</span>
                {newStatus === status.value && (
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
            disabled={!newStatus || updateStatusMutation.isPending}
            isLoading={updateStatusMutation.isPending}
          >
            <CheckCircle className="w-5 h-5 ml-2" />
            ثبت تغییر
          </Button>
        </div>
      </Modal>
    </div>
  );
}
export default SellerOrderDetail;
