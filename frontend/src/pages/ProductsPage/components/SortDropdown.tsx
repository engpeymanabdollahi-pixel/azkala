import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SORT_OPTIONS } from '../constants';
import type { SortOption } from '../types';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

/**
 * Dropdown مرتب‌سازی محصولات
 */
export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentOption = SORT_OPTIONS.find((o) => o.value === value)!;
  const Icon = currentOption.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:border-primary-400 transition-all whitespace-nowrap"
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{currentOption.label}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 animate-slide-down">
            {SORT_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full text-right px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2',
                    value === opt.value ? 'text-primary-600 font-bold bg-primary-50' : 'text-gray-700'
                  )}
                >
                  <OptIcon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
export default SortDropdown;
