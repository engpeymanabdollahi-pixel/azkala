import { useQuery } from '@tanstack/react-query';
import { Smile, Meh, Frown } from 'lucide-react';
import apiClient from '@/services/api/client';

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
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    );
  }

  const items = [
    {
      label: 'مثبت',
      value: stats.positive_percent,
      count: stats.positive,
      icon: Smile,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      barColor: 'bg-green-500',
    },
    {
      label: 'خنثی',
      value: stats.neutral_percent,
      count: stats.neutral,
      icon: Meh,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      barColor: 'bg-gray-500',
    },
    {
      label: 'منفی',
      value: stats.negative_percent,
      count: stats.negative,
      icon: Frown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      barColor: 'bg-red-500',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-black text-gray-900 flex items-center gap-2">
          <Smile className="w-5 h-5 text-primary-600" />
          احساسات کلی
        </h3>
        <p className="text-xs text-gray-500 mt-1">توزیع احساسات در پیام‌ها</p>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm font-bold text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{item.count} پیام</span>
                  <span className={`text-sm font-black ${item.color}`}>{item.value}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`${item.barColor} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}