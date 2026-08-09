import { useState } from 'react';
import { Bell, BellRing, BellOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useProductAlertStatus } from '@/hooks/api/useAlertApi';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { AlertModal } from './AlertModal';
import type { Product } from '@/types/models';

interface ProductAlertButtonProps {
  product: Product;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'full';
}

/**
 * کامپوننت دکمه هشدار محصول
 * 
 * - با کلیک، AlertModal باز می‌شود
 * - کاربر می‌تواند نوع هشدار را انتخاب کند:
 *   • Restock (اگر ناموجود)
 *   • Price Drop با درصد تخفیف
 *   • Target Price با قیمت هدف
 * - اگر کاربر لاگین نباشد، modal login باز می‌شود
 */
export function ProductAlertButton({
  product,
  className,
  size = 'md',
  variant = 'icon'
}: ProductAlertButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openAuthModal = useAuthModalStore((state) => state.open);
  
  const { hasAnyAlert, isLoading: isStatusLoading } = useProductAlertStatus(product.id);

  // تعیین حالت بر اساس موجودی
  const isOutOfStock = product.stock === 0;

  // متن‌ها بر اساس حالت
  const config = isOutOfStock
    ? {
        label: hasAnyAlert ? 'هشدار فعال است' : 'موجود شد خبرم کن',
        tooltip: hasAnyAlert ? 'مشاهده هشدارهای فعال' : 'با شارژ مجدد، به شما اطلاع می‌دهیم',
        activeColor: 'text-success-600 border-success-500 bg-success-50 dark:bg-success-900/20',
      }
    : {
        label: hasAnyAlert ? 'هشدار فعال است' : 'هشدار کاهش قیمت',
        tooltip: hasAnyAlert ? 'مشاهده هشدارهای فعال' : 'با تخفیف یا کاهش قیمت، به شما اطلاع می‌دهیم',
        activeColor: 'text-primary-600 border-primary-500 bg-primary-50 dark:bg-primary-900/20',
      };

  // آیکون بر اساس حالت
  const Icon = hasAnyAlert ? BellRing : (isOutOfStock ? BellOff : Bell);

  // سایزها
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Handle click
  const handleClick = () => {
    if (!isAuthenticated) {
      openAuthModal({
        reason: 'برای ثبت هشدار محصول باید وارد حساب کاربری شوید'
      });
      return;
    }
    setIsModalOpen(true);
  };

  // ========================================
  // حالت Icon Only (برای ProductDetailPage)
  // ========================================
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isStatusLoading}
          title={config.tooltip}
          aria-label={config.label}
          className={cn(
            'relative rounded-full border-2 transition-all duration-300',
            'flex items-center justify-center',
            'hover:scale-110 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            sizeClasses[size],
            hasAnyAlert
              ? config.activeColor
              : 'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700',
            className
          )}
        >
          {isStatusLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Icon className={cn(iconSizes[size], 'transition-transform')} />
              
              {/* نشانگر هشدار فعال */}
              {hasAnyAlert && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-success-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  <BellRing className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </span>
              )}
            </>
          )}
        </button>

        {/* AlertModal */}
        <AlertModal
          product={product}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // ========================================
  // حالت Full (با متن)
  // ========================================
  return (
    <>
      <button
        onClick={handleClick}
        disabled={isStatusLoading}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl',
          'border-2 transition-all duration-300',
          'font-medium text-sm',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasAnyAlert
            ? config.activeColor
            : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700',
          className
        )}
      >
        {isStatusLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
        <span>{config.label}</span>
        
        {/* نشانگر هشدار فعال */}
        {hasAnyAlert && (
          <span className="flex items-center justify-center w-5 h-5 bg-success-500 rounded-full">
            <BellRing className="w-3 h-3 text-white" strokeWidth={3} />
          </span>
        )}
      </button>

      {/* AlertModal */}
      <AlertModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}