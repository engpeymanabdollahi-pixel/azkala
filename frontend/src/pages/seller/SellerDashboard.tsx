import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Zap,
  Flame,
  LayoutDashboard,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Truck,
  AlertTriangle,
  X,
  MessageCircle,
  Store,
} from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SimpleChart } from '@/components/ui/SimpleChart';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api/client';
import { toast } from 'react-hot-toast'; // ✅ ایمپورت toast اضافه شد

// ==================== Types ====================
interface DashboardStats {
  total_revenue: number;
  pending_orders: number;
  active_products: number;
  total_products: number;
  pending_settlements: number;
  total_sales: number;
  monthly_sales: { month: string; sales: number; revenue: number }[];
  top_products: { id: number; name: string; sales: number; revenue: number; image?: string }[];
}

interface Order {
  id: number;
  order_id: string;
  status: string;
  total: number;
  items_count: number;
  created_at: string;
  tracking_number?: string;
}

interface Conversation {
  id: number;
  unread_count: number;
}

// ==================== API Functions ====================
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/seller/dashboard/stats');
  return response.data.data;
};

const fetchRecentOrders = async (page: number = 1): Promise<{ data: Order[]; total: number }> => {
  const response = await apiClient.get(`/seller/orders?page=${page}&per_page=5`);
  const res = response.data;

  if (res?.data?.data && Array.isArray(res.data.data)) {
    return { data: res.data.data, total: res.data.total ?? res.data.data.length };
  }
  if (res?.data && Array.isArray(res.data)) {
    return { data: res.data, total: res.data.length };
  }
  if (Array.isArray(res)) {
    return { data: res, total: res.length };
  }
  return { data: [], total: 0 };
};

const fetchUnreadMessages = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/chat/conversations');
    const conversations: Conversation[] = response.data.data?.data || response.data.data || [];
    return conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  } catch (error) {
    return 0;
  }
};

// ==================== Skeleton Components ====================
const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-3 border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between mb-2">
      <div className="w-9 h-9 bg-gray-200 rounded-lg" />
      <div className="w-14 h-4 bg-gray-200 rounded" />
    </div>
    <div className="w-16 h-3 bg-gray-200 rounded mb-1.5" />
    <div className="w-20 h-5 bg-gray-200 rounded" />
  </div>
);

const OrderSkeleton = () => (
  <div className="p-3 animate-pulse border-b border-gray-100">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-gray-200 rounded-lg" />
        <div>
          <div className="w-20 h-3 bg-gray-200 rounded mb-1" />
          <div className="w-16 h-2 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-16 h-4 bg-gray-200 rounded" />
    </div>
  </div>
);

// ==================== Main Component ====================
export function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'shipped'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['seller-dashboard-stats'],
    queryFn: fetchDashboardStats,
    retry: 3,
    retryDelay: 1000,
  });

  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['seller-recent-orders', currentPage],
    queryFn: () => fetchRecentOrders(currentPage),
    staleTime: 0,
  });

  useEffect(() => {
    const loadUnread = async () => {
      const count = await fetchUnreadMessages();
      setUnreadCount(count);
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    const orders = ordersData?.data;
    if (!Array.isArray(orders)) return [];
    if (orderFilter === 'all') return orders;
    return orders.filter(order => order.status === orderFilter);
  }, [ordersData, orderFilter]);

  const chartData = useMemo(() => {
    if (!stats?.monthly_sales) return [];
    return stats.monthly_sales.map(sale => ({
      label: sale.month,
      value: typeof sale.sales === 'number' && Number.isFinite(sale.sales) ? sale.sales : 0,
      color: '#3b82f6',
    }));
  }, [stats?.monthly_sales]);

  const handleRefresh = () => {
    refetchStats();
    refetchOrders();
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'warning' | 'primary' | 'success' | 'error'; icon: any }> = {
      pending: { label: 'در انتظار', variant: 'warning', icon: Clock },
      preparing: { label: 'در حال آماده‌سازی', variant: 'primary', icon: Package },
      ready_for_shipment: { label: 'آماده ارسال', variant: 'primary', icon: CheckCircle },
      shipped: { label: 'ارسال شده', variant: 'success', icon: Truck },
      delivered: { label: 'تحویل شده', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'لغو شده', variant: 'error', icon: X },
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

  const quickActions = [
    { label: 'محصولات', icon: Package, path: '/seller/products', color: 'from-accent-500 to-accent-600' },
    { label: 'سفارشات', icon: ShoppingCart, path: '/seller/orders', color: 'from-success-500 to-success-600' },
    { label: 'تسویه', icon: DollarSign, path: '/seller/payouts', color: 'from-warning-500 to-warning-600' },
    { label: 'آمار', icon: TrendingUp, path: '/seller/products', color: 'from-primary-500 to-primary-600' },
  ];

  if (statsLoading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-3 md:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-gray-200 rounded-lg" />
              <div>
                <div className="w-32 h-5 bg-gray-200 rounded mb-1" />
                <div className="w-20 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (statsError || ordersError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-error-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-error-500 to-error-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1.5">خطا در بارگذاری</h3>
          <p className="text-gray-600 text-xs mb-3">مشکلی در ارتباط با سرور رخ داده است</p>
          <Button onClick={handleRefresh} size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="p-3 md:p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/30">
                <LayoutDashboard className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black text-gray-900">داشبورد فروشنده</h1>
                <p className="text-[11px] text-gray-600">
                  خوش آمدید <span className="font-bold text-primary-600">{user?.name}</span> 👋
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Link to="/seller/chat">
                <Button variant="outline" size="sm" className="gap-1 relative">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-xs">پیام‌ها</span>
                  {unreadCount > 0 && (
                    <Badge variant="error" size="sm" className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] rounded-full p-0">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-xs">بروزرسانی</span>
              </Button>
              <Button onClick={() => navigate('/seller/products/new')} size="sm" className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-xs">محصول جدید</span>
                <span className="md:hidden text-xs">جدید</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {[
            { title: 'درآمد کل', value: formatPrice(stats?.total_revenue || 0), change: '+12.5%', changeType: 'up' as const, icon: DollarSign, gradient: 'from-primary-500 to-primary-600' },
            { title: 'سفارشات در انتظار', value: stats?.pending_orders || 0, change: '+8 امروز', changeType: 'up' as const, icon: ShoppingCart, gradient: 'from-accent-500 to-accent-600' },
            { title: 'محصولات فعال', value: stats?.active_products || 0, change: `از ${stats?.total_products || 0}`, changeType: 'neutral' as const, icon: Package, gradient: 'from-success-500 to-success-600' },
            { title: 'در انتظار تسویه', value: formatPrice(stats?.pending_settlements || 0), change: 'هفته آینده', changeType: 'neutral' as const, icon: Clock, gradient: 'from-warning-500 to-warning-600' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="group bg-white rounded-xl p-3 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-start justify-between mb-2">
                  <div className={cn('w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-all', stat.gradient)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={cn('flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded', stat.changeType === 'up' ? 'bg-success-50 text-success-600' : stat.changeType === 'down' ? 'bg-error-50 text-error-600' : 'bg-gray-100 text-gray-600')}>
                    {stat.changeType === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : stat.changeType === 'down' ? <ArrowDownRight className="w-2.5 h-2.5" /> : null}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-gray-600 text-[10px] mb-0.5 font-medium">{stat.title}</h3>
                <p className="text-sm md:text-base font-black text-gray-900 truncate">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Sales Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-3.5 h-3.5 text-white" />
                  </div>
                  نمودار فروش ماهانه
                </h2>
              </div>
              {chartData.length > 0 ? (
                <SimpleChart data={chartData} height={200} type="bar" showValues={true} />
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 mx-auto mb-1.5 opacity-30" />
                    <p className="text-xs">داده‌ای برای نمایش وجود ندارد</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5 mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                محصولات پرفروش
              </h2>
              {stats?.top_products && stats.top_products.length > 0 ? (
                <div className="space-y-1.5">
                  {stats.top_products.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex items-center gap-1.5 p-1.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" onClick={() => navigate(`/seller/products/${product.id}/edit`)}>
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-[11px] line-clamp-1">{product.name}</p>
                        <p className="text-[9px] text-gray-500">{product.sales} فروش</p>
                      </div>
                      <p className="text-[11px] font-bold text-primary-700">{formatPrice(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <TrendingUp className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
                  <p className="text-[10px]">محصول پرفروشی وجود ندارد</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-l from-primary-50/50 to-white">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                  <ShoppingCart className="w-3.5 h-3.5 text-white" />
                </div>
                سفارشات اخیر
              </h2>
              <div className="flex gap-1.5">
                <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value as any)} className="px-2 py-1 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-primary-500">
                  <option value="all">همه</option>
                  <option value="pending">در انتظار</option>
                  <option value="processing">در حال پردازش</option>
                  <option value="shipped">ارسال شده</option>
                </select>
                <Button variant="outline" size="xs" onClick={() => navigate('/seller/orders')} className="gap-0.5 text-[10px]">
                  همه <ArrowUpRight className="w-2.5 h-2.5" />
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {ordersLoading ? (
                Array.from({ length: 5 }).map((_, i) => <OrderSkeleton key={i} />)
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <Link 
                    key={order.id} 
                    to={`/seller/orders/${order.id}`}
                    className="block p-2.5 hover:bg-primary-50/30 transition-colors group cursor-pointer no-underline"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Package className="w-3.5 h-3.5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">سفارش #{order.order_id}</p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(order.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-[10px] text-gray-600">
                        <span className="flex items-center gap-0.5">
                          <Package className="w-2.5 h-2.5" />
                          {order.items_count} محصول
                        </span>
                        {order.tracking_number && (
                          <span className="text-[9px] bg-gray-100 px-1 py-0.5 rounded">کد: {order.tracking_number}</span>
                        )}
                      </div>
                      <p className="text-sm font-black text-primary-700">{formatPrice(order.total)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShoppingCart className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-semibold text-xs">سفارشی یافت نشد</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">فیلتر را تغییر دهید</p>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {ordersData && ordersData.total > 5 && (
              <div className="p-2 border-t border-gray-100 flex items-center justify-between">
                <Button variant="outline" size="xs" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="gap-0.5 text-[10px]">
                  <ChevronRight className="w-2.5 h-2.5" /> قبلی
                </Button>
                <span className="text-[10px] text-gray-600">صفحه {currentPage} از {Math.ceil(ordersData.total / 5)}</span>
                <Button variant="outline" size="xs" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(ordersData.total / 5)} className="gap-0.5 text-[10px]">
                  بعدی <ChevronLeft className="w-2.5 h-2.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ کارت دسترسی سریع به فروشگاه (کاملاً جدا و در جای صحیح) */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-600 rounded-2xl p-4 md:p-6 text-white mt-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-primary-500/20">
          <div className="text-center md:text-right">
            <h3 className="font-black text-lg md:text-xl mb-1 flex items-center justify-center md:justify-start gap-2">
              <Store className="w-5 h-5" />
              فروشگاه آنلاین شما
            </h3>
            <p className="text-white/80 text-sm">مشاهده صفحه عمومی فروشگاه همان‌طور که مشتریان می‌بینند</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => {
              console.log('🔍 محتوای user:', user);
              const storeSlug = user?.slug;
              console.log('🔍 اسلاگ پیدا شده:', storeSlug);

              if (storeSlug) {
                window.open(`/seller/${storeSlug}`, '_blank');
              } else {
                toast.error('آدرس فروشگاه یافت نشد. لطفاً ابتدا به بخش تنظیمات رفته و نام فروشگاه را ذخیره کنید.');
                navigate('/seller/settings');
              }
            }}
            className="bg-white text-primary-600 hover:bg-gray-100 font-bold gap-2 w-full md:w-auto"
          >
            <Store className="w-4 h-4" />
            مشاهده فروشگاه
          </Button>
        </div>

        {/* Quick Actions & Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
              <h3 className="text-xs font-black text-gray-900 mb-2 flex items-center gap-1.5">
                <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                دسترسی سریع
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button key={idx} onClick={() => navigate(action.path)} className="group flex flex-col items-center gap-1 p-2 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all hover:-translate-y-0.5">
                      <div className={cn('w-7 h-7 bg-gradient-to-br rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform', action.color)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 text-center">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-gradient-to-br from-warning-50 to-accent-50 border-2 border-warning-200 rounded-xl p-3">
              <div className="flex items-start gap-1.5 mb-1.5">
                <div className="w-6 h-6 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Flame className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-[11px] mb-0.5">نکته روز</h4>
                  <p className="text-[10px] text-gray-700 leading-relaxed">
                    با افزودن تصاویر باکیفیت، فروش خود را تا <strong className="text-warning-600">۴۰٪</strong> افزایش دهید!
                  </p>
                </div>
              </div>
              <Button variant="outline" size="xs" className="w-full text-[10px]" onClick={() => navigate('/seller/products')}>
                مشاهده محصولات
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}