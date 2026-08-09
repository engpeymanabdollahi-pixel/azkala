import { cn } from '@/utils/cn';
import type { CategoryTabsProps, MagazineCategoryFilter } from '@/types/magazine.types';
import { MAGAZINE_CATEGORIES } from '@/types/magazine.types';

const ALL_OPTION: { key: 'all'; label: string; icon: string } = {
  key: 'all',
  label: 'همه',
  icon: '📋',
};

/**
 * تب‌های فیلتر دسته‌بندی مقالات
 * 
 * شامل "همه" + ۵ دسته اصلی
 * روی موبایل به صورت افقی scrollable است
 */
export default function CategoryTabs({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryTabsProps) {
  const allOptions = [ALL_OPTION, ...Object.values(MAGAZINE_CATEGORIES)];

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 -mx-1 px-1',
        // scrollbar styling برای دسکتاپ
        '[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded',
        className
      )}
    >
      {allOptions.map((option) => {
        const isActive = activeCategory === option.key;

        return (
          <button
            key={option.key}
            onClick={() => onCategoryChange(option.key as MagazineCategoryFilter)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium',
              'transition-all border-2',
              isActive
                ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'
            )}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}