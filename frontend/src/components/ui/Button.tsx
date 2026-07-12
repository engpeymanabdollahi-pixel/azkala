import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 
      'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 active:from-primary-700 active:to-primary-800 shadow-lg shadow-primary-500/30',
    secondary: 
      'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300',
    outline: 
      'bg-transparent border-2 border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
    ghost: 
      'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    danger: 
      'bg-gradient-to-r from-error-500 to-error-600 text-white hover:from-error-600 hover:to-error-700 active:from-error-700 active:to-error-800 shadow-lg shadow-error-500/30',
    accent: 
      'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 active:from-accent-700 active:to-accent-800 shadow-lg shadow-accent-500/30',
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-2.5',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        'hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>در حال بارگذاری...</span>
        </>
      ) : (
        <>
          {!isLoading && leftIcon}
          {children}
          {!isLoading && rightIcon}
        </>
      )}
    </button>
  );
}