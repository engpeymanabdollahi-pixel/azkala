import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  User, Package, Heart, MapPin, Shield, Bell, Smartphone,
  LogOut, Menu, X, Ticket,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

const menuItems = [
  { path: '/dashboard/profile', label: 'پروفایل', icon: User, color: 'from-primary-500 to-primary-600' },
  { path: '/dashboard/orders', label: 'سفارشات', icon: Package, color: 'from-accent-500 to-accent-600' },
  { path: '/dashboard/wishlist', label: 'علاقه‌مندی‌ها', icon: Heart, color: 'from-error-500 to-error-600' },
  { path: '/dashboard/addresses', label: 'آدرس‌ها', icon: MapPin, color: 'from-success-500 to-success-600' },
  { path: '/dashboard/devices', label: 'دستگاه‌های من', icon: Smartphone, color: 'from-warning-500 to-warning-600' },
  { path: '/dashboard/tickets', label: 'تیکت‌های من', icon: Ticket, color: 'from-orange-500 to-red-500' },
  { path: '/dashboard/security', label: 'امنیت', icon: Shield, color: 'from-primary-500 to-accent-500' },
  { path: '/dashboard/notifications', label: 'اعلان‌ها', icon: Bell, color: 'from-accent-500 to-primary-500' },
];

export function UserDashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('با موفقیت خارج شدید', { icon: '👋' });
  };

  const getInitial = () => user?.name?.[0] || 'U';
  const getRoleBadge = () => {
    switch (user?.role) {
      case 'seller': return { label: 'فروشنده', color: 'bg-accent-500' };
      case 'admin': return { label: 'مدیر', color: 'bg-primary-500' };
      default: return { label: 'مشتری', color: 'bg-primary-500' };
    }
  };
  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Spacer برای هدر اصلی sticky */}
      <div className="pt-20 md:pt-24"></div>
      
      <div className="container mx-auto px-3 md:px-4 py-6 max-w-7xl">
        {/* Page Header - فقط عنوان صفحه */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">حساب کاربری من</h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">مدیریت اطلاعات و سفارشات شما</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden sticky top-28 transition-colors duration-300">
              {/* User Info */}
              <div className="p-4 bg-gradient-to-br from-primary-600 to-accent-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl font-black border-2 border-white/30">
                    {getInitial()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{user?.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded', roleBadge.color)}>
                        {roleBadge.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || 
                    (item.path === '/dashboard/profile' && location.pathname === '/dashboard');
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5',
                        isActive
                          ? `bg-gradient-to-l ${item.color} text-white shadow-md`
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-2 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Sidebar - Mobile */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="fixed inset-y-0 right-0 z-50 w-72 bg-white dark:bg-slate-800 shadow-2xl md:hidden animate-slide-in-right transition-colors duration-300">
                <div className="flex flex-col h-full">
                  <div className="p-4 bg-gradient-to-br from-primary-600 to-accent-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl font-black border-2 border-white/30">
                        {getInitial()}
                      </div>
                      <div>
                        <p className="font-black text-sm">{user?.name}</p>
                        <p className="text-[10px] text-white/80">{user?.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="flex-1 p-3 overflow-y-auto">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5',
                            isActive
                              ? `bg-gradient-to-l ${item.color} text-white shadow-md`
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </nav>

                  <div className="p-3 border-t border-gray-100 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>خروج از حساب</span>
                    </button>
                  </div>
                </div>
              </aside>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}