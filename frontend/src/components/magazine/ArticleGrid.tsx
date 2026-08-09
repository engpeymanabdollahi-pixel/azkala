import { cn } from '@/utils/cn';
import type { ArticleGridProps } from '@/types/magazine.types';
import ArticleCard from './ArticleCard';

/**
 * Grid نمایش مقالات با responsive columns
 */
export default function ArticleGrid({ articles, columns = 3, className }: ArticleGridProps) {
  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns];

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
        <div className="text-6xl mb-3">📭</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          مقاله‌ای یافت نشد
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          فیلتر دیگری را امتحان کنید
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6', gridColsClass, className)}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

/**
 * Skeleton loading state برای ArticleGrid
 */
export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 animate-pulse"
        >
          <div className="aspect-video bg-gray-200 dark:bg-slate-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}