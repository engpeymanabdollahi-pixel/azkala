import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // ✅ اضافه شد
import { Smartphone, Package, BadgeCheck, X, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ProductCardSkeleton } from '@/components/features/ProductCardSkeleton';
import { useModelStore } from '@/store/modelStore';
import { useAuthStore } from '@/store/authStore';
import { categoryService } from '@/services/api/category.service'; // ✅ اضافه شد
import { cn } from '@/utils/cn';
import type { Product, Category } from '@/types/models';
import type { FilterMode, LayoutMode } from './types';
import { DEFAULT_LAYOUT_MODE, SKELETON_COUNT, DEFAULT_PRICE_RANGE } from './constants';

// Hooks
import { useProducts } from './hooks/useProducts';
import { useProductFilters } from './hooks/useProductFilters';
import { useUserDevices } from './hooks/useUserDevices';

// Components
import { Toolbar } from './components/Toolbar';
import { FilterSidebar } from './components/FilterSidebar';
import { MobileFilterDrawer } from './components/MobileFilterDrawer';
import { DeviceSelector } from './components/DeviceSelector';
import { ProductGrid } from './components/ProductGrid';

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedModel } = useModelStore();
  const { isAuthenticated } = useAuthStore();

  // ✅ فیلتر برند از طریق URL (مثلاً از BrandsPage: /products?brand_id=3)
  // قبلاً هیچ صفحه‌ای این پارامتر را نمی‌خواند، پس کلیک روی یک برند در
  // BrandsPage هیچ اثری روی لیست محصولات نداشت.
  const brandId = useMemo(() => {
    const raw = searchParams.get('brand_id');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [searchParams]);

  // ✅ دریافت دسته‌بندی‌های واقعی از دیتابیس
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['all-categories'],
    queryFn: async () => {
      try {
        // ✅ categoryService.getAll() از قبل پاسخ را یک بار باز می‌کند و
        // {success, data: Category[]} برمی‌گرداند — res.data?.data اینجا
        // همیشه undefined بود (تودرتوی اضافه‌ی اشتباه).
        const res = await categoryService.getAll();
        return res.data || [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
  });

  // State
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(DEFAULT_LAYOUT_MODE);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>(
    selectedModel ? 'header-device' : 'all'
  );
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>(
    selectedModel ? [selectedModel.id] : []
  );

  // Hooks
  const { devices: userDevices } = useUserDevices();
  const { products, isLoading } = useProducts({
    filterMode,
    selectedModelId: selectedModel?.id,
    selectedDeviceIds,
    brandId,
  });

  const brandName = brandId ? products[0]?.brand?.name : undefined;

  const clearBrandFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('brand_id');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const {
    filters,
    filteredProducts,
    activeFiltersCount,
    setSelectedCategory,
    setSearchQuery,
    setPriceRange,
    setMinRating,
    setOnlyDiscounted,
    setOnlyInStock,
    setSortBy,
    resetFilters,
  } = useProductFilters(products);

  // ✅ اعمال پارامترهای search/category/discount/new که هدر (SearchBar،
  // MegaMenu، NAV_ITEMS «تخفیف‌های ویژه») در URL می‌سازد — قبلاً هیچ صفحه‌ای
  // این پارامترها را نمی‌خواند (فقط brand_id خوانده می‌شد)، پس جستجوی سراسری
  // و لینک‌های مگامنو/تخفیف در عمل هیچ اثری روی نتایج نداشتند: کاربر به این
  // صفحه هدایت می‌شد ولی نتایج فیلتر/جستجو نمی‌شدند.
  // «new» معادل واقعی در دیتابیس ندارد (فیلد is_new‌ای در Product نیست)،
  // پس به‌جای ساختن یک فیلتر ساختگی، صادقانه روی مرتب‌سازی «جدیدترین‌ها»
  // (created_at نزولی) که از قبل واقعی و موجود است نگاشت می‌شود.
  // با یک رشته‌ی «آخرین‌اعمال‌شده» فقط وقتی این ۴ پارامتر واقعاً عوض شوند
  // اعمال می‌شود — نه با هر تغییر دیگری در searchParams (مثل حذف فیلتر برند)،
  // تا فیلترهایی که کاربر خودش دستی تغییر داده پاک نشوند.
  const lastAppliedHeaderParams = useRef<string | null>(null);
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const discount = searchParams.get('discount');
    const isNew = searchParams.get('new');

    if (!search && !category && !discount && !isNew) return;
    // اگر پارامتر دسته‌بندی هست ولی دسته‌بندی‌ها هنوز از سرور نیامده، صبر کن
    // تا در رندر بعدی (وقتی categories پر شد) دوباره تلاش شود؛ وگرنه این
    // تلاش به‌عنوان «اعمال‌شده» علامت می‌خورد و دیگر هیچ‌وقت واقعاً اجرا نمی‌شود.
    if (category && categories.length === 0) return;

    const signature = `${search ?? ''}|${category ?? ''}|${discount ?? ''}|${isNew ?? ''}`;
    if (signature === lastAppliedHeaderParams.current) return;
    lastAppliedHeaderParams.current = signature;

    if (search) setSearchQuery(search);
    if (category) {
      const match = categories.find((c) => c.slug === category);
      if (match) setSelectedCategory(match.id);
    }
    if (discount === 'true') setOnlyDiscounted(true);
    if (isNew === 'true') setSortBy('newest');
  }, [searchParams, categories, setSearchQuery, setSelectedCategory, setOnlyDiscounted, setSortBy]);

  useEffect(() => {
    if (selectedModel && !selectedDeviceIds.includes(selectedModel.id)) {
      setSelectedDeviceIds((prev) => [...prev, selectedModel.id]);
    }
  }, [selectedModel]);

  const handleViewProduct = useCallback(
    (product: Product) => navigate(`/products/${product.slug}`),
    [navigate]
  );

  const toggleDeviceSelection = useCallback((deviceId: number) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  }, []);

  const handleFilterModeChange = useCallback(
    (mode: FilterMode) => {
      setFilterMode(mode);
      if (mode === 'my-devices' && selectedDeviceIds.length === 0 && userDevices.length > 0) {
        setSelectedDeviceIds(userDevices.map((d) => d.phone_model_id));
      }
    },
    [selectedDeviceIds.length, userDevices]
  );

  const handleSelectAllDevices = useCallback(() => {
    setSelectedDeviceIds(userDevices.map((d) => d.phone_model_id));
  }, [userDevices]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
        <div className="container mx-auto px-3 md:px-4 py-4 max-w-7xl">
          <div className="h-12 bg-white dark:bg-slate-800 rounded-xl mb-3 animate-pulse" />
          <div className="h-10 bg-white dark:bg-slate-800 rounded-xl mb-3 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ProductCardSkeleton 
                key={i} 
                style={{ animationDelay: `${i * 50}ms` }} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-3 md:px-4 py-4 max-w-7xl">

        {/* دکمه‌های فیلتر اصلی */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-2 mb-3 shadow-sm sticky top-20 z-30">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleFilterModeChange('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                filterMode === 'all'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              )}
            >
              <Package className="w-3.5 h-3.5" />
              همه محصولات
            </button>

            {isAuthenticated && (
              <button
                onClick={() => handleFilterModeChange('my-devices')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  filterMode === 'my-devices'
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                )}
              >
                <Smartphone className="w-3.5 h-3.5" />
                دستگاه‌های من
                {selectedDeviceIds.length > 0 && filterMode === 'my-devices' && (
                  <Badge variant="primary" className="bg-white/20 dark:bg-slate-900/40 text-white text-[10px] px-1.5 py-0">
                    {selectedDeviceIds.length}
                  </Badge>
                )}
              </button>
            )}

            {selectedModel && (
              <button
                onClick={() => handleFilterModeChange('header-device')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  filterMode === 'header-device'
                    ? 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                )}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                {selectedModel.name}
              </button>
            )}
          </div>
        </div>

        {/* فیلتر فعال برند (وقتی از BrandsPage آمده باشد) */}
        {brandId && (
          <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl px-3 py-2 mb-3 text-xs font-bold text-primary-700 dark:text-primary-300">
            <Tag className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              فیلتر بر اساس برند{brandName ? `: ${brandName}` : ''}
              {!isLoading && ` (${products.length} محصول)`}
            </span>
            <button
              onClick={clearBrandFilter}
              className="mr-auto p-1 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800/40 transition-colors"
              aria-label="حذف فیلتر برند"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {filterMode === 'my-devices' && (
          <DeviceSelector
            devices={userDevices}
            selectedDeviceIds={selectedDeviceIds}
            onToggleDevice={toggleDeviceSelection}
            onSelectAll={handleSelectAllDevices}
            onClearAll={() => setSelectedDeviceIds([])}
          />
        )}

        {/* ✅ ارسال categories به Toolbar */}
        <Toolbar
          searchQuery={filters.searchQuery}
          layoutMode={layoutMode}
          sortBy={filters.sortBy}
          filters={filters}
          categories={categories} // ✅ این خط اضافه شد
          activeFiltersCount={activeFiltersCount}
          onSearchChange={setSearchQuery}
          onLayoutChange={setLayoutMode}
          onSortChange={setSortBy}
          onShowMobileFilters={() => setShowMobileFilters(true)}
          onRemoveCategory={() => setSelectedCategory(null)}
          onRemovePriceRange={() => setPriceRange(DEFAULT_PRICE_RANGE)}
          onRemoveMinRating={() => setMinRating(0)}
          onRemoveDiscounted={() => setOnlyDiscounted(false)}
          onRemoveInStock={() => setOnlyInStock(false)}
        />

        {/* Layout اصلی */}
        <div className="flex gap-4">
          {/* ✅ ارسال categories به FilterSidebar */}
          <FilterSidebar
            filters={filters}
            categories={categories} // ✅ این خط اضافه شد
            products={products}
            activeFiltersCount={activeFiltersCount}
            onCategoryChange={setSelectedCategory}
            onPriceRangeChange={setPriceRange}
            onMinRatingChange={setMinRating}
            onDiscountedChange={setOnlyDiscounted}
            onInStockChange={setOnlyInStock}
            onResetFilters={resetFilters}
          />

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={filteredProducts}
              layoutMode={layoutMode}
              filterMode={filterMode}
              searchQuery={filters.searchQuery}
              userDevices={userDevices}
              selectedDeviceIds={selectedDeviceIds}
              selectedModelName={selectedModel?.name}
              activeFiltersCount={activeFiltersCount}
              onViewProduct={handleViewProduct}
              onResetFilters={resetFilters}
              onSelectAllDevices={handleSelectAllDevices}
              onChangeFilterMode={handleFilterModeChange}
            />
          </div>
        </div>
      </div>

      {/* ✅ ارسال categories به MobileFilterDrawer */}
      <MobileFilterDrawer
        isOpen={showMobileFilters}
        filters={filters}
        categories={categories} // ✅ این خط اضافه شد
        activeFiltersCount={activeFiltersCount}
        filteredCount={filteredProducts.length}
        onClose={() => setShowMobileFilters(false)}
        onCategoryChange={setSelectedCategory}
        onPriceRangeChange={setPriceRange}
        onMinRatingChange={setMinRating}
        onDiscountedChange={setOnlyDiscounted}
        onInStockChange={setOnlyInStock}
        onResetFilters={resetFilters}
      />
    </div>
  );
}
export default ProductsPage;