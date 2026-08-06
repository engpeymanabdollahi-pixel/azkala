import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  ShoppingCart, Search, Eye, Edit2, Truck, CheckCircle,
  X, ChevronLeft, ChevronRight, Package, DollarSign, Calendar,
  User, MapPin, Phone, Mail, CreditCard, Clock, AlertCircle,
  RefreshCw, Banknote, Tag, FileText, Printer,
  Store, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { 
  adminOrderService, 
  type AdminOrder, 
  type OrderFilters,
  type OrderDetailResponse,
} from '@/services/api/adminOrder.service';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { ExportButton } from '@/components/admin/ExportButton';
import { Virtuoso } from 'react-virtuoso';

// ==================== Types ====================

type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

// ==================== Helper Functions ====================

type BadgeVariant = NonNullable<BadgeProps['variant']>;

const getStatusInfo = (status: string) => {
  const map: Record<string, { label: string; color: BadgeVariant; icon: LucideIcon; bg: string }> = {
    pending: { label: 'در انتظار', color: 'warning', icon: Clock, bg: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800' },
    processing: { label: 'در حال پردازش', color: 'primary', icon: Package, bg: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800' },
    shipped: { label: 'ارسال شده', color: 'accent', icon: Truck, bg: 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 border-accent-200 dark:border-accent-800' },
    delivered: { label: 'تحویل شده', color: 'success', icon: CheckCircle, bg: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800' },
    cancelled: { label: 'لغو شده', color: 'error', icon: X, bg: 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 border-error-200 dark:border-error-800' },
    returned: { label: 'مرجوعی', color: 'gray', icon: AlertCircle, bg: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' },
  };
  return map[status] || map.pending;
};

const getPaymentStatusInfo = (status: string) => {
  const map: Record<string, { label: string; color: BadgeVariant }> = {
    pending: { label: 'پرداخت نشده', color: 'warning' },
    paid: { label: 'پرداخت شده', color: 'success' },
    failed: { label: 'ناموفق', color: 'error' },
    refunded: { label: 'مسترد شده', color: 'gray' },
  };
  return map[status] || map.pending;
};

const getPaymentMethodLabel = (method: string) => {
  const map: Record<string, string> = {
    online: 'آنلاین',
    wallet: 'کیف پول',
    cash: 'نقدی',
  };
  return map[method] || method;
};

// ==================== Main Component ====================

export function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sellerFilter, setSellerFilter] = useState<number | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // ==================== Queries ====================

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => adminOrderService.getOrders(filters),
    placeholderData: keepPreviousData,
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination;
  const stats = data?.data?.stats;
  const sellers = data?.data?.sellers || [];

  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-order-detail', selectedOrder?.id],
    queryFn: () => adminOrderService.getOrderDetail(selectedOrder!.id),
    enabled: !!selectedOrder && showDetailModal,
  });

  // ==================== Mutations ====================

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrderStatusUpdatePayload }) =>
      adminOrderService.updateStatus(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
      toast.success(response.message, { icon: '✅' });
      setShowStatusModal(false);
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminOrderService.updatePaymentStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(response.message, { icon: '✅' });
    },
    onError: () => toast.error('خطا در تغییر وضعیت پرداخت'),
  });

  // ==================== Handlers ====================

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 500);
    return () => clearTimeout(timeout);
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status,
      page: 1,
    }));
  };

  const handleSellerFilter = (sellerId: number | 'all') => {
    setSellerFilter(sellerId);
    setFilters(prev => ({
      ...prev,
      seller_id: sellerId === 'all' ? undefined : sellerId,
      page: 1,
    }));
  };

  const handleViewDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleOpenStatusModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  // ==================== Render ====================

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            مدیریت سفارشات
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت و پیگیری تمامی سفارشات فروشگاه
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ قبلاً کامپوننت ExportButton ایمپورت شده بود اما هیچ‌جای این
              صفحه رندر نمی‌شد — با اینکه بکند (/admin/export/orders/excel و
              /pdf) کاملاً پیاده‌سازی شده، ادمین هیچ راهی برای دانلود گزارش
              سفارشات نداشت. */}
          <ExportButton type="orders" label="خروجی" filters={{ status: filters.status }} />
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="کل سفارشات" value={stats?.total || 0} icon={ShoppingCart} color="primary" />
        <StatCard label="در انتظار" value={stats?.pending || 0} icon={Clock} color="warning" />
        <StatCard label="در حال پردازش" value={stats?.processing || 0} icon={Package} color="accent" />
        <StatCard label="ارسال شده" value={stats?.shipped || 0} icon={Truck} color="primary" />
        <StatCard label="تحویل شده" value={stats?.delivered || 0} icon={CheckCircle} color="success" />
        <StatCard label="لغو شده" value={stats?.cancelled || 0} icon={X} color="error" />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-xl p-4 text-white shadow-lg shadow-success-500/30">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-xs opacity-80">درآمد کل</span>
          </div>
          <p className="text-xl font-black">{formatPrice(stats?.total_revenue || 0)}</p>
          <p className="text-xs opacity-80 mt-1">تومان</p>
        </div>
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white shadow-lg shadow-primary-500/30">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-xs opacity-80">سفارشات امروز</span>
          </div>
          <p className="text-xl font-black">{stats?.today_orders || 0}</p>
          <p className="text-xs opacity-80 mt-1">سفارش</p>
        </div>
        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl p-4 text-white shadow-lg shadow-accent-500/30">
          <div className="flex items-center justify-between mb-2">
            <Banknote className="w-5 h-5" />
            <span className="text-xs opacity-80">درآمد امروز</span>
          </div>
          <p className="text-xl font-black">{formatPrice(stats?.today_revenue || 0)}</p>
          <p className="text-xs opacity-80 mt-1">تومان</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 space-y-3">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="جستجو بر اساس شماره سفارش، نام کاربر، ایمیل یا تلفن..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: 'all', label: 'همه', icon: ShoppingCart },
            { value: 'pending', label: 'در انتظار', icon: Clock },
            { value: 'processing', label: 'در حال پردازش', icon: Package },
            { value: 'shipped', label: 'ارسال شده', icon: Truck },
            { value: 'delivered', label: 'تحویل شده', icon: CheckCircle },
            { value: 'cancelled', label: 'لغو شده', icon: X },
            { value: 'returned', label: 'مرجوعی', icon: AlertCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => handleStatusFilter(item.value as StatusFilter)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap',
                  statusFilter === item.value
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* 🆕 Seller Filter */}
        {sellers.length > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
              فروشنده:
            </span>
            <select
              value={sellerFilter === 'all' ? 'all' : sellerFilter}
              onChange={(e) => {
                const value = e.target.value;
                handleSellerFilter(value === 'all' ? 'all' : parseInt(value));
              }}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-primary-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-w-[200px]"
            >
              <option value="all">همه فروشندگان</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.shop_name} ({seller.name})
                </option>
              ))}
            </select>
            {sellerFilter !== 'all' && (
              <button
                onClick={() => handleSellerFilter('all')}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                title="پاک کردن فیلتر"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

          {/* Orders List (Optimized with Virtuoso & CSS Grid) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {isLoading ? (
              <div className="p-8 space-y-3 flex-1">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={<ShoppingCart className="w-12 h-12" />}
                  title="سفارشی یافت نشد"
                  description="با فیلترهای فعلی هیچ سفارشی وجود ندارد"
                  action={
                    <Button onClick={() => setFilters({ page: 1, per_page: 20 })} variant="outline">
                      پاک کردن فیلترها
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {/* Table Header (Sticky) */}
                <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1.5fr_0.5fr] bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 sticky top-0 z-10 shadow-sm">
                  <div>شماره سفارش</div>
                  <div>مشتری</div>
                  <div>تاریخ</div>
                  <div>مبلغ کل</div>
                  <div>وضعیت سفارش</div>
                  <div>وضعیت پرداخت</div>
                  <div>روش پرداخت</div>
                  <div>فروشنده</div>
                  <div className="text-center">عملیات</div>
                </div>

                {/* Virtuoso Virtualized List */}
                <Virtuoso
                  data={orders}
                  increaseViewportBy={200}
                  itemContent={(_index, order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    const paymentInfo = getPaymentStatusInfo(order.payment_status);

                    return (
                      <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1.5fr_0.5fr] border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors items-center px-4 py-3 gap-2 group">
                        {/* 1. Order Number */}
                        <div>
                          <code className="text-xs font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                            {order.order_number}
                          </code>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{order.items_count} کالا</p>
                        </div>

                        {/* 2. Customer */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {order.user?.name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                              {order.user?.name || 'کاربر حذف شده'}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {order.user?.email}
                            </p>
                          </div>
                        </div>

                        {/* 3. Date */}
                        <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                          <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="truncate">{order.created_at_fa}</span>
                        </div>

                        {/* 4. Total */}
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</p>
                          {order.discount > 0 && (
                            <p className="text-[10px] text-success-600 dark:text-success-400">تخفیف: {formatPrice(order.discount)}</p>
                          )}
                        </div>

                        {/* 5. Order Status */}
                        <div>
                          <button
                            onClick={() => handleOpenStatusModal(order)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all hover:scale-105',
                              statusInfo.bg
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </button>
                        </div>

                        {/* 6. Payment Status */}
                        <div>
                          <Badge variant={paymentInfo.color} size="sm">
                            <CreditCard className="w-3 h-3 ml-0.5" />
                            {paymentInfo.label}
                          </Badge>
                        </div>

                        {/* 7. Payment Method */}
                        <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {getPaymentMethodLabel(order.payment_method)}
                        </div>

                        {/* 8. Sellers */}
                        <div>
                          {order.sellers && order.sellers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {order.sellers.slice(0, 2).map((seller) => (
                                <div
                                  key={seller.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent-50 dark:bg-accent-900/30 border border-accent-200 dark:border-accent-800 rounded text-[10px] font-bold text-accent-700 dark:text-accent-400"
                                  title={seller.shop_name}
                                >
                                  <Store className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="truncate max-w-[60px]">{seller.shop_name}</span>
                                </div>
                              ))}
                              {order.sellers.length > 2 && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                                  +{order.sellers.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">ازکالا</span>
                          )}
                        </div>

                        {/* 9. Actions */}
                        <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewDetail(order)}
                            className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="مشاهده جزئیات"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal(order)}
                            className="p-1.5 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                            title="تغییر وضعیت"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }}
                />
              </>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 flex-shrink-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  نمایش {(pagination.current_page - 1) * pagination.per_page + 1} تا{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} از{' '}
                  <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span> سفارش
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                    disabled={pagination.current_page === 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="px-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                    {pagination.current_page} / {pagination.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.last_page, prev.page! + 1) }))}
                    disabled={pagination.current_page === pagination.last_page}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          detail={orderDetail}
          isLoading={detailLoading}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          onPrint={handlePrintInvoice}
          onUpdateStatus={() => {
            setShowDetailModal(false);
            handleOpenStatusModal(selectedOrder);
          }}
        />
      )}

      {/* Status Modal */}
      {showStatusModal && selectedOrder && (
        <OrderStatusModal
          order={selectedOrder}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
          }}
          onSave={(data) => updateStatusMutation.mutate({ id: selectedOrder.id, data })}
          onPaymentChange={(status) => updatePaymentMutation.mutate({ id: selectedOrder.id, status })}
          isPending={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}

// ==================== Sub Components ====================

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray';
}) {
  const colors = {
    primary: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30',
    success: 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30',
    error: 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/30',
    warning: 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/30',
    accent: 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30',
    gray: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-black text-gray-900 dark:text-gray-100">{value.toLocaleString('fa-IR')}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function OrderDetailModal({ order, detail, isLoading, onClose, onPrint, onUpdateStatus }: {
  order: AdminOrder;
  detail?: OrderDetailResponse;
  isLoading: boolean;
  onClose: () => void;
  onPrint: () => void;
  onUpdateStatus: () => void;
}) {
  const statusInfo = getStatusInfo(order.status);
  const paymentInfo = getPaymentStatusInfo(order.payment_status);

  // 🆕 Guard clause برای loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full p-8">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 🆕 Guard clause - اصلاح شده به detail.data.order
  if (!detail?.data?.order) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-warning-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-bold">اطلاعات سفارش در دسترس نیست</p>
          <Button onClick={onClose} className="mt-4" variant="outline">
            بستن
          </Button>
        </div>
      </div>
    );
  }

  // 🆕 استخراج داده‌ها از detail.data
  const orderData = detail.data.order;
  const userData = detail.data.user;
  const itemsData = detail.data.items || [];
  const shippingAddress = orderData.shipping_address;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-l from-accent-50/50 dark:from-accent-900/20 to-white dark:to-gray-800">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              جزئیات سفارش
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              شماره سفارش: <code className="font-bold text-primary-700 dark:text-primary-400">{order.order_number}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrint} className="gap-1">
              <Printer className="w-4 h-4" />
              چاپ
            </Button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status & Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard
              label="وضعیت سفارش"
              value={
                <Badge variant={statusInfo.color} size="sm">
                  <statusInfo.icon className="w-3 h-3 ml-0.5" />
                  {statusInfo.label}
                </Badge>
              }
            />
            <InfoCard
              label="وضعیت پرداخت"
              value={
                <Badge variant={paymentInfo.color} size="sm">
                  {paymentInfo.label}
                </Badge>
              }
            />
            <InfoCard
              label="تاریخ ثبت"
              value={<span className="text-xs font-bold">{order.created_at_fa}</span>}
            />
            <InfoCard
              label="روش پرداخت"
              value={<span className="text-xs font-bold">{getPaymentMethodLabel(order.payment_method)}</span>}
            />
          </div>

          {/* Customer Info - اصلاح شده */}
          {userData && (
            <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                اطلاعات مشتری
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">نام</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{userData.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">ایمیل</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{userData.email}</p>
                  </div>
                </div>
                {userData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">تلفن</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{userData.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {shippingAddress && (
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                آدرس ارسال
              </h4>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><strong>{shippingAddress.full_name || 'نامشخص'}</strong></p>
                <p>{shippingAddress.phone}</p>
                <p>
                  {shippingAddress.province}، {shippingAddress.city}
                </p>
                <p>{shippingAddress.address}</p>
                {shippingAddress.postal_code && (
                  <p>کد پستی: {shippingAddress.postal_code}</p>
                )}
              </div>
            </div>
          )}

          {/* Sellers in Detail */}
          {order.sellers && order.sellers.length > 0 && (
            <div className="bg-accent-50 dark:bg-accent-900/20 rounded-xl p-4 border border-accent-100 dark:border-accent-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <Store className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                فروشندگان سفارش ({order.sellers.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {order.sellers.map((seller) => (
                  <div
                    key={seller.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-accent-200 dark:border-accent-800 rounded-lg text-xs font-bold text-accent-700 dark:text-accent-400"
                  >
                    <Store className="w-3 h-3" />
                    {seller.shop_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products - اصلاح شده */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              محصولات سفارش ({itemsData.length} مورد)
            </h4>
            <div className="space-y-2">
              {itemsData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-accent-200 dark:hover:border-accent-700 transition-all"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                    <SafeImage
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      fallbackEmoji="📦"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {item.product_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>تعداد: <strong className="text-gray-900 dark:text-gray-100">{item.quantity}</strong></span>
                      <span>قیمت واحد: <strong className="text-gray-900 dark:text-gray-100">{formatPrice(item.price)}</strong></span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-accent-700 dark:text-accent-400">{formatPrice(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-br from-gray-50 dark:from-gray-900/60 to-white dark:to-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success-600 dark:text-success-400" />
              خلاصه مالی
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">جمع کل محصولات:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(orderData.subtotal)}</span>
              </div>
              {orderData.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">تخفیف:</span>
                  <span className="font-bold text-success-600 dark:text-success-400">- {formatPrice(orderData.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">هزینه ارسال:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(orderData.shipping)}</span>
              </div>
              {orderData.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">مالیات:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(orderData.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-black text-gray-900 dark:text-gray-100">مبلغ نهایی:</span>
                <span className="font-black text-primary-700 dark:text-primary-400">{formatPrice(orderData.total)}</span>
              </div>
              {orderData.coupon_code && (
                <div className="flex items-center gap-1.5 pt-2 text-xs">
                  <Tag className="w-3 h-3 text-accent-600" />
                  <span className="text-gray-600 dark:text-gray-400">کد تخفیف:</span>
                  <code className="font-bold text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30 px-1.5 py-0.5 rounded">
                    {orderData.coupon_code}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Tracking & Notes */}
          {(orderData.tracking_number || orderData.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {orderData.tracking_number && (
                <div className="bg-accent-50 dark:bg-accent-900/20 rounded-xl p-3 border border-accent-100 dark:border-accent-800">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
                    کد پیگیری
                  </h4>
                  <code className="text-sm font-bold text-accent-700 dark:text-accent-400">
                    {orderData.tracking_number}
                  </code>
                </div>
              )}
              {orderData.notes && (
                <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3 border border-warning-100 dark:border-warning-800">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-warning-600 dark:text-warning-400" />
                    یادداشت
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{orderData.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
          <Button onClick={onUpdateStatus} className="gap-1.5">
            <Edit2 className="w-4 h-4" />
            تغییر وضعیت
          </Button>
        </div>
      </div>
    </div>
  );
}

interface OrderStatusUpdatePayload {
  status: string;
  tracking_number?: string;
  notes?: string;
}

function OrderStatusModal({ order, onClose, onSave, onPaymentChange, isPending }: {
  order: AdminOrder;
  onClose: () => void;
  onSave: (data: OrderStatusUpdatePayload) => void;
  onPaymentChange: (status: string) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [notes, setNotes] = useState(order.notes || '');

  const statuses: { value: AdminOrder['status']; label: string; icon: LucideIcon; color: string }[] = [
    { value: 'pending', label: 'در انتظار', icon: Clock, color: 'warning' },
    { value: 'processing', label: 'در حال پردازش', icon: Package, color: 'primary' },
    { value: 'shipped', label: 'ارسال شده', icon: Truck, color: 'accent' },
    { value: 'delivered', label: 'تحویل شده', icon: CheckCircle, color: 'success' },
    { value: 'cancelled', label: 'لغو شده', icon: X, color: 'error' },
    { value: 'returned', label: 'مرجوعی', icon: AlertCircle, color: 'gray' },
  ];

  const handleSave = () => {
    onSave({
      status,
      tracking_number: trackingNumber || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-l from-primary-50/50 dark:from-primary-900/20 to-white dark:to-gray-800">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            تغییر وضعیت سفارش
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/60 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">شماره سفارش</p>
              <code className="text-sm font-bold text-primary-700 dark:text-primary-400">{order.order_number}</code>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">مبلغ کل</p>
              <p className="text-sm font-black text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">وضعیت سفارش</label>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    onClick={() => setStatus(s.value)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-bold',
                      status === s.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(status === 'shipped' || status === 'delivered') && (
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد پیگیری</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="مثلاً: 1234567890"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">یادداشت</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="یادداشت ادمین..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">وضعیت پرداخت</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'pending', label: 'پرداخت نشده' },
                { value: 'paid', label: 'پرداخت شده' },
                { value: 'failed', label: 'ناموفق' },
                { value: 'refunded', label: 'مسترد شده' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => onPaymentChange(p.value)}
                  className={cn(
                    'p-2.5 rounded-lg border-2 transition-all text-xs font-bold',
                    order.payment_status === p.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            انصراف
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            isLoading={isPending}
            className="gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            ذخیره تغییرات
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div>{value}</div>
    </div>
  );
}
export default AdminOrdersPage;
