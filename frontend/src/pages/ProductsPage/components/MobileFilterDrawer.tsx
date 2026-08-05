import { Filter, X, Flame, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { PRICE_RANGES, RATING_OPTIONS, MOBILE_DRAWER_MAX_HEIGHT } from '../constants';
import type { FilterState } from '../types';
import type { Category } from '@/types/models';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  filters: FilterState;
  categories: Category[];
  activeFiltersCount: number;
  filteredCount: number;
  onClose: () => void;
  onCategoryChange: (id: number | null) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onMinRatingChange: (rating: number) => void;
  onDiscountedChange: (value: boolean) => void;
  onInStockChange: (value: boolean) => void;
  onResetFilters: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  filters,
  categories,
  activeFiltersCount,
  filteredCount,
  onClose,
  onCategoryChange,
  onPriceRangeChange,
  onMinRatingChange,
  onDiscountedChange,
  onInStockChange,
  onResetFilters,
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 right-0 left-0 bg-white dark:bg-slate-800 rounded-t-2xl z-50 overflow-hidden flex flex-col animate-slide-up shadow-2xl"
        style={{ maxHeight: MOBILE_DRAWER_MAX_HEIGHT }}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 p-4 flex items-center justify-between flex-shrink-0">
          <h2 className="font-black text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            فیلترها
            {activeFiltersCount > 0 && (
              <Badge variant="primary" className="text-[10px]">{activeFiltersCount}</Badge>
            )}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">دسته‌بندی</h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onCategoryChange(null)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  filters.selectedCategory === null ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                )}
              >
                همه
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    filters.selectedCategory === cat.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">محدوده قیمت</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => onPriceRangeChange([range.min, range.max])}
                  className={cn(
                    'px-2 py-2 rounded-lg text-[10px] font-semibold transition-all',
                    filters.priceRange[0] === range.min && filters.priceRange[1] === range.max
                      ? 'bg-accent-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">حداقل امتیاز</h3>
            <div className="flex gap-1.5">
              {RATING_OPTIONS.map((rating) => (
                <button
                  key={rating}
                  onClick={() => onMinRatingChange(rating)}
                  className={cn(
                    'flex-1 px-2 py-2 rounded-lg text-[10px] font-semibold transition-all',
                    filters.minRating === rating ? 'bg-warning-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {rating === 0 ? 'همه' : `${rating}+`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">فیلترهای سریع</h3>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={filters.onlyDiscounted}
                  onChange={(e) => onDiscountedChange(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <Flame className="w-4 h-4 text-error-500 dark:text-error-400" />
                <span className="text-xs text-gray-700 dark:text-gray-300">فقط تخفیف‌دار</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={filters.onlyInStock}
                  onChange={(e) => onInStockChange(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <CheckCircle className="w-4 h-4 text-success-500 dark:text-success-400" />
                <span className="text-xs text-gray-700 dark:text-gray-300">فقط موجود</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 p-3 flex gap-2 flex-shrink-0">
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={onResetFilters} className="flex-1" size="sm">
              <X className="w-4 h-4 ml-1" />
              پاک کردن
            </Button>
          )}
          <Button onClick={onClose} className="flex-1" size="sm">
            اعمال ({filteredCount})
          </Button>
        </div>
      </div>
    </>
  );
}
export default MobileFilterDrawer;
