import { Search, Filter, Grid3x3, List, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { SortDropdown } from './SortDropdown';
import { FilterTags } from './FilterTags';
import type { LayoutMode, SortOption, FilterState } from '../types';
import { DEFAULT_PRICE_RANGE, DEFAULT_MIN_RATING } from '../constants';

interface ToolbarProps {
  searchQuery: string;
  layoutMode: LayoutMode;
  sortBy: SortOption;
  filters: FilterState;
  categories: any[]; // ✅ اضافه شد: دریافت آرایه دسته‌بندی‌ها از والد
  activeFiltersCount: number;
  onSearchChange: (query: string) => void;
  onLayoutChange: (mode: LayoutMode) => void;
  onSortChange: (sort: SortOption) => void;
  onShowMobileFilters: () => void;
  onRemoveCategory: () => void;
  onRemovePriceRange: () => void;
  onRemoveMinRating: () => void;
  onRemoveDiscounted: () => void;
  onRemoveInStock: () => void;
}

export function Toolbar({
  searchQuery,
  layoutMode,
  sortBy,
  filters,
  categories, // ✅ اضافه شد به لیست آرگومان‌ها
  activeFiltersCount,
  onSearchChange,
  onLayoutChange,
  onSortChange,
  onShowMobileFilters,
  onRemoveCategory,
  onRemovePriceRange,
  onRemoveMinRating,
  onRemoveDiscounted,
  onRemoveInStock,
}: ToolbarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 mb-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="flex-1 relative group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="جستجو..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-10 pl-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Mobile Filter Button */}
          <Button
            onClick={onShowMobileFilters}
            variant="outline"
            size="sm"
            className="lg:hidden gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            فیلتر
            {activeFiltersCount > 0 && (
              <Badge variant="primary" className="text-[10px]">{activeFiltersCount}</Badge>
            )}
          </Button>

          {/* Layout Mode Toggle */}
          <div className="hidden md:flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg">
            <button
              onClick={() => onLayoutChange('grid')}
              className={cn(
                'p-2 rounded-md transition-all',
                layoutMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onLayoutChange('list')}
              className={cn(
                'p-2 rounded-md transition-all',
                layoutMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <SortDropdown value={sortBy} onChange={onSortChange} />
        </div>
      </div>

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <FilterTags
          filters={filters}
          categories={categories} // ✅ اضافه شد: پاس دادن به FilterTags
          onRemoveCategory={onRemoveCategory}
          onRemovePriceRange={onRemovePriceRange}
          onRemoveMinRating={onRemoveMinRating}
          onRemoveDiscounted={onRemoveDiscounted}
          onRemoveInStock={onRemoveInStock}
        />
      )}
    </div>
  );
}