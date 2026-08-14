import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface RatingDistributionItem {
  rating: number;
  count: number;
  percentage: number;
}

export interface RatingSummaryProps {
  /** میانگین امتیاز (0-5) */
  averageRating: number;
  /** تعداد کل نظرات */
  totalReviews: number;
  /** توزیع امتیازات (از 5 تا 1) */
  distribution: RatingDistributionItem[];
  /** کلاس اضافی */
  className?: string;
}

/**
 * RatingSummary - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * نمایش کامل summary در تب نظرات:
 * - میانگین بزرگ با ستاره‌ها
 * - توزیع ۵ ستاره با progress bar
 */
export function RatingSummary({
  averageRating,
  totalReviews,
  distribution,
  className,
}: RatingSummaryProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-3 font-sans', className)}>
      {/* Average Rating Box */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 text-center border border-primary-100 dark:border-primary-800">
        <div className="text-4xl font-black text-primary-700 dark:text-primary-400 mb-1">
          {averageRating.toFixed(1)}
        </div>
        <div className="flex items-center justify-center gap-0.5 mb-1.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-4 h-4',
                i < Math.floor(averageRating)
                  ? 'text-warning-400 fill-warning-400'
                  : 'text-gray-300 dark:text-gray-600'
              )}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 font-sans">
          بر اساس <strong>{totalReviews}</strong> نظر
        </p>
      </div>

      {/* Distribution */}
      <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-xs font-sans">
          توزیع امتیازات
        </h4>
        <div className="space-y-1.5">
          {distribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 w-10">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-sans">
                  {item.rating}
                </span>
                <Star className="w-2.5 h-2.5 text-warning-400 fill-warning-400" />
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-warning-400 to-warning-500 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 w-8 text-left font-sans">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}