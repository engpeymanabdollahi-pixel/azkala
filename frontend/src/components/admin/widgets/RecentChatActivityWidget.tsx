import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Users, Clock } from 'lucide-react';
import apiClient from '@/services/api/client';
import { cn } from '@/utils/cn';

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
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-black text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-600" />
          فعالیت‌های اخیر چت
        </h3>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">فروشندگان فعال</p>
            <p className="text-lg font-black text-gray-900">{activity.active_sellers}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-50 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-accent-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">ساعت شلوغ</p>
            <p className="text-sm font-black text-gray-900">{activity.busiest_hour}</p>
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {activity.recent_messages.length > 0 ? (
          activity.recent_messages.map((msg) => (
            <div key={msg.id} className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {msg.sender_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{msg.sender_name}</p>
                    <span className="text-[10px] text-gray-500">{msg.created_at}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{msg.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">
            فعالیتی وجود ندارد
          </div>
        )}
      </div>
    </div>
  );
}