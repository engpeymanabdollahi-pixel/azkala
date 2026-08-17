import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types/models';
import { wishlistService } from '@/services/api/wishlist.service';
import { useAuthStore } from './authStore';

interface WishlistState {
  items: Product[];
  isSyncing: boolean;
  lastSync: number | null;
  
  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
  
  // Sync with API
  syncFromApi: () => Promise<void>;
  syncToApi: (action: 'add' | 'remove', productId: number) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,
      lastSync: null,

      addItem: (product) => {
        const currentItems = get().items;
        if (!currentItems.some((item) => item.id === product.id)) {
          set({ items: [...currentItems, product] });
          
          // فقط اگر کاربر لاگین است، به API sync کن
          const isAuthenticated = useAuthStore.getState().isAuthenticated;
          if (isAuthenticated) {
            get().syncToApi('add', product.id).catch(console.error);
          }
        }
      },

      removeItem: (productId) => {
        // ✅ برخلاف addItem که قبل از set یک چک «آیا از قبل هست» دارد،
        // removeItem بدون قید و شرط هم set و هم syncToApi را صدا می‌زد —
        // یعنی دوبار کلیک سریع روی دکمه‌ی حذف (مثلاً در WishlistPage.tsx)
        // دو درخواست DELETE برای همان محصول می‌فرستاد (دومی بی‌فایده، فقط
        // بار اضافه‌ی شبکه/سرور، حتی اگر خطایش دیده نشود).
        const wasPresent = get().items.some((item) => item.id === productId);
        if (!wasPresent) return;

        set({ items: get().items.filter((item) => item.id !== productId) });

        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (isAuthenticated) {
          get().syncToApi('remove', productId).catch(console.error);
        }
      },

      toggleItem: (product) => {
        if (get().items.some((item) => item.id === product.id)) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },

      isInWishlist: (productId) => get().items.some((item) => item.id === productId),

     clearWishlist: async () => {
  const items = get().items;
  set({ items: [], isSyncing: true });
  
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (isAuthenticated && items.length > 0) {
    // پاک کردن همه محصولات از API (یکی یکی)
    const deletePromises = items.map(item => 
      get().syncToApi('remove', item.id).catch(console.error)
    );
    await Promise.all(deletePromises);
  }
  
  set({ isSyncing: false });
},

      syncFromApi: async () => {
  try {
    set({ isSyncing: true });
   const response = await wishlistService.getWishlist();

// ✅ response.data آرایه محصولات است (wishlistService خودش unwrap کرده)
const rawData = response.data;
const itemsArray = Array.isArray(rawData) ? rawData : [];
    
    const apiItems = itemsArray
      .map((item: any) => item.product)
      .filter((p: any) => p && p.id && p.slug);
    
    set({ items: apiItems, isSyncing: false });
  } catch (error) {
    console.error('Failed to sync wishlist:', error);
    set({ isSyncing: false });
  }
},

      syncToApi: async (action, productId) => {
        try {
          if (action === 'add') {
            await wishlistService.addToWishlist(productId);
          } else if (action === 'remove') {
            await wishlistService.removeFromWishlist(productId);
          }
        } catch (error) {
          const err = error as { response?: { status?: number } };
          // اگر 404 بود، یعنی محصول در API نیست - از localStorage حذف کن
          if (err.response?.status === 404) {
            console.warn(`⚠️ محصول #${productId} در سرور نیست، از localStorage حذف شد`);
            set({ items: get().items.filter(item => item.id !== productId) });
          } else {
            console.error(`Failed to sync wishlist ${action}:`, error);
          }
        }
      },
    }),
    { 
      name: 'wishlist-storage',
      // 🆕 هنگام rehydrate، فقط محصولات معتبر را لود کن
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            const validItems = state.items.filter(p => p && p.id && p.slug);
            if (validItems.length !== state.items.length) {
              console.log(`🧹 ${state.items.length - validItems.length} محصول نامعتبر از wishlist حذف شد`);
              state.items = validItems;
            }
          }
        };
      }
    }
  )
);