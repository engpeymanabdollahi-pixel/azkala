import apiClient from './client';

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

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/login', data);
      
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login service error:', error);
      if (error.response) {
        throw error;
      }
      throw new Error('خطا در ارتباط با سرور');
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/register', data);
      
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Register service error:', error);
      if (error.response) {
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  async getUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: User }>('/user');
    return response.data.data;
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};