import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, MessageSquare, Package, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import apiClient from '@/services/api/client';
import { cn } from '@/utils/cn';

interface Notification {
  id: string;
  type: 'report' | 'order' | 'user' | 'message' | 'system';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  link?: string;
}

const fetchAdminNotifications = async (): Promise<Notification[]> => {
  const notifications: Notification[] = [];

  try {
    // 1. گزارش‌های در انتظار
    const reportsRes = await apiClient.get('/admin/chat-management/reports/stats');
    const pendingReports = reportsRes.data?.data?.pending ?? 0;
    if (pendingReports > 0) {
      notifications.push({
        id: 'reports-pending',
        type: 'report',
        title: `${pendingReports} گزارش تخلف در انتظار`,
        description: 'گزارش‌های جدید نیاز به بررسی دارند',
        time: 'اکنون',
        isRead: false,
        link: '/admin/communication',
      });
    }

    // 2. سفارشات در انتظار (mock - اگر endpoint داشتید اضافه کنید)
    // 3. درخواست‌های فروشندگی (mock - اگر endpoint داشتید اضافه کنید)
    
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }

  return notifications;
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'report': return AlertTriangle;
    case 'order': return Package;
    case 'user': return Users;
    case 'message': return MessageSquare;
    default: return Bell;
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'report': return 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400';
    case 'order': return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400';
    case 'user': return 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400';
    case 'message': return 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400';
    default: return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400';
  }
};

export default function NotificationBell() {
  const navigate = useNavigate();
  
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: fetchAdminNotifications,
    refetchInterval: 30000, // هر 30 ثانیه
    staleTime: 10000,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors outline-none focus:ring-2 focus:ring-primary-500"
          title="اعلان‌ها"
        >
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-error-500 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white dark:border-slate-800">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end" side="bottom" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            اعلان‌ها
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 rounded-full text-[10px] font-bold">
              {unreadCount} جدید
            </span>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                اعلانی وجود ندارد
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                همه چیز در کنترل است!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {notifications.map((notification) => {
                const Icon = getIconForType(notification.type);
                const colorClass = getColorForType(notification.type);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-right',
                      !notification.isRead && 'bg-primary-50/30 dark:bg-primary-900/10'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-0.5">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 dark:border-slate-700 p-2">
            <button
              onClick={() => navigate('/admin/communication')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <span>مشاهده همه اعلان‌ها</span>
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}