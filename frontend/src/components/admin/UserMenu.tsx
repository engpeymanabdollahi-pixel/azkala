import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Shield, Activity, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = () => {
    if (!user?.name) return 'A';
    return user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'مدیر سیستم';
      case 'seller': return 'فروشنده';
      default: return 'کاربر';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin': return 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300';
      case 'seller': return 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300';
      default: return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors outline-none focus:ring-2 focus:ring-primary-500">
          <Avatar className="h-9 w-9 border-2 border-gray-200 dark:border-slate-700">
            <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
            <AvatarFallback className="text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              {user?.name || 'مدیر سیستم'}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {getRoleLabel()}
            </span>
          </div>
          <ChevronLeft className="hidden md:block h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" side="bottom" sideOffset={8}>
        {/* Header with user info */}
        <div className="flex items-center gap-3 p-3">
          <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-slate-700">
            <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
            <AvatarFallback className="text-base">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {user?.name || 'مدیر سیستم'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || 'admin@azkala.ir'}
            </p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadgeColor()}`}>
              {getRoleLabel()}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
            <User className="ml-2 h-4 w-4" />
            <span>پروفایل من</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
            <Settings className="ml-2 h-4 w-4" />
            <span>تنظیمات</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/admin/users')}>
            <Shield className="ml-2 h-4 w-4" />
            <span>مدیریت کاربران</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/admin/reports')}>
            <Activity className="ml-2 h-4 w-4" />
            <span>گزارش فعالیت</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-error-600 dark:text-error-400 focus:text-error-700 dark:focus:text-error-300 focus:bg-error-50 dark:focus:bg-error-900/20"
        >
          <LogOut className="ml-2 h-4 w-4" />
          <span>خروج از حساب</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}