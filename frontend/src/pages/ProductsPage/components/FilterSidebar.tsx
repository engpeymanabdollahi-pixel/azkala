import { Filter, Package, ShoppingBag, Star, Zap, Flame, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { PRICE_RANGES, RATING_OPTIONS } from '../constants';
import type { FilterState } from '../types';
import type { Category, Product } from '@/types/models';

interface FilterSidebarProps {
  filters: FilterState;
  categories: Category[];
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
  categories,
  products,
  activeFiltersCount,
  onCategoryChange,
  onPriceRangeChange,
  onMinRatingChange,
  onDiscountedChange,
  onInStockChange,
  onResetFilters,
}: FilterSidebarProps) {
  // ✅ دسته‌بندی‌ها قبلاً با یک useQuery داخلی و مستقل دوباره از سرور خوانده
  // می‌شدند، در حالی که ProductsPage از قبل همین داده را گرفته و به‌عنوان prop
  // پاس می‌داد — چون این prop اصلاً در اینترفیس تعریف نشده بود، بی‌صدا نادیده
  // گرفته می‌شد. فقط به لطف یکسان بودن queryKey (`'all-categories'`) در هر دو
  // جا، TanStack Query یک درخواست شبکه‌ی تکراری واقعی نمی‌ساخت؛ ولی کد
  // گمراه‌کننده و دو منبع داده برای یک چیز بود.
  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">

        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-black text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
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
              className="text-[10px] text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 font-bold flex items-center gap-0.5 bg-error-50 dark:bg-error-900/20 px-2 py-1 rounded-md"
            >
              <X className="w-3 h-3" />
              پاک کردن
            </button>
          )}
        </div>

        {/* دسته‌بندی */}
        <div>
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            دسته‌بندی
          </h3>
          <div className="space-y-0.5">
            <button
              onClick={() => onCategoryChange(null)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all',
                filters.selectedCategory === null
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              )}
            >
              <span>همه دسته‌ها</span>
              <Badge variant={filters.selectedCategory === null ? 'primary' : 'gray'} className="text-[10px]">
                {products.length}
              </Badge>
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              // اگر می‌خواهید فقط دسته‌بندی‌هایی که محصول دارند نمایش داده شوند، این خط را نگه دارید
              // اگر می‌خواهید همه دسته‌ها نمایش داده شوند، خط if (count === 0) return null; را حذف کنید
              // if (count === 0) return null;

              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all',
                    filters.selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
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
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
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
                    ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 font-bold border border-accent-300 dark:border-accent-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-transparent'
                )}
              >
                <div className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  filters.priceRange[0] === range.min && filters.priceRange[1] === range.max
                    ? 'border-accent-600 bg-accent-600'
                    : 'border-gray-300 dark:border-slate-600'
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
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-warning-500 dark:text-warning-400" />
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
                    ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300 font-bold border border-warning-300 dark:border-warning-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-transparent'
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
                            i < rating ? 'text-warning-400 fill-warning-400' : 'text-gray-300 dark:text-slate-600'
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
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            فیلترهای سریع
          </h3>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700">
              <input
                type="checkbox"
                checked={filters.onlyDiscounted}
                onChange={(e) => onDiscountedChange(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 dark:border-slate-600 rounded"
              />
              <Flame className="w-4 h-4 text-error-500 dark:text-error-400" />
              <span className="text-xs text-gray-700 dark:text-gray-300">فقط تخفیف‌دار</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700">
              <input
                type="checkbox"
                checked={filters.onlyInStock}
                onChange={(e) => onInStockChange(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 dark:border-slate-600 rounded"
              />
              <CheckCircle className="w-4 h-4 text-success-500 dark:text-success-400" />
              <span className="text-xs text-gray-700 dark:text-gray-300">فقط موجود</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
export default FilterSidebar;
