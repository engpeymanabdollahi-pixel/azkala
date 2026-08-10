import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageSquare,
  Tag, FolderTree, X, LogOut, ChevronLeft,
  Settings, BarChart3, MessageCircle, Newspaper, Megaphone,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import apiClient from '@/services/api/client';

const menuItems = [
  // ═══════════════════════════════════════════════════════
  // 📊 داشبورد و مدیریت اصلی
  // ═══════════════════════════════════════════════════════
  { path: '/admin', icon: LayoutDashboard, label: 'داشبورد', exact: true },
  { path: '/admin/products', icon: Package, label: 'محصولات' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'سفارشات' },
  { path: '/admin/users', icon: Users, label: 'کاربران' },
  { path: '/admin/reviews', icon: MessageSquare, label: 'نظرات' },
  { path: '/admin/magazine', icon: Newspaper, label: 'مجله' },
    { path: '/admin/ads', icon: Megaphone, label: 'تبلیغات' },
  { path: '/admin/catalog', icon: FolderTree, label: 'کاتالوگ' }, // ✅ تجمیع شده
  { path: '/admin/coupons', icon: Tag, label: 'کدهای تخفیف' },

  // ═══════════════════════════════════════════════════════
  // 📊 گزارشات
  // ═══════════════════════════════════════════════════════
  { path: '/admin/reports', icon: BarChart3, label: 'گزارشات' },

  // ═══════════════════════════════════════════════════════
  // 💬 ارتباطات (تجمیع شده)
  // ═══════════════════════════════════════════════════════
  { path: '/admin/communication', icon: MessageCircle, label: 'ارتباطات' },

  // ═══════════════════════════════════════════════════════
  // ⚙️ تنظیمات
  // ═══════════════════════════════════════════════════════
  { path: '/admin/settings', icon: Settings, label: 'تنظیمات' },
];

// ✅ همان endpoint واقعی که AdminDashboard برای شمارش گزارش‌های تخلفِ در
// انتظار استفاده می‌کند — برای اتصال زنگ اعلان به یک سیگنال واقعی، نه
// نقطه‌ی قرمز هاردکدِ همیشه‌روشن قبلی.
const fetchPendingReportsCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/admin/chat-management/reports/stats');
    return response.data?.data?.pending ?? 0;
  } catch {
    return 0;
  }
};

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ قبلاً زنگ اعلان همیشه یک نقطه‌ی قرمز ثابت نشان می‌داد (span
  // absolute بدون هیچ داده‌ای) — یعنی حتی وقتی هیچ گزارش تخلفِ در انتظاری
  // وجود نداشت هم ادمین فکر می‌کرد چیزی خوانده‌نشده مانده. حالا از تعداد
  // واقعی گزارش‌های در انتظار می‌آید و کلیک به صفحه‌ی گزارش‌ها می‌برد.
  const { data: pendingReports = 0 } = useQuery({
    queryKey: ['admin-layout-pending-reports'],
    queryFn: fetchPendingReportsCount,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black text-gray-900 dark:text-gray-100">پنل مدیریت</h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">ازکالا</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft
              className={cn(
                'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
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
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
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
        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
          <div className={cn('flex items-center gap-3 p-2', !sidebarOpen && 'justify-center')}>
            <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name || 'ادمین'}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email || 'admin@azkala.ir'}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
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
          <aside className="fixed inset-y-0 right-0 w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 lg:hidden flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-sm font-black text-gray-900 dark:text-gray-100">پنل مدیریت</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
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
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg"
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
                {/* Top Bar - Modern Design */}
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default AdminLayout;
