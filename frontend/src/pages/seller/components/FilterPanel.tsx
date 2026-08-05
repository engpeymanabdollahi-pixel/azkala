/**
 * کامپوننت FilterPanel - پنل فیلتر پیشرفته
 * ویژگی‌ها:
 * - فیلتر بر اساس دسته‌بندی (Dropdown چند انتخابی)
 * - فیلتر بر اساس برند (Searchable Dropdown)
 * - رنج قیمت (Price Range Slider)
 * - فیلتر موجودی (Checkbox)
 * - دکمه ریست فیلترها
 */

import { useState, useEffect } from 'react';
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
  isOpen = true,
  onClose
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [brandSearch, setBrandSearch] = useState('');

  // همگام‌سازی با فیلترهای والد
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // ذخیره در LocalStorage هنگام تغییر
  useEffect(() => {
    const saved = localStorage.getItem('productTemplatesFilters');
    if (saved && !filters.search) {
      try {
        setLocalFilters(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading filters from localStorage');
      }
    }
  }, []);

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

  // محاسبه تعداد فیلترهای فعال
  const activeFiltersCount = 
    localFilters.categories.length +
    localFilters.brands.length +
    (localFilters.inStockOnly ? 1 : 0) +
    (localFilters.minPrice > priceRange.min || localFilters.maxPrice < priceRange.max ? 1 : 0);

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden",
      "transition-all duration-300"
    )}>
      {/* هدر پنل فیلتر */}
      <div className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary-600" />
          <h3 className="font-black text-gray-900">فیلترهای پیشرفته</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="primary" size="sm">
              {activeFiltersCount} فیلتر فعال
            </Badge>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* محتوای فیلترها */}
      <div className="p-4 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* جستجو */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 block">جستجو</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="نام محصول، برند یا دسته‌بندی..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-sm"
            />
          </div>
        </div>

        {/* دسته‌بندی‌ها */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">دسته‌بندی‌ها</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2",
                    localFilters.categories.includes(cat.id)
                      ? "bg-primary-500 border-primary-500 text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-700 hover:border-primary-300"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* برندها */}
        {brands.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">برندها</label>
            <div className="relative mb-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="جستجوی برند..."
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {filteredBrands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => toggleBrand(brand.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2",
                    localFilters.brands.includes(brand.id)
                      ? "bg-accent-500 border-accent-500 text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-700 hover:border-accent-300"
                  )}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* رنج قیمت */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 block">محدوده قیمت</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500 block mb-1">حداقل</span>
              <input
                type="number"
                value={localFilters.minPrice}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm text-left dir-ltr"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">حداکثر</span>
              <input
                type="number"
                value={localFilters.maxPrice}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 text-sm text-left dir-ltr"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            از {formatPrice(localFilters.minPrice)} تا {formatPrice(localFilters.maxPrice)} تومان
          </div>
        </div>

        {/* فیلتر موجودی */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <input
            type="checkbox"
            id="inStockOnly"
            checked={localFilters.inStockOnly}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
            className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="inStockOnly" className="text-sm font-semibold text-gray-700 cursor-pointer flex-1">
            فقط محصولات موجود
          </label>
        </div>

        {/* دکمه‌های اکشن */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Button
            onClick={handleReset}
            variant="outline"
            fullWidth
            size="sm"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            حذف همه فیلترها
          </Button>
          <Button
            onClick={handleApplyFilters}
            variant="primary"
            fullWidth
            size="sm"
          >
            اعمال فیلترها
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export types
export type { FilterState, FilterOption };
