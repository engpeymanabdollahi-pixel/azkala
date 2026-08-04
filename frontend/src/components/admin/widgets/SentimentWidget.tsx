import { useQuery } from '@tanstack/react-query';
import { Frown, Meh, Smile } from 'lucide-react';
import apiClient from '@/services/api/client';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface SentimentStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  positive_percent: number;
  negative_percent: number;
  neutral_percent: number;
}

const fetchSentimentStats = async (): Promise<{ success: boolean; data: SentimentStats }> => {
  const response = await apiClient.get('/admin/dashboard/sentiment-stats');

  return response.data;
};

export function SentimentWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sentiment-stats'],
    queryFn: fetchSentimentStats,
    refetchInterval: 60000,
  });

  const stats = data?.data;

  if (isLoading || !stats) {
    return (
      <Card variant="elevated" className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-2">
          <Skeleton variant="title" width="9rem" />
          <Skeleton variant="text" width="11rem" />
        </div>
        {/* اسکلتون شکل خودِ محتوا را تقلید می‌کند — سه ردیف با نوار پیشرفت — تا
            وقتی داده می‌رسد چیدمان جابه‌جا نشود. */}
        <div className="p-4 space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" width="5rem" />
                <Skeleton variant="text" width="4rem" />
              </div>
              <Skeleton variant="rect" height="0.5rem" delay={index * 80} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const items = [
    {
      label: 'مثبت',
      value: stats.positive_percent,
      count: stats.positive,
      icon: Smile,
      color: 'text-success-600 dark:text-success-400',
      barColor: 'bg-success-500',
    },
    {
      label: 'خنثی',
      value: stats.neutral_percent,
      count: stats.neutral,
      icon: Meh,
      color: 'text-gray-600 dark:text-gray-400',
      barColor: 'bg-gray-400 dark:bg-gray-500',
    },
    {
      label: 'منفی',
      value: stats.negative_percent,
      count: stats.negative,
      icon: Frown,
      color: 'text-error-600 dark:text-error-400',
      barColor: 'bg-error-500',
    },
  ];

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Smile className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          احساسات کلی
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">توزیع احساسات در پیام‌ها</p>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.count} پیام</span>
                  <span className={`text-sm font-black ${item.color}`}>{item.value}%</span>
                </div>
              </div>

              <div
                className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2"
                role="progressbar"
                aria-valuenow={item.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`سهم پیام‌های ${item.label}`}
              >
                <div
                  className={`${item.barColor} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
