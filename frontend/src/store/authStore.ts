import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthResponse, Seller, AdministrativeRole } from '@/types/models';
import { useWishlistStore } from './wishlistStore';
import { requestNotificationPermission } from '@/lib/notification';
import { useCartStore } from './cartStore';
import { useModelStore } from './modelStore';
import { useCompareStore } from './compareStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  seller: Seller | null;

   login: (response: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setSeller: (seller: Seller | null) => void;
  setToken: (token: string | null) => void;

  isSeller: () => boolean;
  isApprovedSeller: () => boolean;
  isAdmin: () => boolean;
  isCustomer: () => boolean;
  canAccessSellerPanel: () => boolean;

  // ✅ سیستم Multi-Admin/Manager (بخش ۱۸ درخواست) — این دو صرفاً روی
  // user.administrative_role/user.permissions (که از AuthController
  // می‌آید) می‌خوانند؛ عمداً state جدا/تکراری نیستند، چون user همان‌جا
  // در localStorage هم persist می‌شود. منطق hasPermission/hasAnyPermission/
  // hasAllPermissions در usePermission() (بخش ۱۹) است، نه اینجا — تا
  // چک Super Admin bypass فقط یک‌جا نوشته شود.
  //
  // ⚠️ این‌ها فقط برای UX/نمایش‌اند؛ Backend تنها مرجع امنیتی واقعی
  // است و هر endpoint حساس را مستقل از این مقادیر enforce می‌کند.
  getAdministrativeRole: () => AdministrativeRole | null;
  getPermissions: () => string[];
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

          // ✅ فاز ۵.۲ (بازبینی مقایسه محصولات): compareStore هیچ جدول
          // بک‌اندی ندارد و به هیچ کاربری sync نمی‌شود (برخلاف wishlist که
          // عمداً اینجا پاک نمی‌شود چون syncFromApi در login دوباره پرش
          // می‌کند) — دقیقاً مثل cartStore/modelStore بالا یک state محلیِ
          // مرورگر است که روی یک کامپیوتر مشترک نباید بین دو کاربر مختلف
          // نشت کند.
          useCompareStore.setState({ products: [] });
          localStorage.removeItem('azkala-compare');

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
        const state = get();
        
        // اگر هیچ سابقه‌ای از ورود نیست، رد شو
        if (!state.isAuthenticated && !state.user) {
          return;
        }

        try {
          const { authService } = await import('@/services/api/auth.service');
          const user = (await authService.getUser()) as unknown as User;
          
          // ✅ به‌روزرسانی user + isAuthenticated
          // token را تغییر نمی‌دهیم چون ممکن است از cookie احراز شده باشیم
          set({ 
            user, 
            isAuthenticated: true,
            // اگر useradmin است و seller قبلاً null بوده، seller را هم null نگه دار
          });
        } catch (error) {
          // ۴۰۱ یعنی هم cookie و هم token نامعتبرند
          console.warn('[checkAuth] Session expired, clearing state');
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

      setToken: (token: string | null) => {
        set({ token });
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

      getAdministrativeRole: () => get().user?.administrative_role ?? null,
      getPermissions: () => get().user?.permissions ?? [],
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