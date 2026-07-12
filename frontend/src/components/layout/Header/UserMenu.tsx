import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Store, ArrowLeft, ChevronLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { USER_MENU_ITEMS } from './constants';
import type { UserData } from './types';

interface UserMenuProps {
  user: UserData;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}

export const UserMenu = memo(({ user, isOpen, onToggle, onClose, onLogout }: UserMenuProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleSellerPanel = () => {
    onClose();
    navigate('/seller');
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-2 lg:px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="منوی کاربر"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary-500/30 ring-2 ring-white dark:ring-slate-800">
          {user.name?.charAt(0) || 'U'}
        </div>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 hidden lg:block max-w-[120px] truncate">
          {user.name}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 dark:text-gray-400 hidden lg:block transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 py-2 z-30 animate-slide-down overflow-hidden"
          role="menu"
          aria-label="منوی کاربر"
        >
          {/* User Info Header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/30">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {user.role === 'seller' && (
                <Badge variant="accent" size="sm" className="flex-1 justify-center">
                  <Store className="w-3 h-3" />
                  فروشنده
                </Badge>
              )}
              <Badge variant="success" size="sm" className="flex-1 justify-center">
                <CheckCircle className="w-3 h-3" />
                تایید شده
              </Badge>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2" role="menuitem">
            {USER_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-700"
                  role="menuitem"
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', item.color)} />
                  <span className="flex-1 text-right">{item.label}</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                </button>
              );
            })}

            {user.role === 'seller' && (
              <>
                <div className="border-t border-gray-100 dark:border-slate-700 my-2" />
                <button
                  onClick={handleSellerPanel}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-accent-50 dark:hover:bg-accent-900/20 text-sm text-accent-700 dark:text-accent-400 font-bold transition-colors focus:outline-none focus:bg-accent-50 dark:focus:bg-accent-900/20"
                  role="menuitem"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-md">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <span className="flex-1 text-right">پنل فروشنده</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 dark:border-slate-700 pt-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-error-50 dark:hover:bg-error-900/20 text-sm text-error-600 dark:text-error-400 transition-colors focus:outline-none focus:bg-error-50 dark:focus:bg-error-900/20"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>خروج از حساب</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserMenu.displayName = 'UserMenu';