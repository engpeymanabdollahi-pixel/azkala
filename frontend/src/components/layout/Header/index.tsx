import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query'; // ✅ این خط را اضافه کنید
import { useNavigate, useLocation } from 'react-router-dom';
// ✅ قبلاً ۲۹ آیکون اضافه (بدون هیچ استفاده‌ای در JSX این فایل) اینجا ایمپورت
// می‌شد — فقط حجم باندل را زیاد می‌کرد. لیست زیر فقط آیکون‌های واقعاً استفاده‌شده است.
import {
  ShoppingCart, User, Menu, X, Smartphone,
  Store, Phone, Shield, Truck, Sparkles,
  TrendingUp, Gift, Moon, Sun, Heart,
} from 'lucide-react';
import { useModelStore, useCartStore, useAuthStore, useUIStore } from '@/store';
import { useWishlistStore } from '@/store/wishlistStore';
import { useChatStore } from '@/store/chatStore';
import { cn } from '@/utils/cn';
import { useAuthModalStore } from '@/store/authModalStore';
import apiClient from '@/services/api/client'; // ✅ این خط را اضافه کنید
import { STORAGE_URL } from '@/lib/apiConfig';

// Sub-components
import { SearchBar } from './SearchBar';
import { ModelSelector } from './ModelSelector';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserMenu } from './UserMenu';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { QuickAccess } from './QuickAccess';

// Hooks
import { useDarkMode } from './hooks/useDarkMode';
import { useScrollSpy } from './hooks/useScrollSpy';
import { useClickOutside } from './hooks/useClickOutside';

// Constants
import { NAV_ITEMS } from './constants';
import { isPathActive } from './utils';


// ==================== تابع کمکی تبدیل آدرس عکس ====================
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path.replace(/^storage\//, '')}`;
};

// ==================== Main Header Component ====================
export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Stores
  const { selectedModel, openModal } = useModelStore();
  const { getItemCount, openDrawer } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const { toggleChat } = useChatStore();

  // Custom Hooks
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { isScrolled, scrollDirection } = useScrollSpy();

  // State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
    // مودال حالا یک بار در App سوار می‌شود و وضعیتش سراسری است، تا هر صفحه‌ای
    // بتواند بازش کند — نه فقط هدر.
    const openAuthModal = useAuthModalStore((state) => state.open);

  // Refs
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useClickOutside(
    [userMenuRef, notificationsRef, megaMenuRef],
    useCallback(() => {
      setShowUserMenu(false);
      setShowNotifications(false);
      setShowMegaMenu(false);
    }, [])
  );

  // Computed values
  const itemsCount = getItemCount();
  const wishlistCount = wishlistItems.length;
  const currentPage = location.pathname;
  const currentSearch = location.search;

  // ✅ بستن منوها هنگام تغییر مسیر — قبلاً با useState(() => {...}) نوشته شده
  // بود که فقط یک‌بار در mount اجرا می‌شود، نه با هر تغییر مسیر (برخلاف
  // کامنتش). یعنی مثلاً با کلیک روی محصول از داخل MegaMenu، خودِ مگامنو باز
  // می‌ماند. useEffect با وابستگی به آدرس واقعی، درست روی هر ناوبری اجرا
  // می‌شود — چه از دکمه‌های خودِ هدر بیاید چه از جای دیگری در صفحه (مثل لینک
  // داخل UserMenu یا دکمه بازگشت مرورگر).
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowMegaMenu(false);
    setShowQuickAccess(false);
    closeMobileMenu();
  }, [currentPage, currentSearch, closeMobileMenu]);

      // دریافت تنظیمات سایت (لوگو و ...) از مسیر عمومی
  const { data: settingsData } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      try {
        // ✅ استفاده از مسیر عمومی که نیاز به لاگین ندارد
        const res = await apiClient.get('/site-settings');
        return res.data.data;
      } catch (error) {
        console.error('Error fetching site settings:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 30, // ۳۰ دقیقه کش (چون تنظیمات سایت به ندرت تغییر می‌کند)
  });

  // استخراج آدرس لوگو از تنظیمات
  const siteLogo = settingsData?.site_logo;
  const logoUrl = getImageUrl(siteLogo);

  // Handlers
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    closeMobileMenu();
    setShowMegaMenu(false);
    setShowUserMenu(false);
    // ✅ قبلاً اینجا بسته نمی‌شد، پس اگر کاربر با اعلان‌های باز روی یک آیتم
    // ناوبری کلیک می‌کرد، دراپ‌داون اعلان‌ها روی صفحه‌ی جدید هم باز می‌ماند.
    setShowNotifications(false);
  }, [navigate, closeMobileMenu]);

  const handleLogout = useCallback(() => {
    logout();
    setShowUserMenu(false);
    closeMobileMenu();
    navigate('/');
  }, [logout, closeMobileMenu, navigate]);

  const isActive = useCallback(
    (path: string) => isPathActive(currentPage, currentSearch, path),
    [currentPage, currentSearch]
  );

  const handleQuickAccessChat = useCallback(() => {
    toggleChat();
    setShowQuickAccess(false);
  }, [toggleChat]);

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-all duration-300",
        isScrolled && scrollDirection === 'down' && 'shadow-lg',
        isScrolled && 'py-2',
        !isScrolled && 'py-0',
        "min-h-[64px]"
      )}>
        {/* ============ Top Announcement Bar ============ */}
        {!isScrolled && (
          <div className="bg-gradient-to-r from-primary-900 via-primary-700 to-accent-700 text-white text-xs py-2.5 overflow-hidden relative">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
            <div className="container mx-auto px-4 relative">
              <div className="flex items-center justify-center gap-6 md:gap-10 animate-marquee whitespace-nowrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Truck className="w-3.5 h-3.5 text-accent-300" />
                  ارسال رایگان بالای ۵۰۰ هزار تومان
                </span>
                <span className="hidden md:flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-success-300" />
                  ضمانت اصالت کالا
                </span>
                <span className="hidden md:flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-warning-300" />
                  ۷ روز ضمانت بازگشت
                </span>
                <span className="hidden lg:flex items-center gap-1.5 font-medium">
                  <Gift className="w-3.5 h-3.5 text-primary-300" />
                  تخفیف ویژه اولین خرید
                </span>
                <span className="hidden lg:flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-accent-300" />
                  پشتیبانی ۲۴/۷
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============ Main Header ============ */}
        <div className="container mx-auto px-4">
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            isScrolled ? 'py-2' : 'py-4'
          )}>
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={isMobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

                       {/* Logo */}
            <button
              onClick={() => handleNavigate('/')}
              className="flex items-center gap-2.5 flex-shrink-0 group focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
              aria-label="صفحه اصلی ازکالا"
            >
              {logoUrl ? (
                // ✅ اگر لوگو در ادمین آپلود شده باشد، این عکس نمایش داده می‌شود
                <img
                  src={logoUrl}
                  alt="لوگو ازکالا"
                  className={cn(
  "object-contain transition-all duration-300 group-hover:scale-105", 
  isScrolled ? 'h-14 md:h-16 w-auto' : 'h-18 md:h-20 w-auto'
)}
                />
              ) : (
                // ✅ حالت پیش‌فرض: اگر لوگویی آپلود نشده باشد، آیکون و متن نمایش داده می‌شود
                <>
                  <div className={cn(
                    "bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:scale-105 group-hover:rotate-3 transition-all duration-300",
                    isScrolled ? 'w-9 h-9' : 'w-11 h-11'
                  )}>
                    <Smartphone className={cn(
                      "text-white",
                      isScrolled ? 'w-4 h-4' : 'w-5 h-5'
                    )} aria-hidden="true" />
                  </div>
                  {!isScrolled && (
                    <div className="hidden sm:block">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-black text-primary-600 dark:text-primary-400">از</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">کالا</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium -mt-0.5">مارکت‌پلیس لوازم جانبی</p>
                    </div>
                  )}
                </>
              )}
            </button>

            {/* Search Bar */}
            <SearchBar isScrolled={isScrolled} selectedModel={selectedModel} />

            {/* Model Selector */}
            {!isScrolled && (
              <div className="hidden lg:block">
                <ModelSelector
                  selectedModel={selectedModel}
                  isScrolled={isScrolled}
                  onOpenModal={openModal}
                />
              </div>
            )}

            {/* ============ Action Icons ============ */}
            <div className="flex items-center gap-1 mr-auto lg:mr-0">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all group active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={isDarkMode ? 'حالت روشن' : 'حالت تاریک'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:-rotate-12 transition-transform" />
                )}
              </button>

              {/* Cart */}
              <button
                onClick={openDrawer}
                className="relative p-2.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={`سبد خرید - ${itemsCount} محصول`}
              >
                <ShoppingCart className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-br from-accent-500 to-accent-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg shadow-accent-500/50 px-1 animate-scale-in ring-2 ring-white dark:ring-slate-900">
                    {itemsCount > 99 ? '99+' : itemsCount}
                  </span>
                )}
              </button>

              {/* Wishlist */}
              <button
                onClick={() => handleNavigate('/dashboard/wishlist')}
                className="relative p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group hidden sm:flex active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`علاقه‌مندی‌ها - ${wishlistCount} محصول`}
              >
                <Heart className={cn(
                  "w-5 h-5 transition-colors",
                  wishlistCount > 0 
                    ? "text-red-500 fill-red-500" 
                    : "text-gray-700 dark:text-gray-300 group-hover:text-red-500"
                )} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 px-1 animate-scale-in ring-2 ring-white dark:ring-slate-900">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <div ref={notificationsRef}>
                  <NotificationsDropdown
                    isOpen={showNotifications}
                    onToggle={() => setShowNotifications(!showNotifications)}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              )}

              {/* User Menu */}
              {isAuthenticated && user ? (
                <div ref={userMenuRef}>
                  <UserMenu
                    user={user}
                    isOpen={showUserMenu}
                    onToggle={() => setShowUserMenu(!showUserMenu)}
                    onClose={() => setShowUserMenu(false)}
                    onLogout={handleLogout}
                  />
                </div>
                           ) : (
                <button
                  onClick={() => openAuthModal()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="ورود یا ثبت‌نام"
                >
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:block">ورود / ثبت‌نام</span>
                </button>
              )}
            </div>
          </div>

          {/* ============ Desktop Navigation with Mega Menu ============ */}
          {!isScrolled && (
            <nav 
              className="hidden lg:flex items-center gap-1 pb-3 border-t border-gray-100 dark:border-slate-800 pt-3" 
              ref={megaMenuRef} 
              role="navigation" 
              aria-label="منوی اصلی"
            >
              {/* Mega Menu */}
              <MegaMenu
                isOpen={showMegaMenu}
                onToggle={() => setShowMegaMenu(!showMegaMenu)}
                onClose={() => setShowMegaMenu(false)}
              />

              {/* Nav Items */}
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap relative flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500',
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {item.label}
                  {item.badge && (
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full font-black',
                      isActive(item.path)
                        ? 'bg-white/30 text-white'
                        : 'bg-gradient-to-r from-error-500 to-error-600 text-white animate-pulse-soft'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

              {/* Spacer */}
              <div className="flex-1"></div>

                           {/* Spacer */}
              <div className="flex-1"></div>

              {/* Secondary Links */}
              <button
                onClick={() => handleNavigate('/contact')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500',
                  isActive('/contact')
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                )}
              >
                <Phone className="w-4 h-4" />
                تماس با ما
              </button>

              {/* ==================== دکمه اختصاصی جذب فروشنده ==================== */}
              {!isAuthenticated || (isAuthenticated && user?.role !== 'seller') ? (
                // حالت ۱: کاربر لاگین نکرده یا خریدار عادی است -> دعوت به افتتاح شعبه
                <button
                  onClick={() => handleNavigate('/seller-request')}
                  className="group relative px-5 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl text-sm font-black shadow-lg shadow-accent-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center gap-2 overflow-hidden"
                  title="فروشگاه آنلاین خودت رو در ازکالا بساز و بفروش"
                >
                  {/* افکت درخشش پس‌زمینه */}
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />

                  <Store className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 hidden sm:block">فروشگاهتو بساز و بفروش</span>
                  <span className="relative z-10 sm:hidden">فروشگاهتو بساز</span>
                </button>
              ) : (
                // حالت ۲: کاربر تأییدشده به عنوان فروشنده است -> ورود به پنل
                <button
                  onClick={() => handleNavigate('/seller')}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-500',
                    isActive('/seller')
                      ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/30'
                      : 'text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 dark:hover:bg-accent-900/30 border border-accent-200 dark:border-accent-800'
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>مدیریت فروشگاه</span>
                </button>
              )}
              {/* ===================================================================== */}

            </nav>
          )}
        </div>

        {/* ============ Mobile Search Bar ============ */}
        <div className="px-4 pb-3 md:hidden">
          <SearchBar isScrolled={isScrolled} selectedModel={selectedModel} isMobile={true} />
        </div>

        {/* ============ Mobile Model Selector ============ */}
        {!isScrolled && (
          <div className="px-4 pb-3 md:hidden border-t border-gray-100 dark:border-slate-800 pt-3">
            <ModelSelector
              selectedModel={selectedModel}
              isScrolled={isScrolled}
              onOpenModal={openModal}
            />
          </div>
        )}
      </header>

      {/* ============ Mobile Menu ============ */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      {/* ============ Quick Access Floating Button ============ */}
      <QuickAccess
        isOpen={showQuickAccess}
        onToggle={() => setShowQuickAccess(!showQuickAccess)}
        onChatClick={handleQuickAccessChat}
      />
    </>
  );
}