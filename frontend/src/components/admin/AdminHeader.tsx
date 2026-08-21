import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Search, Sun, Moon, Home, ChevronLeft, Sparkles,
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Newspaper, Megaphone, BarChart3, MessageCircle, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

// نقشه مسیر به breadcrumb
const routeLabels: Record<string, { label: string; icon?: any }> = {
  '/admin': { label: 'داشبورد', icon: LayoutDashboard },
  '/admin/products': { label: 'محصولات', icon: Package },
  '/admin/orders': { label: 'سفارشات', icon: ShoppingCart },
  '/admin/users': { label: 'کاربران', icon: Users },
  '/admin/reviews': { label: 'نظرات' },
  '/admin/magazine': { label: 'مجله', icon: Newspaper },
  '/admin/ads': { label: 'تبلیغات', icon: Megaphone },
  '/admin/catalog': { label: 'کاتالوگ' },
  '/admin/coupons': { label: 'کدهای تخفیف' },
  '/admin/reports': { label: 'گزارشات', icon: BarChart3 },
  '/admin/communication': { label: 'ارتباطات', icon: MessageCircle },
  '/admin/settings': { label: 'تنظیمات', icon: Settings },
    '/admin/access-logs': { label: 'گزارش دسترسی‌ها', icon: ShieldCheck },
};

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // ساخت breadcrumb از مسیر فعلی
  const currentPath = location.pathname;
  const currentRoute = routeLabels[currentPath] || { label: '' };
  

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // می‌توانید به صفحه جستجوی global بروید
    navigate(`/admin/products?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 gap-4">
      {/* Right Side: Menu + Breadcrumb */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Breadcrumb - Desktop */}
        <div className="hidden md:flex items-center gap-2 text-sm min-w-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="صفحه اصلی سایت"
          >
            <Home className="h-4 w-4" />
            <span className="text-xs">ازکالا</span>
          </button>
          <ChevronLeft className="h-3 w-3 text-gray-400" />
          <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-semibold min-w-0">
            {currentRoute.icon && (
              <currentRoute.icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            )}
            <span className="truncate">{currentRoute.label}</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search (Desktop) */}
      <form
        onSubmit={handleSearch}
        className={cn(
          'hidden md:flex items-center gap-2 flex-1 max-w-md transition-all',
          searchFocused && 'max-w-lg'
        )}
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="جستجو در محصولات، کاربران، سفارشات..."
            className={cn(
              'w-full pr-10 pl-4 py-2 bg-gray-100 dark:bg-slate-800 border border-transparent rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500',
              'focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
              'transition-all'
            )}
          />
          <kbd className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded">
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Left Side: Actions */}
      <div className="flex items-center gap-1">
        {/* Mobile Search */}
        <button
          onClick={() => navigate('/admin/products')}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="جستجو"
        >
          <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Visit Site */}
        <button
          onClick={() => window.open('/', '_blank')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="مشاهده سایت"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>سایت</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}