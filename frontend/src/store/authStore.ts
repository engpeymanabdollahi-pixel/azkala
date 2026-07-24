import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthResponse, Seller } from '@/types/models';
import { useWishlistStore } from './wishlistStore';
import { requestNotificationPermission } from '@/lib/notification';

// ✅ ایمپورت استورهای سبد خرید و انتخاب مدل برای پاکسازی هنگام خروج
import { useCartStore } from './cartStore';
import { useModelStore } from './modelStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  seller: Seller | null;
  
  // Actions
  login: (response: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setSeller: (seller: Seller | null) => void;
  
  // Helpers
  isSeller: () => boolean;
  isApprovedSeller: () => boolean;
  isAdmin: () => boolean;
  isCustomer: () => boolean;
  canAccessSellerPanel: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      seller: null,

      login: async (response: AuthResponse) => {
        set({
          user: response.user,
          token: response.token || null,
          isAuthenticated: true,
        });
        
        // ✅ استفاده از 'token' برای هماهنگی کامل با apiClient
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        
        if (response.user?.role === 'seller' && (response as any).seller) {
          set({ seller: (response as any).seller });
        }

        try {
          await useWishlistStore.getState().syncFromApi();
          requestNotificationPermission();
        } catch (error) {
          console.error('Failed to sync wishlist after login:', error);
        }
      },

      logout: async () => {
        try {
          const { authService } = await import('@/services/api/auth.service');
          await authService.logout();
        } catch (error: any) {
          // ✅ نادیده گرفتن خطاهای 401 یا خطای "No refresh token"
          // چون هدف ما خروج است و اگر قبلاً خارج شده باشیم، همین کافی است
          const isAuthError = 
            error.response?.status === 401 || 
            error.message?.includes('No refresh token') ||
            error.message?.includes('Unauthenticated');

          if (!isAuthError) {
            console.error('Unexpected logout error:', error);
          }
        } finally {
          // ✅ این بخش "همیشه" اجرا می‌شود، چه درخواست موفق باشد چه خطا بدهد
          
          // ۱. پاک کردن حالت Zustand (احراز هویت)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            seller: null,
          });
          
          // ۲. پاک کردن تمام داده‌های ذخیره‌شده احراز هویت در مرورگر
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');
          
          // ✅ ۳. پاکسازی کامل سبد خرید (هم از State و هم از localStorage)
          useCartStore.setState({
            items: [],
            appliedCoupon: null,
            couponDiscount: 0,
            isDrawerOpen: false,
          });
          localStorage.removeItem('cart-storage');
          
          // ✅ ۴. پاکسازی کامل انتخاب دستگاه/مدل (هم از State و هم از localStorage)
          useModelStore.setState({
            selectedBrand: null,
            selectedSeries: null,
            selectedModel: null,
            selectedCategory: null,
            isModalOpen: false,
          });
          localStorage.removeItem('azkala-model-storage');
          
          // ۵. هدایت اجباری و سخت (Hard Redirect) برای جلوگیری از حلقه‌های رندر React
          // و اطمینان از رندر مجدد هدر با Stateهای خالی
          window.location.href = '/';
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      setSeller: (seller: Seller | null) => {
        set({ seller });
      },

      isSeller: () => {
        return get().user?.role === 'seller';
      },

      isApprovedSeller: () => {
        const state = get();
        return state.user?.role === 'seller' && state.seller?.status === 'active';
      },

      isAdmin: () => {
        return get().user?.role === 'admin';
      },

      isCustomer: () => {
        return get().user?.role === 'customer';
      },

      canAccessSellerPanel: () => {
        const state = get();
        return state.isSeller() && state.seller?.status === 'active';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        seller: state.seller,
      }),
    }
  )
);