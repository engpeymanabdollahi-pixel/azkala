import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthResponse, Seller } from '@/types/models';
import { useWishlistStore } from './wishlistStore';
import { requestNotificationPermission } from '@/lib/notification';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  seller: Seller | null;
  
  // Actions
  login: (response: AuthResponse) => Promise<void>;
  logout: () => void;
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
        
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
        
        if (response.user?.role === 'seller' && (response as any).seller) {
          set({ seller: (response as any).seller });
        }

        // 🆕 Sync Wishlist از API بعد از لاگین
        try {
          await useWishlistStore.getState().syncFromApi();
// 🔔 درخواست اجازه نوتیفیکیشن
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
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            seller: null,
          });
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
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