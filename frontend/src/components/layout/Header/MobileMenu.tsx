import { memo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Smartphone, ChevronLeft, ArrowLeft, Store, User, LogOut, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { MOBILE_MENU_ITEMS, SECONDARY_MENU_ITEMS, CATEGORIES } from './constants';
import type { UserData } from './types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const MobileMenu = memo(({ isOpen, onClose, user, isAuthenticated, onLogout }: MobileMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'main' | 'categories'>('main');

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.includes('?')) return location.pathname.startsWith(path.split('?')[0]);
    return location.pathname.startsWith(path);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 w-[320px] max-w-[85vw] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="منوی موبایل"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-900 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="font-black text-xl text-primary-600 dark:text-primary-400">از</span>
                <span className="font-black text-xl text-gray-900 dark:text-white">کالا</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">مارکت‌پلیس لوازم جانبی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-all hover:rotate-90 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* User Profile Section */}
        {isAuthenticated && user ? (
          <div className="p-4 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-900 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary-500/30 flex-shrink-0 ring-2 ring-white dark:ring-slate-800">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.email}</p>
                <div className="flex gap-1.5 mt-1.5">
                  {user.role === 'seller' && (
                    <Badge variant="accent" size="sm">
                      <Store className="w-3 h-3" />
                      فروشنده
                    </Badge>
                  )}
                  <Badge variant="success" size="sm">
                    <CheckCircle className="w-3 h-3" />
                    فعال
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-900 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
            <button
              onClick={() => handleNavigate('/auth')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <User className="w-4 h-4" />
              ورود / ثبت‌نام
            </button>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => setActiveSection('main')}
            className={cn(
              'flex-1 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
              activeSection === 'main'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            )}
            aria-selected={activeSection === 'main'}
            role="tab"
          >
            منوی اصلی
          </button>
          <button
            onClick={() => setActiveSection('categories')}
            className={cn(
              'flex-1 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
              activeSection === 'categories'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            )}
            aria-selected={activeSection === 'categories'}
            role="tab"
          >
            دسته‌بندی‌ها
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === 'main' ? (
            <div className="py-3">
              {MOBILE_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-5 py-3.5 text-right transition-all duration-200 focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-800',
                      isActive(item.path)
                        ? 'bg-gradient-to-l from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 text-primary-700 dark:text-primary-400 border-r-4 border-primary-600 dark:border-primary-400 font-bold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0 transition-transform',
                      isActive(item.path) ? item.color : 'from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700'
                    )}>
                      <Icon className={cn(
                        'w-5 h-5',
                        isActive(item.path) ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      )} />
                    </div>
                    <span className="font-semibold flex-1 text-right">{item.label}</span>
                    <ChevronLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                );
              })}

              <div className="my-3 border-t border-gray-100 dark:border-slate-800 mx-5" />

              <p className="px-5 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">سایر</p>
              {SECONDARY_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-5 py-3 text-right transition-all focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-800',
                      isActive(item.path)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-r-4 border-primary-600 dark:border-primary-400 font-bold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium flex-1 text-right">{item.label}</span>
                    <ChevronLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                );
              })}

              {isAuthenticated && user?.role === 'seller' && (
                <>
                  <div className="my-3 border-t border-gray-100 dark:border-slate-800 mx-5" />
                  <button
                    onClick={() => handleNavigate('/seller')}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-right bg-gradient-to-l from-accent-50 to-white dark:from-accent-900/20 dark:to-slate-900 hover:from-accent-100 dark:hover:from-accent-800/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-inset"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <span className="font-black text-accent-700 dark:text-accent-400 block">پنل فروشنده</span>
                      <span className="text-xs text-accent-600 dark:text-accent-500">مدیریت فروشگاه</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="py-3">
              {CATEGORIES.map((category) => (
                <div key={category.id} className="mb-4">
                  <div className="flex items-center gap-2.5 px-5 py-2 mb-1">
                    <div className={cn(
                      'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-md',
                      category.color
                    )}>
                      {category.icon}
                    </div>
                    <h4 className="font-black text-gray-900 dark:text-white text-sm">{category.name}</h4>
                  </div>
                  <div className="space-y-0.5 pr-4">
                    {category.subcategories.map((subcat, index) => (
                      <button
                        key={index}
                        onClick={() => handleNavigate(subcat.path)}
                        className="w-full flex items-center gap-2.5 px-5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-right focus:outline-none focus:bg-primary-50 dark:focus:bg-primary-900/20"
                      >
                        <span className="text-base">{subcat.icon}</span>
                        <span className="flex-1 text-right">{subcat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0">
          {isAuthenticated && (
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-error-500 to-error-600 text-white rounded-xl font-bold hover:from-error-600 hover:to-error-700 transition-all shadow-lg shadow-error-500/30 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
              >
                <LogOut className="w-4 h-4" />
                خروج از حساب
              </button>
            </div>
          )}

          <div className="p-4 bg-gradient-to-t from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900 border-t border-gray-200 dark:border-slate-700 text-center text-xs text-gray-600 dark:text-gray-400">
            <p className="font-bold">ازکالا - مارکت‌پلیس لوازم جانبی</p>
            <p className="mt-1.5">پشتیبانی: ۰۲۱-۱۲۳۴۵۶۷۸</p>
          </div>
        </div>
      </div>
    </>
  );
});

MobileMenu.displayName = 'MobileMenu';