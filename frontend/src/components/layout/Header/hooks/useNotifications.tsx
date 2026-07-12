import { useState, useMemo, useCallback } from 'react';
import { Truck, Percent, Sparkles, Award } from 'lucide-react';
import type { UseNotificationsReturn, Notification } from '../types';

// TODO: Replace with API call
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'سفارش شما ارسال شد',
    message: 'سفارش #AZK-12345 با کد رهگیری TRK-987654321 ارسال شد',
    time: '۵ دقیقه پیش',
    read: false,
    icon: <Truck className="w-4 h-4" />,
    iconColor: 'from-primary-500 to-primary-600',
  },
  {
    id: 2,
    title: 'تخفیف ویژه!',
    message: '۲۰٪ تخفیف روی تمام قاب‌های آیفون فقط تا پایان امروز',
    time: '۱ ساعت پیش',
    read: false,
    icon: <Percent className="w-4 h-4" />,
    iconColor: 'from-error-500 to-error-600',
  },
  {
    id: 3,
    title: 'محصول جدید',
    message: 'قاب‌های چرمی جدید آیفون 15 موجود شد',
    time: '۲ ساعت پیش',
    read: true,
    icon: <Sparkles className="w-4 h-4" />,
    iconColor: 'from-accent-500 to-accent-600',
  },
  {
    id: 4,
    title: 'امتیاز وفاداری',
    message: '۵۰ امتیاز به حساب شما اضافه شد',
    time: 'دیروز',
    read: true,
    icon: <Award className="w-4 h-4" />,
    iconColor: 'from-warning-500 to-warning-600',
  },
];

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}