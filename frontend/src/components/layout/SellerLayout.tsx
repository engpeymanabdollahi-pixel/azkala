import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, Package, ShoppingBag, CreditCard, LogOut, Store,
  ArrowLeft, ChevronDown, Bell, User, HelpCircle, Search, Command,
  Home, Star, TrendingUp, CheckCircle2, Eye, Shield, ExternalLink,
  PanelLeftClose, PanelLeftOpen, MessageSquare, Settings, Sparkles,
  Moon, Sun,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

// ==================== Avatar Component ====================
const Avatar = ({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const initial = (name || 'ف').charAt(0);
  const sizeClasses = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div className={cn(
      'bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-black shadow-md flex-shrink-0 ring-2 ring-white dark:ring-slate-800',
      sizeClasses[size]
    )}>
      {initial}
    </div>
  );
};

// ==================== Progress Bar Component ====================
const HealthBar = ({ value }: { value: number }) => {
  const getColor = (v: number) => {
    if (v >= 90) return 'from-success-500 to-success-600';
    if (v >= 70) return 'from-warning-500 to-warning-600';
    return 'from-error-500 to-error-600';
  };

  return (
    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
      <div
        className={cn('h-full bg-gradient-to-r rounded-full transition-all duration-1000', getColor(value))}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

// ==================== Main Component ====================
export function SellerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const { user, seller, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setNotificationsOpen(false);
    setSidebarOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setSidebarOpen(false);
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pendingOrdersCount = 12;
  const newMessagesCount = 5;
  const pendingPayoutsCount = 2;

  const menuItems = [
    { path: '/seller', label: 'داشبورد', icon: LayoutDashboard, end: true, color: 'from-primary-500 to-primary-600', badge: null },
    { path: '/seller/products', label: 'محصولات من', icon: Package, color: 'from-accent-500 to-accent-600', badge: null },
    { path: '/seller/orders', label: 'سفارشات', icon: ShoppingBag, color: 'from-success-500 to-success-600', badge: pendingOrdersCount },
    { path: '/seller/payouts', label: 'تسویه حساب', icon: CreditCard, color: 'from-warning-500 to-warning-600', badge: pendingPayoutsCount },
     { 
      path: '/seller/settings', 
      label: 'تنظیمات فروشگاه', 
      icon: Settings, 
      color: 'from-gray-500 to-gray-600', 
      badge: null 
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success('با موفقیت از حساب خود خارج شدید', { icon: '👋' });
    navigate('/');
  };

  const shopName = seller?.shop_name || user?.name || 'فروشگاه من';
  const userName = user?.name || 'فروشنده';
  const userEmail = user?.email || '';
  const shopRating = seller?.rating?.toFixed(1) || '4.8';
  const healthScore = seller?.health_score || 98;
  const todaySales = 3500000;
  const todayOrders = 8;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            {/* ============ Sidebar ============ */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 bg-white dark:bg-slate-800 shadow-2xl border-l border-gray-100 dark:border-slate-700 transition-all duration-300 ease-in-out',
          'md:static md:translate-x-0 md:shadow-none',
          sidebarCollapsed ? 'md:w-20' : 'md:w-72 w-72',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
        aria-label="منوی کناری"
      >
        <div className="flex flex-col h-full">
          
          {/* ✅ Sidebar Header - زیبا سازی شده با لوگو و برند */}
          <div className={cn(
            'p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 shadow-sm relative',
            sidebarCollapsed && 'md:p-2'
          )}>
            <div className="flex items-center justify-between">
              {/* Right Side: Logo & Brand */}
              <div className={cn(
                "flex items-center gap-3 transition-all duration-300",
                sidebarCollapsed ? 'md:flex-col md:gap-2 md:items-center' : ''
              )}>
                
                {/* Logo Container */}
                <div 
                  className="relative group cursor-pointer transform hover:scale-105 transition-transform duration-300 flex-shrink-0" 
                  onClick={() => navigate('/seller')}
                  title="بازگشت به داشبورد"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 flex items-center justify-center text-white border border-white/20">
                    <Store className="w-6 h-6" />
                  </div>
                  {/* Online Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></div>
                </div>

                {/* Brand Text */}
                {!sidebarCollapsed && (
                  <div className="flex flex-col animate-fade-in overflow-hidden">
                    <h1 className="text-base font-black bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-transparent leading-tight">
                      پنل فروشندگان
                    </h1>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                      ازکالا | Azkala
                    </span>
                  </div>
                )}
              </div>

              {/* Left Side: Collapse Toggle (Desktop) */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all text-gray-500 hover:text-primary-600"
                  aria-label="جمع کردن منو"
                  title="جمع کردن منو"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              )}

              {/* Expand Toggle (Desktop - Collapsed Mode) */}
              {sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all text-gray-500 hover:text-primary-600 mx-auto mt-1"
                  aria-label="باز کردن منو"
                  title="باز کردن منو"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </button>
              )}

              {/* Mobile Close Button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all text-gray-600"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Shop Info Card */}
          <div className={cn(
            'bg-white dark:bg-slate-900 rounded-xl p-2 border border-gray-100 dark:border-slate-700 shadow-sm mx-2 mt-2',
            sidebarCollapsed && 'md:p-1.5 md:mx-1'
          )}>
            <div className={cn('flex items-center gap-2', sidebarCollapsed && 'md:flex-col md:gap-1')}>
              <Avatar name={shopName} size="sm" />
              <div className={cn('flex-1 min-w-0', sidebarCollapsed && 'md:hidden')}>
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{shopName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-warning-500 fill-warning-500" />
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold">{shopRating}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{healthScore}٪</span>
                </div>
                <div className="mt-1">
                  <HealthBar value={healthScore} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {!sidebarCollapsed && (
            <div className="px-3 pt-3 pb-1">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-gradient-to-br from-success-50 to-white dark:from-success-900/20 dark:to-slate-800 border border-success-100 dark:border-success-800/30 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <TrendingUp className="w-3 h-3 text-success-600 dark:text-success-400" />
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">فروش امروز</span>
                  </div>
                  <p className="font-black text-gray-900 dark:text-white text-xs truncate">
                    {(todaySales / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 border border-primary-100 dark:border-primary-800/30 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <ShoppingBag className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">سفارشات</span>
                  </div>
                  <p className="font-black text-gray-900 dark:text-white text-xs">{todayOrders} عدد</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Menu */}
          <nav className={cn(
            'flex-1 p-2 space-y-0.5 overflow-y-auto',
            sidebarCollapsed && 'md:px-1.5'
          )} aria-label="منوی اصلی">
            <p className={cn(
              'text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1.5 px-2',
              sidebarCollapsed && 'md:text-center md:px-0'
            )}>
              {sidebarCollapsed ? '•' : 'منوی اصلی'}
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden',
                      sidebarCollapsed ? 'md:justify-center md:p-2.5' : 'gap-3 px-3 py-2.5',
                      isActive
                        ? `bg-gradient-to-l ${item.color} text-white shadow-lg`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        'rounded-lg flex items-center justify-center transition-all flex-shrink-0 relative',
                        sidebarCollapsed ? 'md:w-10 md:h-10' : 'w-9 h-9',
                        isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-white dark:group-hover:bg-slate-600'
                      )}>
                        <Icon className={cn(sidebarCollapsed ? 'md:w-5 md:h-5' : 'w-5 h-5')} />
                        {item.badge && !isActive && (
                          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-error-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-800">
                            {item.badge}
                          </span>
                        )}
                        {item.badge && isActive && (
                          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-white text-primary-600 text-[9px] font-black rounded-full flex items-center justify-center px-1">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className={cn('flex-1', sidebarCollapsed && 'md:hidden')}>{item.label}</span>
                      {isActive && !sidebarCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full md:hidden" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className={cn(
            'border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50',
            sidebarCollapsed && 'md:px-1.5'
          )}>
            
            {/* View Store Link */}
            {!sidebarCollapsed && (
              <div className="p-2">
                <button
                  onClick={() => { 
                    setUserMenuOpen(false); 
                    const storeSlug = seller?.slug || user?.slug || '';
                    if (storeSlug) navigate(`/seller/${storeSlug}`); 
                    else toast.error('آدرس فروشگاه یافت نشد');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded-xl transition-all text-right shadow-sm"
                >
                  <Store className="w-4 h-4 text-accent-600 dark:text-accent-400 flex-shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">مشاهده فروشگاه</span>
                  <ArrowLeft className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <div className={cn('p-2', sidebarCollapsed && 'md:p-1.5')}>
              <button
                onClick={toggleDarkMode}
                title={sidebarCollapsed ? (isDarkMode ? 'حالت روشن' : 'حالت تاریک') : undefined}
                className={cn(
                  'flex items-center w-full rounded-xl text-sm font-semibold transition-all group',
                  isDarkMode 
                    ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700',
                  sidebarCollapsed ? 'md:justify-center md:p-2.5' : 'gap-3 px-3 py-2.5'
                )}
                aria-label={isDarkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
              >
                <div className={cn(
                  'rounded-lg flex items-center justify-center transition-all',
                  isDarkMode 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50' 
                    : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-gray-200 dark:group-hover:bg-slate-600',
                  sidebarCollapsed ? 'md:w-10 md:h-10' : 'w-9 h-9'
                )}>
                  {isDarkMode ? (
                    <Sun className={cn('text-yellow-500 transition-transform duration-500', sidebarCollapsed ? 'md:w-5 md:h-5' : 'w-5 h-5')} />
                  ) : (
                    <Moon className={cn('text-gray-600 dark:text-gray-300 transition-transform duration-500', sidebarCollapsed ? 'md:w-5 md:h-5' : 'w-5 h-5')} />
                  )}
                </div>
                <span className={cn('flex-1 text-right', sidebarCollapsed && 'md:hidden')}>
                  {isDarkMode ? 'حالت روشن' : 'حالت تاریک'}
                </span>
              </button>
            </div>

            {/* Logout */}
            <div className={cn('p-2 pt-0', sidebarCollapsed && 'md:p-1.5')}>
              <button
                onClick={handleLogout}
                title={sidebarCollapsed ? 'خروج از حساب' : undefined}
                className={cn(
                  'flex items-center w-full rounded-xl text-sm font-semibold text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all group',
                  sidebarCollapsed ? 'md:justify-center md:p-2.5' : 'gap-3 px-3 py-2.5'
                )}
                aria-label="خروج از حساب"
              >
                <div className={cn(
                  'bg-error-100 dark:bg-error-900/30 rounded-lg flex items-center justify-center group-hover:bg-error-200 dark:group-hover:bg-error-900/50 transition-colors',
                  sidebarCollapsed ? 'md:w-10 md:h-10' : 'w-9 h-9'
                )}>
                  <LogOut className={cn(sidebarCollapsed ? 'md:w-5 md:h-5' : 'w-5 h-5')} />
                </div>
                <span className={cn(sidebarCollapsed && 'md:hidden')}>خروج از حساب</span>
              </button>
            </div>

            {/* Support & Version */}
            <div className={cn('p-2 pt-0', sidebarCollapsed && 'md:p-1.5')}>
              <button
                onClick={() => navigate('/help')}
                title={sidebarCollapsed ? 'راهنما و پشتیبانی' : undefined}
                className={cn(
                  'flex items-center w-full rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm',
                  sidebarCollapsed ? 'md:justify-center md:p-2.5' : 'gap-3 px-3 py-2.5'
                )}
              >
                <div className={cn(
                  'bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center',
                  sidebarCollapsed ? 'md:w-10 md:h-10' : 'w-9 h-9'
                )}>
                  <HelpCircle className={cn(sidebarCollapsed ? 'md:w-5 md:h-5' : 'w-5 h-5 text-gray-600 dark:text-gray-400')} />
                </div>
                <span className={cn(sidebarCollapsed && 'md:hidden')}>راهنما</span>
              </button>
              
              {!sidebarCollapsed && (
                <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <Sparkles className="w-3 h-3 text-primary-500 dark:text-primary-400" />
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold">
                    ازکالا نسخه 1.0.0
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
      {/* ============ Main Content ============ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ============ Top Header ============ */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-700 sticky top-0 z-30 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between px-3 md:px-5 py-2.5 gap-2">

            {/* Right Side */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                aria-label="باز کردن منو"
              >
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              <Link
                to="/"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-l from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 hover:from-primary-100 hover:to-accent-100 dark:hover:from-primary-900/30 dark:hover:to-accent-900/30 border border-primary-200 dark:border-primary-800 hover:border-primary-300 dark:hover:border-primary-700 transition-all group flex-shrink-0"
                title="بازگشت به صفحه اصلی ازکالا"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <div className="hidden lg:block">
                  <p className="font-bold text-gray-900 dark:text-white text-xs">ازکالا</p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400">صفحه اصلی</p>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-600 dark:text-primary-400 hidden lg:block" />
              </Link>

              <button
                onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="hidden md:flex items-center gap-2 flex-1 max-w-md px-3 py-2 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg transition-all text-right group"
              >
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors" />
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">جستجو در محصولات، سفارشات...</span>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                  <Command className="w-2.5 h-2.5" />
                  <span>K</span>
                </div>
              </button>
            </div>

            {/* Left Side */}
            <div className="flex items-center gap-1.5 md:gap-2">

              <button
                onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                aria-label="جستجو"
              >
                <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all group"
                  aria-label="اعلان‌ها"
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                  {newMessagesCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-error-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 animate-pulse shadow-lg ring-2 ring-white dark:ring-slate-800">
                      {newMessagesCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-down">
                    <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-l from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 flex items-center justify-between">
                      <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        اعلان‌ها
                      </h3>
                      <Badge variant="error" size="sm">{newMessagesCount} جدید</Badge>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {[
                        { id: 1, title: 'سفارش جدید', message: 'سفارش #AZK-12345 ثبت شد', time: '۵ دقیقه پیش', icon: ShoppingBag, color: 'primary' },
                        { id: 2, title: 'تسویه حساب', message: 'مبلغ ۱,۲۵۰,۰۰۰ تومان واریز شد', time: '۱ ساعت پیش', icon: CreditCard, color: 'success' },
                        { id: 3, title: 'نظر جدید', message: 'مشتری به محصول شما امتیاز ۵ داد', time: '۳ ساعت پیش', icon: Star, color: 'warning' },
                        { id: 4, title: 'پیام جدید', message: 'مشتری درباره سفارش سوال پرسید', time: '۵ ساعت پیش', icon: MessageSquare, color: 'primary' },
                      ].map((notif) => {
                        const Icon = notif.icon;
                        return (
                          <button
                            key={notif.id}
                            className="w-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-50 dark:border-slate-700 text-right flex items-start gap-2"
                          >
                            <div className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm',
                              notif.color === 'primary' && 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
                              notif.color === 'success' && 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
                              notif.color === 'warning' && 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400'
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-900 dark:text-white">{notif.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{notif.time}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="w-full p-2.5 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-bold transition-colors border-t border-gray-100 dark:border-slate-700"
                    >
                      مشاهده همه اعلان‌ها
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-slate-700" />

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all group"
                  aria-label="منوی کاربر"
                  aria-expanded={userMenuOpen}
                >
                  <div className="hidden md:block text-right">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{userName}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{userEmail}</p>
                  </div>
                  <div className="relative">
                    <Avatar name={shopName} size="sm" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 rounded-full border-2 border-white dark:border-slate-800" />
                  </div>
                  <ChevronDown className={cn(
                    'w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-300 hidden md:block',
                    userMenuOpen && 'rotate-180'
                  )} />
                </button>

                {userMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-down">
                    <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-l from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          <Avatar name={shopName} size="md" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full border-2 border-white dark:border-slate-800" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 dark:text-white text-sm truncate">{shopName}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{userEmail}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex items-center gap-0.5 bg-warning-50 dark:bg-warning-900/30 px-1.5 py-0.5 rounded">
                              <Star className="w-3 h-3 text-warning-500 fill-warning-500" />
                              <span className="text-[10px] font-bold text-warning-700 dark:text-warning-400">{shopRating}</span>
                            </div>
                            <Badge variant="success" size="sm" className="text-[10px] py-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              فعال
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="py-1.5">
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-right"
                      >
                        <User className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">پروفایل من</span>
                        <ArrowLeft className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/seller/settings'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-right"
                      >
                        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">تنظیمات</span>
                        <ArrowLeft className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-right"
                      >
                        <Eye className="w-4 h-4 text-accent-600 dark:text-accent-400 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">مشاهده فروشگاه</span>
                        <ArrowLeft className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/help'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-right"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">راهنما و پشتیبانی</span>
                        <ArrowLeft className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-700 pt-1.5 pb-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-error-50 dark:hover:bg-error-900/20 text-error-600 dark:text-error-400 transition-colors text-right"
                      >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-sm font-semibold">خروج از حساب</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="hidden lg:flex items-center justify-between px-5 py-1.5 bg-gradient-to-l from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 border-t border-gray-100 dark:border-slate-700 text-[11px] transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" />
                <span>آنلاین</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <ShoppingBag className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                <span>{pendingOrdersCount} سفارش در انتظار</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <TrendingUp className="w-3 h-3 text-success-600 dark:text-success-400" />
                <span>فروش امروز: {new Intl.NumberFormat('fa-IR').format(todaySales)} تومان</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Shield className="w-3 h-3 text-primary-600 dark:text-primary-400" />
              <span>سلامت فروشگاه: {healthScore}٪</span>
            </div>
          </div>
        </header>

        {/* ============ Page Content ============ */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ============ Global Search Modal ============ */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start justify-center pt-20 animate-fade-in"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 w-full max-w-2xl mx-4 overflow-hidden animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-700">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="جستجو در محصولات، سفارشات، کاربران..."
                className="flex-1 bg-transparent outline-none text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">پیشنهادات</p>
              <div className="space-y-1">
                {[
                  { icon: Package, label: 'محصولات', desc: 'مشاهده همه محصولات', path: '/seller/products' },
                  { icon: ShoppingBag, label: 'سفارشات', desc: 'مدیریت سفارشات', path: '/seller/orders' },
                  { icon: CreditCard, label: 'تسویه حساب', desc: 'مدیریت پرداخت‌ها', path: '/seller/payouts' },
                  { icon: LayoutDashboard, label: 'داشبورد', desc: 'بازگشت به داشبورد', path: '/seller' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => { navigate(item.path); setSearchOpen(false); }}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-right"
                    >
                      <div className="w-9 h-9 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <ArrowLeft className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded">↑</kbd><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded">↓</kbd> برای پیمایش</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded">↵</kbd> برای انتخاب</span>
              </div>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded">ESC</kbd> بستن</span>
            </div>
          </div>
        </div>
      )}

      {/* ============ Sidebar Overlay (Mobile) ============ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}