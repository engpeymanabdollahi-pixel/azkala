import { Link } from 'react-router-dom';
import { Newspaper, ArrowLeft, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useDeviceNews } from '@/hooks/api/useMagazineApi';
import type { DeviceNewsWidgetProps } from '@/types/magazine.types';

/**
 * Widget آخرین اخبار دستگاه انتخاب‌شده
 * 
 * ⭐ این widget به عنوان تب جدید در Hero Section HomePage قرار می‌گیرد
 * فقط وقتی selectedModel وجود دارد نمایش داده می‌شود
 */
export default function DeviceNewsWidget({
  modelId,
  modelName,
  limit = 6,
  className,
}: DeviceNewsWidgetProps) {
  const { data, isLoading, error } = useDeviceNews(modelId, limit);

  const articles = data?.data ?? [];

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900',
        'rounded-2xl p-5 md:p-6 border border-gray-100 dark:border-slate-700 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg leading-tight">
              اخبار {modelName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              آخرین مقالات و بررسی‌ها
            </p>
          </div>
        </div>

        <Link
          to="/magazine"
          className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          <span>همه</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          خطا در بارگذاری اخبار
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && articles.length === 0 && (
        <div className="py-8 text-center">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            هنوز خبری برای {modelName} منتشر نشده
          </p>
        </div>
      )}

      {/* Articles List */}
      {!isLoading && !error && articles.length > 0 && (
        <div className="space-y-1">
          {articles.map((article, idx) => (
            <Link
              key={article.id}
              to={`/magazine/${article.slug}`}
              className={cn(
                'flex gap-3 p-2 -mx-2 rounded-lg group',
                'hover:bg-white dark:hover:bg-slate-700/50 transition-colors',
                idx > 0 && 'border-t border-gray-100 dark:border-slate-700/50 pt-3'
              )}
            >
              {article.featured_image && (
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                    {article.category.label}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.published_at_human}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}