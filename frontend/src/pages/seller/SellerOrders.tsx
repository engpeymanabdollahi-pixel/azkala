import { useState, useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Package, Truck, CheckCircle, Clock,
  Search, Eye, DollarSign, Calendar, RefreshCw, X, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { sellerOrderService, type SellerOrder } from '@/services/api/sellerOrder.service';
import { getOrderStatusConfig, type OrderStatus } from '@/utils/orderStatus';
import toast from 'react-hot-toast';
import { SellerOrderDetailModal } from './SellerOrderDetailModal';

interface StatCardData {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
}

// ==================== Memoized Components ====================
const StatCard = memo(({ stat, index }: { stat: StatCardData; index: number }) => {
  const Icon = stat.icon;
  return (
    <div
      className="group bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          'w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-all',
          stat.gradient
        )}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-[10px] font-medium mb-0.5">{stat.title}</h3>
      <p className="text-base font-black text-gray-900 dark:text-white">{stat.value}</p>
    </div>
  );
});
StatCard.displayName = 'StatCard';

// ==================== Main Component ====================
export function SellerOrders() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [showTrackingModal, setShowTrackingModal] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // ✅ 1. Fetch سفارشات
  const { data: ordersData, isLoading: isOrdersLoading, refetch } = useQuery({
    queryKey: ['seller-orders-fresh', 1],
    queryFn: () => sellerOrderService.getOrders(1, 20),
  });

  // ✅ 2. Fetch آمار
  const { data: statsData } = useQuery({
    queryKey: ['seller-orders-stats'],
    queryFn: () => sellerOrderService.getStats(),
  });

  // ✅ 3. Mutation برای تغییر وضعیت و ثبت کد رهگیری
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, trackingNumber, courierName }: { orderId: number; status: string; trackingNumber?: string; courierName?: string }) =>
      sellerOrderService.updateStatus(orderId, status, trackingNumber, courierName),
    onSuccess: () => {
      // کلید درست همان چیزی است که useQuery بالا واقعاً با آن می‌خواند
      // ('seller-orders-fresh') — نسخه‌ی قبلی 'seller-orders' را invalidate
      // می‌کرد، کلیدی که هیچ کوئری‌ای با آن ثبت نشده بود؛ یعنی بعد از تأیید
      // سفارش یا ثبت کد رهگیری، لیست روی صفحه هیچ‌وقت خودش را به‌روز
      // نمی‌کرد و فروشنده مجبور بود دستی رفرش کند.
      queryClient.invalidateQueries({ queryKey: ['seller-orders-fresh'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders-stats'] });
    },
  });

  // ✅ 4. استخراج ایمن آرایه سفارشات از ساختار لاراول
  const orders = useMemo<SellerOrder[]>(() => {
    if (ordersData?.success && ordersData?.data?.data && Array.isArray(ordersData.data.data)) {
      return ordersData.data.data;
    }
    return [];
  }, [ordersData]);

  // 5. فیلتر کردن سفارشات
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === orderStatusFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((order) =>
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toString().includes(searchQuery)
      );
    }

    return filtered;
  }, [orders, orderStatusFilter, searchQuery]);

  // 6. محاسبه آمار به صورت ایمن
  const stats = useMemo(() => {
    const apiStats: Record<string, number> = statsData?.data || {};
    const safeOrders = Array.isArray(orders) ? orders : [];

    return {
      total: apiStats.total ?? safeOrders.length,
      pending: apiStats.pending ?? safeOrders.filter((o) => o.status === 'pending').length,
      processing: apiStats.processing ?? safeOrders.filter((o) => o.status === 'processing').length,
      shipped: apiStats.shipped ?? safeOrders.filter((o) => o.status === 'shipped').length,
      delivered: apiStats.delivered ?? safeOrders.filter((o) => o.status === 'delivered').length,
      cancelled: safeOrders.filter((o) => o.status === 'cancelled').length,
      totalRevenue: apiStats.revenue ?? 0,
    };
  }, [statsData, orders]);

  const handleSubmitTracking = useCallback(async (orderId: number) => {
    if (!trackingNumber || !courierName) {
      toast.error('لطفاً نام شرکت پستی و کد رهگیری را وارد کنید');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: 'shipped',
        trackingNumber,
        courierName,
      });
      setShowTrackingModal(null);
      setTrackingNumber('');
      setCourierName('');
      toast.success('اطلاعات ارسال با موفقیت ثبت شد', { icon: '🚚' });
    } catch {
      toast.error('خطا در ثبت اطلاعات ارسال');
    } finally {
      setIsSubmitting(false);
    }
  }, [trackingNumber, courierName, updateStatusMutation]);

  const statCards = useMemo<StatCardData[]>(() => [
    { title: 'کل سفارشات', value: stats.total, icon: ShoppingCart, gradient: 'from-primary-500 to-primary-600' },
    { title: 'در انتظار تأیید', value: stats.pending, icon: Clock, gradient: 'from-warning-500 to-warning-600' },
    { title: 'ارسال شده', value: stats.shipped, icon: Truck, gradient: 'from-accent-500 to-accent-600' },
    { title: 'مجموع درآمد', value: formatPrice(stats.totalRevenue), icon: DollarSign, gradient: 'from-success-500 to-success-600' },
  ], [stats]);

  const statusFilters = useMemo((): { id: 'all' | OrderStatus; label: string; count: number; icon: React.ElementType }[] => [
    { id: 'all', label: 'همه', count: stats.total, icon: ShoppingCart },
    { id: 'pending', label: 'در انتظار', count: stats.pending, icon: Clock },
    { id: 'processing', label: 'در حال پردازش', count: stats.processing, icon: Package },
    { id: 'shipped', label: 'ارسال شده', count: stats.shipped, icon: Truck },
    { id: 'delivered', label: 'تحویل شده', count: stats.delivered, icon: CheckCircle },
  ], [stats]);

  return (
    <div className="p-3 md:p-4 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">مدیریت سفارشات</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {filteredOrders.length} سفارش از <span className="font-bold text-gray-900 dark:text-white">{stats.total}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => refetch()}
            disabled={isOrdersLoading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isOrdersLoading && "animate-spin")} />
            <span className="hidden md:inline text-xs">بروزرسانی</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {statCards.map((stat, idx) => (
          <StatCard key={idx} stat={stat} index={idx} />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-3 mb-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="جستجو بر اساس شماره سفارش..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-8 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {statusFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setOrderStatusFilter(filter.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0',
                    orderStatusFilter === filter.id
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {filter.label}
                  <span className={cn(
                    'text-[9px] px-1 py-0.5 rounded font-bold',
                    orderStatusFilter === filter.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-600'
                  )}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isOrdersLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">در حال دریافت اطلاعات سفارشات...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <EmptyState
            icon={<ShoppingCart className="w-10 h-10" />}
            title={searchQuery ? 'سفارشی یافت نشد' : 'هنوز سفارشی ثبت نشده'}
            description={searchQuery ? 'لطفاً شماره سفارش دیگری را جستجو کنید' : 'به محض ثبت اولین سفارش، اینجا نمایش داده می‌شود'}
            action={searchQuery && (
              <Button onClick={() => setSearchQuery('')} variant="outline" size="sm">پاک کردن جستجو</Button>
            )}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-l from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">شماره سفارش</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">مشتری</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">تاریخ</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">مبلغ</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">وضعیت</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-black text-gray-700 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredOrders.map((order) => {
                  const statusConfig = getOrderStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={order.id} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors group">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform',
                            statusConfig.color
                          )}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white text-sm">{order.order_number}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{order.items_count || 0} محصول</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{order.customer_name || order.user?.name || 'مشتری'}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                          <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                          <div>
                            <p className="font-semibold text-[11px]">
                              {new Date(order.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400">
                              {new Date(order.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-black text-gray-900 dark:text-white text-sm">{formatPrice(order.seller_total || order.total)}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={statusConfig.variant} size="sm" className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="outline" size="xs" onClick={() => setSelectedOrderId(order.id)} className="gap-0.5">
                            <Eye className="w-3 h-3" />
                            <span className="hidden lg:inline">مشاهده</span>
                          </Button>
                          {order.status === 'pending' && (
                            <Button
                              size="xs"
                              onClick={() => {
                                updateStatusMutation.mutate({ orderId: order.id, status: 'processing' });
                              }}
                              className="gap-0.5"
                            >
                              <Package className="w-3 h-3" />
                              <span className="hidden lg:inline">تأیید</span>
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button size="xs" onClick={() => setShowTrackingModal(order.id)} className="gap-0.5">
                              <Truck className="w-3 h-3" />
                              <span className="hidden lg:inline">ارسال</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
            {filteredOrders.map((order) => {
              const statusConfig = getOrderStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div key={order.id} className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', statusConfig.color)}>
                        <StatusIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-sm">{order.order_number}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(order.created_at).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant} size="sm" className="gap-0.5">
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-2">
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">مبلغ</p>
                      <p className="font-black text-gray-900 dark:text-white text-[11px]">{formatPrice(order.seller_total || order.total)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-2">
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">مشتری</p>
                      <p className="font-bold text-gray-900 dark:text-white text-[11px]">{order.customer_name || order.user?.name || 'مشتری'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="xs" className="flex-1 gap-0.5" onClick={() => setSelectedOrderId(order.id)}>
                      <Eye className="w-3 h-3" />مشاهده
                    </Button>
                    {order.status === 'pending' && (
                      <Button
                        size="xs"
                        className="flex-1 gap-0.5"
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'processing' })}
                      >
                        <Package className="w-3 h-3" />تأیید
                      </Button>
                    )}
                    {order.status === 'processing' && (
                      <Button size="xs" className="flex-1 gap-0.5" onClick={() => setShowTrackingModal(order.id)}>
                        <Truck className="w-3 h-3" />ارسال
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      <Modal
        isOpen={showTrackingModal !== null}
        onClose={() => { setShowTrackingModal(null); setTrackingNumber(''); setCourierName(''); }}
        size="md"
        title="ثبت اطلاعات ارسال سفارش"
      >
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">کد رهگیری و نام شرکت پستی را وارد کنید</p>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام شرکت پستی <span className="text-error-500">*</span></label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 text-sm"
            >
              <option value="">انتخاب کنید</option>
              <option value="پست پیشتاز">پست پیشتاز</option>
              <option value="تیپاکس">تیپاکس</option>
              <option value="الوپیک">الوپیک</option>
              <option value="اسنپ‌باکس">اسنپ‌باکس</option>
              <option value="چاپار">چاپار</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد رهگیری <span className="text-error-500">*</span></label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="1234567890"
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 font-mono text-left text-sm"
              dir="ltr"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="md" onClick={() => { setShowTrackingModal(null); setTrackingNumber(''); setCourierName(''); }}>
            انصراف
          </Button>
          <Button
            className="flex-1"
            size="md"
            onClick={() => handleSubmitTracking(showTrackingModal!)}
            disabled={!trackingNumber || !courierName || isSubmitting}
            isLoading={isSubmitting}
          >
            <Truck className="w-4 h-4 ml-1.5" />ثبت و ارسال
          </Button>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <SellerOrderDetailModal
        isOpen={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </div>
  );
}
export default SellerOrders;
