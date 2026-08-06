import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Meh, AlertTriangle,
  Loader2, ArrowUp, ArrowDown, Minus,
  BarChart3, PieChart, Users, ShieldCheck, type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface DashboardData {
  total_analyzed: number;
  positive: number;
  neutral: number;
  negative: number;
  positive_percent: number;
  neutral_percent: number;
  negative_percent: number;
  trend: Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
}

interface TopSeller {
  id: number;
  name: string;
  shop_name: string | null;
  avatar: string | null;
  conversations_count: number;
  score: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface Alert {
  id: number;
  buyer_name: string;
  seller_name: string;
  product_name: string;
  avg_score: number;
  created_at: string;
}

// ==================== Main Component ====================

export function AdminSentimentDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, sellersRes, alertsRes] = await Promise.all([
        apiClient.get('/admin/chat-management/sentiment/dashboard'),
        apiClient.get('/admin/chat-management/sentiment/top-sellers'),
        apiClient.get('/admin/chat-management/sentiment/alerts'),
      ]);

      if (dashRes.data.success) setDashboardData(dashRes.data.data);
      if (sellersRes.data.success) setTopSellers(sellersRes.data.data);
      if (alertsRes.data.success) setAlerts(alertsRes.data.data);
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری داشبورد احساسات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">تحلیل احساسات</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">بررسی رضایت مشتریان و عملکرد فروشندگان</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadAllData()} className="gap-1.5">
          <ArrowUp className="w-4 h-4" />
          بروزرسانی
        </Button>
      </div>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="تحلیل شده"
            value={dashboardData.total_analyzed.toLocaleString('fa-IR')}
            icon={PieChart}
            color="gray"
          />
          <SummaryCard
            label="مثبت"
            value={`${dashboardData.positive_percent}%`}
            icon={TrendingUp}
            color="success"
            badge={`${dashboardData.positive.toLocaleString('fa-IR')} پیام`}
          />
          <SummaryCard
            label="خنثی"
            value={`${dashboardData.neutral_percent}%`}
            icon={Meh}
            color="warning"
            badge={`${dashboardData.neutral.toLocaleString('fa-IR')} پیام`}
          />
          <SummaryCard
            label="منفی"
            value={`${dashboardData.negative_percent}%`}
            icon={TrendingDown}
            color="error"
            badge={`${dashboardData.negative.toLocaleString('fa-IR')} پیام`}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h3 className="font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            روند ۳۰ روز اخیر
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {dashboardData?.trend.map((day, i) => {
              const total = day.positive + day.neutral + day.negative;
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-xs text-gray-500 dark:text-gray-400 font-bold">{day.date}</span>
                  <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {total > 0 ? (
                      <>
                        <div style={{ width: `${(day.positive / total) * 100}%` }} className="bg-green-500 transition-all" />
                        <div style={{ width: `${(day.neutral / total) * 100}%` }} className="bg-gray-400 transition-all" />
                        <div style={{ width: `${(day.negative / total) * 100}%` }} className="bg-red-500 transition-all" />
                      </>
                    ) : (
                      <div className="w-full bg-gray-100 dark:bg-gray-700" />
                    )}
                  </div>
                  <span className="w-12 text-xs text-gray-600 dark:text-gray-300 text-right">{total.toLocaleString('fa-IR')}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs text-gray-600 dark:text-gray-400">مثبت</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400" /><span className="text-xs text-gray-600 dark:text-gray-400">خنثی</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs text-gray-600 dark:text-gray-400">منفی</span></div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/40 shadow-sm p-5 border-l-4 border-l-red-500">
          <h3 className="font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            هشدارهای بحرانی
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{alert.buyer_name} ↔ {alert.seller_name}</span>
                    <Badge variant="error" size="sm">{alert.avg_score.toFixed(2)}</Badge>
                  </div>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">محصول: {alert.product_name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{alert.created_at}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p>هیچ هشدار بحرانی وجود ندارد</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">همه مکالمات در وضعیت عادی هستند</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Sellers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            رتبه‌بندی فروشندگان بر اساس رضایت مشتری
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700">
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300">رتبه</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300">فروشنده</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300">مکالمات</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300">امتیاز احساسات</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {topSellers.map((seller, index) => {
                const sentimentIcon = seller.sentiment === 'positive' ? <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" /> :
                                     seller.sentiment === 'negative' ? <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" /> :
                                     <Minus className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
                const sentimentColor = seller.sentiment === 'positive' ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' :
                                      seller.sentiment === 'negative' ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30' :
                                      'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700';
                const rankColor = index < 3
                  ? index === 0 ? 'from-yellow-400 to-amber-500'
                  : index === 1 ? 'from-gray-400 to-gray-500'
                  : 'from-amber-600 to-amber-700'
                  : 'from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700';

                return (
                  <tr key={seller.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white bg-gradient-to-br',
                        rankColor
                      )}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold">
                          {seller.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{seller.name}</p>
                          {seller.shop_name && <p className="text-[10px] text-gray-500 dark:text-gray-400">{seller.shop_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">{seller.conversations_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {sentimentIcon}
                        <span className={cn('px-2 py-0.5 rounded-md text-xs font-bold', sentimentColor)}>
                          {seller.score.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={seller.sentiment === 'positive' ? 'success' : seller.sentiment === 'negative' ? 'error' : 'gray'}
                        size="sm"
                      >
                        {seller.sentiment === 'positive' ? '😊 راضی' : seller.sentiment === 'negative' ? '😞 ناراضی' : '😐 خنثی'}
                      </Badge>
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

// ==================== Sub Components ====================

function SummaryCard({ label, value, icon: Icon, color, badge }: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: 'success' | 'warning' | 'error' | 'gray';
  badge?: string;
}) {
  const colors = {
    success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
    error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    gray: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
      {badge && <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{badge}</span>}
    </div>
  );
}
export default AdminSentimentDashboard;
