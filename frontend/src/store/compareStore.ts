import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

/**
 * CompareStore - مدیریت لیست مقایسه محصولات
 *
 * معماری: Frontend-first با localStorage persistence
 * طراحی Backend-ready: در آینده می‌توان بدون تغییر UI،
 * persistence را به API تغییر داد.
 *
 * مطابق سند مرجع ازکالا (بخش ۸ Marketplace Components):
 * CompareBar + CompareTable
 */

// ==================== Types ====================

export interface CompareProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number | null;
  main_image?: string;
  rating?: number;
  reviews_count?: number;
  // ✅ مثل Product.specifications در types/models.ts این هم ستون JSON آزاد
  // بک‌اند است (رشته، عدد، بولین یا حتی تو در تو) — نه فقط رشته. مصرف‌کننده‌ها
  // (ComparePage.tsx) فقط با !== مقایسه و مستقیم رندر می‌کنند، پس unknown امن است.
  specifications?: Record<string, unknown>;
  compatible_models?: Array<{
    id: number;
    name: string;
    slug?: string;
  }>;
  seller?: {
    id: number;
    shop_name: string;
    slug: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  // ✅ P0 fix — Comparison Brand: قبلاً این فیلد اصلاً در CompareProduct
  // تعریف نشده بود، در حالی که ComparePage.tsx از قبل سعی می‌کرد
  // (product as any).brand?.name را رندر کند — یعنی ردیف «برند» همیشه
  // «—» نشان می‌داد، چون هیچ نقطه‌ی ورودی این فیلد را ست نمی‌کرد. شکل
  // دقیقاً مطابق Brand در types/models.ts (که ProductController از قبل
  // eager-load می‌کند) — نه یک شیء تازه‌اختراع‌شده.
  brand?: {
    id: number;
    name: string;
    slug: string;
  };
}

interface CompareState {
  products: CompareProduct[];
  maxProducts: number;

  // Actions
  addProduct: (product: CompareProduct) => void;
  removeProduct: (productId: number) => void;
  toggleProduct: (product: CompareProduct) => void;
  clearAll: () => void;

  // Selectors
  isCompared: (productId: number) => boolean;
  canCompare: () => boolean;
}

// ==================== Store ====================

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      products: [],
      maxProducts: 4,

      addProduct: (product) => {
        const { products, maxProducts } = get();

        // جلوگیری از محصول تکراری
        if (products.some((p) => p.id === product.id)) {
          toast.error('این محصول قبلاً در لیست مقایسه وجود دارد');
          return;
        }

        // بررسی سقف
        if (products.length >= maxProducts) {
          toast.error(`حداکثر ${maxProducts} محصول می‌توانید مقایسه کنید`);
          return;
        }

        set({ products: [...products, product] });
        toast.success('محصول به لیست مقایسه اضافه شد', { icon: '⚖️' });
      },

      removeProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
      },

      toggleProduct: (product) => {
        const { products, maxProducts } = get();
        const exists = products.some((p) => p.id === product.id);

        if (exists) {
          get().removeProduct(product.id);
          toast.success('محصول از لیست مقایسه حذف شد');
        } else {
          if (products.length >= maxProducts) {
            toast.error(`حداکثر ${maxProducts} محصول می‌توانید مقایسه کنید`);
            return;
          }
          set({ products: [...products, product] });
          toast.success('محصول به لیست مقایسه اضافه شد', { icon: '⚖️' });
        }
      },

      clearAll: () => {
        set({ products: [] });
        toast.success('لیست مقایسه پاک شد');
      },

      isCompared: (productId) => {
        return get().products.some((p) => p.id === productId);
      },

      canCompare: () => {
        return get().products.length >= 2;
      },
    }),
    {
      name: 'azkala-compare',
      // فقط products را persist کن، نه functions
      partialize: (state) => ({
        products: state.products,
      }),
    }
  )
);