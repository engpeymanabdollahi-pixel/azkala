import { Star, MessageCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Props برای ProductRating (inline mode)
 * 
 * نمایش سریع امتیاز محصول در Title Section:
 * ★ 4.8 | 💬 124 نظر | ✓ 500 فروش
 */
export interface ProductRatingProps {
  /** امتیاز محصول (0-5) */
  rating: number;
  /** تعداد کل نظرات */
  totalReviews?: number;
  /** تعداد فروش */
  salesCount?: number;
  /** کلاس اضافی */
  className?: string;
  /** اندازه ستاره‌ها */
  size?: 'sm' | 'md' | 'lg';
  /** نمایش تعداد فروش */
  showSales?: boolean;
  /** نمایش تعداد نظرات */
  showReviews?: boolean;
}

/**
 * ProductRating - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * نمایش inline rating با ستاره‌های Vazirmatn
 * 
 * مثال:
 * ```tsx
 * <ProductRating 
 *   rating={4.8} 
 *   totalReviews={124}
 *   salesCount={500}
 * />
 * ```
 */
export function ProductRating({
  rating,
  totalReviews,
  salesCount,
  className,
  size = 'md',
  showSales = true,
  showReviews = true,
}: ProductRatingProps) {
  if (rating <= 0) return null;

  const sizeClasses = {
    sm: { star: 'w-3.5 h-3.5', text: 'text-xs', gap: 'gap-2' },
    md: { star: 'w-4 h-4', text: 'text-sm', gap: 'gap-3' },
    lg: { star: 'w-5 h-5', text: 'text-base', gap: 'gap-4' },
  };
  const currentSize = sizeClasses[size];

  return (
    <div className={cn('flex items-center flex-wrap font-sans', currentSize.gap, currentSize.text, className)}>
      {/* ستاره‌ها + عدد */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                currentSize.star,
                i < Math.floor(rating)
                  ? 'text-warning-400 fill-warning-400'
                  : 'text-gray-300 dark:text-gray-600'
              )}
            />
          ))}
        </div>
        <span className="font-bold text-gray-900 dark:text-gray-100">
          {rating.toFixed(1)}
        </span>
      </div>

      {/* تعداد نظرات */}
      {showReviews && typeof totalReviews === 'number' && (
        <>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <MessageCircle className={cn(currentSize.star)} />
            {totalReviews} نظر
          </span>
        </>
      )}

      {/* تعداد فروش */}
      {showSales && typeof salesCount === 'number' && salesCount > 0 && (
        <>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span className="text-success-600 dark:text-success-400 flex items-center gap-1">
            <CheckCircle className={cn(currentSize.star)} />
            {salesCount} فروش
          </span>
        </>
      )}
    </div>
  );
}