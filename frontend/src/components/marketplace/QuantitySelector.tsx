import { useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Props برای QuantitySelector
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 */
export interface QuantitySelectorProps {
  /** تعداد فعلی */
  quantity: number;
  /** callback برای تغییر تعداد */
  onQuantityChange: (newQuantity: number) => void;
  /** حداکثر موجودی (محدودیت افزایش) */
  maxStock: number;
  /** حداقل تعداد (پیش‌فرض: 1) */
  minQuantity?: number;
  /** غیرفعال بودن کامل */
  disabled?: boolean;
  /** کلاس اضافی */
  className?: string;
  /** اندازه: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * QuantitySelector - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * قابلیت‌ها:
 * - دکمه‌های +/- با محدودیت stock
 * - Disabled state در min/max
 * - RTL support
 * - Dark mode
 * - فونت Vazirmatn (font-sans)
 * 
 * مثال:
 * ```tsx
 * <QuantitySelector
 *   quantity={quantity}
 *   onQuantityChange={setQuantity}
 *   maxStock={product.stock}
 * />
 * ```
 */
export function QuantitySelector({
  quantity,
  onQuantityChange,
  maxStock,
  minQuantity = 1,
  disabled = false,
  className,
  size = 'md',
}: QuantitySelectorProps) {
  const sizeClasses = {
    sm: { button: 'w-7 h-7', icon: 'w-3.5 h-3.5', text: 'w-8 text-sm', container: 'p-0.5' },
    md: { button: 'w-8 h-8', icon: 'w-4 h-4', text: 'w-10 text-base', container: 'p-1' },
    lg: { button: 'w-10 h-10', icon: 'w-5 h-5', text: 'w-12 text-lg', container: 'p-1.5' },
  };
  const currentSize = sizeClasses[size];

  const handleDecrease = useCallback(() => {
    onQuantityChange(Math.max(minQuantity, quantity - 1));
  }, [quantity, minQuantity, onQuantityChange]);

  const handleIncrease = useCallback(() => {
    onQuantityChange(Math.min(maxStock, quantity + 1));
  }, [quantity, maxStock, onQuantityChange]);

  const isMinDisabled = disabled || quantity <= minQuantity;
  const isMaxDisabled = disabled || quantity >= maxStock;

  return (
    <div
      className={cn(
        'flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl font-sans',
        currentSize.container,
        className
      )}
    >
      {/* دکمه کاهش */}
      <button
        type="button"
        onClick={handleDecrease}
        disabled={isMinDisabled}
        className={cn(
          'flex items-center justify-center',
          'text-gray-900 dark:text-gray-100',
          'hover:bg-white dark:hover:bg-gray-700',
          'rounded-lg transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          currentSize.button
        )}
        aria-label="کاهش تعداد"
      >
        <Minus className={currentSize.icon} />
      </button>

      {/* نمایش تعداد */}
      <span
        className={cn(
          'text-center font-black text-gray-900 dark:text-gray-100',
          currentSize.text
        )}
      >
        {quantity}
      </span>

      {/* دکمه افزایش */}
      <button
        type="button"
        onClick={handleIncrease}
        disabled={isMaxDisabled}
        className={cn(
          'flex items-center justify-center',
          'text-gray-900 dark:text-gray-100',
          'hover:bg-white dark:hover:bg-gray-700',
          'rounded-lg transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          currentSize.button
        )}
        aria-label="افزایش تعداد"
      >
        <Plus className={currentSize.icon} />
      </button>
    </div>
  );
}