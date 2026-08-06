import { useState, useMemo, memo, ReactNode, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Award,
  Star,
  Store,
  ArrowUp,
  ArrowDown,
  Minus,
  UserCheck,
  Target,
  Smartphone,
  ShoppingBag,
  AlertTriangle,
  Activity,
  Eye,
  Percent,
  Box,
  Flame,
  Rocket,
  Brain,
  MessageCircle,
  MessageSquare,
  Clock,
  Users as UsersIcon,
} from 'lucide-react';
import { adminReportService } from '@/services/api/adminReport.service';
import { adminAdvancedReportService } from '@/services/api/adminAdvancedReport.service';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { ExportButton } from '@/components/admin/ExportButton';

// ============================================================================
// Types
// ============================================================================

interface OverviewData {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
}

interface KpiData {
  orders: { current: number; previous: number; change: number };
  revenue: { current: number; previous: number; change: number };
  avg_order: { current: number; previous: number; change: number };
  users: { current: number; previous: number; change: number };
}

interface SalesChartItem {
  date: string;
  revenue: number;
  orders_count: number;
}

interface TopProduct {
  id: string | number;
  name: string;
  total_sold: number;
  total_revenue: number;
}

interface TopCategory {
  id: string | number;
  name: string;
  total_revenue: number;
}

interface OrderStatusItem {
  status: string;
  count: number;
}

interface ChatAnalytics {
  total_conversations: number;
  active_conversations: number;
  total_messages: number;
  messages_today: number;
  conversion_rate: number;
  comparison?: {
    conversation_change: number;
    message_change: number;
  };
  daily_stats: Array<{ label: string; conversations: number; messages: number }>;
  hourly_stats: Array<{ label: string; count: number }>;
  top_sellers: Array<{
    id: string | number;
    shop_name?: string;
    name: string;
    conversations_count: number;
    response_count: number;
  }>;
}

interface UsersAnalysis {
  total_customers: number;
  retention_rate: number;
  new_vs_returning?: { new: number; returning: number };
  by_frequency?: {
    no_purchase: number;
    single: number;
    occasional: number;
    regular: number;
    vip: number;
  };
  by_value?: {
    no_purchase: number;
    low: number;
    medium: number;
    high: number;
    premium: number;
  };
}

interface SellerPerformance {
  total_sellers: number;
  averages?: { revenue: number; sold: number; rating: number };
  sellers: Array<{
    id: string | number;
    rank: number;
    name: string;
    shop_name?: string;
    rating: number;
    products_count: number;
    total_sold: number;
    total_revenue: number;
    performance: number;
  }>;
}

interface PeriodComparison {
  current?: { orders: number; revenue: number; users: number; products: number };
  previous?: { orders: number; revenue: number; users: number; products: number };
  changes?: { orders: number; revenue: number; users: number; products: number };
}

interface DeviceAnalytics {
  message?: string;
  by_brand: Array<{ device_brand: string; count: number }>;
  by_model: Array<{ device_model: string; count: number }>;
}

interface BasketAnalysis {
  avg_items_per_order: number;
  avg_order_value: number;
  frequently_bought: Array<{ product_id: string | number; product_name: string; frequency: number }>;
}

interface ProductAnalytics {
  most_viewed: Array<{ id: string | number; name: string; views_count: number }>;
  high_conversion: Array<{ id: string | number; name: string; conversion_rate: number }>;
  low_stock: Array<{ id: string | number; name: string; stock: number }>;
}

interface Prediction {
  date: string;
  predicted_revenue: number;
  confidence: number;
}

interface PredictionsData {
  current_avg: number;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  predictions: Prediction[];
}

interface Anomaly {
  date: string;
  type: 'spike' | 'drop';
  revenue: number;
  orders_count: number;
  deviation_percentage: number;
}

interface AnomaliesData {
  anomalies: Anomaly[];
  statistics: {
    mean: number;
    std_dev: number;
    threshold: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

const PERIODS = [
  { value: 7, label: '۷ روز' },
  { value: 14, label: '۱۴ روز' },
  { value: 30, label: '۳۰ روز' },
  { value: 60, label: '۶۰ روز' },
  { value: 90, label: '۹۰ روز' },
];

const CHART_COLORS = [
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#06b6d4',
  '#ef4444',
  '#84cc16',
  '#f59e0b',
  '#6366f1',
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

type TabType =
  | 'overview'
  | 'chat'
  | 'users'
  | 'sellers'
  | 'comparison'
  | 'devices'
  | 'basket'
  | 'products'
  | 'predictions'
  | 'anomalies';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  phase: string;
  color: string;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'نمای کلی', icon: BarChart3, phase: 'MVP', color: 'from-primary-500 to-primary-600' },
  { id: 'chat', label: 'تحلیل چت', icon: MessageCircle, phase: 'فاز ۳', color: 'from-blue-500 to-blue-600' },
  { id: 'users', label: 'کاربران', icon: Users, phase: 'فاز ۲', color: 'from-purple-500 to-purple-600' },
  { id: 'sellers', label: 'فروشندگان', icon: Store, phase: 'فاز ۲', color: 'from-green-500 to-green-600' },
  { id: 'comparison', label: 'مقایسه', icon: Activity, phase: 'فاز ۲', color: 'from-indigo-500 to-indigo-600' },
  { id: 'devices', label: 'دستگاه‌ها', icon: Smartphone, phase: 'فاز ۳', color: 'from-pink-500 to-pink-600' },
  { id: 'basket', label: 'سبد خرید', icon: ShoppingBag, phase: 'فاز ۳', color: 'from-orange-500 to-orange-600' },
  { id: 'products', label: 'محصولات', icon: Package, phase: 'فاز ۳', color: 'from-teal-500 to-teal-600' },
  { id: 'predictions', label: 'پیش‌بینی', icon: Brain, phase: 'فاز ۴', color: 'from-violet-500 to-violet-600' },
  { id: 'anomalies', label: 'ناهنجاری', icon: AlertTriangle, phase: 'فاز ۴', color: 'from-red-500 to-red-600' },
];

// ============================================================================
// Helpers
// ============================================================================

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'در انتظار',
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    delivered: 'تحویل شده',
    cancelled: 'لغو شده',
  };
  return map[status] || status;
};

// ============================================================================
// Main Component
// ============================================================================

export function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState(30);

  const renderTabContent = useCallback(() => {
    const props = { period };
    switch (activeTab) {
      case 'overview':
        return <OverviewTab {...props} />;
      case 'chat':
        return <ChatAnalyticsTab {...props} />;
      case 'users':
        return <UsersTab {...props} />;
      case 'sellers':
        return <SellersTab {...props} />;
      case 'comparison':
        return <ComparisonTab {...props} />;
      case 'devices':
        return <DevicesTab {...props} />;
      case 'basket':
        return <BasketTab {...props} />;
      case 'products':
        return <ProductsTab {...props} />;
      case 'predictions':
        return <PredictionsTab />;
      case 'anomalies':
        return <AnomaliesTab {...props} />;
      default:
        return null;
    }
  }, [activeTab, period]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            گزارشات پیشرفته
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">تحلیل جامع عملکرد پلتفرم ازکالا</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-1 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-2" />
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  period === p.value
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ✅ قبلاً کامپوننت ExportButton برای type="summary" ساخته شده بود
              ولی هیچ صفحه‌ای آن را رندر نمی‌کرد و کاملاً غیرقابل‌دسترس بود */}
          <ExportButton type="summary" label="خروجی خلاصه گزارش" filters={{ period }} />
        </div>
      </div>

      {/* Tabs Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all relative',
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                    : 'bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
                <span
                  className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0',
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {tab.phase}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}

// ============================================================================
// Tab Components
// ============================================================================

// ----- Overview Tab -----
function OverviewTab({ period }: { period: number }) {
  const { data: overviewData } = useQuery({
    queryKey: ['admin-reports-overview'],
    queryFn: () => adminReportService.getOverview(),
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['admin-reports-dashboard', period],
    queryFn: () => adminReportService.getDashboard(period),
  });

  const { data: salesData } = useQuery({
    queryKey: ['admin-reports-sales', period],
    queryFn: () => adminReportService.getSalesChart(period),
  });

  const { data: topProductsData } = useQuery({
    queryKey: ['admin-reports-top-products', period],
    queryFn: () => adminReportService.getTopProducts(period),
  });

  const { data: topCategoriesData } = useQuery({
    queryKey: ['admin-reports-top-categories', period],
    queryFn: () => adminReportService.getTopCategories(period),
  });

  const { data: orderStatusData } = useQuery({
    queryKey: ['admin-reports-order-status', period],
    queryFn: () => adminReportService.getOrderStatus(period),
  });

  const overview = overviewData?.data as OverviewData | undefined;
  const kpis = dashboardData?.data?.kpis as KpiData | undefined;
  const chartData = (salesData?.data?.chart as SalesChartItem[]) || [];
  const summary = salesData?.data?.summary;
  const topProducts = (topProductsData?.data?.products as TopProduct[]) || [];
  const topCategories = (topCategoriesData?.data?.categories as TopCategory[]) || [];
  const orderStatus = (orderStatusData?.data?.by_status as OrderStatusItem[]) || [];

  return (
    <div className="space-y-5">
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="کل کاربران" value={overview.total_users.toLocaleString('fa-IR')} icon={Users} color="primary" />
          <StatCard label="کل محصولات" value={overview.total_products.toLocaleString('fa-IR')} icon={Package} color="accent" />
          <StatCard label="کل سفارشات" value={overview.total_orders.toLocaleString('fa-IR')} icon={ShoppingCart} color="success" />
          <StatCard label="درآمد کل" value={formatPrice(overview.total_revenue)} icon={DollarSign} color="warning" />
        </div>
      )}

      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="سفارشات"
            current={kpis.orders.current}
            previous={kpis.orders.previous}
            change={kpis.orders.change}
            icon={ShoppingCart}
            color="primary"
          />
          <KpiCard
            label="درآمد"
            current={kpis.revenue.current}
            previous={kpis.revenue.previous}
            change={kpis.revenue.change}
            icon={DollarSign}
            color="success"
            isMoney
          />
          <KpiCard
            label="میانگین سفارش"
            current={kpis.avg_order.current}
            previous={kpis.avg_order.previous}
            change={kpis.avg_order.change}
            icon={TrendingUp}
            color="accent"
            isMoney
          />
          <KpiCard
            label="کاربران جدید"
            current={kpis.users.current}
            previous={kpis.users.previous}
            change={kpis.users.change}
            icon={Users}
            color="warning"
          />
        </div>
      )}

      <div className="card-enhanced">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              نمودار فروش
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">روند فروش در {period} روز اخیر</p>
          </div>
          {summary && (
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">کل فروش</p>
                <p className="font-black text-primary-600">{formatPrice(summary.total_revenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">کل سفارشات</p>
                <p className="font-black text-accent-600">{summary.total_orders.toLocaleString('fa-IR')}</p>
              </div>
            </div>
          )}
        </div>
        <AreaChart data={chartData} height={320} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-enhanced p-5">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-warning-600" />
            Top 10 محصولات پرفروش
          </h3>
          <div className="space-y-2">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0',
                    index === 0 && 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white',
                    index === 1 && 'bg-gradient-to-br from-gray-300 dark:from-gray-600 to-gray-400 dark:to-gray-600 text-white',
                    index === 2 && 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
                    index > 2 && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{product.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{product.total_sold.toLocaleString('fa-IR')} فروش</p>
                </div>
                <p className="text-sm font-black text-primary-600">{formatPrice(product.total_revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-enhanced p-5">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-accent-600" />
            Top دسته‌بندی‌ها
          </h3>
          {topCategories.length > 0 ? (
            <>
              <div className="flex items-center justify-center">
                <PieChart data={topCategories} size={240} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {topCategories.slice(0, 6).map((cat, index) => (
                  <div key={cat.id} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-gray-700 dark:text-gray-300 line-clamp-1">{cat.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">داده‌ای وجود ندارد</p>
          )}
        </div>
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-success-600" />
          وضعیت سفارشات
        </h3>
        <div className="space-y-3">
          {orderStatus.map((item) => {
            const color = STATUS_COLORS[item.status] || '#6b7280';
            const total = orderStatus.reduce((sum, s) => sum + s.count, 0);
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 dark:text-gray-300">{getStatusLabel(item.status)}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.count.toLocaleString('fa-IR')} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="progress-enhanced">
                  <div className="progress-enhanced-bar" style={{ width: `${percentage}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ----- Chat Analytics Tab -----
function ChatAnalyticsTab({ period }: { period: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-advanced-chat', period],
    queryFn: () => adminAdvancedReportService.getChatAnalytics(period),
  });

  if (isLoading) return <LoadingState />;

  const analysis = data?.data as ChatAnalytics | undefined;
  if (!analysis) return <LoadingState />;

  const maxHourly = Math.max(...(analysis.hourly_stats || []).map((h) => h.count), 1);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="کل مکالمات"
          value={Number(analysis.total_conversations || 0).toLocaleString('fa-IR')}
          icon={MessageCircle}
          color="primary"
        />
        <StatCard
          label="مکالمات فعال"
          value={Number(analysis.active_conversations || 0).toLocaleString('fa-IR')}
          icon={Activity}
          color="success"
        />
        <StatCard
          label="کل پیام‌ها"
          value={Number(analysis.total_messages || 0).toLocaleString('fa-IR')}
          icon={MessageSquare}
          color="accent"
        />
        <StatCard
          label="پیام امروز"
          value={Number(analysis.messages_today || 0).toLocaleString('fa-IR')}
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          label="نرخ تبدیل"
          value={`${Number(analysis.conversion_rate || 0)}%`}
          icon={Target}
          color="success"
        />
      </div>

      {/* Comparison */}
      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          مقایسه با دوره قبل ({period} روز)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary-50 to-white p-4 rounded-xl border border-primary-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">مکالمات</span>
              <ChangeBadge value={Number(analysis.comparison?.conversation_change || 0)} />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {Number(analysis.total_conversations || 0).toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="bg-gradient-to-br from-accent-50 to-white p-4 rounded-xl border border-accent-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">پیام‌ها</span>
              <ChangeBadge value={Number(analysis.comparison?.message_change || 0)} />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {Number(analysis.total_messages || 0).toLocaleString('fa-IR')}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          روند روزانه ({period} روز اخیر)
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {(analysis.daily_stats || []).map((day, i) => {
            const maxConv = Math.max(...(analysis.daily_stats || []).map((d) => d.conversations), 1);
            const maxMsg = Math.max(...(analysis.daily_stats || []).map((d) => d.messages), 1);
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-xs text-gray-500 dark:text-gray-400 font-bold">{day.label}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <div
                        style={{ width: `${(day.conversations / maxConv) * 100}%` }}
                        className="bg-primary-500 transition-all"
                      />
                    </div>
                    <span className="w-12 text-xs text-gray-600 dark:text-gray-400 text-right">{day.conversations}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <div
                        style={{ width: `${(day.messages / maxMsg) * 100}%` }}
                        className="bg-accent-500 transition-all"
                      />
                    </div>
                    <span className="w-12 text-xs text-gray-600 dark:text-gray-400 text-right">{day.messages}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">مکالمات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">پیام‌ها</span>
          </div>
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning-600" />
          توزیع ساعتی پیام‌ها
        </h3>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {(analysis.hourly_stats || []).map((hour, i) => {
            const percentage = (hour.count / maxHourly) * 100;
            const intensity =
              percentage > 70
                ? 'bg-red-500'
                : percentage > 40
                ? 'bg-orange-500'
                : percentage > 20
                ? 'bg-yellow-500'
                : 'bg-blue-500';
            return (
              <div key={i} className="text-center">
                <div
                  className={cn('w-full rounded-t-lg transition-all', intensity)}
                  style={{
                    height: `${Math.max(percentage, 5)}%`,
                    minHeight: '4px',
                    maxHeight: '80px',
                  }}
                />
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{hour.label}</p>
                <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{hour.count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Sellers */}
      <div className="card-enhanced overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-success-600" />
            فروشندگان برتر (بر اساس پاسخگویی)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-enhanced w-full">
            <thead>
              <tr>
                <th>رتبه</th>
                <th>فروشنده</th>
                <th>مکالمات</th>
                <th>پاسخ‌ها</th>
                <th>میانگین پاسخ/مکالمه</th>
              </tr>
            </thead>
            <tbody>
              {(analysis.top_sellers || []).map((seller, index) => {
                const avgResponse =
                  seller.conversations_count > 0
                    ? (seller.response_count / seller.conversations_count).toFixed(1)
                    : '0';
                return (
                  <tr key={seller.id}>
                    <td>
                      <RankBadge rank={index + 1} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                          {(seller.shop_name || seller.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{seller.shop_name || seller.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{seller.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm font-bold">{Number(seller.conversations_count || 0).toLocaleString('fa-IR')}</td>
                    <td className="text-sm font-bold text-primary-600">{Number(seller.response_count || 0).toLocaleString('fa-IR')}</td>
                    <td>
                      <Badge variant={parseFloat(avgResponse) > 10 ? 'success' : 'warning'}>{avgResponse}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----- Users Tab -----
function UsersTab({ period }: { period: number }) {
  const { data } = useQuery({
    queryKey: ['admin-advanced-users', period],
    queryFn: () => adminAdvancedReportService.getUsersAnalysis(period),
  });

  const analysis = data?.data as UsersAnalysis | undefined;
  if (!analysis) return <LoadingState />;

  const frequencyData = [
    { label: 'بدون خرید', value: analysis.by_frequency?.no_purchase || 0, color: '#94a3b8' },
    { label: 'تک خرید', value: analysis.by_frequency?.single || 0, color: '#06b6d4' },
    { label: 'گاهی', value: analysis.by_frequency?.occasional || 0, color: '#3b82f6' },
    { label: 'منظم', value: analysis.by_frequency?.regular || 0, color: '#10b981' },
    { label: 'VIP', value: analysis.by_frequency?.vip || 0, color: '#f59e0b' },
  ];

  const valueData = [
    { label: 'بدون خرید', value: analysis.by_value?.no_purchase || 0, color: '#94a3b8' },
    { label: 'کم', value: analysis.by_value?.low || 0, color: '#06b6d4' },
    { label: 'متوسط', value: analysis.by_value?.medium || 0, color: '#3b82f6' },
    { label: 'بالا', value: analysis.by_value?.high || 0, color: '#10b981' },
    { label: 'پریمیوم', value: analysis.by_value?.premium || 0, color: '#f59e0b' },
  ];

  const totalFreq = frequencyData.reduce((sum, d) => sum + d.value, 0);
  const totalValue = valueData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="کل مشتریان"
          value={Number(analysis.total_customers || 0).toLocaleString('fa-IR')}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="کاربران جدید"
          value={Number(analysis.new_vs_returning?.new || 0).toLocaleString('fa-IR')}
          icon={UserCheck}
          color="success"
        />
        <StatCard
          label="نرخ بازگشت"
          value={`${Number(analysis.retention_rate || 0)}%`}
          icon={Target}
          color="accent"
        />
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          کاربران جدید vs بازگشتی
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-xl">
            <p className="text-xs text-primary-700 mb-1">کاربران جدید</p>
            <p className="text-3xl font-black text-primary-700">
              {Number(analysis.new_vs_returning?.new || 0).toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 p-4 rounded-xl">
            <p className="text-xs text-accent-700 mb-1">کاربران بازگشتی</p>
            <p className="text-3xl font-black text-accent-700">
              {Number(analysis.new_vs_returning?.returning || 0).toLocaleString('fa-IR')}
            </p>
          </div>
        </div>
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-success-600" />
          دسته‌بندی بر اساس تعداد خرید
        </h3>
        <div className="space-y-3">
          {frequencyData.map((item) => {
            const percentage = totalFreq > 0 ? (item.value / totalFreq) * 100 : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.value.toLocaleString('fa-IR')} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="progress-enhanced">
                  <div className="progress-enhanced-bar" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-warning-600" />
          دسته‌بندی بر اساس ارزش خرید
        </h3>
        <div className="space-y-3">
          {valueData.map((item) => {
            const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.value.toLocaleString('fa-IR')} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="progress-enhanced">
                  <div className="progress-enhanced-bar" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ----- Sellers Tab -----
function SellersTab({ period }: { period: number }) {
  const { data } = useQuery({
    queryKey: ['admin-advanced-sellers', period],
    queryFn: () => adminAdvancedReportService.getSellerPerformance(period),
  });

  const performance = data?.data as SellerPerformance | undefined;
  if (!performance) return <LoadingState />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="میانگین فروش"
          value={formatPrice(performance.averages?.revenue || 0)}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          label="میانگین تعداد فروش"
          value={Number(performance.averages?.sold || 0).toLocaleString('fa-IR')}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          label="میانگین امتیاز"
          value={Number(performance.averages?.rating || 0).toFixed(1)}
          icon={Star}
          color="warning"
        />
      </div>

      <div className="card-enhanced overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary-600" />
            رتبه‌بندی فروشندگان ({performance.total_sellers || 0} فروشنده)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-enhanced w-full">
            <thead>
              <tr>
                <th>رتبه</th>
                <th>فروشنده</th>
                <th>امتیاز</th>
                <th>محصولات</th>
                <th>تعداد فروش</th>
                <th>درآمد</th>
                <th>عملکرد</th>
              </tr>
            </thead>
            <tbody>
              {(performance.sellers || []).map((seller) => (
                <tr key={seller.id}>
                  <td>
                    <RankBadge rank={seller.rank} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                        {(seller.shop_name || seller.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{seller.shop_name || seller.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{seller.name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-warning-400 text-warning-400" />
                      <span className="text-sm font-bold">{Number(seller.rating || 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="text-sm font-bold">{seller.products_count || 0}</td>
                  <td className="text-sm font-bold">{Number(seller.total_sold || 0).toLocaleString('fa-IR')}</td>
                  <td className="text-sm font-black text-primary-600">{formatPrice(seller.total_revenue || 0)}</td>
                  <td>
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold',
                        seller.performance >= 100
                          ? 'bg-success-50 text-success-700'
                          : seller.performance >= 70
                          ? 'bg-warning-50 text-warning-700'
                          : 'bg-error-50 text-error-700'
                      )}
                    >
                      {seller.performance >= 100 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {seller.performance}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----- Comparison Tab -----
function ComparisonTab({ period }: { period: number }) {
  const { data } = useQuery({
    queryKey: ['admin-advanced-comparison', period],
    queryFn: () => adminAdvancedReportService.getPeriodComparison(period),
  });

  const comparison = data?.data as PeriodComparison | undefined;
  if (!comparison) return <LoadingState />;

  const metrics = [
    {
      label: 'سفارشات',
      current: comparison.current?.orders || 0,
      previous: comparison.previous?.orders || 0,
      change: comparison.changes?.orders || 0,
      icon: ShoppingCart,
      color: 'primary',
    },
    {
      label: 'درآمد',
      current: comparison.current?.revenue || 0,
      previous: comparison.previous?.revenue || 0,
      change: comparison.changes?.revenue || 0,
      icon: DollarSign,
      color: 'success',
      isMoney: true,
    },
    {
      label: 'کاربران جدید',
      current: comparison.current?.users || 0,
      previous: comparison.previous?.users || 0,
      change: comparison.changes?.users || 0,
      icon: Users,
      color: 'accent',
    },
    {
      label: 'محصولات جدید',
      current: comparison.current?.products || 0,
      previous: comparison.previous?.products || 0,
      change: comparison.changes?.products || 0,
      icon: Package,
      color: 'warning',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary-600" />
          مقایسه {period} روز اخیر با دوره قبل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-gradient-to-br from-gray-50 dark:from-gray-900/40 to-white p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <metric.icon className={cn('w-5 h-5', `text-${metric.color}-600`)} />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{metric.label}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">دوره فعلی</p>
                  <p className="text-xl font-black text-gray-900 dark:text-gray-100">
                    {metric.isMoney ? formatPrice(metric.current) : Number(metric.current).toLocaleString('fa-IR')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">دوره قبل</p>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    {metric.isMoney ? formatPrice(metric.previous) : Number(metric.previous).toLocaleString('fa-IR')}
                  </p>
                </div>
                <ChangeBadge value={metric.change} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- Devices Tab -----
function DevicesTab({ period }: { period: number }) {
  const { data } = useQuery({
    queryKey: ['admin-advanced-devices', period],
    queryFn: () => adminAdvancedReportService.getDeviceAnalytics(period),
  });

  const analytics = data?.data as DeviceAnalytics | undefined;
  if (!analytics) return <LoadingState />;

  return (
    <div className="space-y-5">
      {analytics.message && (
        <div className="card-enhanced p-5 bg-warning-50 border-warning-200">
          <p className="text-sm text-warning-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {analytics.message}
          </p>
        </div>
      )}

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-primary-600" />
          Top 10 برند دستگاه
        </h3>
        <div className="space-y-2">
          {(analytics.by_brand || []).map((item, index) => {
            const total = (analytics.by_brand || []).reduce((sum, i) => sum + i.count, 0);
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={item.device_brand} className="flex items-center gap-3">
                <div className="w-6 text-xs font-black text-gray-500 dark:text-gray-400">{index + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-gray-700 dark:text-gray-300">{item.device_brand}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.count.toLocaleString('fa-IR')} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="progress-enhanced">
                    <div
                      className="progress-enhanced-bar"
                      style={{ width: `${percentage}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-accent-600" />
          Top 10 مدل دستگاه
        </h3>
        <div className="space-y-2">
          {(analytics.by_model || []).map((item, index) => {
            const total = (analytics.by_model || []).reduce((sum, i) => sum + i.count, 0);
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={item.device_model} className="flex items-center gap-3">
                <div className="w-6 text-xs font-black text-gray-500 dark:text-gray-400">{index + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-gray-700 dark:text-gray-300">{item.device_model}</span>
                    <span className="text-gray-500 dark:text-gray-400">{item.count.toLocaleString('fa-IR')}</span>
                  </div>
                  <div className="progress-enhanced">
                    <div
                      className="progress-enhanced-bar"
                      style={{ width: `${percentage}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ----- Basket Tab -----
function BasketTab({ period }: { period: number }) {
  const { data } = useQuery({
    queryKey: ['admin-advanced-basket', period],
    queryFn: () => adminAdvancedReportService.getBasketAnalysis(period),
  });

  const analysis = data?.data as BasketAnalysis | undefined;
  if (!analysis) return <LoadingState />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StatCard
          label="میانگین اقلام در سبد"
          value={Number(analysis.avg_items_per_order || 0).toFixed(2)}
          icon={ShoppingBag}
          color="primary"
        />
        <StatCard
          label="میانگین ارزش سبد"
          value={formatPrice(analysis.avg_order_value || 0)}
          icon={DollarSign}
          color="success"
        />
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-warning-600" />
          پرتکرارترین محصولات
        </h3>
        <div className="space-y-2">
          {(analysis.frequently_bought || []).map((item, index) => (
            <div key={item.product_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-warning-400 to-warning-500 text-white flex items-center justify-center text-xs font-black">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.product_name}</p>
              </div>
              <Badge variant="warning">{Number(item.frequency || 0).toLocaleString('fa-IR')} بار</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- Products Tab -----
function ProductsTab({ period }: { period: number }) {
  const { data } = useQuery({
    queryKey: ['admin-advanced-products', period],
    queryFn: () => adminAdvancedReportService.getProductAnalytics(period),
  });

  const analysis = data?.data as ProductAnalytics | undefined;
  if (!analysis) return <LoadingState />;

  return (
    <div className="space-y-5">
      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-primary-600" />
          پربازدیدترین محصولات
        </h3>
        <div className="space-y-2">
          {(analysis.most_viewed || []).map((product, index) => (
            <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-black">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{product.name}</p>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Eye className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span className="font-bold">{Number(product.views_count || 0).toLocaleString('fa-IR')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-success-600" />
          بالاترین نرخ تبدیل
        </h3>
        <div className="space-y-2">
          {(analysis.high_conversion || []).map((product, index) => (
            <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="w-7 h-7 rounded-lg bg-success-100 text-success-700 flex items-center justify-center text-xs font-black">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{product.name}</p>
              </div>
              <Badge variant="success">{Number(product.conversion_rate || 0)}%</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-error-600" />
          محصولات کم‌موجود
        </h3>
        <div className="space-y-2">
          {(analysis.low_stock || []).map((product) => (
            <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="w-7 h-7 rounded-lg bg-error-100 text-error-700 flex items-center justify-center text-xs font-black">
                <Box className="w-3 h-3" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{product.name}</p>
              </div>
              <Badge variant="error">{product.stock} عدد</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- Predictions Tab -----
function PredictionsTab() {
  const { data } = useQuery({
    queryKey: ['admin-advanced-predictions'],
    queryFn: () => adminAdvancedReportService.getPredictions(7),
  });

  const predictions = data?.data as PredictionsData | undefined;
  if (!predictions) return <LoadingState />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="میانگین روزانه"
          value={formatPrice(predictions.current_avg || 0)}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          label="روند"
          value={predictions.trend === 'up' ? 'صعودی' : predictions.trend === 'down' ? 'نزولی' : 'ثابت'}
          icon={predictions.trend === 'up' ? TrendingUp : predictions.trend === 'down' ? TrendingDown : Minus}
          color={predictions.trend === 'up' ? 'success' : predictions.trend === 'down' ? 'error' : 'warning'}
        />
        <StatCard
          label="تغییر روند"
          value={`${Number(predictions.trend_percentage || 0)}%`}
          icon={Percent}
          color="accent"
        />
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-accent-600" />
          پیش‌بینی ۷ روز آینده
        </h3>
        <div className="space-y-2">
          {(predictions.predictions || []).map((pred, index) => (
            <div key={pred.date} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-l from-accent-50 to-white border border-accent-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 text-white flex items-center justify-center text-xs font-black">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{pred.date}</p>
                <p className="text-lg font-black text-gray-900 dark:text-gray-100">{formatPrice(pred.predicted_revenue || 0)}</p>
              </div>
              <Badge variant="accent">{Number(pred.confidence || 0)}% اطمینان</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- Anomalies Tab (✅ اصلاح شده) -----
function AnomaliesTab({ period }: { period: number }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-advanced-anomalies', period],
    queryFn: () => adminAdvancedReportService.getAnomalies(period),
  });

  if (isLoading) return <LoadingState />;

  // ✅ بررسی خطا
  if (isError || !data?.success || !data?.data) {
    return (
      <div className="card-enhanced p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-warning-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">خطا در دریافت داده‌ها</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {error instanceof Error ? error.message : 'لطفاً دوباره تلاش کنید'}
        </p>
      </div>
    );
  }

  // ✅ استخراج امن داده‌ها با null check کامل
  const anomaliesData = (data.data as AnomaliesData) || {};
  
  // ✅ اطمینان از وجود statistics
  const stats = anomaliesData.statistics || { mean: 0, std_dev: 0, threshold: 0 };
  
  // ✅ استخراج امن مقادیر با typeof check
  const mean = (stats && typeof stats.mean === 'number') ? Number(stats.mean) : 0;
  const stdDev = (stats && typeof stats.std_dev === 'number') ? Number(stats.std_dev) : 0;
  const threshold = (stats && typeof stats.threshold === 'number') ? Number(stats.threshold) : 0;
  
  // ✅ استخراج امن anomalyList
  const anomalyList = Array.isArray(anomaliesData.anomalies) ? anomaliesData.anomalies : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="میانگین روزانه" value={formatPrice(mean)} icon={DollarSign} color="primary" />
        <StatCard label="انحراف معیار" value={formatPrice(stdDev)} icon={Activity} color="accent" />
        <StatCard label="آستانه هشدار" value={formatPrice(threshold)} icon={AlertTriangle} color="warning" />
      </div>

      <div className="card-enhanced p-5">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-error-600" />
          ناهنجاری‌های شناسایی شده ({anomalyList.length})
        </h3>

        {anomalyList.length > 0 ? (
          <div className="space-y-2">
            {anomalyList.map((anomaly, index) => {
              // ✅ استخراج امن فیلدهای هر ناهنجاری
              const revenue = typeof anomaly?.revenue === 'number' ? anomaly.revenue : 0;
              const ordersCount = typeof anomaly?.orders_count === 'number' ? anomaly.orders_count : 0;
              const deviationPercentage = typeof anomaly?.deviation_percentage === 'number' ? anomaly.deviation_percentage : 0;
              const type = anomaly?.type === 'spike' ? 'spike' : 'drop';
              const date = anomaly?.date || '';

              return (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-xl border-2',
                    type === 'spike'
                      ? 'bg-gradient-to-l from-success-50 to-white border-success-200'
                      : 'bg-gradient-to-l from-error-50 to-white border-error-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {type === 'spike' ? (
                        <TrendingUp className="w-5 h-5 text-success-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-error-600" />
                      )}
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{date}</p>
                    </div>
                    <Badge variant={type === 'spike' ? 'success' : 'error'}>
                      {type === 'spike' ? 'افزایش' : 'کاهش'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">درآمد</p>
                      <p className="font-black text-gray-900 dark:text-gray-100">{formatPrice(revenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">سفارشات</p>
                      <p className="font-black text-gray-900 dark:text-gray-100">{ordersCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">انحراف</p>
                      <p className={cn('font-black', type === 'spike' ? 'text-success-600' : 'text-error-600')}>
                        {deviationPercentage > 0 ? '+' : ''}
                        {deviationPercentage}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state-enhanced">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-success-500 mb-2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">ناهنجاری شناسایی نشد</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">همه چیز عادی است!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Shared Subcomponents
// ============================================================================

type ColorVariant = 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray';

const colorMap: Record<ColorVariant, string> = {
  primary: 'text-primary-600 bg-primary-50',
  success: 'text-success-600 bg-success-50',
  error: 'text-error-600 bg-error-50',
  warning: 'text-warning-600 bg-warning-50',
  accent: 'text-accent-600 bg-accent-50',
  gray: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40',
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: ColorVariant;
}) {
  return (
    <div className="stat-card-enhanced">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function KpiCard({
  label,
  current,
  previous,
  change,
  icon: Icon,
  color,
  isMoney = false,
}: {
  label: string;
  current: number;
  previous: number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: ColorVariant;
  isMoney?: boolean;
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const ChangeIcon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;

  return (
    <div className="stat-card-enhanced">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold',
            isNeutral && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
            isPositive && 'bg-success-50 text-success-700',
            !isNeutral && !isPositive && 'bg-error-50 text-error-700'
          )}
        >
          <ChangeIcon className="w-3 h-3" />
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-xl font-black text-gray-900 dark:text-gray-100">
        {isMoney ? formatPrice(current) : Number(current).toLocaleString('fa-IR')}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
        دوره قبل: {isMoney ? formatPrice(previous) : Number(previous).toLocaleString('fa-IR')}
      </p>
    </div>
  );
}

function Badge({
  children,
  variant,
}: {
  children: ReactNode;
  variant: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray';
}) {
  const badgeColors = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-success-50 text-success-700 border-success-200',
    error: 'bg-error-50 text-error-700 border-error-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    accent: 'bg-accent-50 text-accent-700 border-accent-200',
    gray: 'bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold', badgeColors[variant])}>
      {children}
    </span>
  );
}

function ChangeBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold',
        isNeutral && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
        isPositive && 'bg-success-50 text-success-700',
        !isNeutral && !isPositive && 'bg-error-50 text-error-700'
      )}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(value)}%
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black',
        rank === 1 && 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white',
        rank === 2 && 'bg-gradient-to-br from-gray-300 dark:from-gray-600 to-gray-400 dark:to-gray-600 text-white',
        rank === 3 && 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
        rank > 3 && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      )}
    >
      {rank}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

// ============================================================================
// Chart Components
// ============================================================================

const AreaChart = memo(function AreaChart({ data, height = 320 }: { data: SalesChartItem[]; height?: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 800;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { maxRevenue, maxOrders } = useMemo(() => {
    if (data.length === 0) return { maxRevenue: 100, maxOrders: 10 };
    return {
      maxRevenue: Math.max(...data.map((d) => d.revenue)) || 100,
      maxOrders: Math.max(...data.map((d) => d.orders_count)) || 10,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-gray-500 dark:text-gray-400">داده‌ای وجود ندارد</p>
      </div>
    );
  }

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
  const getYRevenue = (value: number) => padding.top + chartHeight - (value / maxRevenue) * chartHeight;
  const getYOrders = (value: number) => padding.top + chartHeight - (value / maxOrders) * chartHeight;

  const revenuePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYRevenue(d.revenue)}`).join(' ');
  const revenueAreaPath =
    revenuePath + ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;
  const ordersPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYOrders(d.orders_count)}`).join(' ');
  const ordersAreaPath =
    ordersPath + ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(maxRevenue * p));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 600 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick, i) => {
          const y = getYRevenue(tick);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                {tick >= 1000000
                  ? `${(tick / 1000000).toFixed(1)}M`
                  : tick >= 1000
                  ? `${(tick / 1000).toFixed(0)}K`
                  : tick}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 10) !== 0 && i !== data.length - 1) return null;
          const x = getX(i);
          const date = new Date(d.date);
          return (
            <text key={i} x={x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">
              {`${date.getDate()}/${date.getMonth() + 1}`}
            </text>
          );
        })}

        <path d={revenueAreaPath} fill="url(#revenueGradient)" />
        <path d={ordersAreaPath} fill="url(#ordersGradient)" />
        <path d={revenuePath} fill="none" stroke="#14b8a6" strokeWidth="2" />
        <path d={ordersPath} fill="none" stroke="#f97316" strokeWidth="2" />

        {data.map((_, i) => {
          const x = getX(i);
          const zoneWidth = chartWidth / data.length;
          return (
            <rect
              key={i}
              x={x - zoneWidth / 2}
              y={padding.top}
              width={zoneWidth}
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'crosshair' }}
            />
          );
        })}

        {hoveredIndex !== null && (
          <>
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={padding.top + chartHeight}
              stroke="#14b8a6"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={getX(hoveredIndex)} cy={getYRevenue(data[hoveredIndex].revenue)} r="5" fill="#14b8a6" stroke="white" strokeWidth="2" />
            <circle
              cx={getX(hoveredIndex)}
              cy={getYOrders(data[hoveredIndex].orders_count)}
              r="5"
              fill="#f97316"
              stroke="white"
              strokeWidth="2"
            />
          </>
        )}

        {hoveredIndex !== null && (() => {
          const d = data[hoveredIndex];
          const x = getX(hoveredIndex);
          const tooltipWidth = 180;
          const tooltipHeight = 80;
          let tooltipX = x + 10;
          if (tooltipX + tooltipWidth > width - padding.right) tooltipX = x - tooltipWidth - 10;
          const tooltipY = padding.top;
          const date = new Date(d.date);
          return (
            <g>
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                fill="white"
                stroke="#e2e8f0"
                strokeWidth="1"
                rx="8"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
              <text x={tooltipX + 10} y={tooltipY + 20} fontSize="11" fontWeight="bold" fill="#1e293b">
                {`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`}
              </text>
              <circle cx={tooltipX + 15} cy={tooltipY + 38} r="4" fill="#14b8a6" />
              <text x={tooltipX + 25} y={tooltipY + 42} fontSize="11" fill="#64748b">
                درآمد: {formatPrice(d.revenue)}
              </text>
              <circle cx={tooltipX + 15} cy={tooltipY + 58} r="4" fill="#f97316" />
              <text x={tooltipX + 25} y={tooltipY + 62} fontSize="11" fill="#64748b">
                سفارشات: {d.orders_count.toLocaleString('fa-IR')}
              </text>
            </g>
          );
        })()}

        <g transform={`translate(${padding.left}, ${height - 25})`}>
          <circle cx="0" cy="0" r="4" fill="#14b8a6" />
          <text x="10" y="4" fontSize="11" fill="#64748b">
            درآمد
          </text>
          <circle cx="80" cy="0" r="4" fill="#f97316" />
          <text x="90" y="4" fontSize="11" fill="#64748b">
            سفارشات
          </text>
        </g>
      </svg>
    </div>
  );
});

const PieChart = memo(function PieChart({ data, size = 240 }: { data: TopCategory[]; size?: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const center = size / 2;
  const radius = size / 2 - 10;
  const total = data.reduce((sum, d) => sum + d.total_revenue, 0);

  if (total === 0) return <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">داده‌ای وجود ندارد</p>;

  let currentAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const percentage = d.total_revenue / total;
    const angle = percentage * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const path = [`M ${center} ${center}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ');

    const midAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.65;
    const labelX = center + labelRadius * Math.cos(midAngle);
    const labelY = center + labelRadius * Math.sin(midAngle);

    return {
      path,
      color: CHART_COLORS[i % CHART_COLORS.length],
      label: d.name,
      percentage: (percentage * 100).toFixed(1),
      labelX,
      labelY,
      index: i,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice) => (
        <g key={slice.index}>
          <path
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
            onMouseEnter={() => setHoveredIndex(slice.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              cursor: 'pointer',
              transform: hoveredIndex === slice.index ? 'scale(1.05)' : 'scale(1)',
              transformOrigin: `${center}px ${center}px`,
              transition: 'transform 0.2s',
            }}
          />
          {parseFloat(slice.percentage) > 8 && (
            <text x={slice.labelX} y={slice.labelY} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill="white" style={{ pointerEvents: 'none' }}>
              {slice.percentage}%
            </text>
          )}
        </g>
      ))}
      <circle cx={center} cy={center} r={radius * 0.4} fill="white" />
      <text x={center} y={center - 5} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b">
        {data.length}
      </text>
      <text x={center} y={center + 12} textAnchor="middle" fontSize="10" fill="#64748b">
        دسته‌بندی
      </text>
    </svg>
  );
});
export default AdminReportsPage;
