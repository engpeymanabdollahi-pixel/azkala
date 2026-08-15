import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { pushSubscriptionService } from '@/services/api/pushSubscription.service';

// ✅ کلید localStorage برای نگه‌داشتن id ردیف push_subscriptions بک‌اند —
// چون هیچ endpoint «لیست subscription های من» وجود ندارد (فقط
// subscribe/unsubscribe/test/vapid-key)، تنها راه یافتن id برای
// unsubscribe بعدی همین است. مقدار حساس نیست (فقط یک عدد شناسه).
const SUBSCRIPTION_ID_KEY = 'azkala-push-subscription-id';

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * تبدیل کلید VAPID (base64url) به Uint8Array — فرمت استاندارد مورد نیاز
 * PushManager.subscribe({ applicationServerKey }).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { status?: number; data?: { message?: string } } })?.response;

  if (response?.status === 403) {
    return 'دسترسی لازم (Permission «مدیریت پشتیبانی») برای فعال‌سازی نوتیفیکیشن را ندارید.';
  }
  if (response?.data?.message) {
    return response.data.message;
  }
  if (err instanceof Error) {
    return err.message || fallback;
  }

  return fallback;
}

interface UsePushNotificationResult {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

/**
 * مدیریت Web Push از سمت کلاینت: permission، subscribe/unsubscribe واقعی
 * روی PushManager مرورگر + هماهنگی با ۴ endpoint واقعی بک‌اند
 * (backend/app/Http/Controllers/Api/PushSubscriptionController.php).
 *
 * ⚠️ این route ها فقط برای کاربر admin با Permission support.manage
 * مجازند (routes/api.php) — این hook را فقط در بخشی از پنل ادمین رندر
 * کنید، نه صفحات کاربر عادی (وگرنه subscribe همیشه با ۴۰۳ رد می‌شود).
 */
export function usePushNotification(): UsePushNotificationResult {
  const supported = isPushSupported();

  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // بررسی وضعیت واقعی subscription مرورگر هنگام mount — تا اگر کاربر قبلاً
  // subscribe کرده (مثلاً در یک session قبلی)، دکمه از ابتدا وضعیت درست را
  // نشان دهد، نه همیشه «فعال‌سازی نوتیفیکیشن».
  useEffect(() => {
    if (!supported) return;

    let cancelled = false;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();

        if (!cancelled) {
          setIsSubscribed(!!existing);
        }
      } catch {
        // ✅ عمداً بی‌صدا — یعنی وضعیت subscribe نامشخص می‌ماند (نه خطا)،
        // کاربر همچنان می‌تواند دکمه را بزند و subscribe واقعی تلاش کند.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) {
      setError('مرورگر شما از نوتیفیکیشن Push پشتیبانی نمی‌کند.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ۱. permission
      let currentPermission = Notification.permission;
      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      }

      if (currentPermission !== 'granted') {
        setError('مجوز نوتیفیکیشن داده نشد.');
        return;
      }

      // ۲. Service Worker registration موجود (از main.tsx ثبت شده)
      const registration = await navigator.serviceWorker.ready;

      // ۳. گرفتن VAPID public key از بک‌اند
      const vapidResponse = await pushSubscriptionService.getVapidPublicKey();
      if (!vapidResponse.success || !vapidResponse.publicKey) {
        setError('کلید VAPID سرور تنظیم نشده است؛ لطفاً با پشتیبانی فنی تماس بگیرید.');
        return;
      }

      // ۴. ایجاد PushSubscription واقعی مرورگر (یا استفاده از موجود)
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // ✅ Cast صریح به BufferSource: با @types/node حاضر در پروژه،
          // Uint8Array به‌صورت generic (`Uint8Array<ArrayBufferLike>`)
          // تایپ می‌شود که با تعریف lib.dom.d.ts برای
          // applicationServerKey (`BufferSource | string | null`) به‌صورت
          // ساختاری یکی تشخیص داده نمی‌شود — در Runtime هیچ تفاوتی
          // نیست، فقط یک ناسازگاری شناخته‌شده‌ی تایپ TS است.
          applicationServerKey: urlBase64ToUint8Array(vapidResponse.publicKey) as BufferSource,
        });
      }

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setError('اطلاعات subscription مرورگر ناقص است.');
        return;
      }

      // ۵. ارسال subscription به بک‌اند
      const saved = await pushSubscriptionService.subscribe({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });

      if (saved.success) {
        localStorage.setItem(SUBSCRIPTION_ID_KEY, String(saved.data.id));
        setIsSubscribed(true);
        toast.success('نوتیفیکیشن با موفقیت فعال شد.');
      } else {
        setError(saved.message || 'ثبت subscription ناموفق بود.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'خطا در فعال‌سازی نوتیفیکیشن.'));
    } finally {
      setIsLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;

    setIsLoading(true);
    setError(null);

    try {
      // همیشه سطح مرورگر را غیرفعال کن — این بخش هرگز به id بک‌اند وابسته
      // نیست، پس حتی اگر id گم شده باشد کاربر واقعاً دیگر push دریافت
      // نمی‌کند.
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      // در صورت وجود id ذخیره‌شده، سمت بک‌اند هم غیرفعال کن. نبودِ id یا
      // شکست این تماس را «خطای بلاک‌کننده» در نظر نمی‌گیریم — ردیف
      // یتیم در سمت سرور خودش در اولین تلاش ارسال ناموفق deactivate
      // می‌شود (PushSubscriptionService::sendTestNotification).
      const storedId = localStorage.getItem(SUBSCRIPTION_ID_KEY);
      if (storedId) {
        try {
          await pushSubscriptionService.unsubscribe(Number(storedId));
        } catch (err) {
          console.warn('[usePushNotification] حذف subscription سمت سرور ناموفق بود:', err);
        } finally {
          localStorage.removeItem(SUBSCRIPTION_ID_KEY);
        }
      }

      setIsSubscribed(false);
      toast.success('نوتیفیکیشن غیرفعال شد.');
    } catch (err) {
      setError(extractErrorMessage(err, 'خطا در غیرفعال‌سازی نوتیفیکیشن.'));
    } finally {
      setIsLoading(false);
    }
  }, [supported]);

  const sendTestNotification = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await pushSubscriptionService.sendTest();
      if (result.success) {
        toast.success('نوتیفیکیشن تست ارسال شد.');
      } else {
        setError(result.message || 'هیچ subscription فعالی یافت نشد.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'خطا در ارسال نوتیفیکیشن تست.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permission,
    isSupported: supported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
