import { Link } from 'react-router-dom';
import { Eye, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ArticleCardProps } from '@/types/magazine.types';
import { MAGAZINE_CATEGORY_COLORS } from '@/types/magazine.types';

/**
 * کارت نمایش مقاله مجله
 * 
 * سه variant:
 * - default: برای grid اصلی
 * - compact: برای sidebar و لیست‌های کوچک
 * - featured: برای نمایش ویژه (افقی در دسکتاپ)
 */
export default function ArticleCard({
  article,
  variant = 'default',
  showImage = true,
  showExcerpt = true,
  showMeta = true,
  className,
}: ArticleCardProps) {
  // Defensive: مطمئن شویم فیلدهای ضروری وجود دارند
  if (!article) return null;

  const categoryKey = article.category?.key || 'news';
  const categoryLabel = article.category?.label || 'اخبار';
  const categoryColorClass = MAGAZINE_CATEGORY_COLORS[categoryKey] || MAGAZINE_CATEGORY_COLORS.news;
  
  const sourceName = article.source?.name;
  const sourceUrl = article.source?.url;
  const isExternal = article.source?.is_external || false;
  
  const viewCount = article.stats?.view_count || 0;
  const publishedAtHuman = article.published_at_human || '';

  // ============ Compact Variant ============
  if (variant === 'compact') {
    return (
      <Link
        to={`/magazine/${article.slug}`}
        className={cn(
          'flex gap-3 group hover:bg-gray-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors',
          className
        )}
      >
        {showImage && article.featured_image && (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
            {article.title}
          </h4>
          {publishedAtHuman && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{publishedAtHuman}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // ============ Default & Featured Variants ============
  const isFeatured = variant === 'featured';

  return (
    <Link
      to={`/magazine/${article.slug}`}
      className={cn(
        'group flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden',
        'shadow-sm hover:shadow-xl transition-all duration-300',
        'border border-gray-100 dark:border-slate-700 hover:-translate-y-1',
        isFeatured && 'md:flex-row md:items-stretch',
        className
      )}
    >
      {/* تصویر */}
      {showImage && (
        <div
          className={cn(
            'relative overflow-hidden bg-gray-100 dark:bg-slate-700',
            isFeatured ? 'md:w-1/2 aspect-video md:aspect-auto' : 'aspect-video'
          )}
        >
          {article.featured_image ? (
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <span className="text-5xl">📰</span>
            </div>
          )}

          {/* badge دسته */}
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-sm',
                categoryColorClass
              )}
            >
              {categoryLabel}
            </span>
          </div>

          {/* badge منبع خارجی */}
          {isExternal && sourceName && (
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              <span>{sourceName}</span>
            </div>
          )}
        </div>
      )}

      {/* محتوا */}
      <div className={cn('flex-1 flex flex-col p-4', isFeatured && 'md:p-6')}>
        <h3
          className={cn(
            'font-bold text-gray-900 dark:text-white',
            'group-hover:text-primary-600 dark:group-hover:text-primary-400',
            'transition-colors line-clamp-2',
            isFeatured ? 'text-xl md:text-2xl mb-3' : 'text-base md:text-lg mb-2'
          )}
        >
          {article.title}
        </h3>

        {showExcerpt && article.excerpt && (
          <p
            className={cn(
              'text-gray-600 dark:text-gray-300 mb-4 leading-relaxed',
              isFeatured ? 'text-sm md:text-base line-clamp-3' : 'text-sm line-clamp-2'
            )}
          >
            {article.excerpt}
          </p>
        )}

        {showMeta && (
          <div className="mt-auto flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {publishedAtHuman && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {publishedAtHuman}
                </span>
              )}
              {viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {viewCount}
                </span>
              )}
            </div>

            {sourceName && !isExternal && (
              <span className="text-gray-400 dark:text-gray-500">{sourceName}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}