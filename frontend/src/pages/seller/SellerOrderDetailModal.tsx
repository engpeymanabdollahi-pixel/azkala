import { useEffect, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Package, User, MapPin, Clock, CheckCircle, Truck,
  Download, Printer, Phone, Mail, Calendar, FileText,
  Copy, DollarSign, ShoppingBag, Sparkles, XCircle, Tag,
  MessageSquare, TrendingUp, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { sellerOrderService, type SellerOrder } from '@/services/api/sellerOrder.service';
import toast from 'react-hot-toast';

// ==================== Props ====================
interface SellerOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

// ==================== Main Component ====================
export function SellerOrderDetailModal({ isOpen, onClose, orderId }: SellerOrderDetailModalProps) {
  const queryClient = useQueryClient();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // ✅ Fetch سفارش از API
  const { data, isLoading } = useQuery({
    queryKey: ['seller-order', orderId],
    queryFn: () => sellerOrderService.getOrder(orderId!),
    enabled: isOpen && !!orderId,
  });

  // ✅ Mutation برای تغییر وضعیت
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      sellerOrderService.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders-stats'] });
    },
  });

  const order = data?.data as SellerOrder | undefined;

  const getStatusConfig = useCallback((status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any; color: string }> = {
      pending: { label: 'در انتظار', variant: 'warning', icon: Clock, color: 'from-warning-500 to-warning-600' },
      processing: { label: 'در حال پردازش', variant: 'primary', icon: Package, color: 'from-primary-500 to-primary-600' },
      shipped: { label: 'ارسال شده', variant: 'success', icon: Truck, color: 'from-success-500 to-success-600' },
      delivered: { label: 'تحویل شده', variant: 'success', icon: CheckCircle, color: 'from-success-500 to-success-600' },
      cancelled: { label: 'لغو شده', variant: 'error', icon: XCircle, color: 'from-error-500 to-error-600' },
    };
    return config[status] || config.pending;
  }, []);

  const handleStatusChange = useCallback(async () => {
    if (!newStatus || !order) return;
    try {
      await updateStatusMutation.mutateAsync({ orderId: order.id, status: newStatus });
      setShowStatusModal(false);
      setNewStatus('');
      toast.success('وضعیت سفارش تغییر کرد', { icon: '✅' });
    } catch (error) {
      toast.error('خطا در تغییر وضعیت');
    }
  }, [newStatus, order, updateStatusMutation]);

  const handleCopy = useCallback((text: string, label: string = 'کد') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} کپی شد`, { icon: '📋' });
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Parse shipping_address
  const shippingAddress = useMemo(() => {
    if (!order?.shipping_address) return null;
    try {
      return typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;
    } catch {
      return null;
    }
  }, [order?.shipping_address]);

  const availableStatuses = useMemo(() => {
    if (!order) return [];
    const map: Record<string, { value: string; label: string; icon: any; color: string }[]> = {
      pending: [
        { value: 'processing', label: 'شروع پردازش', icon: Package, color: 'from-primary-500 to-primary-600' },
        { value: 'cancelled', label: 'لغو سفارش', icon: XCircle, color: 'from-error-500 to-error-600' },
      ],
      processing: [
        { value: 'shipped', label: 'ارسال شده', icon: Truck, color: 'from-success-500 to-success-600' },
        { value: 'cancelled', label: 'لغو سفارش', icon: XCircle, color: 'from-error-500 to-error-600' },
      ],
      shipped: [
        { value: 'delivered', label: 'تحویل داده شده', icon: CheckCircle, color: 'from-success-500 to-success-600' },
      ],
      delivered: [],
      cancelled: [],
    };
    return map[order.status] || [];
  }, [order]);

  const timelineSteps = useMemo(() => {
    if (!order) return [];
    return [
      { status: 'pending', label: 'ثبت سفارش', description: 'سفارش توسط مشتری ثبت شد', time: order.created_at, active: true, icon: ShoppingBag },
      { status: 'processing', label: 'در حال پردازش', description: 'سفارش در حال آماده‌سازی', time: order.status === 'processing' ? order.updated_at : null, active: ['processing', 'shipped', 'delivered'].includes(order.status), icon: Package },
      { status: 'shipped', label: 'ارسال شده', description: 'به شرکت پستی تحویل شد', time: order.status === 'shipped' ? order.updated_at : null, active: ['shipped', 'delivered'].includes(order.status), icon: Truck },
      { status: 'delivered', label: 'تحویل داده شده', description: 'به مشتری تحویل شد', time: order.status === 'delivered' ? order.updated_at : null, active: order.status === 'delivered', icon: CheckCircle },
    ];
  }, [order]);

  if (!isOpen) return null;

  // Loading State
  if (isLoading || !order) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl" title={null}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">در حال بارگذاری...</p>
          </div>
        </div>
      </Modal>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" title={null}>
        {/* Custom Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-md', statusConfig.color)}>
              <StatusIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-black text-gray-900">{order.order_number}</h1>
                <Badge variant={statusConfig.variant} size="sm" className="gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                ثبت: {new Date(order.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-xs">چاپ</span>
            </Button>
            {availableStatuses.length > 0 && (
              <Button size="sm" className="gap-1" onClick={() => setShowStatusModal(true)}>
                <Package className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-xs">تغییر وضعیت</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(90vh-180px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-3">
              {/* Timeline */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900">وضعیت سفارش</h2>
                </div>

                <div className="relative">
                  <div className="absolute right-[15px] top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-3">
                    {timelineSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isCurrent = order.status === step.status;
                      return (
                        <div key={index} className="flex items-start gap-3 relative">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-sm',
                              step.active
                                ? `bg-gradient-to-br ${statusConfig.color} text-white`
                                : 'bg-white border-2 border-gray-300 text-gray-400'
                            )}
                          >
                            {step.active ? <Icon className="w-4 h-4" /> : <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                          </div>
                          <div className={cn('flex-1 pt-0.5 pb-1.5', step.active ? 'opacity-100' : 'opacity-50')}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className={cn('font-black text-sm', step.active ? 'text-gray-900' : 'text-gray-400')}>
                                {step.label}
                              </p>
                              {isCurrent && (
                                <Badge variant={statusConfig.variant} size="sm">فعلی</Badge>
                              )}
                            </div>
                            <p className={cn('text-xs mb-0.5', step.active ? 'text-gray-600' : 'text-gray-400')}>
                              {step.description}
                            </p>
                            {step.time && (
                              <p className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(step.time).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-l from-gray-50/50 to-white">
                  <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-sm">
                      <ShoppingBag className="w-3.5 h-3.5 text-white" />
                    </div>
                    آیتم‌های سفارش
                    <Badge variant="primary" size="sm">{order.items?.length || 0} محصول</Badge>
                  </h2>
                </div>

                <div className="divide-y divide-gray-100">
                  {(order.items || []).map((item: any, index: number) => (
                    <div key={index} className="p-3 hover:bg-primary-50/30 transition-colors group">
                      <div className="flex items-start gap-2">
                        {item.product?.main_image ? (
                          <img
                            src={item.product.main_image}
                            alt={item.product.name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                            📦
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-gray-900 text-sm mb-0.5 group-hover:text-primary-600 transition-colors line-clamp-1">
                            {item.product?.name || 'محصول'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded">
                              <Package className="w-3 h-3 text-primary-500" />
                              <span className="font-semibold">{item.quantity}</span> عدد
                            </span>
                            <span className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded">
                              <Tag className="w-3 h-3 text-accent-500" />
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-black text-sm text-primary-700">{formatPrice(item.total || item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="p-3 bg-gradient-to-l from-primary-50/50 to-white border-t border-gray-100">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-gray-600 text-xs">
                      <span className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" />جمع کالاها</span>
                      <span className="font-bold">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 text-xs">
                      <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />هزینه ارسال</span>
                      <span className="font-bold">
                        {order.shipping === 0 ? <Badge variant="success" size="sm">رایگان</Badge> : formatPrice(order.shipping)}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex items-center justify-between text-success-600 text-xs">
                        <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />تخفیف</span>
                        <span className="font-bold">{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-base font-black pt-2 border-t border-primary-200">
                      <span className="text-gray-900 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-primary-600" />
                        مبلغ نهایی
                      </span>
                      <span className="text-primary-700">{formatPrice(order.seller_total || order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Tracking Info */}
              {order.tracking_number && (
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-xl p-3 text-white relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-black text-sm">اطلاعات ارسال</h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                      <p className="text-white/80 text-[10px] mb-0.5">کد رهگیری</p>
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="font-mono font-black text-sm" dir="ltr">{order.tracking_number}</p>
                        <button onClick={() => handleCopy(order.tracking_number!, 'کد رهگیری')} className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center shadow-sm">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 text-sm">اطلاعات مشتری</h3>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-black shadow-sm text-xs">
                      {(order.customer_name || order.user?.name || 'م')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-500">نام</p>
                      <p className="font-black text-gray-900 text-xs">{order.customer_name || order.user?.name || 'مشتری'}</p>
                    </div>
                  </div>
                  {order.user?.phone && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center shadow-sm">
                        <Phone className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500">شماره تماس</p>
                        <p className="font-black text-gray-900 text-xs" dir="ltr">{order.user.phone}</p>
                      </div>
                    </div>
                  )}
                  {order.user?.email && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center shadow-sm">
                        <Mail className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500">ایمیل</p>
                        <p className="font-black text-gray-900 text-[11px]">{order.user.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {shippingAddress && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-black text-gray-900 text-sm">آدرس تحویل</h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500">استان / شهر</p>
                        <p className="font-bold text-gray-900 text-xs">
                          {shippingAddress.province}، {shippingAddress.city}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <MapPin className="w-3 h-3 text-primary-500 flex-shrink-0" />
                        <p className="text-[10px] text-gray-500">آدرس کامل</p>
                      </div>
                      <p className="text-gray-900 text-xs leading-relaxed font-medium pr-4">
                        {shippingAddress.address}
                      </p>
                    </div>
                    {shippingAddress.postal_code && (
                      <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-500">کد پستی</p>
                          <p className="font-mono font-black text-gray-900 text-xs" dir="ltr">{shippingAddress.postal_code}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(shippingAddress.postal_code, 'کد پستی')}
                          className="p-1.5 bg-primary-100 hover:bg-primary-200 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-primary-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="bg-gradient-to-br from-warning-50 to-accent-50 border-2 border-warning-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-7 h-7 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-black text-warning-900 text-sm">یادداشت مشتری</h3>
                  </div>
                  <p className="text-warning-800 text-xs leading-relaxed bg-white/50 rounded-lg p-2">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => { setShowStatusModal(false); setNewStatus(''); }}
        size="md"
        title="تغییر وضعیت سفارش"
      >
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-gray-600 mt-3 text-sm">وضعیت جدید سفارش {order.order_number}</p>
        </div>

        <div className="space-y-1.5 mb-4">
          {availableStatuses.map((status) => {
            const StatusIcon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => setNewStatus(status.value)}
                className={cn(
                  'w-full text-right px-3 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 group',
                  newStatus === status.value
                    ? 'border-primary-500 bg-gradient-to-l from-primary-50 to-white shadow-sm'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform', status.color)}>
                  <StatusIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 text-sm flex-1">{status.label}</span>
                {newStatus === status.value && <CheckCircle className="w-4 h-4 text-primary-600" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="md" onClick={() => { setShowStatusModal(false); setNewStatus(''); }}>
            انصراف
          </Button>
          <Button 
            className="flex-1" 
            size="md" 
            onClick={handleStatusChange} 
            disabled={!newStatus || updateStatusMutation.isPending} 
            isLoading={updateStatusMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 ml-1.5" />
            ثبت تغییر
          </Button>
        </div>
      </Modal>
    </>
  );
}
export default SellerOrderDetailModal;
