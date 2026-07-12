import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageSquare,
  Tag, FolderTree, Award, Menu, X, LogOut, ChevronLeft,
  Settings, Bell, Search, BarChart3, MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const menuItems = [
  // ═══════════════════════════════════════════════════════
  // 📊 داشبورد و مدیریت اصلی
  // ═══════════════════════════════════════════════════════
  { path: '/admin', icon: LayoutDashboard, label: 'داشبورد', exact: true },
  { path: '/admin/products', icon: Package, label: 'محصولات' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'سفارشات' },
  { path: '/admin/users', icon: Users, label: 'کاربران' },
  { path: '/admin/reviews', icon: MessageSquare, label: 'نظرات' },
  { path: '/admin/catalog', icon: FolderTree, label: 'کاتالوگ' }, // ✅ تجمیع شده
  { path: '/admin/coupons', icon: Tag, label: 'کدهای تخفیف' },
  
  // ═══════════════════════════════════════════════════════
  // 📊 گزارشات
  // ═══════════════════════════════════════════════════════
  { path: '/admin/reports', icon: BarChart3, label: 'گزارشات' },
  
  // ═══════════════════════════════════════════════════════
   // ═══════════════════════════════════════════════════════
  // 💬 ارتباطات (تجمیع شده)
  // ═══════════════════════════════════════════════════════
  { path: '/admin/communication', icon: MessageCircle, label: 'ارتباطات' },

  // ═══════════════════════════════════════════════════════
  // ⚙️ تنظیمات
  // ═══════════════════════════════════════════════════════
  { path: '/admin/settings', icon: Settings, label: 'تنظیمات' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white border-l border-gray-200 shadow-sm transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black text-gray-900">پنل مدیریت</h1>
                <p className="text-[10px] text-gray-500">ازکالا</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft
              className={cn(
                'w-4 h-4 text-gray-500 transition-transform',
                !sidebarOpen && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-gradient-to-l from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-gray-100">
          <div className={cn('flex items-center gap-3 p-2', !sidebarOpen && 'justify-center')}>
            <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'ادمین'}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email || 'admin@azkala.ir'}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              خروج از پنل
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 w-72 bg-white shadow-2xl z-50 lg:hidden flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-sm font-black text-gray-900">پنل مدیریت</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                        isActive
                          ? 'bg-gradient-to-l from-primary-500 to-primary-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      )
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                خروج از پنل
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="جستجو در پنل..."
                className="bg-transparent text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="hidden md:block text-sm font-semibold text-gray-700">
                {user?.name || 'ادمین'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}