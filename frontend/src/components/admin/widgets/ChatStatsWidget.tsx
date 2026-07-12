import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Send, Clock, TrendingUp } from 'lucide-react';
import apiClient from '@/services/api/client';
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
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    );
  }

  const items = [
    {
      label: 'مکالمات فعال',
      value: stats.active_conversations,
      icon: MessageCircle,
      color: 'text-primary-600 bg-primary-50',
    },
    {
      label: 'پیام‌های امروز',
      value: stats.messages_today,
      icon: Send,
      color: 'text-accent-600 bg-accent-50',
    },
    {
      label: 'میانگین پاسخ',
      value: `${stats.avg_response_minutes} دقیقه`,
      icon: Clock,
      color: 'text-warning-600 bg-warning-50',
    },
    {
      label: 'نرخ تبدیل',
      value: `${stats.conversion_rate}%`,
      icon: TrendingUp,
      color: 'text-success-600 bg-success-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-black text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-600" />
          آمار چت
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg font-black text-gray-900">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}