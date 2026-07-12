import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api/client';
import type { UserDevice } from '../types';

interface UseUserDevicesResult {
  devices: UserDevice[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * هوک دریافت دستگاه‌های کاربر لاگین شده
 * فقط وقتی کاربر لاگین است، درخواست ارسال می‌شود
 */
export function useUserDevices(): UseUserDevicesResult {
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-devices'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: UserDevice[] }>('/user/devices');
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });

  return {
    devices: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}