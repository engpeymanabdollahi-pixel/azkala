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
          const isAuthError = 
            error.response?.status === 401 || 
            error.message?.includes('No refresh token') ||
            error.message?.includes('Unauthenticated');

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