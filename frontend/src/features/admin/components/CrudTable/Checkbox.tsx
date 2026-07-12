import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  className,
  ...props
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'peer h-5 w-5 shrink-0 rounded-md border-2 border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
        checked && 'bg-primary-500 border-primary-500 text-white',
        className
      )}
      {...props}
    >
      {checked && (
        <div className="flex items-center justify-center text-current">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}
    </button>
  );
}