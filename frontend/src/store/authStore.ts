import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthResponse, Seller } from '@/types/models';
import { useWishlistStore } from './wishlistStore';
import { requestNotificationPermission } from '@/lib/notification';
import { useCartStore } from './cartStore';
import { useModelStore } from './modelStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  seller: Seller | null;
  
  login: (response: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  /** تأیید نشست از روی کوکی هنگام بالا آمدن اپ */
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setSeller: (seller: Seller | null) => void;
  
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
        
        // ✅ اصلاح امنیتی: حذف localStorage.setItem('token', ...)
        // توکن فقط در حافظه Zustand می‌ماند و توسط apiClient خوانده می‌شود.
        
        if (response.user?.role === 'seller' && 'seller' in response) {
          set({ seller: response.seller as Seller });
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
        } catch (error) {
          const isAuthError = 
            (error as { response?: { status?: number } }).response?.status === 401 || 
            (error as { message?: string }).message?.includes('No refresh token') ||
            (error as { message?: string }).message?.includes('Unauthenticated');

          if (!isAuthError) {
            console.error('Unexpected logout error:', error);
          }
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            seller: null,
          });
          
          // ✅ اصلاح امنیتی: حذف localStorage.removeItem('token')
          localStorage.removeItem('auth-storage');
          
          useCartStore.setState({
            items: [],
            appliedCoupon: null,
            couponDiscount: 0,
            isDrawerOpen: false,
          });
          localStorage.removeItem('cart-storage');
          
          useModelStore.setState({
            selectedBrand: null,
            selectedSeries: null,
            selectedModel: null,
            selectedCategory: null,
            isModalOpen: false,
          });
          localStorage.removeItem('azkala-model-storage');
          
          window.location.href = '/';
        }
      },

      /**
       * تأیید نشست هنگام بالا آمدن اپ.
       *
       * isAuthenticated در localStorage persist می‌شود ولی خودش هیچ چیزی را
       * ثابت نمی‌کند — فقط می‌گوید کاربر زمانی وارد شده بود. تا پیش از این هیچ
       * چیز آن را راستی‌آزمایی نمی‌کرد، پس اپ بعد از هر refresh خودش را لاگین
       * فرض می‌کرد و اولین درخواست با ۴۰۱ کاربر را بیرون می‌انداخت.
       *
       * حالا از سرور می‌پرسیم. کوکی نشست خودکار همراه درخواست می‌رود؛ اگر معتبر
       * باشد کاربرِ تازه برمی‌گردد، وگرنه حالت بدون‌ورود پاک‌سازی می‌شود.
       */
      checkAuth: async () => {
        // اگر هرگز واردی در کار نبوده، درخواستی هم لازم نیست.
        if (!get().isAuthenticated && !get().user) {
          return;
        }

        try {
          const { authService } = await import('@/services/api/auth.service');
          // auth.service نسخه‌ی سبک‌تری از User را اعلام می‌کند (بدون created_at
          // و updated_at). منبع واقعی همان چیزی است که API می‌دهد؛ store روی
          // نوع کامل types/models کار می‌کند.
          const user = (await authService.getUser()) as unknown as User;

          set({ user, isAuthenticated: true });
        } catch {
          // ۴۰۱ یعنی کوکی نبود یا منقضی شده. بی‌صدا پاک می‌کنیم؛ اینجا toast
          // «نشست منقضی شد» نشان نمی‌دهیم چون بازدیدکننده‌ای که فقط localStorage
          // کهنه دارد کار اشتباهی نکرده است.
          set({ user: null, token: null, isAuthenticated: false, seller: null });
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

      isSeller: () => get().user?.role === 'seller',
      isApprovedSeller: () => {
        const state = get();
        return state.user?.role === 'seller' && state.seller?.status === 'active';
      },
      isAdmin: () => get().user?.role === 'admin',
      isCustomer: () => get().user?.role === 'customer',
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
        // ✅ اصلاح امنیتی: token از اینجا حذف شد تا در localStorage ذخیره نشود
        isAuthenticated: state.isAuthenticated,
        seller: state.seller,
      }),
    }
  )
);