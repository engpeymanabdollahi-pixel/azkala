/**
 * ع©ط§ظ…ظ¾ظˆظ†ظ†طھ FilterPanel - ظ¾ظ†ظ„ ظپغŒظ„طھط± ظ¾غŒط´ط±ظپطھظ‡
 * ظˆغŒعکع¯غŒâ€Œظ‡ط§:
 * - ظپغŒظ„طھط± ط¨ط± ط§ط³ط§ط³ ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒ (Dropdown ع†ظ†ط¯ ط§ظ†طھط®ط§ط¨غŒ)
 * - ظپغŒظ„طھط± ط¨ط± ط§ط³ط§ط³ ط¨ط±ظ†ط¯ (Searchable Dropdown)
 * - ط±ظ†ط¬ ظ‚غŒظ…طھ (Price Range Slider)
 * - ظپغŒظ„طھط± ظ…ظˆط¬ظˆط¯غŒ (Checkbox)
 * - ط¯ع©ظ…ظ‡ ط±غŒط³طھ ظپغŒظ„طھط±ظ‡ط§
 */

import { useState, useEffect, useRef } from 'react';
import { X, SlidersHorizontal, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface FilterState {
  categories: number[];
  brands: number[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  search: string;
}

interface FilterOption {
  id: number;
  name: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories?: FilterOption[];
  brands?: FilterOption[];
  priceRange?: { min: number; max: number };
  isOpen?: boolean;
  onClose?: () => void;
}

export function FilterPanel({
  filters,
  onFilterChange,
  categories = [],
  brands = [],
  priceRange = { min: 0, max: 10000000 },
  onClose
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const isFirstRender = useRef(true);
  const [brandSearch, setBrandSearch] = useState('');

  // ظ‡ظ…ع¯ط§ظ…â€Œط³ط§ط²غŒ ط¨ط§ ظپغŒظ„طھط±ظ‡ط§غŒ ظˆط§ظ„ط¯.
  //
  // ط¨ط§ط²غŒط§ط¨غŒ ط§ط² LocalStorage ط¹ظ…ط¯ط§ظ‹ ط§غŒظ†ط¬ط§ ظ†غŒط³طھطŒ ط¯ط± ProductTemplates.tsx ط§ط³طھ:
  // ط¯ط± ظ…ظˆط¨ط§غŒظ„ ط§غŒظ† ظ¾ظ†ظ„ ظ‡ط± ط¨ط§ط± ع©ظ‡ ع©ط´ظˆ ط¨ط§ط² ظ…غŒâ€Œط´ظˆط¯ ط¯ظˆط¨ط§ط±ظ‡ mount ظ…غŒâ€Œط´ظˆط¯طŒ ظ¾ط³ ط§ع¯ط±
  // ط¨ط§ط²غŒط§ط¨غŒ ط§غŒظ†ط¬ط§ ط¨ظˆط¯طŒ ظ‡ط± ط¨ط§ط± localFilters ط±ط§ ط¨ط§ ظ†ط³ط®ظ‡â€ŒغŒ ط°ط®غŒط±ظ‡â€Œط´ط¯ظ‡ ط¨ط§ط²ظ†ظˆغŒط³غŒ
  // ظ…غŒâ€Œع©ط±ط¯ â€” ط­طھغŒ ط§ع¯ط± filters (ظˆط§ظ„ط¯) ط§ط² ظ‚ط¨ظ„ ع†غŒط² ط¯غŒع¯ط±غŒ ط¨ظˆط¯ â€” ظˆ ع†ظˆظ† onFilterChange
  // طµط¯ط§ ط²ط¯ظ‡ ظ†ظ…غŒâ€Œط´ط¯طŒ ع†ع©â€Œط¨ط§ع©ط³â€Œظ‡ط§ غŒع© ع†غŒط² ظ†ط´ط§ظ† ظ…غŒâ€Œط¯ط§ط¯ظ†ط¯ ظˆ ظ†طھط§غŒط¬ ع†غŒط² ط¯غŒع¯ط±غŒ.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    localStorage.setItem('productTemplatesFilters', JSON.stringify(localFilters));
    onClose?.();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      categories: [],
      brands: [],
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      inStockOnly: false,
      search: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    localStorage.removeItem('productTemplatesFilters');
  };

  const toggleCategory = (categoryId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const toggleBrand = (brandId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter(id => id !== brandId)
        : [...prev.brands, brandId]
    }));
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('fa-IR').format(price);

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // ظ…ط­ط§ط³ط¨ظ‡ طھط¹ط¯ط§ط¯ ظپغŒظ„طھط±ظ‡ط§غŒ ظپط¹ط§ظ„
  const activeFiltersCount = 
    localFilters.categories.length +
    localFilters.brands.length +
    (localFilters.inStockOnly ? 1 : 0) +
    (localFilters.minPrice > priceRange.min || localFilters.maxPrice < priceRange.max ? 1 : 0);

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden",
      "transition-all duration-300"
    )}>
      {/* ظ‡ط¯ط± ظ¾ظ†ظ„ ظپغŒظ„طھط± */}
      <div className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-black text-gray-900 dark:text-gray-100">ظپغŒظ„طھط±ظ‡ط§غŒ ظ¾غŒط´ط±ظپطھظ‡</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="primary" size="sm">
              {activeFiltersCount} ظپغŒظ„طھط± ظپط¹ط§ظ„
            </Badge>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            type="button"
            aria-label="ط¨ط³طھظ† ظپغŒظ„طھط±ظ‡ط§"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* ظ…ط­طھظˆط§غŒ ظپغŒظ„طھط±ظ‡ط§ */}
      <div className="p-4 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* ط¬ط³طھط¬ظˆ */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">ط¬ط³طھط¬ظˆ</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="ظ†ط§ظ… ظ…ط­طµظˆظ„طŒ ط¨ط±ظ†ط¯ غŒط§ ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒ..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40 transition-all text-sm"
            />
          </div>
        </div>

        {/* ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒâ€Œظ‡ط§ */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒâ€Œظ‡ط§</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    localFilters.categories.includes(cat.id)
                      ? "bg-primary-500 border-primary-500 text-white shadow-md"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-primary-300 dark:hover:border-primary-500"
                  )}
                  type="button"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ط¨ط±ظ†ط¯ظ‡ط§ */}
        {brands.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">ط¨ط±ظ†ط¯ظ‡ط§</label>
            <div className="relative mb-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="ط¬ط³طھط¬ظˆغŒ ط¨ط±ظ†ط¯..."
                className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {filteredBrands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => toggleBrand(brand.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                    localFilters.brands.includes(brand.id)
                      ? "bg-accent-500 border-accent-500 text-white shadow-md"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-accent-300 dark:hover:border-accent-500"
                  )}
                  type="button"
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ط±ظ†ط¬ ظ‚غŒظ…طھ */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">ظ…ط­ط¯ظˆط¯ظ‡ ظ‚غŒظ…طھ</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="template-min-price" className="text-xs text-gray-500 dark:text-gray-400 block mb-1">ط­ط¯ط§ظ‚ظ„</label>
              <input
                id="template-min-price"
                type="number"
                value={localFilters.minPrice}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 text-sm text-left dir-ltr"
              />
            </div>
            <div>
              <label htmlFor="template-max-price" className="text-xs text-gray-500 dark:text-gray-400 block mb-1">ط­ط¯ط§ع©ط«ط±</label>
              <input
                id="template-max-price"
                type="number"
                value={localFilters.maxPrice}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 text-sm text-left dir-ltr"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            ط§ط² {formatPrice(localFilters.minPrice)} طھط§ {formatPrice(localFilters.maxPrice)} طھظˆظ…ط§ظ†
          </div>
        </div>

        {/* ظپغŒظ„طھط± ظ…ظˆط¬ظˆط¯غŒ */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          <input
            type="checkbox"
            id="inStockOnly"
            checked={localFilters.inStockOnly}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="inStockOnly" className="text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer flex-1">
            ظپظ‚ط· ظ…ط­طµظˆظ„ط§طھ ظ…ظˆط¬ظˆط¯
          </label>
        </div>

        {/* ط¯ع©ظ…ظ‡â€Œظ‡ط§غŒ ط§ع©ط´ظ† */}
        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            onClick={handleReset}
            variant="outline"
            fullWidth
            size="sm"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            ط­ط°ظپ ظ‡ظ…ظ‡ ظپغŒظ„طھط±ظ‡ط§
          </Button>
          <Button
            onClick={handleApplyFilters}
            variant="primary"
            fullWidth
            size="sm"
          >
            ط§ط¹ظ…ط§ظ„ ظپغŒظ„طھط±ظ‡ط§
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export types
export type { FilterState, FilterOption };

