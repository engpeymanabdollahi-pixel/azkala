import apiClient, { fetchCsrfCookie } from './client';

// ✅ تغییر: استفاده از phone به جای email برای لاگین
export interface LoginData {
  phone: string;
  password: string;
}

// ✅ تغییر: phone اجباری شد، email اختیاری (nullable) شد
export interface RegisterData {
  name: string;
  phone: string; 
  password: string;
  password_confirmation: string;
  email?: string; 
}

// ✅ تغییر: phone اجباری، email اختیاری
export interface User {
  id: number;
  name: string;
  email?: string; 
  phone: string;  
  role: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

interface ApiError {
  response?: {
    status: number;
    data?: unknown;
  };
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // با احراز هویت stateful، لاراول توکن CSRF می‌خواهد؛ بدون این، POST
      // با ۴۱۹ رد می‌شود.
      await fetchCsrfCookie();

      const response = await apiClient.post<AuthResponse>('/login', data);

      if (response.data.success) {
        // توکن دیگر در localStorage نگهداری نمی‌شود: نشست روی کوکی httpOnly
        // سوار است که جاوااسکریپت — و در نتیجه XSS — نمی‌تواند بخواندش.
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('Login service error:', error);
      const apiError = error as ApiError;
      if (apiError.response) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      await fetchCsrfCookie();

      const response = await apiClient.post<AuthResponse>('/register', data);

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('Register service error:', error);
      const apiError = error as ApiError;
      if (apiError.response) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
    }
  },

  async getUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: User }>('/user');
    return response.data.data;
  },

  /**
   * @deprecated نشست روی کوکی httpOnly است و از جاوااسکریپت خوانده نمی‌شود.
   * apiClient خودش کوکی را همراه هر درخواست می‌فرستد؛ چیزی برای برگرداندن نیست.
   */
  getToken(): string | null {
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};