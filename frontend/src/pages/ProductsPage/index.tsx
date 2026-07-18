import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // ✅ اضافه شد
import { Smartphone, Package, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductCardSkeleton } from '@/components/features/ProductCardSkeleton';
import { useModelStore } from '@/store/modelStore';
import { useAuthStore } from '@/store/authStore';
import { categoryService } from '@/services/api/category.service'; // ✅ اضافه شد
import { cn } from '@/utils/cn';
import type { Product } from '@/types/models';
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
  const { selectedModel } = useModelStore();
  const { isAuthenticated } = useAuthStore();

  // ✅ دریافت دسته‌بندی‌های واقعی از دیتابیس
  const { data: categories = [] } = useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      try {
        // اگر نام متد در category.service.ts شما getCategories است، آن را تغییر دهید
        const res = await categoryService.getAll(); 
        return res.data?.data || res.data || [];
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
  });
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
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-3 md:px-4 py-4 max-w-7xl">
          <div className="h-12 bg-white rounded-xl mb-3 animate-pulse" />
          <div className="h-10 bg-white rounded-xl mb-3 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-3 md:px-4 py-4 max-w-7xl">
        
        {/* دکمه‌های فیلتر اصلی */}
        <div className="bg-white rounded-xl border border-gray-100 p-2 mb-3 shadow-sm sticky top-20 z-30">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleFilterModeChange('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                filterMode === 'all'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Smartphone className="w-3.5 h-3.5" />
                دستگاه‌های من
                {selectedDeviceIds.length > 0 && filterMode === 'my-devices' && (
                  <Badge variant="primary" className="bg-white/20 text-white text-[10px] px-1.5 py-0">
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                {selectedModel.name}
              </button>
            )}
          </div>
        </div>

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