import { Bell, Package, Truck, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export function NotificationsSection() {
  const notifications = [
    {
      id: 1,
      title: 'سفارش #AZK-12345 ثبت شد',
      message: 'سفارش شما در حال پردازش است',
      time: '۲ ساعت پیش',
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      read: false,
    },
    {
      id: 2,
      title: 'سفارش #AZK-12340 تحویل داده شد',
      message: 'امیدواریم از خرید خود راضی باشید',
      time: '۱ روز پیش',
      icon: Truck,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
      read: true,
    },
    {
      id: 3,
      title: 'تخفیف ویژه ۲۰٪',
      message: 'به مناسبت عید، ۲۰٪ تخفیف روی همه محصولات',
      time: '۳ روز پیش',
      icon: Gift,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
      read: true,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
        <div>
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-primary-600" />
            اعلان‌های من
          </h3>
          <p className="text-[11px] text-gray-600">{unreadCount} اعلان خوانده نشده</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="error" size="sm">{unreadCount} جدید</Badge>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-3">
        <h4 className="font-bold text-gray-900 text-xs mb-2">تنظیمات اعلان‌ها</h4>
        <div className="space-y-2">
          {[
            { title: 'اعلان‌های سفارش', enabled: true },
            { title: 'تخفیف‌ها و پیشنهادات', enabled: true },
            { title: 'خبرنامه', enabled: false },
            { title: 'اعلان‌های پیامکی', enabled: true },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-xs text-gray-700">{item.title}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                className={cn(
                  'p-3 hover:bg-gray-50 transition-colors flex items-start gap-2.5',
                  !notif.read && 'bg-primary-50/30'
                )}
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', notif.bgColor)}>
                  <Icon className={cn('w-4 h-4', notif.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="font-bold text-gray-900 text-xs truncate">{notif.title}</h4>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 line-clamp-1">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{notif.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}