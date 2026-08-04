import { useState, useEffect } from 'react';
import {
  Sparkles, TrendingUp, Loader2, Settings, Filter,
  ChevronLeft, ChevronRight, ShoppingBag, Users,
  DollarSign, MousePointer, Award, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

// ==================== Types ====================

interface SuggestionStats {
  total: number;
  clicked: number;
  purchased: number;
  auto: number;
  manual: number;
  click_rate: number;
  conversion_rate: number;
  revenue: number;
  today: number;
  trend: Array<{
    date: string;
    total: number;
    clicked: number;
    purchased: number;
  }>;
}

interface Suggestion {
  id: number;
  conversation_id: number;
  product_id: number;
  suggested_by: number | null;
  source: 'auto' | 'manual';
  relevance_score: number;
  is_clicked: boolean;
  is_purchased: boolean;
  created_at: string;
  product?: {
    id: number;
    name: string;
    main_image: string | null;
    price: number;
    discount_price: number | null;
  };
  suggestedBy?: {
    id: number;
    name: string;
    shop_name: string | null;
  };
}

interface TopProduct {
  product_id: number;
  product: {
    id: number;
    name: string;
    main_image: string | null;
    price: number;
    discount_price: number | null;
  };
  total_suggestions: number;
  total_clicked: number;
  total_purchased: number;
  click_rate: number;
  conversion_rate: number;
  revenue: number;
}

interface TopSeller {
  seller: {
    id: number;
    name: string;
    shop_name: string | null;
    avatar: string | null;
  };
  total_suggestions: number;
  total_clicked: number;
  total_purchased: number;
  success_rate: number;
}

// ==================== Main Component ====================

export function AdminSuggestionManagementPage() {
  const [stats, setStats] = useState<SuggestionStats | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'top' | 'settings'>('overview');

  // فیلترها
  const [sourceFilter, setSourceFilter] = useState('all');
  const [clickedFilter, setClickedFilter] = useState('all');
  const [purchasedFilter, setPurchasedFilter] = useState('all');

  // Settings
  const [settings, setSettings] = useState({
    max_suggestions_per_conversation: 5,
    min_relevance_score: 0.5,
    prioritize_same_category: true,
    prioritize_top_selling: true,
    prioritize_new_products: false,
    auto_suggest_enabled: true,
    manual_suggest_enabled: true,
  });

  // ==================== Loaders ====================
  const loadStats = async () => {
    try {
      const res = await apiClient.get('/admin/chat-management/suggestions/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/chat-management/suggestions', {
        params: {
          source: sourceFilter !== 'all' ? sourceFilter : undefined,
          clicked: clickedFilter !== 'all' ? clickedFilter : undefined,
          purchased: purchasedFilter !== 'all' ? purchasedFilter : undefined,
          page: currentPage,
        },
      });
      if (res.data.success) {
        setSuggestions(res.data.data.suggestions);
        setTotalPages(res.data.data.pagination.last_page);
      }
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری پیشنهادات');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopPerformers = async () => {
    try {
      const res = await apiClient.get('/admin/chat-management/suggestions/top-performers');
      if (res.data.success) setTopProducts(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadTopSellers = async () => {
    try {
      const res = await apiClient.get('/admin/chat-management/suggestions/top-sellers');
      if (res.data.success) setTopSellers(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await apiClient.get('/admin/chat-management/suggestions/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadStats();
    if (activeTab === 'overview') {
      loadTopPerformers();
      loadTopSellers();
    } else if (activeTab === 'list') {
      loadSuggestions();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab, currentPage, sourceFilter, clickedFilter, purchasedFilter]);

  // ==================== Handlers ====================
  const handleSaveSettings = async () => {
    try {
      const res = await apiClient.put('/admin/chat-management/suggestions/settings', settings);
      if (res.data.success) {
        toast.success('تنظیمات ذخیره شد');
      }
    } catch (error) {
      toast.error('خطا در ذخیره تنظیمات');
    }
  };

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">مدیریت پیشنهادات محصول</h1>
            <p className="text-sm text-gray-500 mt-1">تحلیل و بهینه‌سازی سیستم پیشنهاد هوشمند</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'نمای کلی', icon: TrendingUp },
          { id: 'list', label: 'لیست پیشنهادات', icon: ShoppingBag },
          { id: 'top', label: 'برترین‌ها', icon: Award },
          { id: 'settings', label: 'تنظیمات', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString('fa-IR')}</p>
              <p className="text-xs text-gray-500 mt-1">کل پیشنهادات</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600">{stats.click_rate}%</p>
              <p className="text-xs text-gray-500 mt-1">نرخ کلیک</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-green-600">{stats.conversion_rate}%</p>
              <p className="text-xs text-gray-500 mt-1">نرخ تبدیل</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600">{formatPrice(stats.revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">درآمد از پیشنهادات</p>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              روند ۷ روز اخیر
            </h3>
            <div className="space-y-3">
              {stats.trend.map((day, i) => {
                const max = Math.max(...stats.trend.map(d => d.total), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-gray-500 font-bold">{day.date}</span>
                    <div className="flex-1 flex h-6 rounded-lg overflow-hidden bg-gray-100">
                      {day.total > 0 && (
                        <>
                          <div 
                            style={{ width: `${(day.purchased / max) * 100}%` }} 
                            className="bg-green-500 transition-all"
                            title="خریداری شده"
                          />
                          <div 
                            style={{ width: `${((day.clicked - day.purchased) / max) * 100}%` }} 
                            className="bg-blue-500 transition-all"
                            title="کلیک شده"
                          />
                          <div 
                            style={{ width: `${((day.total - day.clicked) / max) * 100}%` }} 
                            className="bg-gray-300 transition-all"
                            title="بدون کلیک"
                          />
                        </>
                      )}
                    </div>
                    <span className="w-16 text-xs text-gray-600 text-right">{day.total.toLocaleString('fa-IR')}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs text-gray-600">خرید</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs text-gray-600">کلیک</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300" /><span className="text-xs text-gray-600">بدون کلیک</span></div>
            </div>
          </div>

          {/* Top Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                برترین محصولات پیشنهادی
              </h3>
              <div className="space-y-2">
                {topProducts.slice(0, 5).map((item, i) => (
                  <div key={item.product_id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.product?.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.total_purchased} خرید از {item.total_suggestions} پیشنهاد
                      </p>
                    </div>
                    <Badge variant="success" size="sm">{item.conversion_rate}%</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Sellers */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                برترین فروشندگان پیشنهاددهنده
              </h3>
              <div className="space-y-2">
                {topSellers.slice(0, 5).map((item, i) => (
                  <div key={item.seller?.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.seller?.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.total_purchased} خرید موفق
                      </p>
                    </div>
                    <Badge variant="primary" size="sm">{item.success_rate}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="all">همه منابع</option>
                <option value="auto">خودکار</option>
                <option value="manual">دستی</option>
              </select>
              <select
                value={clickedFilter}
                onChange={(e) => {
                  setClickedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="all">وضعیت کلیک: همه</option>
                <option value="yes">کلیک شده</option>
                <option value="no">بدون کلیک</option>
              </select>
              <select
                value={purchasedFilter}
                onChange={(e) => {
                  setPurchasedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="all">وضعیت خرید: همه</option>
                <option value="yes">خریداری شده</option>
                <option value="no">خریداری نشده</option>
              </select>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-bold">پیشنهادی یافت نشد</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {suggestions.map((sug) => (
                  <div key={sug.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      {sug.product?.main_image && (
                        <img
                          src={sug.product.main_image}
                          alt={sug.product.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={sug.source === 'auto' ? 'primary' : 'warning'} size="sm">
                            {sug.source === 'auto' ? 'خودکار' : 'دستی'}
                          </Badge>
                          {sug.is_clicked && (
                            <Badge variant="success" size="sm">
                              <MousePointer className="w-3 h-3" />
                              کلیک شده
                            </Badge>
                          )}
                          {sug.is_purchased && (
                            <Badge variant="success" size="sm">
                              <ShoppingBag className="w-3 h-3" />
                              خریداری شده
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(sug.created_at).toLocaleDateString('fa-IR')}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-gray-900 mb-1">{sug.product?.name}</p>
                        <p className="text-xs text-gray-600">
                          پیشنهاد دهنده: {sug.suggestedBy?.name || 'سیستم'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          امتیاز ارتباط: {(sug.relevance_score * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <p className="text-sm font-black text-primary-600">
                          {formatPrice(sug.product?.discount_price || sug.product?.price || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  قبلی
                </Button>
                <span className="text-sm text-gray-600">
                  صفحه {currentPage} از {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= totalPages}
                  className="gap-1"
                >
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Top Tab */}
      {activeTab === 'top' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              برترین محصولات (بر اساس نرخ تبدیل)
            </h3>
            <div className="space-y-3">
              {topProducts.map((item, i) => (
                <div key={item.product_id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0',
                      i === 0 && 'bg-gradient-to-br from-yellow-400 to-amber-500',
                      i === 1 && 'bg-gradient-to-br from-gray-300 to-gray-400',
                      i === 2 && 'bg-gradient-to-br from-amber-600 to-amber-700',
                      i > 2 && 'bg-gray-300'
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 mb-1">{item.product?.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">پیشنهاد</p>
                          <p className="font-bold">{item.total_suggestions}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">کلیک</p>
                          <p className="font-bold text-blue-600">{item.total_clicked}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">خرید</p>
                          <p className="font-bold text-green-600">{item.total_purchased}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="success" size="sm">نرخ تبدیل: {item.conversion_rate}%</Badge>
                        <Badge variant="primary" size="sm">درآمد: {formatPrice(item.revenue)}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sellers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              برترین فروشندگان (بر اساس موفقیت)
            </h3>
            <div className="space-y-3">
              {topSellers.map((item, i) => (
                <div key={item.seller?.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0',
                      i === 0 && 'bg-gradient-to-br from-yellow-400 to-amber-500',
                      i === 1 && 'bg-gradient-to-br from-gray-300 to-gray-400',
                      i === 2 && 'bg-gradient-to-br from-amber-600 to-amber-700',
                      i > 2 && 'bg-gray-300'
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 mb-1">{item.seller?.name}</p>
                      {item.seller?.shop_name && (
                        <p className="text-xs text-gray-500">{item.seller.shop_name}</p>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        <div>
                          <p className="text-gray-500">پیشنهاد</p>
                          <p className="font-bold">{item.total_suggestions}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">کلیک</p>
                          <p className="font-bold text-blue-600">{item.total_clicked}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">خرید</p>
                          <p className="font-bold text-green-600">{item.total_purchased}</p>
                        </div>
                      </div>
                      <Badge variant="primary" size="sm" className="mt-2">
                        نرخ موفقیت: {item.success_rate}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            تنظیمات الگوریتم پیشنهاد
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  حداکثر پیشنهادات در هر مکالمه
                </label>
                <input
                  type="number"
                  value={settings.max_suggestions_per_conversation}
                  onChange={(e) => setSettings({ ...settings, max_suggestions_per_conversation: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  حداقل امتیاز ارتباط (0-1)
                </label>
                <input
                  type="number"
                  value={settings.min_relevance_score}
                  onChange={(e) => setSettings({ ...settings, min_relevance_score: parseFloat(e.target.value) || 0.5 })}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700">اولویت‌بندی:</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.prioritize_same_category}
                  onChange={(e) => setSettings({ ...settings, prioritize_same_category: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">اولویت با محصولات هم‌دسته‌بندی</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.prioritize_top_selling}
                  onChange={(e) => setSettings({ ...settings, prioritize_top_selling: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">اولویت با محصولات پرفروش</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.prioritize_new_products}
                  onChange={(e) => setSettings({ ...settings, prioritize_new_products: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">اولویت با محصولات جدید</span>
              </label>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700">فعال‌سازی:</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_suggest_enabled}
                  onChange={(e) => setSettings({ ...settings, auto_suggest_enabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">پیشنهاد خودکار فعال باشد</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.manual_suggest_enabled}
                  onChange={(e) => setSettings({ ...settings, manual_suggest_enabled: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">پیشنهاد دستی توسط فروشنده فعال باشد</span>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Button onClick={handleSaveSettings} className="gap-1.5">
                <Settings className="w-4 h-4" />
                ذخیره تنظیمات
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminSuggestionManagementPage;
