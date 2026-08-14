import { AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Props برای ProductStock
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * و هماهنگ با ProductCard (isLowStock threshold = 5)
 */
export interface ProductStockProps {
  /** تعداد موجودی */
  stock: number;
  /** آستانه Low Stock (پیش‌فرض: 5 - مطابق ProductCard) */
  lowStockThreshold?: number;
  /** کلاس اضافی */
  className?: string;
  /** حالت نمایش: 'inline' | 'warning' | 'full' */
  variant?: 'inline' | 'warning' | 'full';
}

/**
 * ProductStock - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * حالت‌ها:
 * - stock === 0: ناموجود (قرمز)
 * - stock <= lowStockThreshold: فقط X عدد باقی مانده (زرد)
 * - stock > lowStockThreshold: موجود (سبز)
 * 
 * مثال:
 * ```tsx
 * // در ProductDetailPage
 * <ProductStock stock={product.stock} variant="warning" />
 * 
 * // در ProductCard (اگر نیاز به inline باشد)
 * <ProductStock stock={product.stock} variant="inline" />
 * ```
 */
export function ProductStock({
  stock,
  lowStockThreshold = 5,
  className,
  variant = 'warning',
}: ProductStockProps) {
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= lowStockThreshold;
  const isInStock = stock > lowStockThreshold;

  // ==================== حالت inline (فقط متن) ====================
  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'text-xs font-bold flex items-center gap-1 font-sans',
          isOutOfStock && 'text-error-600 dark:text-error-400',
          isLowStock && 'text-warning-600 dark:text-warning-400',
          isInStock && 'text-success-600 dark:text-success-400',
          className
        )}
      >
        {isOutOfStock ? (
          <>
            <XCircle className="w-3.5 h-3.5" />
            ناموجود
          </>
        ) : isLowStock ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5" />
            فقط {stock} عدد
          </>
        ) : (
          <>
            <Package className="w-3.5 h-3.5" />
            {stock} عدد
          </>
        )}
      </span>
    );
  }

  // ==================== حالت warning (کادر هشدار - مناسب ProductDetailPage) ====================
  if (variant === 'warning') {
    // اگر موجودی کافی است، هیچ هشداری نمایش نده
    if (isInStock) {
      return (
        <div
          className={cn(
            'flex items-center gap-2 p-2 bg-success-50 dark:bg-success-900/20',
            'rounded-lg border border-success-100 dark:border-success-800',
            'font-sans',
            className
          )}
        >
          <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">موجود در انبار</p>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">{stock} عدد</p>
          </div>
        </div>
      );
    }

    // Low Stock Warning
    if (isLowStock) {
      return (
        <div
          className={cn(
            'flex items-center gap-2 p-2 bg-warning-50 dark:bg-warning-900/20',
            'rounded-lg border border-warning-200 dark:border-warning-800',
            'animate-pulse-soft',
            'font-sans',
            className
          )}
        >
          <AlertTriangle className="w-4 h-4 text-warning-600 dark:text-warning-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-warning-700 dark:text-warning-400">
              فقط {stock} عدد باقی مانده!
            </p>
            <p className="text-[10px] text-warning-600 dark:text-warning-400/80">
              هر چه سریع‌تر سفارش خود را ثبت کنید
            </p>
          </div>
        </div>
      );
    }

    // Out of Stock
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 bg-error-50 dark:bg-error-900/20',
          'rounded-lg border border-error-200 dark:border-error-800',
          'font-sans',
          className
        )}
      >
        <XCircle className="w-4 h-4 text-error-600 dark:text-error-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-error-700 dark:text-error-400">ناموجود</p>
          <p className="text-[10px] text-error-600 dark:text-error-400/80">
            این محصول فعلاً موجود نیست
          </p>
        </div>
      </div>
    );
  }

  // ==================== حالت full (کادر کامل با آمار) ====================
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700',
        'rounded-xl p-3 font-sans',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">وضعیت موجودی</span>
        {isOutOfStock ? (
          <span className="text-xs font-bold text-error-600 dark:text-error-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            ناموجود
          </span>
        ) : isLowStock ? (
          <span className="text-xs font-bold text-warning-600 dark:text-warning-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            کم‌موجود
          </span>
        ) : (
          <span className="text-xs font-bold text-success-600 dark:text-success-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            موجود
          </span>
        )}
      </div>

      {/* Progress bar برای موجودی */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOutOfStock && 'bg-error-500',
              isLowStock && 'bg-warning-500',
              isInStock && 'bg-success-500'
            )}
            style={{ width: `${Math.min((stock / (lowStockThreshold * 2)) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-12 text-left">
          {stock} عدد
        </span>
      </div>

      {/* Low Stock Warning */}
      {isLowStock && (
        <p className="text-[10px] text-warning-600 dark:text-warning-400 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          فقط {stock} عدد باقی مانده - هر چه سریع‌تر سفارش دهید
        </p>
      )}
    </div>
  );
}