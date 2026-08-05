import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps {
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  // ✅ چند جای فرانت‌اند (مثل FilterTags.tsx) از قبل Badge را به‌عنوان یک
  // چیپ قابل‌کلیک با onClick استفاده می‌کردند، ولی این prop اصلاً در تایپ
  // تعریف نشده و به هیچ‌جا پاس داده نمی‌شد — پس کلیک روی آن چیپ‌ها
  // (مثلاً برای حذف یک فیلتر فعال) هیچ اثری نداشت.
  onClick?: () => void;
}

export function Badge({
  variant = 'primary',
  size = 'md',
  children,
  className,
  icon,
  onClick,
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800',
    accent: 'bg-accent-100 text-accent-700 border-accent-200 dark:bg-accent-900/30 dark:text-accent-300 dark:border-accent-800',
    success: 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/30 dark:text-success-300 dark:border-success-800',
    warning: 'bg-warning-50 text-warning-600 border-warning-200 dark:bg-warning-900/30 dark:text-warning-300 dark:border-warning-800',
    error: 'bg-error-50 text-error-700 border-error-200 dark:bg-error-900/30 dark:text-error-300 dark:border-error-800',
    gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border transition-all',
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}