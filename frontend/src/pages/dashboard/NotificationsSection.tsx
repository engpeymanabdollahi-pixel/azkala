import { Bell, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { useNotifications } from '@/components/layout/Header/hooks/useNotifications'; // مسیر را در صورت نیاز اصلاح کنید

export function NotificationsSection() {
  // ✅ دریافت داده‌های واقعی از هوک
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
        <div>
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-600" />
            اعلان‌های من
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} اعلان خوانده نشده` : 'اعلان جدیدی ندارید'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="error" size="sm">{unreadCount} جدید</Badge>
        )}
      </div>

      {/* Settings (UI Only - آماده برای اتصال به بک‌اند در آینده) */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          تنظیمات دریافت اعلان
        </h4>
        <div className="space-y-3">
          {[
            { title: 'اعلان‌های سفارش', enabled: true },
            { title: 'تخفیف‌ها و پیشنهادات', enabled: true },
            { title: 'خبرنامه', enabled: false },
            { title: 'اعلان‌های پیامکی', enabled: true },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">{item.title}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                {/* ✅ اصلاح شده برای پشتیبانی صحیح از RTL */}
                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full rtl:peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 text-gray-300" />
            <p>هیچ اعلانی وجود ندارد.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  'w-full p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 text-right group focus:outline-none focus:bg-gray-50',
                  !notif.read && 'bg-primary-50/30'
                )}
              >
                {/* ✅ استفاده از استایل گرادیانت آیکون که از هوک می‌آید */}
                <div className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 shadow-sm',
                  notif.iconColor
                )}>
                  {notif.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={cn(
                      'font-bold text-sm text-gray-900 truncate',
                      !notif.read && 'text-primary-900'
                    )}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{notif.time}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}