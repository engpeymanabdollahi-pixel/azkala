import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Package, ShoppingCart, Users, Tag, TrendingUp, TrendingDown,
  DollarSign, Eye, Star, AlertCircle, CheckCircle, Clock,
  ArrowLeft, RefreshCw, Flag, MessageCircle, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import apiClient from '@/services/api/client';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast'; // ✅ ایمپورت جدید برای نوتیفیکیشن

import { ChatStatsWidget } from '@/components/admin/widgets/ChatStatsWidget';
import { SentimentWidget } from '@/components/admin/widgets/SentimentWidget';
import { RecentChatActivityWidget } from '@/components/admin/widgets/RecentChatActivityWidget';

// ==================== Types ====================

interface DashboardStats {
  total_products: number;
  total_orders: number;
  total_users: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  total_reviews: number;
  total_coupons: number;
  recent_orders: Array<{
    id: number;
    order_number: string;
    user_name: string;
    total: number;
    status: string;
    created_at: string;
  }>;
  recent_users: Array<{
    id: number;
    name: string;
    email: string;
    created_at: string;
  }>;
  top_products: Array<{
    id: number;
    name: string;
    sales_count: number;
    revenue: number;
  }>;
  monthly_stats: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
}

interface ReportStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  today: number;
  week: number;
  month: number;
}

// ==================== Fetch Stats ====================

const fetchDashboardStats = async (): Promise<{ success: boolean; data: DashboardStats }> => {
  const response = await apiClient.get('/admin/dashboard/stats');
  return response.data;
};

const fetchReportStats = async (): Promise<{ success: boolean; data: ReportStats }> => {
  try {
    const response = await apiClient.get('/admin/chat-management/reports/stats'); 
    return response.data;
  } catch (error) {
    console.error('Failed to fetch report stats:', error);
    return {
      success: false,
      data: {
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0,
        today: 0,
        week: 0,
        month: 0,
      },
    };
  }
};

// ==================== Main Component ====================

export function AdminDashboard() {
  const navigate = useNavigate();

  // ✅ Refها برای مدیریت هوشمند نوتیفیکیشن (جلوگیری از اسپم در لود اولیه)
  const previousPendingCount = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60000, // هر ۶۰ ثانیه برای آمار کلی
  });

  // ✅ کوئری گزارش‌ها با نظرسنجی ۱۵ ثانیه‌ای برای احساس بلادرنگ بودن
  const { data: reportData, refetch: refetchReports } = useQuery({
    queryKey: ['admin-report-stats'],
    queryFn: fetchReportStats,
    refetchInterval: 15000, // هر ۱۵ ثانیه
    refetchIntervalInBackground: true, // حتی وقتی تب مرورگر فعال نیست بررسی شود
  });

  const stats = data?.data;
  const reportStats = reportData?.data;

  // ✅ منطق هوشمند بررسی افزایش درخواست‌های جدید و نمایش نوتیفیکیشن
  useEffect(() => {
    if (!reportStats) return;

    const currentPending = reportStats.pending || 0;

    // در اولین رندر، فقط مقدار پایه را ذخیره کن (بدون نمایش نوتیفیکیشن)
    if (isFirstRender.current) {
      previousPendingCount.current = currentPending;
      isFirstRender.current = false;
      return;
    }

    // اگر تعداد درخواست‌های در انتظار افزایش یافته باشد، نوتیفیکیشن نمایش بده
    if (previousPendingCount.current !== null && currentPending > previousPendingCount.current) {
      const newRequests = currentPending - previousPendingCount.current;
      
      toast.success(
        `${newRequests} درخواست افتتاح شعبه جدید دریافت شد! 🏪`,
        {
          duration: 6000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            fontWeight: 'bold',
          },
        }
      );
    }

    // به‌روزرسانی مقدار مرجع برای دور بعدی
    previousPendingCount.current = currentPending;
  }, [reportStats]);

  // ==================== Loading State ====================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-white dark:bg-gray-800 rounded-xl animate-pulse w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-80 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ✅ قبلاً fetchDashboardStats خطا را جایی نمی‌گرفت — اگر API خطا
  // می‌داد، isLoading فقط false می‌شد و data undefined می‌ماند؛ صفحه
  // بی‌صدا همه‌جا صفر نشان می‌داد و ادمین فکر می‌کرد فروشگاه خالی است.
  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-error-200 dark:border-error-800 rounded-xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-error-500 mx-auto mb-3" />
        <p className="text-gray-900 dark:text-gray-100 font-bold mb-1">خطا در بارگذاری آمار داشبورد</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">اتصال به سرور برقرار نشد یا خطایی رخ داد.</p>
        <Button onClick={() => refetch()} size="sm" className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  // ==================== Stats Cards ====================

  const statCards = [
    {
      label: 'کل محصولات',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      textColor: 'text-primary-600 dark:text-primary-400',
      link: '/admin/products',
    },
    {
      label: 'کل سفارشات',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-50 dark:bg-accent-900/30',
      textColor: 'text-accent-600 dark:text-accent-400',
      link: '/admin/orders',
      badge: stats?.pending_orders ? `${stats.pending_orders} در انتظار` : null,
    },
    {
      label: 'کل کاربران',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-success-500 to-success-600',
      bgColor: 'bg-success-50 dark:bg-success-900/30',
      textColor: 'text-success-600 dark:text-success-400',
      link: '/admin/users',
    },
    {
      label: 'درآمد کل',
      value: formatPrice(stats?.total_revenue || 0),
      icon: DollarSign,
      color: 'from-warning-500 to-warning-600',
      bgColor: 'bg-warning-50 dark:bg-warning-900/30',
      textColor: 'text-warning-600 dark:text-warning-400',
      isPrice: true,
    },
  ];

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">داشبورد مدیریت</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            خلاصه وضعیت فروشگاه ازکالا
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/reports')}
            className="gap-1.5 relative"
          >
            <Flag className="w-4 h-4" />
            گزارش‌های تخلف
            {reportStats?.pending && reportStats.pending > 0 && (
              <Badge 
                variant="error" 
                size="sm" 
                className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-[10px] rounded-full p-0"
              >
                {reportStats.pending}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              refetchReports();
            }}
            className="gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => card.link && navigate(card.link)}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all',
                card.link && 'cursor-pointer'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bgColor)}>
                  <Icon className={cn('w-5 h-5', card.textColor)} />
                </div>
                {card.badge && (
                  <Badge variant="warning" size="sm">{card.badge}</Badge>
                )}
              </div>
              <p className={cn('text-2xl font-black text-gray-900 dark:text-gray-100', card.isPrice && 'text-lg')}>
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-warning-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">سفارشات در انتظار</span>
          </div>
          <p className="text-xl font-black text-warning-600">{stats?.pending_orders || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">سفارشات تکمیل‌شده</span>
          </div>
          <p className="text-xl font-black text-success-600">{stats?.completed_orders || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-accent-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">کل نظرات</span>
          </div>
          <p className="text-xl font-black text-accent-600">{stats?.total_reviews || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">کدهای تخفیف</span>
          </div>
          <p className="text-xl font-black text-primary-600">{stats?.total_coupons || 0}</p>
        </div>
        
        {/* 🆕 ویجت گزارش‌های تخلف */}
        <div 
          onClick={() => navigate('/admin/reports')}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">گزارش‌های تخلف</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xl font-black text-red-600 dark:text-red-400">{reportStats?.pending || 0}</p>
            {reportStats?.pending && reportStats.pending > 0 && (
              <Badge variant="error" size="sm" className="animate-pulse">
                جدید
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            {reportStats?.today || 0} گزارش امروز
          </p>
        </div>
      </div>

      {/* 🆕 ویجت‌های چت */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatStatsWidget />
        <SentimentWidget />
      </div>
      <RecentChatActivityWidget />

      {/* 🆕 Report Stats Section */}
      {reportStats && reportStats.total > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl border-2 border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              وضعیت گزارش‌های تخلف
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/reports')}
              className="gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              مشاهده همه
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{reportStats.total}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">کل گزارش‌ها</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{reportStats.pending}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">در انتظار</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{reportStats.reviewed}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">بررسی شده</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-green-600 dark:text-green-400">{reportStats.resolved}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">حل شده</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-gray-600 dark:text-gray-400">{reportStats.dismissed}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">رد شده</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-accent-600" />
              آخرین سفارشات
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/orders')}
              className="gap-1"
            >
              مشاهده همه
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {stats?.recent_orders && stats.recent_orders.length > 0 ? (
              stats.recent_orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center text-white">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{order.order_number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.user_name}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</p>
                    <Badge
                      variant={
                        order.status === 'completed' ? 'success' :
                        order.status === 'cancelled' ? 'error' :
                        order.status === 'processing' ? 'primary' : 'warning'
                      }
                      size="sm"
                    >
                      {order.status === 'pending' ? 'در انتظار' :
                       order.status === 'processing' ? 'در حال پردازش' :
                       order.status === 'completed' ? 'تکمیل‌شده' :
                       order.status === 'cancelled' ? 'لغو شده' : order.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                هنوز سفارشی ثبت نشده است
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success-600" />
              پرفروش‌ترین محصولات
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/products')}
              className="gap-1"
            >
              مشاهده همه
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {stats?.top_products && stats.top_products.length > 0 ? (
              stats.top_products.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm',
                      index === 0 ? 'bg-warning-500' :
                      index === 1 ? 'bg-gray-400 dark:bg-gray-600' :
                      index === 2 ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-600'
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.sales_count} فروش</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-success-600">
                    {formatPrice(product.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                هنوز محصولی فروش نرفته است
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            آخرین کاربران ثبت‌نام‌شده
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/users')}
            className="gap-1"
          >
            مشاهده همه
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400">کاربر</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400">ایمیل</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400">تاریخ ثبت‌نام</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_users && stats.recent_users.length > 0 ? (
                stats.recent_users.slice(0, 5).map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('fa-IR')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    هنوز کاربری ثبت‌نام نکرده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;