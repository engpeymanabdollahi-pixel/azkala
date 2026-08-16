import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { ComponentType } from 'react';
import { Bell, Package, Truck, CreditCard, UserCheck, Gift } from 'lucide-react';
import type { UseNotificationsReturn } from '../types';
import apiClient from '@/services/api/client';

/** شکل نوتیفیکیشن همان‌طور که API برمی‌گرداند */
interface NotificationApiItem {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
}
import { useAuthStore } from '@/store/authStore';

// نگاشت آیکون‌ها بر اساس نوع نوتیفیکیشن
// ✅ در بک‌اند، جاهایی که واقعاً رکورد notifications ساخته می‌شوند:
// - AdminUserService::initialApproveRequest/finalApproveRequest، با type
//   دقیقاً برابر seller_request_initial_approved / seller_request_final_approved
//   (نه seller_approved/seller_rejected که اینجا قبلاً نوشته شده بود و هیچ‌وقت
//   از سمت بک‌اند ارسال نمی‌شد — پس همیشه به آیکون پیش‌فرض Bell می‌افتاد).
// - ReferralRewardService::qualifyAndRewardForCompletedOrder، با type
//   دقیقاً برابر referral_reward_earned (Referral System — پاداش معرفی).
// order_placed/order_shipped/order_delivered/payment هنوز در بک‌اند پیاده
// نشده‌اند؛ اینجا نگه داشته شده‌اند تا اگر در آینده اضافه شدند، آیکون آماده باشد.
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, { icon: ComponentType<{ className?: string }>; color: string }> = {
    order_placed: { icon: Package, color: 'from-primary-500 to-primary-600' },
    order_shipped: { icon: Truck, color: 'from-blue-500 to-blue-600' },
    order_delivered: { icon: Package, color: 'from-success-500 to-success-600' },
    payment: { icon: CreditCard, color: 'from-accent-500 to-accent-600' },
    seller_request_initial_approved: { icon: UserCheck, color: 'from-green-500 to-green-600' },
    seller_request_final_approved: { icon: UserCheck, color: 'from-success-500 to-success-600' },
    // ✅ Referral System: دومین نوع واقعی که بک‌اند می‌سازد
    // (ReferralRewardService::qualifyAndRewardForCompletedOrder، بعد از
    // commit موفقِ ردیف پاداش).
    referral_reward_earned: { icon: Gift, color: 'from-accent-500 to-accent-600' },
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ✅ دریافت لیست نوتیفیکیشن‌ها از API
  const { data: apiNotifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/user/notifications');
        return res.data?.data || [];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    // فقط وقتی کاربر وارد شده باشد. پیش از این با نبودِ توکن در localStorage
    // زودهنگام return می‌شد — و چون آن کلید عملاً هیچ‌وقت نوشته نمی‌شد،
    // نوتیفیکیشن‌ها همیشه خالی بودند.
    enabled: isAuthenticated,
    refetchInterval: 30000, // رفرش هر ۳۰ ثانیه
    staleTime: 10000,
  });

  // تبدیل داده‌های API به فرمت مورد نیاز کامپوننت
  const notifications = apiNotifications.map((n: NotificationApiItem) => {
    const iconData = getNotificationIcon(n.type);
    const Icon = iconData.icon;
    return {
      id: n.id,
      // ✅ قبلاً type اینجا حذف می‌شد (فقط برای انتخاب آیکون استفاده و دور
      // ریخته می‌شد)، پس هیچ کامپوننتی نمی‌توانست بر اساس نوع نوتیفیکیشن
      // (مثلاً seller_request_initial_approved) کاری مثل هدایت به صفحه‌ی
      // مربوطه انجام دهد.
      type: n.type,
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
      const res = await apiClient.post(`/user/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // ✅ علامت‌گذاری همه نوتیفیکیشن‌ها به عنوان خوانده شده
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/user/notifications/read-all');
      return res.data;
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

  const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}