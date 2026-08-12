import { Gift, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Props Interface برای ProductPrice
 * 
 * دو سناریو را پشتیبانی می‌کند:
 * 1. محصول با تخفیف: price + comparePrice (قیمت قبلی)
 * 2. محصول بدون تخفیف: فقط price
 */
export interface ProductPriceProps {
  /** قیمت نهایی (بعد از تخفیف) */
  price: number;
  /** قیمت اصلی (قبل از تخفیف) - اختیاری */
  comparePrice?: number | null;
  /** درصد تخفیف (اگر قبلاً محاسبه شده) - اختیاری */
  discountPercent?: number;
  /** کلاس اضافی برای استایل سفارشی */
  className?: string;
  /** حالت نمایش: 'box' (کادر کامل) یا 'inline' (فقط قیمت) */
  variant?: 'box' | 'inline';
}

/**
 * ProductPrice - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * قابلیت‌ها:
 * - نمایش قیمت با فرمت فارسی
 * - Badge تخفیف درصدی
 * - نمایش صرفه‌جویی
 * - RTL + Responsive
 * - Dark mode support
 * 
 * مثال استفاده:
 * ```tsx
 * <ProductPrice 
 *   price={1500000} 
 *   comparePrice={2000000}
 *   discountPercent={25}
 * />
 * ```
 */
export function ProductPrice({
  price,
  comparePrice,
  discountPercent: discountPercentProp,
  className,
  variant = 'box',
}: ProductPriceProps) {
  // محاسبه discountPercent اگر داده نشده باشد
  const discountPercent =
    discountPercentProp ??
    (comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0);

  const hasDiscount = discountPercent > 0 && comparePrice && comparePrice > price;
  const savingsAmount = hasDiscount ? comparePrice! - price : 0;

  // ==================== حالت inline (فقط قیمت) ====================
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-baseline gap-1.5', className)}>
        {hasDiscount && (
          <span className="text-sm text-gray-400 dark:text-gray-500 line-through font-sans">
            {formatPrice(comparePrice!)}
          </span>
        )}
        <span className="text-lg md:text-xl font-black text-primary-700 dark:text-primary-400 font-sans">
          {formatPrice(price)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-sans">تومان</span>
        {hasDiscount && (
          <Badge variant="error" size="sm" className="text-[10px] font-sans">
            <Flame className="w-3 h-3 ml-0.5" />
            {discountPercent}٪
          </Badge>
        )}
      </div>
    );
  }

  // ==================== حالت box (کادر کامل) ====================
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-950/40 dark:via-gray-800 dark:to-accent-950/40',
        'border-2 border-primary-200 dark:border-primary-800 rounded-xl p-3 shadow-md',
        className
      )}
    >
      {/* قیمت قبلی + Badge تخفیف */}
      {hasDiscount && comparePrice && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-400 dark:text-gray-500 line-through font-sans">
            {formatPrice(comparePrice)}
          </span>
          <Badge variant="error" className="text-[10px] font-sans">
            <Flame className="w-3 h-3 ml-0.5" />
            {discountPercent}٪ تخفیف
          </Badge>
        </div>
      )}

      {/* قیمت نهایی */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl md:text-3xl font-black text-primary-700 dark:text-primary-400 font-sans">
          {formatPrice(price)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-sans">تومان</span>
      </div>

      {/* صرفه‌جویی */}
      {hasDiscount && savingsAmount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-success-600 dark:text-success-400 font-semibold bg-success-50 dark:bg-success-900/20 px-2 py-1 rounded-lg border border-success-200 dark:border-success-800 font-sans">
          <Gift className="w-3 h-3" />
          صرفه‌جویی: {formatPrice(savingsAmount)}
        </div>
      )}
    </div>
  );
}