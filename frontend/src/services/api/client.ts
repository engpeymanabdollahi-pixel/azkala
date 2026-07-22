import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

// ==================== Axios Instance ====================
const client = axios.create({
  // ✅ اضافه کردن /v1 به انتهای آدرس پایه
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/v1` : 'http://127.0.0.1:8000/api/v1',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ==================== Request Queue (برای Refresh Token) ====================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

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
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
};

const addPendingRequest = (config: InternalAxiosRequestConfig): void => {
  const requestKey = generateRequestKey(config);
  
  // لغو درخواست قبلی اگر وجود دارد
  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey);
    controller?.abort();
    pendingRequests.delete(requestKey);
  }
  
  // ایجاد AbortController جدید
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
    // افزودن Token
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // افزودن Language Header
    if (config.headers) {
      config.headers['Accept-Language'] = 'fa';
    }

    // جلوگیری از درخواست تکراری (فقط برای GET)
    if (config.method?.toUpperCase() === 'GET') {
      addPendingRequest(config);
    }

    // Logging در Development
    if (import.meta.env.DEV) {
      console.log(
        `%c📤 Request: ${config.method?.toUpperCase()} ${config.url}`,
        'color: #3b82f6; font-weight: bold;'
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== Response Interceptor ====================
client.interceptors.response.use(
  (response) => {
    // حذف از pending requests
    removePendingRequest(response.config);

    // Logging در Development
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
    
    // حذف از pending requests
    if (originalRequest) {
      removePendingRequest(originalRequest);
    }

    // اگر درخواست cancel شده، خطا را نادیده بگیر
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = originalRequest?.url || 'unknown';
    const errorData = error.response?.data as any;

    // Logging در Development
    if (import.meta.env.DEV) {
      console.error(
        `%c❌ Response Error: ${status || 'Network'} ${url}`,
        'color: #ef4444; font-weight: bold;',
        errorData || error.message
      );
    }

    // ==================== مدیریت ۴۰۱ - Refresh Token ====================
    if (status === 401 && !originalRequest._retry) {
      // اگر در حال refresh هستیم، درخواست را در صف قرار بده
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
        // تلاش برای refresh token
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (refreshToken) {
          // TODO: پیاده‌سازی refresh endpoint
          // const response = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
          // const newToken = response.data.token;
          // useAuthStore.getState().setToken(newToken);
          // processQueue(null, newToken);
          // originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // return client(originalRequest);
          
          // فعلاً logout می‌کنیم
          throw new Error('Refresh not implemented');
        } else {
          throw new Error('No refresh token');
        }
      } catch (refreshError) {
        // اگر refresh شکست خورد، logout کن
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

    // ==================== مدیریت ۴۲۲ - Validation Errors ====================
    if (status === 422) {
      const errors = errorData?.errors;
      if (errors) {
        // نمایش اولین خطا
        const firstError = Object.values(errors)[0];
        const message = Array.isArray(firstError) ? firstError[0] : firstError;
        
        toast.error(String(message) || 'خطای اعتبارسنجی', { 
          duration: 3000,
          icon: '⚠️'
        });
        
        // اگر فرم React Hook Form استفاده می‌کند، خطاها را برگردان
        return Promise.reject({ 
          ...error, 
          validationErrors: errors 
        });
      }
    }

    // ==================== مدیریت ۴۰۳ - Forbidden ====================
    else if (status === 403) {
      toast.error('شما دسترسی به این بخش را ندارید', { 
        icon: '🚫', 
        duration: 3000 
      });
    }

    // ==================== مدیریت ۴۰۴ - Not Found ====================
    else if (status === 404) {
      // برای health check toast نشان نده
      if (!url.includes('/test') && !url.includes('/health')) {
        toast.error('مورد درخواستی یافت نشد', { 
          icon: '🔍', 
          duration: 3000 
        });
      }
    }

    // ==================== مدیریت ۴۲۹ - Too Many Requests ====================
    else if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      const message = retryAfter 
        ? `لطفاً ${retryAfter} ثانیه صبر کنید`
        : 'تعداد درخواست‌ها بیش از حد مجاز است';
      
      toast.error(message, { 
        icon: '⏱️', 
        duration: 4000 
      });
    }

    // ==================== مدیریت ۵۰۰ - Server Error ====================
    else if (status === 500) {
      // اگر پیام خطا از سرور آمد، نمایش بده
      const serverMessage = errorData?.message;
      
      toast.error(serverMessage || 'خطای سرور. لطفاً دوباره تلاش کنید', { 
        icon: '💥', 
        duration: 4000 
      });
    }

    // ==================== مدیریت ۵۰۳ - Service Unavailable ====================
    else if (status === 503) {
      toast.error('سرویس موقتاً در دسترس نیست. لطفاً چند لحظه دیگر تلاش کنید', { 
        icon: '🔧', 
        duration: 4000 
      });
    }

    // ==================== مدیریت Network Error ====================
    else if (!error.response) {
      // بررسی timeout
      if (error.code === 'ECONNABORTED') {
        toast.error('زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید', { 
          icon: '⏰', 
          duration: 4000 
        });
      } else {
        toast.error('خطای اتصال به سرور. اینترنت خود را بررسی کنید', { 
          icon: '🌐', 
          duration: 4000 
        });
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