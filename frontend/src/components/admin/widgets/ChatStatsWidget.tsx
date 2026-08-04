import { useQuery } from '@tanstack/react-query';
import { Clock, MessageCircle, Send, TrendingUp } from 'lucide-react';
import apiClient from '@/services/api/client';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';

interface ChatStats {
  active_conversations: number;
  total_conversations: number;
  messages_today: number;
  total_messages: number;
  avg_response_minutes: number;
  conversion_rate: number;
}

const fetchChatStats = async (): Promise<{ success: boolean; data: ChatStats }> => {
  const response = await apiClient.get('/admin/dashboard/chat-stats');

  return response.data;
};

export function ChatStatsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-chat-stats'],
    queryFn: fetchChatStats,
    refetchInterval: 30000,
  });

  const stats = data?.data;

  if (isLoading || !stats) {
    return (
      <Card variant="elevated" className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <Skeleton variant="title" width="7rem" />
        </div>
        {/* اسکلتون همان شبکه‌ی ۲×۲ را می‌سازد تا وقتی داده رسید چیدمان نپرد */}
        <div className="grid grid-cols-2 gap-3 p-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton variant="rect" width="2.5rem" height="2.5rem" delay={index * 80} />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" width="4rem" delay={index * 80} />
                <Skeleton variant="text" width="3rem" height="1.25rem" delay={index * 80} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const items = [
    {
      label: 'مکالمات فعال',
      value: stats.active_conversations,
      icon: MessageCircle,
      color: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30',
    },
    {
      label: 'پیام‌های امروز',
      value: stats.messages_today,
      icon: Send,
      color: 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30',
    },
    {
      label: 'میانگین پاسخ',
      value: `${stats.avg_response_minutes} دقیقه`,
      icon: Clock,
      color: 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/30',
    },
    {
      label: 'نرخ تبدیل',
      value: `${stats.conversion_rate}%`,
      icon: TrendingUp,
      color: 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30',
    },
  ];

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          آمار چت
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  item.color
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.label}</p>
                <p className="text-lg font-black text-gray-900 dark:text-gray-100">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
