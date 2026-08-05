/**
 * صفحه کتابخانه محصولات آماده - نسخه بازطراحی شده
 * 
 * ویژگی‌های اصلی:
 * - طراحی مدرن با Glassmorphism و Hover Effects پیشرفته
 * - فیلتر پیشرفته با ذخیره در LocalStorage
 * - مشاهده سریع محصول (Quick View)
 * - مرتب‌سازی چندگانه
 * - Breadcrumb برای ناوبری
 * - Toast Notifications سفارشی
 * - Keyboard Shortcuts
 * - Responsive کامل برای موبایل، تبلت و دسکتاپ
 * 
 * @version 2.0.0
 * @author ازکالا تیم فنی
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Package, Search, Filter, SlidersHorizontal, ChevronRight, Home,
  Loader2, X, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { TemplateCard, type ProductTemplate } from './components/TemplateCard';
import { QuickViewModal } from './components/QuickViewModal';
import { FilterPanel, type FilterState, type FilterOption } from './components/FilterPanel';
import { SortDropdown, type SortOption } from './components/SortDropdown';
import { EmptyState } from './components/EmptyState';
import { cn } from '@/utils/cn';

// کامپوننت Breadcrumb برای ناوبری بهتر
function Breadcrumb() {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <Link to="/seller/dashboard" className="hover:text-primary-600 transition-colors flex items-center gap-1">
        <Home className="w-4 h-4" />
        <span>داشبورد</span>
      </Link>
      <ChevronRight className="w-4 h-4 text-gray-300" />
      <Link to="/seller/products" className="hover:text-primary-600 transition-colors">
        محصولات من
      </Link>
      <ChevronRight className="w-4 h-4 text-gray-300" />
      <span className="text-gray-900 font-bold flex items-center gap-1">
        <Package className="w-4 h-4" />
        کتابخانه محصولات آماده
      </span>
    </nav>
  );
}

// کامپوننت Skeleton Loading برای کارت محصول
function TemplateCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded-lg" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-2 bg-gray-200 rounded-full" />
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-10 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function ProductTemplates() {
  const navigate = useNavigate();
  
  // State Management
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<number | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductTemplate | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [favorites, setFavorites] = useState<number[]>([]);
  
  // فیلترها
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    minPrice: 0,
    maxPrice: 10000000,
    inStockOnly: false,
    search: ''
  });

  // داده‌های فیلتر (دسته‌بندی‌ها و برندها)
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [brands, setBrands] = useState<FilterOption[]>([]);

  // بارگذاری دسته‌بندی‌ها و برندها برای فیلتر
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        apiClient.get('/products/categories'),
        apiClient.get('/products/brands')
      ]);
      setCategories(catsRes.data?.data || []);
      setBrands(brandsRes.data?.data || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // بارگذاری علاقه‌مندی‌ها از LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('templateFavorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading favorites');
      }
    }
  }, []);

  // ذخیره علاقه‌مندی‌ها
  const toggleFavorite = useCallback((id: number) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(id)
        ? prev.filter(fid => fid !== id)
        : [...prev, id];
      localStorage.setItem('templateFavorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // بارگذاری محصولات با debounce برای جستجو
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTemplates();
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/products/templates', {
        params: { 
          search: filters.search,
          per_page: 50 
        }
      });
      setTemplates(res.data?.data?.data || []);
    } catch (error) {
      toast.error('خطا در بارگذاری محصولات آماده');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // کپی محصول
  const handleCopy = useCallback(async (templateId: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این محصول را به فروشگاه خود اضافه کنید؟')) return;
    
    try {
      setCopyingId(templateId);
      const res = await apiClient.post(`/seller/products/copy-template/${templateId}`);
      
      // نمایش Toast سفارشی با انیمیشن
      toast.success(
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-500" />
          <span>{res.data.message || 'محصول با موفقیت کپی شد!'}</span>
        </div>,
        { duration: 2000 }
      );
      
      // انتقال به صفحه ویرایش محصول جدید
      setTimeout(() => {
        navigate(`/seller/products/${res.data.data.product.id}/edit`);
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا در کپی محصول');
    } finally {
      setCopyingId(null);
    }
  }, [navigate]);

  // فیلتر و مرتب‌سازی محصولات
  const filteredAndSortedTemplates = useMemo(() => {
    let result = [...templates];

    // اعمال فیلترها
    if (filters.categories.length > 0) {
      result = result.filter(t => t.category?.id && filters.categories.includes(t.category.id));
    }
    if (filters.brands.length > 0) {
      result = result.filter(t => t.brand?.id && filters.brands.includes(t.brand.id));
    }
    if (filters.minPrice > 0 || filters.maxPrice < 10000000) {
      result = result.filter(t => {
        const price = t.discount_price || t.price;
        return price >= filters.minPrice && price <= filters.maxPrice;
      });
    }
    if (filters.inStockOnly) {
      result = result.filter(t => t.stock > 0);
    }

    // اعمال مرتب‌سازی
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.id - a.id);
        break;
      case 'popular':
        // فرض بر این است که محصولات با ID بالاتر پربازدیدتر هستند
        result.sort((a, b) => b.id - a.id);
        break;
      case 'price_asc':
        result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
        break;
      case 'discount':
        result.sort((a, b) => {
          const discountA = a.compare_price ? (1 - (a.discount_price || a.price) / a.compare_price) : 0;
          const discountB = b.compare_price ? (1 - (b.discount_price || b.price) / b.compare_price) : 0;
          return discountB - discountA;
        });
        break;
    }

    return result;
  }, [templates, filters, sortBy]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F یا Cmd+F برای فوکوس روی جستجو
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('template-search')?.focus();
      }
      // Escape برای بستن مودال‌ها
      if (e.key === 'Escape') {
        setQuickViewProduct(null);
        setShowFilters(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatCount = (count: number) => 
    new Intl.NumberFormat('fa-IR').format(count);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-accent-50/20">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header با آمار */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            کتابخانه محصولات آماده
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            محصولات آماده را با یک کلیک به فروشگاه خود اضافه کنید و فقط قیمت و موجودی را تنظیم کنید
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/seller/products')}>
            <Package className="w-4 h-4 ml-2" />
            محصولات من
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <SlidersHorizontal className="w-4 h-4 ml-2" />
            فیلترها
          </Button>
        </div>
      </div>

      {/* نوار ابزار: جستجو + فیلتر + مرتب‌سازی */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* جستجو */}
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="template-search"
              type="text"
              placeholder="جستجو در محصولات آماده (نام، برند، دسته‌بندی)... (Ctrl+F)"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* دکمه فیلتر دسکتاپ */}
          <div className="hidden lg:block">
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              فیلترهای پیشرفته
            </Button>
          </div>

          {/* مرتب‌سازی */}
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        {/* نمایش تعداد نتایج */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            نمایش <span className="font-bold text-gray-900">{formatCount(filteredAndSortedTemplates.length)}</span> محصول از{' '}
            <span className="font-bold text-gray-900">{formatCount(templates.length)}</span> محصول کل
          </span>
          {(filters.categories.length > 0 || filters.brands.length > 0 || filters.inStockOnly) && (
            <Badge variant="primary" size="sm">
              {filters.categories.length + filters.brands.length + (filters.inStockOnly ? 1 : 0)} فیلتر فعال
            </Badge>
          )}
        </div>
      </div>

      {/* Layout اصلی: Sidebar Filters + Products Grid */}
      <div className="flex gap-6">
        {/* Sidebar Filters - دسکتاپ */}
        <aside className={cn(
          "hidden lg:block w-72 flex-shrink-0",
          showFilters ? "block" : "hidden"
        )}>
          <div className="sticky top-6">
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              categories={categories}
              brands={brands}
              isOpen={showFilters}
            />
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-xs bg-white p-4 overflow-y-auto">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                categories={categories}
                brands={brands}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>
        )}

        {/* Products Grid */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <TemplateCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAndSortedTemplates.length === 0 ? (
            <EmptyState
              icon={filters.search ? 'search' : 'package'}
              title={filters.search ? 'محصولی یافت نشد' : 'محصول آماده‌ای یافت نشد'}
              description={
                filters.search 
                  ? 'جستجوی خود را تغییر دهید یا فیلترها را حذف کنید'
                  : 'هنوز محصول آماده‌ای در سیستم ثبت نشده است'
              }
              actionLabel={filters.search ? 'حذف فیلترها' : undefined}
              onAction={() => setFilters({
                categories: [],
                brands: [],
                minPrice: 0,
                maxPrice: 10000000,
                inStockOnly: false,
                search: ''
              })}
              showSupportButton={!filters.search}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAndSortedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onCopy={handleCopy}
                  onQuickView={setQuickViewProduct}
                  copyingId={copyingId}
                  isFavorite={favorites.includes(template.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        template={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onCopy={handleCopy}
        copyingId={copyingId}
      />
    </div>
  );
}