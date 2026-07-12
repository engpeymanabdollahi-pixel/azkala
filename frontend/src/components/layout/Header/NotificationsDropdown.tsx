import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useNotifications } from './hooks/useNotifications';
import type { Notification } from './types';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const NotificationItem = memo(({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: (id: number) => void }) => (
  <button
    onClick={() => onMarkAsRead(notification.id)}
    className={cn(
      'w-full px-5 py-3.5 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-right group focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-700',
      !notification.read && 'bg-primary-50/30 dark:bg-primary-900/20 hover:bg-primary-50 dark:hover:bg-primary-900/30'
    )}
    aria-label={`${notification.title} - ${notification.read ? 'خوانده شده' : 'خوانده نشده'}`}
  >
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 shadow-md',
          notification.iconColor
        )}
      >
        {notification.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={cn(
            'font-bold text-sm text-gray-900 dark:text-white truncate',
            !notification.read && 'text-primary-900 dark:text-primary-300'
          )}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" aria-hidden="true" />
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
          {notification.time}
        </p>
      </div>
    </div>
  </button>
));

NotificationItem.displayName = 'NotificationItem';

export const NotificationsDropdown = memo(({ isOpen, onToggle, onClose }: NotificationsDropdownProps) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleViewAll = () => {
    onClose();
    navigate('/dashboard/notifications');
  };

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={onToggle}
        className="relative p-2.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label={`اعلان‌ها - ${unreadCount} خوانده نشده`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-br from-accent-500 to-accent-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg shadow-accent-500/50 px-1 ring-2 ring-white dark:ring-slate-900 animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 py-2 z-30 animate-slide-down overflow-hidden"
          role="dialog"
          aria-label="اعلان‌ها"
        >
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 flex items-center justify-between">
            <div>
              <p className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                اعلان‌ها
              </p>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {unreadCount} اعلان خوانده نشده
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold focus:outline-none focus:underline"
              >
                خواندن همه
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto" role="list" aria-label="لیست اعلان‌ها">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
          
          <button
            onClick={handleViewAll}
            className="w-full px-5 py-3 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-bold transition-colors flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-slate-700 focus:outline-none focus:bg-primary-50 dark:focus:bg-primary-900/20"
          >
            مشاهده همه اعلان‌ها
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
});

NotificationsDropdown.displayName = 'NotificationsDropdown';