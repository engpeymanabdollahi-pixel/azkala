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

      clearWishlist: () => {
        set({ items: [] });
        // TODO: Clear all from API (need bulk delete endpoint)
      },

      syncFromApi: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        
        // اگر کاربر لاگین نیست، از localStorage استفاده کن
        if (!isAuthenticated) {
          console.log('⚠️ کاربر لاگین نیست، از localStorage استفاده می‌شود');
          return;
        }
        
        if (get().isSyncing) return;
        
        set({ isSyncing: true });
        try {
          const response = await wishlistService.getWishlist();
          
          // 🆕 فقط محصولاتی که واقعاً وجود دارند و معتبر هستند
          const apiItems = response.data.data
            .map(w => w.product)
            .filter(p => p && p.id && p.slug && p.name); // فقط محصولات معتبر
          
          // 🆕 جایگزین کردن کامل (نه merge)
          set({ 
            items: apiItems,
            lastSync: Date.now()
          });
          
          console.log(`✅ Wishlist sync شد: ${apiItems.length} محصول از API`);
        } catch (error) {
          console.error('Failed to sync wishlist from API:', error);
        } finally {
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