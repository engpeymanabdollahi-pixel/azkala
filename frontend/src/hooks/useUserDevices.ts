import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export interface UserDevice {
  id: number;
  user_id: number;
  phone_model_id: number;
  nickname?: string;
  phone_model?: {
    id: number;
    name: string;
    slug?: string;
    release_year?: number;
    image?: string | null;
    brand?: {
      id: number;
      name: string;
      slug?: string;
      type?: string;
      logo?: string | null;
      // ✅ فاز ۵: بک‌اند حالا family را هم eager-load می‌کند (علاوه بر
      // brand، نه به‌جایش) — اختیاری چون پاسخ‌های قدیمی‌تر/cache‌شده ممکن
      // است هنوز نداشته باشندش.
      family?: { id: number; name: string; slug: string; icon: string | null } | null;
    };
    series?: {
      id: number;
      name: string;
      slug?: string;
    };
  };
}

/**
 * Hook مشترک برای مدیریت دستگاه‌های کاربر
 *
 * ✅ در Header DeviceSelector (سناریو B) و
 * ✅ در User Panel DevicesSection (سناریو C) استفاده می‌شود
 *
 * الگو از Shopify Polaris - "Merchant Experience, Bulk Actions"
 */
export function useUserDevices() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ✅ فقط وقتی کاربر لاگین است fetch کن
  const { data, isLoading, error } = useQuery<UserDevice[]>({
    queryKey: ['user-devices'],
    queryFn: async () => {
      const response = await apiClient.get('/user/devices');
      return response.data?.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  const devices = data || [];

  // ✅ Mutation: افزودن دستگاه
  const addMutation = useMutation({
    mutationFn: async ({
      phoneModelId,
      nickname,
    }: {
      phoneModelId: number;
      nickname?: string;
    }) => {
      const response = await apiClient.post('/user/devices', {
        phone_model_id: phoneModelId,
        nickname,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
    },
  });

  // ✅ Mutation: حذف دستگاه
  const removeMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      const response = await apiClient.delete(`/user/devices/${deviceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
    },
  });

  // ✅ Helper: آیا این device ذخیره شده؟
  const isDeviceSaved = (phoneModelId: number): boolean => {
    return devices.some((d) => d.phone_model_id === phoneModelId);
  };

  // ✅ Helper: گرفتن device object با modelId
  const getDeviceByModelId = (phoneModelId: number): UserDevice | undefined => {
    return devices.find((d) => d.phone_model_id === phoneModelId);
  };

  // ✅ API: افزودن با toast
  const addDevice = async (phoneModelId: number, nickname?: string) => {
    try {
      await addMutation.mutateAsync({ phoneModelId, nickname });
      toast.success('دستگاه به لیست شما اضافه شد', { icon: '📱' });
      return true;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || 'خطا در ذخیره دستگاه';
      toast.error(msg);
      return false;
    }
  };

  // ✅ API: حذف با toast
  const removeDevice = async (deviceId: number) => {
    try {
      await removeMutation.mutateAsync(deviceId);
      toast.success('دستگاه حذف شد', { icon: '🗑️' });
      return true;
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || 'خطا در حذف دستگاه';
      toast.error(msg);
      return false;
    }
  };

  return {
    devices,
    isLoading,
    error,
    addDevice,
    removeDevice,
    isDeviceSaved,
    getDeviceByModelId,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}