import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, Edit2, Trash2, Eye, EyeOff,
  Star, ShoppingCart, DollarSign,
  AlertCircle, CheckCircle, X, ChevronLeft, ChevronRight,
  Zap, Award, Flame, BarChart3,
  ArrowUpDown, RefreshCw, Store,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { 
  adminProductService, 
  type AdminProduct, 
  type ProductFilters 
} from '@/services/api/adminProduct.service';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

// ==================== Types ====================

type SortField = 'created_at' | 'price' | 'sales_count' | 'rating' | 'stock' | 'views_count';
type StatusFilter = 'all' | 'active' | 'inactive' | 'featured' | 'special' | 'low_stock' | 'out_of_stock';

// ==================== Helper Functions ====================

const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: 'ناموجود', color: 'error' as const, icon: X };
  if (stock < 10) return { label: 'کم‌موجود', color: 'warning' as const, icon: AlertCircle };
  return { label: 'موجود', color: 'success' as const, icon: CheckCircle };
};

const getPerformanceColor = (score: number) => {
  if (score >= 80) return 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800';
  if (score >= 60) return 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
  if (score >= 40) return 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800';
  return 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800';
};

const getPerformanceLabel = (score: number) => {
  if (score >= 80) return 'عالی';
  if (score >= 60) return 'خوب';
  if (score >= 40) return 'متوسط';
  return 'ضعیف';
};

// ==================== Main Component ====================

export function AdminProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State ها
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [quickEditProduct, setQuickEditProduct] = useState<AdminProduct | null>(null);
  const [showStatsModal, setShowStatsModal] = useState<AdminProduct | null>(null);

  // ==================== Queries ====================

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: () => adminProductService.getProducts(filters),
    keepPreviousData: true,
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination;
  const stats = data?.data?.stats;

  // ==================== Mutations ====================

  const quickUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminProductService.quickUpdate(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(response.message, { icon: '✅' });
      setQuickEditProduct(null);
    },
    onError: () => toast.error('خطا در به‌روزرسانی'),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: any }) =>
      adminProductService.bulkAction(ids, action),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(response.message, { icon: '✅' });
      setSelectedIds([]);
    },
    onError: () => toast.error('خطا در عملیات'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminProductService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('محصول حذف شد', { icon: '🗑️' });
    },
    onError: () => toast.error('خطا در حذف'),
  });

  // ==================== Handlers ====================

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 500);
    return () => clearTimeout(timeout);
  };

  const handleSort = (field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status,
      page: 1,
    }));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = (id: number) => {
    if (window.confirm('آیا از حذف این محصول مطمئن هستید؟')) {
      deleteMutation.mutate(id);
    }
  };

  // ==================== Render ====================

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Package className="w-5 h-5 text-white" />
            </div>
            مدیریت محصولات
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت و نظارت بر تمامی محصولات فروشگاه
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          label="کل محصولات"
          value={stats?.total || 0}
          icon={Package}
          color="primary"
        />
        <StatCard
          label="فعال"
          value={stats?.active || 0}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          label="غیرفعال"
          value={stats?.inactive || 0}
          icon={EyeOff}
          color="gray"
        />
        <StatCard
          label="ویژه"
          value={stats?.featured || 0}
          icon={Award}
          color="accent"
        />
        <StatCard
          label="تخفیف‌دار"
          value={stats?.special_offers || 0}
          icon={Flame}
          color="error"
        />
        <StatCard
          label="کم‌موجود"
          value={stats?.low_stock || 0}
          icon={AlertCircle}
          color="warning"
        />
        <StatCard
          label="ناموجود"
          value={stats?.out_of_stock || 0}
          icon={X}
          color="error"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 space-y-3">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام، SKU یا توضیحات..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { value: 'all', label: 'همه', icon: Package },
              { value: 'active', label: 'فعال', icon: CheckCircle },
              { value: 'inactive', label: 'غیرفعال', icon: EyeOff },
              { value: 'featured', label: 'ویژه', icon: Award },
              { value: 'special', label: 'تخفیف', icon: Flame },
              { value: 'low_stock', label: 'کم‌موجود', icon: AlertCircle },
              { value: 'out_of_stock', label: 'ناموجود', icon: X },
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
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                {selectedIds.length} محصول انتخاب شده
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'activate' })}
                disabled={bulkMutation.isPending}
              >
                <CheckCircle className="w-3.5 h-3.5 ml-1" />
                فعال‌سازی
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'deactivate' })}
                disabled={bulkMutation.isPending}
              >
                <EyeOff className="w-3.5 h-3.5 ml-1" />
                غیرفعال
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'feature' })}
                disabled={bulkMutation.isPending}
              >
                <Award className="w-3.5 h-3.5 ml-1" />
                ویژه
              </Button>
              <Button
                size="sm"
                variant="error"
                onClick={() => {
                  if (window.confirm(`آیا از حذف ${selectedIds.length} محصول مطمئن هستید؟`)) {
                    bulkMutation.mutate({ ids: selectedIds, action: 'delete' });
                  }
                }}
                disabled={bulkMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5 ml-1" />
                حذف
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title="محصولی یافت نشد"
            description="با فیلترهای فعلی هیچ محصولی وجود ندارد"
            action={
              <Button onClick={() => setFilters({ page: 1, per_page: 20 })} variant="outline">
                پاک کردن فیلترها
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-3 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400">محصول</th>
                  <SortableHeader 
                    label="قیمت" 
                    field="price" 
                    currentSort={filters.sort_by} 
                    order={filters.sort_order}
                    onSort={handleSort}
                  />
                  <SortableHeader 
                    label="موجودی" 
                    field="stock" 
                    currentSort={filters.sort_by} 
                    order={filters.sort_order}
                    onSort={handleSort}
                  />
                  <SortableHeader 
                    label="فروش" 
                    field="sales_count" 
                    currentSort={filters.sort_by} 
                    order={filters.sort_order}
                    onSort={handleSort}
                  />
                  <SortableHeader 
                    label="امتیاز" 
                    field="rating" 
                    currentSort={filters.sort_by} 
                    order={filters.sort_order}
                    onSort={handleSort}
                  />
                  <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400">عملکرد</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400">فروشنده</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-400">وضعیت</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-400">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const StockIcon = stockStatus.icon;
                  const isSelected = selectedIds.includes(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        'border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors',
                        isSelected && 'bg-primary-50/50 dark:bg-primary-900/20'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                      </td>

                      {/* Product Info */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                            <SafeImage
                              src={product.main_image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              fallbackEmoji="📦"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.sku && (
                                <code className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                  {product.sku}
                                </code>
                              )}
                              {product.is_featured && (
                                <Badge variant="accent" size="sm" className="text-[9px]">
                                  <Award className="w-2.5 h-2.5 ml-0.5" />
                                  ویژه
                                </Badge>
                              )}
                              {product.is_special_offer && (
                                <Badge variant="error" size="sm" className="text-[9px]">
                                  <Flame className="w-2.5 h-2.5 ml-0.5" />
                                  تخفیف
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatPrice(product.price)}
                          </p>
                          {product.compare_price && product.compare_price > product.price && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 line-through">
                              {formatPrice(product.compare_price)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <StockIcon className={cn(
                            'w-3.5 h-3.5',
                            stockStatus.color === 'success' && 'text-success-500',
                            stockStatus.color === 'warning' && 'text-warning-500',
                            stockStatus.color === 'error' && 'text-error-500'
                          )} />
                          <span className={cn(
                            'text-sm font-bold',
                            stockStatus.color === 'success' && 'text-success-600',
                            stockStatus.color === 'warning' && 'text-warning-600',
                            stockStatus.color === 'error' && 'text-error-600'
                          )}>
                            {product.stock}
                          </span>
                        </div>
                      </td>

                      {/* Sales */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600">
                            {product.sales_count || 0}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Star className={cn(
                            'w-3.5 h-3.5',
                            product.rating > 0 ? 'text-warning-400 fill-warning-400' : 'text-gray-300 dark:text-gray-600'
                          )} />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600">
                            {product.rating?.toFixed(1) || '0'}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            ({product.reviews_count})
                          </span>
                        </div>
                      </td>

                      {/* Performance Score */}
                      <td className="px-3 py-3">
                        <div className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold',
                          getPerformanceColor(product.performance_score)
                        )}>
                          <Zap className="w-3 h-3" />
                          {product.performance_score}
                          <span className="text-[9px] opacity-70">
                            {getPerformanceLabel(product.performance_score)}
                          </span>
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-600 line-clamp-1">
                            {product.seller?.shop_name || 'ازکالا'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => quickUpdateMutation.mutate({
                            id: product.id,
                            data: { is_active: !product.is_active }
                          })}
                          className="flex items-center gap-1"
                        >
                          {product.is_active ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle className="w-3 h-3 ml-0.5" />
                              فعال
                            </Badge>
                          ) : (
                            <Badge variant="gray" size="sm">
                              <EyeOff className="w-3 h-3 ml-0.5" />
                              غیرفعال
                            </Badge>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/products/${product.slug}`)}
                            className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors"
                            title="مشاهده"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* ✅ قبلاً showStatsModal state و آیکون BarChart3 تعریف
                              شده بودند و adminProductService.getProductStats()
                              کامل پیاده‌سازی شده بود (فروش/درآمد ۳۰ روز اخیر +
                              امتیاز عملکرد)، اما هیچ دکمه‌ای برای باز کردنش
                              وجود نداشت — کل قابلیت غیرقابل‌دسترس بود. */}
                          <button
                            onClick={() => setShowStatsModal(product)}
                            className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="آمار محصول"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setQuickEditProduct(product)}
                            className="p-1.5 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-accent-600 transition-colors"
                            title="ویرایش سریع"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-error-600 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              نمایش {(pagination.current_page - 1) * pagination.per_page + 1} تا{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} از{' '}
              <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span> محصول
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
              <span className="px-3 text-xs font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600">
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

      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <QuickEditModal
          product={quickEditProduct}
          onClose={() => setQuickEditProduct(null)}
          onSave={(data) => quickUpdateMutation.mutate({ id: quickEditProduct.id, data })}
          isPending={quickUpdateMutation.isPending}
        />
      )}

      {/* Product Stats Modal */}
      {showStatsModal && (
        <ProductStatsModal product={showStatsModal} onClose={() => setShowStatsModal(null)} />
      )}
    </div>
  );
}

// ==================== Sub Components ====================

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: any;
  color: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray';
}) {
  const colors = {
    primary: 'from-primary-500 to-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30',
    success: 'from-success-500 to-success-600 text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30',
    error: 'from-error-500 to-error-600 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/30',
    warning: 'from-warning-500 to-warning-600 text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/30',
    accent: 'from-accent-500 to-accent-600 text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30',
    gray: 'from-gray-500 to-gray-600 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors[color].split(' ').slice(2).join(' '))}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-black text-gray-900 dark:text-gray-100">{value.toLocaleString('fa-IR')}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function SortableHeader({ label, field, currentSort, order, onSort }: {
  label: string;
  field: SortField;
  currentSort?: string;
  order?: string;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <th className="px-3 py-3 text-right">
      <button
        onClick={() => onSort(field)}
        className={cn(
          'text-xs font-bold flex items-center gap-1 hover:text-primary-600 transition-colors',
          isActive ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
        )}
      >
        {label}
        <ArrowUpDown className={cn('w-3 h-3', isActive && order === 'desc' && 'rotate-180')} />
      </button>
    </th>
  );
}

function QuickEditModal({ product, onClose, onSave, isPending }: {
  product: AdminProduct;
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
}) {
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock);
  const [isActive, setIsActive] = useState(product.is_active);
  const [isFeatured, setIsFeatured] = useState(product.is_featured);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-l from-primary-50/50 to-white">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary-600" />
            ویرایش سریع
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Product Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <SafeImage src={product.main_image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{product.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku || 'N/A'}</p>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1.5">قیمت (تومان)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1.5">موجودی</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">فعال</span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-accent-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">محصول ویژه</span>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            انصراف
          </Button>
          <Button
            onClick={() => onSave({ price, stock, is_active: isActive, is_featured: isFeatured })}
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

function ProductStatsModal({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-product-stats', product.id],
    queryFn: () => adminProductService.getProductStats(product.id),
  });

  const stats = data?.data;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-l from-primary-50/50 to-white dark:from-primary-900/10 dark:to-gray-800">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            آمار محصول
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <SafeImage src={product.main_image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{product.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku || 'N/A'}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}
            </div>
          ) : stats ? (
            <>
              <div className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                getPerformanceColor(stats.performance_score)
              )}>
                <span className="text-sm font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  امتیاز عملکرد
                </span>
                <span className="text-lg font-black">
                  {stats.performance_score} <span className="text-xs opacity-70">({getPerformanceLabel(stats.performance_score)})</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <ShoppingCart className="w-5 h-5 text-primary-500 dark:text-primary-400 mx-auto mb-1" />
                  <p className="text-lg font-black text-gray-900 dark:text-gray-100">{stats.last_30_days.sales.toLocaleString('fa-IR')}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">فروش ۳۰ روز اخیر</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <DollarSign className="w-5 h-5 text-success-500 dark:text-success-400 mx-auto mb-1" />
                  <p className="text-lg font-black text-gray-900 dark:text-gray-100">{formatPrice(stats.last_30_days.revenue)}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">درآمد ۳۰ روز اخیر (تومان)</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">خطا در دریافت آمار</p>
          )}
        </div>

        <div className="flex items-center justify-end p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <Button variant="outline" onClick={onClose}>بستن</Button>
        </div>
      </div>
    </div>
  );
}

export default AdminProductsPage;
