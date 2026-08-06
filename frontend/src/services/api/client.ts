import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

// ==================== Axios Instance ====================
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/v1` : 'http://127.0.0.1:8000/api/v1',
  timeout: 120000,
    withCredentials: true, // ✅ این خط را حتماً اضافه کنید
  headers: {
    'Accept': 'application/json',
  },
});

// ==================== Request Interceptor ====================
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
        delete (config.headers as any)['Content-Type'];
      }
    } else {
      if (config.headers) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // 4. Logging در Development
    if (import.meta.env.DEV) {
      console.log(
        `%c📤 Request: ${config.method?.toUpperCase()} ${config.url}`,
        'color: #3b82f6; font-weight: bold;',
        config.data instanceof FormData ? 'FormData (File Upload)' : config.data
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== Response Interceptor ====================
client.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(
        `%c✅ Response: ${response.status} ${response.config.url}`,
        'color: #10b981; font-weight: bold;'
      );
    }

    // ✅ حفظ ساختار قبلی: برگرداندن کل آبجکت response تا ۳۶ فایل Service خراب نشوند
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = originalRequest?.url || 'unknown';
    const errorData = error.response?.data as any;

    if (import.meta.env.DEV) {
      console.error(
        `%c❌ Response Error: ${status || 'Network'} ${url}`,
        'color: #ef4444; font-weight: bold;',
        errorData || error.message
      );
    }

          // مدیریت هوشمند خطای ۴۰۱
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // ✅ اگر درخواست مربوط به بررسی‌های پس‌زمینه (مثل can-review) است، کاربر را بیرون نانداز
        if (originalRequest.url?.includes('can-review') || originalRequest.url?.includes('/reviews')) {
          return Promise.reject(error);
        }

        // در غیر این صورت، اگر واقعاً نشست اصلی منقضی شده باشد، کاربر را خارج کن
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated) {
          authState.logout();
          toast.error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید', { icon: '🔒', duration: 4000 });
        }
        
        return Promise.reject(error);
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

// ✅ تابع Dummy برای جلوگیری از خطای import در ۳ فایل دیگر
export const cancelAllRequests = (): void => {
  // React Query خودش مدیریت لغو درخواست‌ها را انجام می‌دهد
};

export { client as apiClient };

export default client;