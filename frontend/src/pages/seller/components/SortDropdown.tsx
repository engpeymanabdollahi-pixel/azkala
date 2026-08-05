/**
 * کامپوننت SortDropdown - منوی مرتب‌سازی محصولات
 * ویژگی‌ها:
 * - جدیدترین
 * - پربازدیدترین
 * - ارزان‌ترین
 * - گران‌ترین
 * - بیشترین تخفیف
 */

import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, TrendingUp, DollarSign, Tag, Star, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

type SortOption = 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'discount';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'newest', label: 'جدیدترین', icon: <Star className="w-4 h-4" /> },
  { value: 'popular', label: 'پربازدیدترین', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'price_asc', label: 'ارزان‌ترین', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'price_desc', label: 'گران‌ترین', icon: <DollarSign className="w-4 h-4 rotate-180" /> },
  { value: 'discount', label: 'بیشترین تخفیف', icon: <Tag className="w-4 h-4" /> },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // بستن dropdown هنگام کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = sortOptions.find(opt => opt.value === value) || sortOptions[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* دکمه اصلی */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl",
          "hover:border-primary-400 hover:shadow-md",
          "transition-all duration-200",
          isOpen ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200"
        )}
      >
        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">{selectedOption.label}</span>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* منوی dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50",
          "animate-in fade-in zoom-in-95 duration-200"
        )}>
          <div className="p-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  "transition-all duration-150",
                  value === option.value
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg",
                  value === option.value ? "bg-primary-200" : "bg-gray-100"
                )}>
                  {option.icon}
                </span>
                {option.label}
                {value === option.value && (
                  <span className="mr-auto">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { SortOption };
