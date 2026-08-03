import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Bell, Package, Truck, CreditCard, UserCheck, AlertCircle } from 'lucide-react';
import type { UseNotificationsReturn } from '../types';
import { API_V1_URL } from '@/lib/apiConfig';

const API_BASE = API_V1_URL;

// نگاشت آیکون‌ها بر اساس نوع نوتیفیکیشن
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, { icon: any; color: string }> = {
    order_placed: { icon: Package, color: 'from-primary-500 to-primary-600' },
    order_shipped: { icon: Truck, color: 'from-blue-500 to-blue-600' },
    order_delivered: { icon: Package, color: 'from-success-500 to-success-600' },
    payment: { icon: CreditCard, color: 'from-accent-500 to-accent-600' },
    seller_approved: { icon: UserCheck, color: 'from-green-500 to-green-600' },
    seller_rejected: { icon: AlertCircle, color: 'from-error-500 to-error-600' },
    default: { icon: Bell, color: 'from-gray-500 to-gray-600' },
  };
  return iconMap[type] || iconMap.default;
};

// محاسبه زمان به صورت نسبی (مثلاً "۵ دقیقه پیش")
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'همین الان';
  if (diffMins < 60) return `${diffMins} دقیقه پیش`;
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  if (diffDays < 7) return `${diffDays} روز پیش`;
  return date.toLocaleDateString('fa-IR');
};

export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient();

  // ✅ دریافت لیست نوتیفیکیشن‌ها از API
  const { data: apiNotifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return [];

      try {
        const res = await fetch(`${API_BASE}/user/notifications`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json' 
          },
        });
        
        if (!res.ok) return [];
        
        const result = await res.json();
        return result.data || [];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    refetchInterval: 30000, // رفرش هر ۳۰ ثانیه
    staleTime: 10000,
  });

  // تبدیل داده‌های API به فرمت مورد نیاز کامپوننت
  const notifications = apiNotifications.map((n: any) => {
    const iconData = getNotificationIcon(n.type);
    const Icon = iconData.icon;
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      time: getRelativeTime(n.created_at),
      read: n.read_at !== null,
      icon: <Icon className="w-4 h-4" />,
      iconColor: iconData.color,
    };
  });

  // ✅ علامت‌گذاری یک نوتیفیکیشن به عنوان خوانده شده
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/user/notifications/${id}/read`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json' 
        },
      });
      if (!res.ok) throw new Error('خطا در علامت‌گذاری');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // ✅ علامت‌گذاری همه نوتیفیکیشن‌ها به عنوان خوانده شده
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/user/notifications/read-all`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json' 
        },
      });
      if (!res.ok) throw new Error('خطا در علامت‌گذاری همه');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAsRead = useCallback((id: number) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}