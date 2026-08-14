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
  /** اندازه فونت: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ProductPrice - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * قابلیت‌ها:
 * - نمایش قیمت با فرمت فارسی (formatPrice)
 * - Badge تخفیف درصدی
 * - نمایش صرفه‌جویی (Savings Badge)
 * - RTL + Responsive
 * - Dark mode support
 * - Auto-calculate discount اگر discountPercent پاس نشود
 * - فونت Vazirmatn (font-sans)
 * 
 * مثال استفاده:
 * ```tsx
 * // در ProductDetailPage (variant box)
 * <ProductPrice price={1500000} comparePrice={2000000} />
 * 
 * // در ProductCard (variant inline)
 * <ProductPrice price={800000} variant="inline" size="sm" />
 * ```
 */
export function ProductPrice({
  price,
  comparePrice,
  discountPercent: discountPercentProp,
  className,
  variant = 'box',
  size = 'md',
}: ProductPriceProps) {
  // محاسبه discountPercent اگر داده نشده باشد
  const discountPercent =
    discountPercentProp ??
    (comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0);

  const hasDiscount = discountPercent > 0 && comparePrice && comparePrice > price;
  const savingsAmount = hasDiscount ? comparePrice! - price : 0;

  // سایزهای فونت بر اساس size prop
  const sizeClasses = {
    sm: { price: 'text-base md:text-lg', old: 'text-xs', label: 'text-[10px]', savings: 'text-[10px]' },
    md: { price: 'text-2xl md:text-3xl', old: 'text-sm', label: 'text-xs', savings: 'text-xs' },
    lg: { price: 'text-3xl md:text-4xl', old: 'text-base', label: 'text-sm', savings: 'text-sm' },
  };
  const currentSize = sizeClasses[size];

  // ==================== حالت inline (فقط قیمت - مناسب برای ProductCard) ====================
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-baseline gap-1.5 font-sans', className)}>
        {hasDiscount && (
          <span className={cn(currentSize.old, 'text-gray-400 dark:text-gray-500 line-through')}>
            {formatPrice(comparePrice!)}
          </span>
        )}
        <span className={cn(currentSize.price, 'font-black text-primary-700 dark:text-primary-400')}>
          {formatPrice(price)}
        </span>
        <span className={cn(currentSize.label, 'text-gray-500 dark:text-gray-400')}>تومان</span>
        {hasDiscount && (
          <Badge variant="error" size="sm" className={cn(currentSize.label, 'font-sans')}>
            <Flame className="w-3 h-3 ml-0.5" />
            {discountPercent}٪
          </Badge>
        )}
      </div>
    );
  }

  // ==================== حالت box (کادر کامل - مناسب برای ProductDetailPage) ====================
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-950/40 dark:via-gray-800 dark:to-accent-950/40',
        'border-2 border-primary-200 dark:border-primary-800 rounded-xl p-3 shadow-md',
        'font-sans',
        className
      )}
    >
      {/* قیمت قبلی + Badge تخفیف */}
      {hasDiscount && comparePrice && (
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(currentSize.old, 'text-gray-400 dark:text-gray-500 line-through')}>
            {formatPrice(comparePrice)}
          </span>
          <Badge variant="error" className={cn(currentSize.label, 'font-sans')}>
            <Flame className="w-3 h-3 ml-0.5" />
            {discountPercent}٪ تخفیف
          </Badge>
        </div>
      )}

      {/* قیمت نهایی */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className={cn(currentSize.price, 'font-black text-primary-700 dark:text-primary-400')}>
          {formatPrice(price)}
        </span>
        <span className={cn(currentSize.label, 'text-gray-500 dark:text-gray-400')}>تومان</span>
      </div>

      {/* صرفه‌جویی */}
      {hasDiscount && savingsAmount > 0 && (
        <div
          className={cn(
            'flex items-center gap-1.5 font-semibold',
            currentSize.savings,
            'text-success-600 dark:text-success-400',
            'bg-success-50 dark:bg-success-900/20',
            'px-2 py-1 rounded-lg',
            'border border-success-200 dark:border-success-800',
            'font-sans'
          )}
        >
          <Gift className="w-3 h-3" />
          صرفه‌جویی: {formatPrice(savingsAmount)}
        </div>
      )}
    </div>
  );
}