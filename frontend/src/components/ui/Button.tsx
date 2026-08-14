import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Button Component برای ازکالا
 * 
 * بر اساس shadcn/ui + Radix Slot + cva
 * 
 * Features:
 * - ۸ variant: default, destructive, outline, secondary, ghost, link, accent, success
 * - ۸ size: default, xs, sm, md, lg, icon, icon-sm, icon-xs
 * - asChild برای polymorphism (با Slot)
 * - isLoading برای نمایش spinner
 * - کاملاً RTL-friendly
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-600/20',
        destructive: 'bg-error-600 text-white hover:bg-error-700 shadow-sm shadow-error-600/20',
        outline: 'border border-gray-300 dark:border-slate-600 bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200',
        secondary: 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-600',
        ghost: 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200',
        link: 'text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline',
        // ✨ Brand ازکالا - Accent Gradient
        accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 shadow-md shadow-accent-500/30 font-bold',
        // ✨ Success (برای تأیید، خرید و...)
        success: 'bg-success-600 text-white hover:bg-success-700 shadow-sm shadow-success-600/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-10 px-4 py-2 text-sm rounded-xl', // ✨ Alias برای default با rounded بیشتر
        lg: 'h-11 px-6 text-base rounded-xl',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-xs': 'h-6 w-6 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * اگر true باشد، children را به‌عنوان child element render می‌کند (Slot)
   * مثال: <Button asChild><Link to="...">Click</Link></Button>
   */
  asChild?: boolean;
  /**
   * نمایش spinner و غیرفعال کردن دکمه هنگام loading
   */
  isLoading?: boolean;
  /**
   * متن loading (اختیاری - اگر نباشد فقط spinner)
   */
  loadingText?: string;
  /**
   * ✅ قبلاً هیچ‌کدام از این سه پراپ در ButtonProps تعریف نشده بودند، در
   * حالی که ~۲۰ جای مختلف پروژه (مودال‌های ادمین، FilterPanel، صفحه‌ی
   * تماس و...) از leftIcon/rightIcon/fullWidth روی Button استفاده
   * می‌کردند — چون این‌ها پراپ‌های شناخته‌شده‌ی HTML نیستند، React فقط با
   * warning کنسول نادیده‌شان می‌گرفت: آیکون‌ها اصلاً رندر نمی‌شدند و
   * دکمه‌های submit/cancel داخل مودال‌ها به‌جای تمام‌عرض، اندازه‌ی طبیعی
   * خودشان را می‌گرفتند.
   */
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };