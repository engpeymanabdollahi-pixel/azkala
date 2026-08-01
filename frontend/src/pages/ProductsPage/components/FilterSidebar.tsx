import { Filter, Package, ShoppingBag, Star, Zap, Flame, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { PRICE_RANGES, RATING_OPTIONS } from '../constants';
import type { FilterState } from '../types';
import { useQuery } from '@tanstack/react-query';
import client from '@/services/api/client';
import type { Product } from '@/types/models';

interface FilterSidebarProps {
  filters: FilterState;
  products: Product[];
  activeFiltersCount: number;
  onCategoryChange: (id: number | null) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onMinRatingChange: (rating: number) => void;
  onDiscountedChange: (value: boolean) => void;
  onInStockChange: (value: boolean) => void;
  onResetFilters: () => void;
}

export function FilterSidebar({
  filters,
  products,
  activeFiltersCount,
  onCategoryChange,
  onPriceRangeChange,
  onMinRatingChange,
  onDiscountedChange,
  onInStockChange,
  onResetFilters,
}: FilterSidebarProps) {
    // دریافت دسته‌بندی‌های واقعی از دیتابیس
    const { data: categories = [] } = useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const res = await client.get('/categories');
      return res.data?.data || res.data || [];
    },
  });
  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">
        
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
            فیلترها
            {activeFiltersCount > 0 && (
              <Badge variant="primary" className="text-[10px]">{activeFiltersCount}</Badge>
            )}
          </h2>
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-[10px] text-error-600 hover:text-error-700 font-bold flex items-center gap-0.5 bg-error-50 px-2 py-1 rounded-md"
            >
              <X className="w-3 h-3" />
              پاک کردن
            </button>
          )}
        </div>

        {/* دسته‌بندی */}
        <div>
          <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary-600" />
            دسته‌بندی
          </h3>
          <div className="space-y-0.5">
            <button
              onClick={() => onCategoryChange(null)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all',
                filters.selectedCategory === null
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <span>همه دسته‌ها</span>
              <Badge variant={filters.selectedCategory === null ? 'primary' : 'gray'} className="text-[10px]">
                {products.length}
              </Badge>
            </button>
             {categories.map((cat: any) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              // اگر می‌خواهید فقط دسته‌بندی‌هایی که محصول دارند نمایش داده شوند، این خط را نگه دارید
              // اگر می‌خواهید همه ۳۸ تا نمایش داده شوند، خط if (count === 0) return null; را حذف کنید
             // if (count === 0) return null; 
              
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all',
                    filters.selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {/* اگر آیکون در دیتابیس دارید: <span>{cat.icon}</span> */}
                    {cat.name}
                  </span>
                  <Badge variant={filters.selectedCategory === cat.id ? 'primary' : 'gray'} className="text-[10px]">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* محدوده قیمت */}
        <div>
          <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-accent-600" />
            محدوده قیمت
          </h3>
          <div className="space-y-0.5">
            {PRICE_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => onPriceRangeChange([range.min, range.max])}
                className={cn(
                  'w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all',
                  filters.priceRange[0] === range.min && filters.priceRange[1] === range.max
                    ? 'bg-accent-50 text-accent-700 font-bold border border-accent-300'
                    : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                )}
              >
                <div className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  filters.priceRange[0] === range.min && filters.priceRange[1] === range.max
                    ? 'border-accent-600 bg-accent-600'
                    : 'border-gray-300'
                )}>
                  {filters.priceRange[0] === range.min && filters.priceRange[1] === range.max && (
                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
                <span>{range.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* حداقل امتیاز */}
        <div>
          <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-warning-500" />
            حداقل امتیاز
          </h3>
          <div className="space-y-0.5">
            {RATING_OPTIONS.map((rating) => (
              <button
                key={rating}
                onClick={() => onMinRatingChange(rating)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all',
                  filters.minRating === rating
                    ? 'bg-warning-50 text-warning-700 font-bold border border-warning-300'
                    : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                )}
              >
                {rating === 0 ? (
                  <span className="font-semibold">همه امتیازها</span>
                ) : (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3 h-3',
                            i < rating ? 'text-warning-400 fill-warning-400' : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">به بالا</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* فیلترهای سریع */}
        <div>
          <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary-600" />
            فیلترهای سریع
          </h3>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
              <input
                type="checkbox"
                checked={filters.onlyDiscounted}
                onChange={(e) => onDiscountedChange(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded"
              />
              <Flame className="w-4 h-4 text-error-500" />
              <span className="text-xs text-gray-700">فقط تخفیف‌دار</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
              <input
                type="checkbox"
                checked={filters.onlyInStock}
                onChange={(e) => onInStockChange(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded"
              />
              <CheckCircle className="w-4 h-4 text-success-500" />
              <span className="text-xs text-gray-700">فقط موجود</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
export default FilterSidebar;
