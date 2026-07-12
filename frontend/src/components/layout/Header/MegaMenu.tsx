import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, ChevronLeft, Flame, Percent, Sparkles, TrendingUp, ArrowLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { CATEGORIES } from './constants';

interface MegaMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const MegaMenu = memo(({ isOpen, onToggle, onClose }: MegaMenuProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="relative">
      <button
        onMouseEnter={() => onToggle()}
        onMouseLeave={() => onClose()}
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500',
          isOpen
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="دسته‌بندی محصولات"
      >
        <Menu className="w-4 h-4 flex-shrink-0" />
        دسته‌بندی محصولات
        <ChevronDown className={cn('w-4 h-4 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          onMouseEnter={() => onToggle()}
          onMouseLeave={() => onClose()}
          className="absolute top-full left-0 mt-2 w-[1000px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-30 animate-slide-down overflow-hidden"
          role="menu"
          aria-label="منوی دسته‌بندی‌ها"
        >
          <div className="flex">
            {/* Categories Grid */}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-3 gap-6">
                {CATEGORIES.map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-gray-100 dark:border-slate-700">
                      <div className={cn(
                        'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md',
                        category.color
                      )}>
                        {category.icon}
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white">{category.name}</h3>
                    </div>
                    <div className="space-y-0.5">
                      {category.subcategories.map((subcat, index) => (
                        <button
                          key={index}
                          onClick={() => handleNavigate(subcat.path)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all text-right group focus:outline-none focus:bg-primary-50 dark:focus:bg-primary-900/20"
                          role="menuitem"
                        >
                          <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">{subcat.icon}</span>
                          <span className="flex-1 text-right whitespace-nowrap">{subcat.name}</span>
                          <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotions Sidebar */}
            <div className="w-64 bg-gradient-to-b from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-r border-gray-100 dark:border-slate-700 p-5 flex flex-col">
              <h4 className="font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-error-500" />
                پیشنهادات ویژه
              </h4>

              <div className="space-y-3 mb-4 flex-1">
                <button
                  onClick={() => handleNavigate('/products?discount=true')}
                  className="w-full bg-white dark:bg-slate-700 rounded-xl p-3 border border-gray-100 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="w-4 h-4 text-error-500" />
                    <span className="text-xs font-bold text-error-600 dark:text-error-400">تا ۵۰٪ تخفیف</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-right">تخفیف‌های شگفت‌انگیز امروز</p>
                </button>

                <button
                  onClick={() => handleNavigate('/products?new=true')}
                  className="w-full bg-white dark:bg-slate-700 rounded-xl p-3 border border-gray-100 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">جدیدترین‌ها</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-right">محصولات تازه وارد</p>
                </button>

                <button
                  onClick={() => handleNavigate('/products?bestseller=true')}
                  className="w-full bg-white dark:bg-slate-700 rounded-xl p-3 border border-gray-100 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-accent-500" />
                    <span className="text-xs font-bold text-accent-600 dark:text-accent-400">پرفروش‌ها</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-right">انتخاب هزاران خریدار</p>
                </button>
              </div>

              <button
                onClick={() => handleNavigate('/products')}
                className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-bold hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center justify-center gap-1.5 group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                مشاهده همه
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MegaMenu.displayName = 'MegaMenu';