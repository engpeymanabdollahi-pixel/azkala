import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  fullWidth = true,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-sm font-semibold text-gray-700 flex items-center gap-1"
        >
          {label}
          {props.required && <span className="text-error-500 text-lg leading-none">*</span>}
        </label>
      )}
      <div className="relative group">
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
            {rightIcon}
          </div>
        )}
        <input
          {...props}
          id={inputId}
          className={cn(
            'w-full rounded-xl border-2 bg-white px-4 py-3 text-gray-900 text-sm',
            'placeholder:text-gray-400',
            'border-gray-200',
            'focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none',
            'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200',
            'transition-all duration-200',
            rightIcon && 'pr-11',
            leftIcon && 'pl-11',
            error && 'border-error-400 focus:border-error-500 focus:ring-error-100',
            className
          )}
        />
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
            {leftIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-error-500 font-medium flex items-center gap-1 animate-fade-in">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}