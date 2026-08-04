import { useQuery } from '@tanstack/react-query';
import { Clock, MessageCircle, Users } from 'lucide-react';
import apiClient from '@/services/api/client';
import { Card } from '@/components/ui/Card';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';

interface RecentMessage {
  id: number;
  content: string;
  sender_name: string;
  sender_avatar: string | null;
  conversation_id: number;
  created_at: string;
  type: string;
}

interface ActivityData {
  recent_messages: RecentMessage[];
  active_sellers: number;
  busiest_hour: string;
}

const fetchRecentActivity = async (): Promise<{ success: boolean; data: ActivityData }> => {
  const response = await apiClient.get('/admin/dashboard/recent-chat-activity');

  return response.data;
};

export function RecentChatActivityWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-recent-chat-activity'],
    queryFn: fetchRecentActivity,
    refetchInterval: 30000,
  });

  const activity = data?.data;

  if (isLoading || !activity) {
    return (
      <Card variant="elevated" className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <Skeleton variant="title" width="10rem" />
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
          {[0, 1].map((index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton variant="rect" width="2rem" height="2rem" delay={index * 80} />
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" width="4.5rem" delay={index * 80} />
                <Skeleton variant="text" width="2.5rem" height="1.25rem" delay={index * 80} />
              </div>
            </div>
          ))}
        </div>
        {/* اسکلتونِ ردیف پیام‌ها همان ساختار آواتار + دو خط را دارد */}
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="p-3 flex items-start gap-2">
              <Skeleton variant="circle" width="2rem" height="2rem" delay={index * 60} />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" width="6rem" delay={index * 60} />
                <Skeleton variant="text" width="90%" delay={index * 60} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          فعالیت‌های اخیر چت
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">فروشندگان فعال</p>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">
              {activity.active_sellers}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-50 dark:bg-accent-900/30 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-accent-600 dark:text-accent-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">ساعت شلوغ</p>
            <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
              {activity.busiest_hour}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-64 overflow-y-auto">
        {activity.recent_messages.length > 0 ? (
          activity.recent_messages.map((message) => (
            <div
              key={message.id}
              className="p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
              <div className="flex items-start gap-2">
                {/* آواتار واقعی اگر هست؛ قبلاً sender_avatar گرفته می‌شد ولی
                    هیچ‌وقت نمایش داده نمی‌شد و همیشه حرف اول نشان داده می‌شد. */}
                {message.sender_avatar ? (
                  <SafeImage
                    src={message.sender_avatar}
                    alt={message.sender_name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {message.sender_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {message.sender_name}
                    </p>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
                      {message.created_at}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">هنوز پیامی نیست</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              به‌محض شروع مکالمه‌ای تازه، اینجا نمایش داده می‌شود.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
