import client from './client';

// ==================== Types ====================
// ✅ این تایپ‌ها دقیقاً منطبق با
// backend/app/Http/Controllers/Api/PushSubscriptionController.php هستند
// (نه حدس) — چهار route واقعی موجود، همه زیر گروه admin:
//   POST   /admin/push/subscribe
//   DELETE /admin/push/unsubscribe/{subscription}
//   POST   /admin/push/test
//   GET    /admin/push/vapid-public-key
//
// ⚠️ نکته معماری مهم: این route ها با middleware('admin') +
// permission:support.manage محافظت می‌شوند (routes/api.php حدود خط ۷۹۴)،
// یعنی فقط کاربری که هم users.role=admin است و هم Permission
// support.manage دارد می‌تواند subscribe/unsubscribe/test بزند — این یک
// قابلیت عمومی مشتری نیست. به همین دلیل usePushNotification/
// PushNotificationButton عمداً فقط داخل پنل ادمین (AdminSettingsPage، تب
// «اطلاع‌رسانی») رندر می‌شود، نه در صفحات کاربر عادی — رندر کردنش جای
// دیگری همیشه با ۴۰۳ مواجه می‌شد. تغییر این محدوده‌ی Permission یک تصمیم
// معماری جداست و خارج از scope فاز TWA preparation است.

export interface PushSubscriptionRecord {
  id: number;
  user_id: number;
  endpoint: string;
  is_active: boolean;
  last_used_at: string | null;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const pushSubscriptionService = {
  async getVapidPublicKey(): Promise<{ success: boolean; publicKey: string | null }> {
    const response = await client.get('/admin/push/vapid-public-key');
    return response.data;
  },

  async subscribe(
    payload: PushSubscriptionPayload
  ): Promise<{ success: boolean; message: string; data: PushSubscriptionRecord }> {
    const response = await client.post('/admin/push/subscribe', payload);
    return response.data;
  },

  async unsubscribe(id: number): Promise<{ success: boolean; message: string }> {
    const response = await client.delete(`/admin/push/unsubscribe/${id}`);
    return response.data;
  },

  async sendTest(): Promise<{ success: boolean; message?: string; results?: unknown[] }> {
    const response = await client.post('/admin/push/test');
    return response.data;
  },
};
