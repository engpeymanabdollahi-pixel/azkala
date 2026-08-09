import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertService, type CreateAlertPayload } from '@/services/api/alert.service';
import { useAuthStore } from '@/store/authStore';
import type { ProductAlert, AlertStatusResponse } from '@/types/models';
import toast from 'react-hot-toast';

/**
 * Hook برای مدیریت هشدارهای محصول با TanStack Query
 * 
 * ویژگی‌ها:
 * - دریافت لیست هشدارها (cache شده)
 * - ساخت/حذف/تغییر وضعیت هشدار
 * - بررسی وضعیت هشدار برای محصول خاص
 * - Optimistic UI برای تجربه بهتر
 */
export function useAlertApi() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ============================================================
  // 📥 دریافت لیست هشدارها (فقط برای کاربران لاگین شده)
  // ============================================================
  const { 
    data: alertsData, 
    isLoading: isAlertsLoading 
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      if (!isAuthenticated) return { data: [], total: 0 };
      const response = await alertService.getAlerts();
      return {
        data: response.data.data || [],
        total: response.data.total || 0,
      };
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // ۲ دقیقه
    retry: 1,
  });

  const alerts = alertsData?.data || [];
  const totalAlerts = alertsData?.total || 0;

  // ============================================================
  // 📤 ساخت هشدار جدید
  // ============================================================
  const createAlertMutation = useMutation({
    mutationFn: async (payload: CreateAlertPayload) => {
      if (!isAuthenticated) {
        throw new Error('برای ثبت هشدار باید وارد حساب کاربری شوید');
      }
      return alertService.createAlert(payload);
    },

    onSuccess: (response, payload) => {
      // پیام‌های فارسی بر اساس نوع هشدار
      const messages: Record<string, string> = {
        restock: 'هشدار موجودی ثبت شد. به محض شارژ محصول به شما اطلاع می‌دهیم',
        price_drop: payload.discount_percentage
          ? `هشدار ${payload.discount_percentage}٪ تخفیف ثبت شد. با رسیدن به این تخفیف به شما اطلاع می‌دهیم`
          : 'هشدار کاهش قیمت ثبت شد. با کاهش قیمت به شما اطلاع می‌دهیم',
        target_price: `هشدار قیمت ${payload.target_price?.toLocaleString('fa-IR')} تومان ثبت شد`,
      };

      toast.success(messages[payload.type] || 'هشدار ثبت شد', {
        icon: '🔔',
        duration: 3000,
      });

      // آپدیت cache
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ 
        queryKey: ['alert-status', payload.product_id] 
      });
    },

    onError: (error: any) => {
      const message = error?.response?.data?.message || 
                     error?.message || 
                     'خطا در ثبت هشدار';
      
      // اگر هشدار تکراری است
      if (error?.response?.status === 409) {
        toast.error('شما قبلاً برای این محصول هشدار فعال دارید', {
          icon: 'ℹ️',
          duration: 3000,
        });
        return;
      }

      toast.error(message, { icon: '❌', duration: 3000 });
    },
  });

  // ============================================================
  // 🗑️ حذف هشدار
  // ============================================================
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return alertService.deleteAlert(alertId);
    },

    onSuccess: (_, alertId) => {
      toast.success('هشدار لغو شد', { icon: '🔕', duration: 2000 });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },

    onError: () => {
      toast.error('خطا در لغو هشدار', { icon: '❌', duration: 3000 });
    },
  });

  // ============================================================
  // 🔀 Toggle هشدار (فعال/غیرفعال)
  // ============================================================
  const toggleAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return alertService.toggleAlert(alertId);
    },

    onSuccess: (response) => {
      const isActive = response.data?.is_active;
      toast.success(
        isActive ? 'هشدار فعال شد' : 'هشدار غیرفعال شد',
        { icon: isActive ? '🔔' : '🔕', duration: 2000 }
      );
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },

    onError: () => {
      toast.error('خطا در تغییر وضعیت هشدار', { icon: '❌', duration: 3000 });
    },
  });

  // ============================================================
  // 🔍 Helper functions
  // ============================================================

  /**
   * دریافت هشدار فعال برای یک محصول با نوع خاص
   */
  const getAlertForProduct = (productId: number, type?: string): ProductAlert | undefined => {
    return alerts.find(alert => 
      alert.product_id === productId && 
      alert.is_active && 
      (!type || alert.type === type)
    );
  };

  /**
   * بررسی آیا برای محصول خاصی هشدار فعال وجود دارد
   */
  const hasAlert = (productId: number, type?: string): boolean => {
    return !!getAlertForProduct(productId, type);
  };

  /**
   * Toggle smart: اگر هشدار وجود دارد حذف کن، در غیر این صورت بساز
   */
  const toggleProductAlert = (
    productId: number, 
    type: 'restock' | 'price_drop' | 'target_price',
    targetPrice?: number
  ) => {
    const existingAlert = getAlertForProduct(productId, type);
    
    if (existingAlert) {
      deleteAlertMutation.mutate(existingAlert.id);
    } else {
      createAlertMutation.mutate({
        product_id: productId,
        type,
        target_price: targetPrice,
        channels: ['database', 'email'],
      });
    }
  };

  return {
    // Data
    alerts,
    totalAlerts,
    isAlertsLoading,
    
    // Mutations
    createAlert: createAlertMutation.mutate,
    deleteAlert: deleteAlertMutation.mutate,
    toggleAlert: toggleAlertMutation.mutate,
    isCreating: createAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
    
    // Helpers
    getAlertForProduct,
    hasAlert,
    toggleProductAlert,
  };
}

/**
 * Hook اختصاصی برای بررسی وضعیت هشدار یک محصول خاص
 * با این hook می‌توانیم در ProductDetailPage وضعیت دقیق را بدانیم
 */
export function useProductAlertStatus(productId: number | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: ['alert-status', productId],
    queryFn: async () => {
      if (!productId || !isAuthenticated) {
        return null;
      }
      const response = await alertService.getAlertStatus(productId);
      return response.data as AlertStatusResponse;
    },
    enabled: !!productId && isAuthenticated,
    staleTime: 60 * 1000, // ۱ دقیقه
    retry: 1,
  });

  return {
    status: data,
    isLoading,
    hasRestockAlert: data?.restock_alert || false,
    hasPriceDropAlert: data?.price_drop_alert || false,
    hasTargetPriceAlert: data?.target_price_alert || false,
    hasAnyAlert: data?.has_alert || false,
  };
}