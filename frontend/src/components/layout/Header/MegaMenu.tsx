import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Grid3x3, Sparkles, ArrowLeft, Layers } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCategories } from '@/hooks/useCategories';

interface MegaMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const MegaMenu = memo(({ isOpen, onToggle, onClose }: MegaMenuProps) => {
  const navigate = useNavigate();
  const { data: categories, isLoading } = useCategories();

  const handleNavigate = (slug: string) => {
    onClose();
    navigate(`/products?category=${slug}`);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => onToggle()}
      onMouseLeave={() => onClose()}
    >
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500',
          isOpen
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="دسته‌بندی محصولات"
      >
        <Grid3x3 className="w-4 h-4 flex-shrink-0" />
        دسته‌بندی کالاها
        <ChevronLeft className={cn('w-4 h-4 transition-transform flex-shrink-0', isOpen && '-rotate-90')} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[900px] max-w-[95vw] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden before:absolute before:-top-3 before:left-0 before:right-0 before:h-4 before:bg-transparent">
          
          {isLoading ? (
            <div className="p-4 grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-6 bg-gray-100 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 bg-gray-50 dark:bg-slate-700/50 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-50 dark:bg-slate-700/50 rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-gray-50 dark:bg-slate-700/50 rounded w-4/6 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex">
              {/* بخش اصلی دسته‌بندی‌ها (فشرده و بهینه) */}
              <div className="flex-1 p-4">
                <div className="grid grid-cols-4 gap-4">
                  {categories?.map((category) => (
                    <div key={category.id} className="group/category">
                      {/* هدر دسته‌بندی والد */}
                      <div 
                        className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100 dark:border-slate-700 cursor-pointer"
                        onClick={() => handleNavigate(category.slug)}
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-5 h-5 object-contain" />
                          ) : (
                            <Layers className="w-4 h-4" />
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-xs group-hover/category:text-primary-600 dark:group-hover/category:text-primary-400 transition-colors truncate">
                          {category.name}
                        </h3>
                      </div>
                      
                      {/* زیردسته‌ها (حداکثر ۵ مورد برای جلوگیری از اسکرول) */}
                      <ul className="space-y-0.5">
                        {category.children?.slice(0, 5).map((subcat) => (
                          <li key={subcat.id}>
                            <button
                              onClick={() => handleNavigate(subcat.slug)}
                              className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all text-right group"
                            >
                              <span className="flex-1 text-right truncate">{subcat.name}</span>
                              <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-primary-500" />
                            </button>
                          </li>
                        ))}
                        
                        {/* لینک مشاهده همه اگر زیردسته‌ها بیشتر از ۵ تا بود */}
                        {category.children && category.children.length > 5 && (
                          <li>
                            <button 
                              onClick={() => handleNavigate(category.slug)}
                              className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all mt-1"
                            >
                              مشاهده همه
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* ستون کناری پیشنهادات ویژه (فشرده‌تر) */}
              <div className="w-56 bg-gradient-to-b from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-r border-gray-100 dark:border-slate-700 p-4 flex flex-col">
                <h4 className="font-black text-gray-900 dark:text-white mb-3 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-accent-500" />
                  پیشنهاد ازکالا
                </h4>

                <div className="space-y-2 mb-3 flex-1">
                  <button
                    onClick={() => { onClose(); navigate('/products?discount=true'); }}
                    className="w-full bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-gray-100 dark:border-slate-700 hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-sm transition-all group text-right"
                  >
                    <p className="text-[10px] font-bold text-accent-600 dark:text-accent-400 mb-0.5">شگفت‌انگیزها</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">تخفیف‌های ویژه امروز</p>
                  </button>

                  <button
                    onClick={() => { onClose(); navigate('/products?new=true'); }}
                    className="w-full bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group text-right"
                  >
                    <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 mb-0.5">جدیدترین‌ها</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">محصولات تازه رسیده</p>
                  </button>
                </div>

                <button
                  onClick={() => { onClose(); navigate('/products'); }}
                  className="w-full py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-[11px] font-bold hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm flex items-center justify-center gap-1.5 group"
                >
                  فروشگاه
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MegaMenu.displayName = 'MegaMenu';