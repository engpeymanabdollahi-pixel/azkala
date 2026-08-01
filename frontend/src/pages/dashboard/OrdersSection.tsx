import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Eye, Truck, CheckCircle, Clock, XCircle,
  Filter, RefreshCw, MapPin, Star, RotateCw, MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { orderService, type Order } from '@/services/api/order.service';
import { RateSellerModal } from '@/components/seller/RateSellerModal';
import toast from 'react-hot-toast';

export function OrdersSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // States برای امتیازدهی
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [orderToRate, setOrderToRate] = useState<Order | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.getOrders(1),
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => orderService.cancelOrder(orderId),
    onSuccess: () => {
      toast.success('سفارش لغو شد', { icon: '✅' });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setSelectedOrder(null);
    },
    onError: () => toast.error('خطا در لغو سفارش'),
  });

  // Handlers امتیازدهی
  const handleOpenRateModal = useCallback((order: Order) => {
    setOrderToRate(order);
    setRateModalOpen(true);
  }, []);

  const handleCloseRateModal = useCallback(() => {
    setRateModalOpen(false);
    setOrderToRate(null);
  }, []);

  const handleRateSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
  }, [queryClient]);

  const getSellerIdFromOrder = useCallback((order: Order): number => {
    if (order.items && order.items.length > 0) {
      return (order.items[0] as any).seller_id || 0;
    }
    return 0;
  }, []);

  const orders = useMemo(() => data?.data?.data || [], [data]);
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }), [orders]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'warning' | 'primary' | 'success' | 'error'; icon: any }> = {
      pending: { label: 'در انتظار', variant: 'warning', icon: Clock },
      processing: { label: 'پردازش', variant: 'primary', icon: Package },
      shipped: { label: 'ارسال شده', variant: 'primary', icon: Truck },
      delivered: { label: 'تحویل شده', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'لغو شده', variant: 'error', icon: XCircle },
    };
    const item = config[status] || config.pending;
    const Icon = item.icon;
    return (
      <Badge variant={item.variant} size="sm" className="gap-1">
        <Icon className="w-3 h-3" />
        {item.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'کل', value: stats.total, icon: Package, gradient: 'from-primary-500 to-primary-600' },
          { label: 'در انتظار', value: stats.pending, icon: Clock, gradient: 'from-warning-500 to-warning-600' },
          { label: 'در حال ارسال', value: stats.shipped + stats.processing, icon: Truck, gradient: 'from-accent-500 to-accent-600' },
          { label: 'تحویل شده', value: stats.delivered, icon: CheckCircle, gradient: 'from-success-500 to-success-600' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={cn('w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center', stat.gradient)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium">{stat.label}</span>
              </div>
              <p className="text-lg font-black text-gray-900">{stat.value.toLocaleString('fa-IR')}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-2.5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Filter className="w-4 h-4 text-primary-600 flex-shrink-0" />
          {[
            { id: 'all', label: 'همه', count: stats.total },
            { id: 'pending', label: 'در انتظار', count: stats.pending },
            { id: 'processing', label: 'پردازش', count: stats.processing },
            { id: 'shipped', label: 'ارسال شده', count: stats.shipped },
            { id: 'delivered', label: 'تحویل شده', count: stats.delivered },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
                statusFilter === filter.id
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {filter.label}
              <span className={cn('text-[10px] px-1 py-0.5 rounded', statusFilter === filter.id ? 'bg-white/20' : 'bg-gray-200')}>
                {filter.count}
              </span>
            </button>
          ))}
          <Button variant="ghost" size="xs" onClick={() => refetch()} className="mr-auto">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState
            icon={<Package className="w-10 h-10" />}
            title={statusFilter !== 'all' ? 'سفارشی یافت نشد' : 'هنوز سفارشی ثبت نکرده‌اید'}
            description={statusFilter !== 'all' ? 'فیلتر دیگری امتحان کنید' : 'برای خرید به فروشگاه بروید'}
            action={
              <Button onClick={() => navigate('/products')} size="md">
                مشاهده محصولات
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const sellerId = getSellerIdFromOrder(order);
            const canRate = order.status === 'delivered' && sellerId > 0;
            
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-l from-gray-50/50 to-white">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shadow-sm',
                        order.status === 'delivered' ? 'bg-gradient-to-br from-success-500 to-success-600' :
                        order.status === 'cancelled' ? 'bg-gradient-to-br from-error-500 to-error-600' :
                        'bg-gradient-to-br from-primary-500 to-primary-600'
                      )}>
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">شماره سفارش</p>
                        <p className="font-black text-gray-900 text-sm">{order.order_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-500">تاریخ</p>
                        <p className="font-semibold text-gray-900 text-xs">
                          {new Date(order.created_at).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">مبلغ</p>
                        <p className="font-black text-primary-700 text-sm">{formatPrice(order.total)}</p>
                      </div>
                      {getStatusBadge(order.status)}

<button
  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all',
                          selectedOrder?.id === order.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-primary-50'
                        )}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
  <div className="p-3 bg-gradient-to-b from-white to-gray-50/30">
    
   

    {/* Products */}
                    {/* Banner امتیازدهی */}
                    {canRate && (
                      <div className="mb-3 bg-gradient-to-r from-warning-50 via-accent-50 to-primary-50 border-2 border-warning-200 rounded-xl p-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-warning-400 to-warning-500 rounded-xl flex items-center justify-center shadow-md">
                              <Star className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-sm">تجربه خرید خود را به اشتراک بگذارید</p>
                              <p className="text-[11px] text-gray-600 mt-0.5">
                                با امتیازدهی به فروشنده، به دیگران کمک کنید
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => handleOpenRateModal(order)}
                            className="gap-1.5 shadow-md"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" />
                            امتیاز به فروشنده
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    <div className="mb-2.5">
                      <h4 className="font-black text-gray-900 text-xs mb-1.5 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-primary-600" />
                        محصولات ({order.items?.length || 0})
                      </h4>
                      <div className="space-y-1.5">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.product?.main_image ? (
                                <img src={item.product.main_image} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-[11px] line-clamp-1">{item.product?.name || 'محصول'}</p>
                              <p className="text-[10px] text-gray-500">{item.quantity} عدد × {formatPrice(item.price)}</p>
                            </div>
                            <p className="font-black text-primary-700 text-xs">{formatPrice(item.total)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mb-2.5">
                      <h4 className="font-black text-gray-900 text-xs mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-accent-600" />
                        آدرس تحویل
                      </h4>
                      <div className="bg-gradient-to-l from-accent-50 to-white border border-accent-200 rounded-lg p-2">
                        <p className="font-semibold text-gray-900 text-xs">{order.shipping_address?.full_name || '-'}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{order.shipping_address?.phone || '-'}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {order.shipping_address?.address || '-'}، {order.shipping_address?.city || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-2 mb-2.5">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex justify-between text-gray-600">
                          <span>جمع کالاها:</span>
                          <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>ارسال:</span>
                          <span className="font-semibold">
                            {order.shipping === 0 ? <Badge variant="success" size="sm">رایگان</Badge> : formatPrice(order.shipping)}
                          </span>
                        </div>
                        <div className="flex justify-between font-black pt-1 border-t border-gray-200">
                          <span>مبلغ نهایی:</span>
                          <span className="text-primary-700">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 flex-wrap">
                      {order.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="xs" 
                          className="flex-1 gap-1 text-error-600"
                          onClick={() => {
                            if (window.confirm('آیا از لغو این سفارش مطمئن هستید؟')) {
                              cancelMutation.mutate(order.id);
                            }
                          }}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="w-3 h-3" />
                          <span className="text-[10px]">لغو</span>
                        </Button>
                      )}

                      {order.status === 'delivered' && (
                        <Button variant="outline" size="xs" className="flex-1 gap-1">
                          <RotateCw className="w-3 h-3" />
                          <span className="text-[10px]">خرید مجدد</span>
                        </Button>
                      )}

                      {['processing', 'shipped'].includes(order.status) && (
                        <Button variant="outline" size="xs" className="flex-1 gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span className="text-[10px]">پیگیری</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal امتیازدهی به فروشنده */}
      {orderToRate && (
        <RateSellerModal
          isOpen={rateModalOpen}
          onClose={handleCloseRateModal}
          orderId={orderToRate.id}
          sellerId={getSellerIdFromOrder(orderToRate)}
          onSuccess={handleRateSuccess}
        />
      )}
    </div>
  );
}
export default OrdersSection;
