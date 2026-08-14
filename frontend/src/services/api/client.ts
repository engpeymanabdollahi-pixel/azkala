import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { API_ORIGIN, API_V1_URL } from '@/lib/apiConfig';
import { logger } from '@/utils/logger';

// ==================== Axios Instance ====================
const client = axios.create({
  baseURL: API_V1_URL,
  timeout: 120000,
  withCredentials: true, // ✅ این خط را حتماً اضافه کنید
  // ✅ بدون این، axios کوکی XSRF-TOKEN را فقط برای درخواست‌های هم‌مبدأ
  // می‌خواند و در هدر X-XSRF-TOKEN می‌گذارد. فرانت‌اند (127.0.0.1:5173) و
  // بک‌اند (127.0.0.1:8000) پورت متفاوت دارند یعنی از نظر مرورگر دو مبدأ
  // جدا هستند — بدون این پرچم axios هیچ‌وقت هدر CSRF را نمی‌فرستد، هرچند
  // بار fetchCsrfCookie() صدا زده شود یا retry شود؛ چون مشکل خواندن کوکی
  // در axios است، نه نبودِ خودِ کوکی. همین باعث ۴۱۹ مکرر روی
  // register/login/verify-otp می‌شد.
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
  },
});

// ==================== Request Interceptor ====================
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. افزودن Token
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. افزودن Language Header
    if (config.headers) {
      config.headers['Accept-Language'] = 'fa';
    }

    // 3. مدیریت حیاتی Content-Type برای FormData
    if (config.data instanceof FormData) {
      if (config.headers) {
        const headers = config.headers as Record<string, string | boolean>;
        delete headers['Content-Type'];
      }
    } else {
      if (config.headers) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // 4. ✅ دریافت خودکار CSRF Cookie برای متدهای stateful
    // لاراول برای POST/PUT/PATCH/DELETE با Sanctum توکن CSRF می‌خواهد.
    // به جای اصلاح تک‌تک سرویس‌ها، اینجا به‌صورت مرکزی مدیریت می‌کنیم.
    // فقط برای درخواست‌هایی که قبلاً retry نشده‌اند (جلوگیری از حلقه).
    const method = config.method?.toLowerCase();
    const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method || '');

    if (needsCsrf && !(config as any)._csrfFetched) {
      try {
        await fetchCsrfCookie();
        (config as any)._csrfFetched = true;
      } catch (csrfError) {
        logger.warn('Failed to fetch CSRF cookie:', csrfError);
        // ادامه می‌دهیم حتی اگر CSRF fail شد - شاید درخواست public باشد
      }
    }

    // 4.۵ ✅ هدر X-XSRF-TOKEN را دستی می‌سازیم، نه با تکیه بر withXSRFToken.
    // withXSRFToken:true روی axios باید همین کار را خودکار انجام بدهد، ولی
    // در محیط واقعی (Windows/Laragon) با همان کوکی موجود همچنان ۴۱۹ دیده شد
    // — یعنی رفتار خواندن خودکار کوکیِ axios به‌اندازه‌ی کافی قابل‌اتکا
    // نیست تا رویش حساب کرد. خواندن مستقیم document.cookie و ست کردن هدر
    // اینجا هیچ ابهامی در مورد نسخه‌ی axios یا تشخیص هم‌مبدأ باقی نمی‌گذارد.
    if (needsCsrf && config.headers) {
      const xsrfToken = readCookie('XSRF-TOKEN');
      if (xsrfToken) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
      }
    }

    // 5. Logging در Development
    if (import.meta.env.DEV) {
      logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`, 
        config.data instanceof FormData ? 'FormData (File Upload)' : config.data);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== Response Interceptor ====================
client.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      logger.debug(`Response: ${response.status} ${response.config.url}`);
    }

    // ✅ حفظ ساختار قبلی: برگرداندن کل آبجکت response تا ۳۶ فایل Service خراب نشوند
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = originalRequest?.url || 'unknown';
    const errorData = error.response?.data as { message?: string; code?: string; errors?: Record<string, string[]> } | undefined;

    // ✅ این interceptor قبلاً هر پاسخ غیر-2xx را (حتی وقتی کد بالادست
    // کاملاً درست مدیریتش می‌کرد، مثل 409 «قبلاً در wishlist هست») با
    // logger.error چاپ می‌کرد — یعنی در کنسول قرمز دیده می‌شد در حالی که
    // رفتار واقعی برنامه درست بود. برای این حالت‌های شناخته‌شده و بی‌خطر
    // (نه یک باگ واقعی) سطح لاگ به debug کاهش پیدا می‌کند.
    const isBenignConflict = status === 409 && errorData?.code === 'ALREADY_WISHLISTED';

    if (import.meta.env.DEV) {
      if (isBenignConflict) {
        logger.debug(`Response (expected conflict): ${status} ${url}`, errorData);
      } else {
        logger.error(`Response Error: ${status || 'Network'} ${url}`,
          errorData || error.message);
      }
    }

          // مدیریت هوشمند خطای ۴۰۱
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // درخواست‌های پس‌زمینه را نادیده بگیر
        if (originalRequest.url?.includes('can-review') || 
            originalRequest.url?.includes('/reviews') ||
            originalRequest.url?.includes('notifications')) {
          return Promise.reject(error);
        }

        const authState = useAuthStore.getState();

        // ✅ اگر کاربر در حافظه هست ولی token از بین رفته، سعی کن از cookie استفاده کنی
        if (authState.isAuthenticated && authState.user && !authState.token) {
          try {
            // ✅ عمداً axios خام، نه authService.getUser() (که از همین client
            // با همین interceptor استفاده می‌کند). قبلاً وقتی این پروب خودش هم
            // ۴۰۱ می‌گرفت (کوکی نشست هم نامعتبر بود)، چون originalRequest آن
            // تازه بود (._retry نداشت)، همین شاخه دوباره اجرا می‌شد و دوباره
            // پروب می‌زد — یک حلقه‌ی بی‌نهایت از درخواست‌های GET /user که در
            // عرض چند ثانیه مرورگر را کاملاً هنگ می‌کرد (صدها درخواست پشت سر
            // هم، دیده‌شده مستقیم با Playwright).
            const probeResponse = await axios.get(`${API_V1_URL}/user`, { withCredentials: true });
            const user = probeResponse.data?.data;
            if (user) {
              // Cookie هنوز معتبر است، فقط state را به‌روز کن
              authState.updateUser(user as any);
              // Retry با cookie
              return client(originalRequest);
            }
          } catch {
            // Cookie هم منقضی شده
          }
        }

        // در غیر این صورت، واقعاً logout کن
        if (authState.isAuthenticated) {
          authState.logout();
          toast.error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید', { 
            icon: '🔒', 
            duration: 4000 
          });
        }
        
        return Promise.reject(error);
      }
          // ✅ مدیریت هوشمند خطای ۴۱۹ (CSRF Token Mismatch)
    // اگر CSRF cookie منقضی شده باشد، یک بار دوباره دریافت کن و retry کن
    if (status === 419 && !(originalRequest as any)._csrfRetry) {
      (originalRequest as any)._csrfRetry = true;
      
      try {
        await fetchCsrfCookie();
        // Retry همان request با cookie جدید
        return client(originalRequest);
      } catch (csrfError) {
        logger.error('Failed to refresh CSRF cookie:', csrfError);
        toast.error('مشکل امنیتی. لطفاً صفحه را رفرش کنید', { icon: '🔒', duration: 4000 });
      }
    }

    // مدیریت ۴۲۲ - Validation Errors
    if (status === 422 && errorData?.errors) {
      const errors = errorData.errors;
      const firstError = Object.values(errors)[0];
      const message = Array.isArray(firstError) ? firstError[0] : firstError;
      toast.error(String(message) || 'خطای اعتبارسنجی', { duration: 4000, icon: '⚠️' });
      return Promise.reject({ ...error, validationErrors: errors });
    }

    // مدیریت سایر خطاها
    if (status === 403) toast.error('شما دسترسی به این بخش را ندارید', { icon: '🚫', duration: 3000 });
    if (status === 404 && !url.includes('/test')) toast.error('مورد درخواستی یافت نشد', { icon: '🔍', duration: 3000 });
    if (status === 429) toast.error('تعداد درخواست‌ها بیش از حد مجاز است', { icon: '⏱️', duration: 4000 });
    if (status === 500) toast.error(errorData?.message || 'خطای سرور', { icon: '💥', duration: 4000 });
    if (!error.response) toast.error('خطای اتصال به سرور. اینترنت خود را بررسی کنید', { icon: '🌐', duration: 4000 });

    return Promise.reject(error);
  }
);

/**
 * دریافت کوکی CSRF از Sanctum.
 *
 * وقتی درخواست stateful باشد (مبدأ در SANCTUM_STATEFUL_DOMAINS)، لاراول توکن
 * CSRF را اجباری می‌کند. بدون این فراخوانی، هر POST از مرورگر ۴۱۹ می‌گیرد.
 *
 * مسیرش زیر api/v1 نیست، پس از API_ORIGIN استفاده می‌شود نه baseURL کلاینت.
 *
 * باید پیش از هر عملیات ورود/ثبت‌نام صدا زده شود.
 */
export const fetchCsrfCookie = async (): Promise<void> => {
  await axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true });
};

/**
 * مقدار خام یک کوکی را از document.cookie می‌خواند.
 *
 * ✅ قبلاً برای خواندن XSRF-TOKEN فقط به withXSRFToken/رفتار داخلی axios
 * تکیه می‌شد. روی این پروژه در یک محیط واقعی (Windows/Laragon) با همان
 * پرچم فعال، هدر همچنان فرستاده نمی‌شد و ۴۱۹ ادامه داشت — یعنی رفتار
 * خودکار axios به‌قدر کافی قابل‌اتکا نبود که رویش حساب شود. خواندن مستقیم
 * کوکی اینجا هیچ وابستگی‌ای به نسخه‌ی axios یا تشخیص هم‌مبدأ ندارد.
 */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));

  return match ? match[1] : null;
}

// ✅ تابع Dummy برای جلوگیری از خطای import در ۳ فایل دیگر
export const cancelAllRequests = (): void => {
  // React Query خودش مدیریت لغو درخواست‌ها را انجام می‌دهد
};

export default client;