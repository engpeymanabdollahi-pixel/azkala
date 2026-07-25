import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

// ==================== Axios Instance ====================
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/v1` : 'http://127.0.0.1:8000/api/v1',
  timeout: 120000,
  headers: {
    'Accept': 'application/json',
    // ⚠️ نکته حیاتی: Content-Type را اینجا تعریف نکنید. 
    // اجازه دهید Axios برای FormData خودش boundary را تنظیم کند.
  },
});

// ==================== Request Queue (برای Refresh Token) ====================
let isRefreshing = false;
type QueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};
let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ==================== Pending Requests (Duplicate Cancellation) ====================
const pendingRequests = new Map<string, AbortController>();

const generateRequestKey = (config: AxiosRequestConfig): string => {
  const { method, url, params } = config;
  // ⚠️ اصلاح حیاتی: data را حذف کردیم چون JSON.stringify(FormData) مقدار "{}" می‌دهد 
  // و باعث تداخل و لغو اشتباه درخواست‌های آپلود فایل می‌شود.
  return [method, url, JSON.stringify(params)].join('&');
};

const addPendingRequest = (config: InternalAxiosRequestConfig): void => {
  const requestKey = generateRequestKey(config);

  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey);
    controller?.abort();
    pendingRequests.delete(requestKey);
  }

  const controller = new AbortController();
  config.signal = controller.signal;
  pendingRequests.set(requestKey, controller);
};

const removePendingRequest = (config: AxiosRequestConfig): void => {
  const requestKey = generateRequestKey(config);
  pendingRequests.delete(requestKey);
};

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

    // 3. ⚠️ مدیریت حیاتی Content-Type برای FormData
    if (config.data instanceof FormData) {
      // حذف هرگونه Content-Type از پیش تنظیم شده تا مرورگر بتواند 
      // هدر را همراه با boundary صحیح (مثلاً multipart/form-data; boundary=----WebKit...) تنظیم کند.
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    } else {
      // برای سایر درخواست‌ها (مثل JSON)، هدر را به صورت صریح تنظیم می‌کنیم
      if (config.headers) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // 4. جلوگیری از درخواست تکراری (فقط برای GET)
    if (config.method?.toUpperCase() === 'GET') {
      addPendingRequest(config);
    }

    // 5. Logging در Development
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
    removePendingRequest(response.config);

    if (import.meta.env.DEV) {
      console.log(
        `%c✅ Response: ${response.status} ${response.config.url}`,
        'color: #10b981; font-weight: bold;'
      );
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (originalRequest) {
      removePendingRequest(originalRequest);
    }

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

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

    // مدیریت ۴۰۱ - Refresh Token
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          // TODO: پیاده‌سازی refresh endpoint
          throw new Error('Refresh not implemented');
        } else {
          throw new Error('No refresh token');
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        useAuthStore.getState().logout();
        
        toast.error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید', {
          icon: '🔐',
          duration: 4000,
        });
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // مدیریت ۴۲۲ - Validation Errors
    if (status === 422) {
      const errors = errorData?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        const message = Array.isArray(firstError) ? firstError[0] : firstError;
        
        toast.error(String(message) || 'خطای اعتبارسنجی', { 
          duration: 4000,
          icon: '⚠️'
        });
        
        return Promise.reject({ 
          ...error, 
          validationErrors: errors 
        });
      }
    }

    // مدیریت ۴۰۳ - Forbidden
    if (status === 403) {
      toast.error('شما دسترسی به این بخش را ندارید', { icon: '🚫', duration: 3000 });
    }

    // مدیریت ۴۰۴ - Not Found
    if (status === 404) {
      if (!url.includes('/test') && !url.includes('/health')) {
        toast.error('مورد درخواستی یافت نشد', { icon: '🔍', duration: 3000 });
      }
    }

    // مدیریت ۴۲۹ - Too Many Requests
    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      const message = retryAfter ? `لطفاً ${retryAfter} ثانیه صبر کنید` : 'تعداد درخواست‌ها بیش از حد مجاز است';
      toast.error(message, { icon: '⏱️', duration: 4000 });
    }

    // مدیریت ۵۰۰ - Server Error
    if (status === 500) {
      const serverMessage = errorData?.message;
      toast.error(serverMessage || 'خطای سرور. لطفاً دوباره تلاش کنید', { icon: '💥', duration: 4000 });
    }

    // مدیریت ۵۰۳ - Service Unavailable
    if (status === 503) {
      toast.error('سرویس موقتاً در دسترس نیست. لطفاً چند لحظه دیگر تلاش کنید', { icon: '🔧', duration: 4000 });
    }

    // مدیریت Network Error
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید', { icon: '⏰', duration: 4000 });
      } else {
        toast.error('خطای اتصال به سرور. اینترنت خود را بررسی کنید', { icon: '🌐', duration: 4000 });
      }
    }

    return Promise.reject(error);
  }
);

// ==================== Cancel Token Helper ====================
export const cancelAllRequests = (): void => {
  pendingRequests.forEach((controller) => controller.abort());
  pendingRequests.clear();
};

export default client;