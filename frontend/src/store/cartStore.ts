// src/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, CartSellerGroup, Product, ProductVariant } from '@/types/models';
import { cartService } from '@/services/api/cart.service';

interface CartState {
  items: CartItem[];
  appliedCoupon: string | null;
  couponDiscount: number;
  isDrawerOpen: boolean;

  // ✅ Variant/Color System فاز ۳: هویت یک آیتم سبد از «product_id» به
  // «product_id + variant_id» تغییر کرده. variant اختیاری است — عدم
  // ارسال آن دقیقاً همان رفتار قبلی (محصول بدون رنگ) را می‌دهد.
  // removeItem/updateQuantity هم به همین دلیل عمداً variantId اختیاری
  // می‌گیرند: صدا زدن با فقط productId، دقیقاً همان آیتم legacy
  // (variant_id=null) را هدف می‌گیرد، نه هر ردیفی با آن product_id.
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeItem: (productId: number, variantId?: number | null) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number | null) => void;
  clearCart: () => void;

  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;

  getSubtotal: () => number;
  getTax: () => number;
  getShipping: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getGroupsBySeller: () => CartSellerGroup[];
  hasItems: () => boolean;
  
  syncCart: () => Promise<void>;
}

let cartIdCounter = Date.now();

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      couponDiscount: 0,
      isDrawerOpen: false,

      addItem: (product, quantity = 1, variant = null) => {
        const items = get().items;
        const variantId = variant?.id ?? null;
        // ✅ هویت آیتم سبد: product_id + variant_id. رنگ متفاوت همان
        // محصول یک آیتم کاملاً جدا می‌شود؛ همان رنگ (یا هر دو بدون رنگ)
        // merge می‌شود.
        const existingItem = items.find(
          (item) => item.product_id === product.id && (item.variant_id ?? null) === variantId
        );

        // ✅ اگر رنگی انتخاب شده، موجودی همان رنگ سنجیده می‌شود، نه
        // Product.stock کلی.
        const maxStock = variant ? variant.stock : product.stock;
        const unitPrice = variant?.final_price ?? product.price;
        const variantSummary = variant
          ? { id: variant.id, color_name: variant.color_name, color_code: variant.color_code, sku: variant.sku }
          : null;

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;

          if (newQuantity > maxStock) {
            return;
          }

          set({
            items: items.map((item) =>
              item.id === existingItem.id
                ? {
                    ...item,
                    quantity: newQuantity,
                    total: newQuantity * item.price,
                    updated_at: new Date().toISOString(),
                  }
                : item
            ),
          });

          // 🔄 Sync با سرور
          cartService.addToCart(product.id, quantity, undefined, variantId ?? undefined).catch(err => {
            console.error('Error syncing cart:', err);
          });

          return;
        }

        if (quantity > maxStock) {
          return;
        }

        const newItem: CartItem = {
          id: cartIdCounter++,
          product_id: product.id,
          variant_id: variantId,
          variant: variantSummary,
          seller_id: product.seller_id,
          quantity,
          price: unitPrice,
          total: unitPrice * quantity,
          product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set({ items: [...items, newItem] });

        // 🔄 Sync با سرور
        cartService.addToCart(product.id, quantity, undefined, variantId ?? undefined).catch(err => {
          console.error('Error syncing cart:', err);
        });
      },

      // ✅ فاز ۳: قبلاً این متد یک itemId می‌گرفت و با item.id مقایسه
      // می‌کرد؛ اما فراخوان‌های واقعی (WishlistPage و غیره) از قبل
      // product.id را پاس می‌دادند، نه شناسه‌ی واقعی ردیف سبد — یعنی این
      // مقایسه فقط وقتی درست کار می‌کرد که syncCart() قبلاً آیتم‌ها را
      // با id=product_id جایگزین کرده بود (رجوع به کامنت syncCart پایین).
      // امضای صریح (productId + variantId اختیاری) هم آن ابهام را رفع
      // می‌کند، هم رنگ‌دار را درست هدف می‌گیرد.
      removeItem: (productId, variantId = null) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.product_id === productId && (item.variant_id ?? null) === variantId)
          ),
        }));

        // 🔄 Sync با سرور — پیدا کردن شناسه‌ی واقعی ردیف سبد از طریق
        // product_id + variant_id، نه فقط product_id.
        cartService.getCart().then(res => {
          const serverItem = res.data.items.find(
            item => item.product_id === productId && (item.variant_id ?? null) === variantId
          );
          if (serverItem) {
            cartService.removeItem(serverItem.id);
          }
        }).catch(err => console.error('Error removing from cart:', err));
      },

      updateQuantity: (productId, quantity, variantId = null) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        const item = get().items.find(
          (i) => i.product_id === productId && (i.variant_id ?? null) === variantId
        );
        // ✅ اگر آیتم به یک رنگ وصل است، موجودی همان رنگ سنجیده می‌شود.
        const maxStock = item?.variant_id ? (item.product.variants?.find(v => v.id === item.variant_id)?.stock ?? item.product.stock) : item?.product.stock;
        if (item && maxStock !== undefined && quantity > maxStock) {
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId && (i.variant_id ?? null) === variantId
              ? {
                  ...i,
                  quantity,
                  total: quantity * i.price,
                  updated_at: new Date().toISOString(),
                }
              : i
          ),
        }));

        // 🔄 Sync با سرور
        cartService.getCart().then(res => {
          const serverItem = res.data.items.find(
            item => item.product_id === productId && (item.variant_id ?? null) === variantId
          );
          if (serverItem) {
            cartService.updateQuantity(serverItem.id, quantity);
          }
        }).catch(err => console.error('Error updating cart:', err));
      },

      clearCart: () => {
        set({
          items: [],
          appliedCoupon: null,
          couponDiscount: 0,
        });

        // 🔄 Sync با سرور
        cartService.clearCart().catch(err => console.error('Error clearing cart:', err));
      },

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      applyCoupon: async (code: string) => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (code === 'SALE10') {
            set({ appliedCoupon: code, couponDiscount: 0.1 });
            return true;
          }

          if (code === 'WELCOME20') {
            set({ appliedCoupon: code, couponDiscount: 0.2 });
            return true;
          }

          return false;
        } catch (error) {
          console.error('Coupon validation failed:', error);
          return false;
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, couponDiscount: 0 });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + (item.total || 0), 0);
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        return Math.floor(subtotal * 0.09);
      },

      getShipping: () => {
        const groups = get().getGroupsBySeller();
        return groups.reduce((sum, group) => sum + group.shipping, 0);
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const couponDiscount = get().couponDiscount;
        return Math.floor(subtotal * couponDiscount);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        const shipping = get().getShipping();
        const discount = get().getDiscount();

        return subtotal + tax + shipping - discount;
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getGroupsBySeller: () => {
        const items = get().items;
        const grouped: Record<number, CartSellerGroup> = {};

        items.forEach((item) => {
          if (!grouped[item.seller_id]) {
            grouped[item.seller_id] = {
              seller_id: item.seller_id,
              shop_name: item.product.seller?.shop_name || 'فروشگاه',
              items: [],
              subtotal: 0,
              shipping: 0,
              discount: 0,
              total: 0,
            };
          }

          grouped[item.seller_id].items.push(item);
          grouped[item.seller_id].subtotal += item.total || 0;
        });

        Object.values(grouped).forEach((group) => {
          group.shipping = group.subtotal >= 500000 ? 0 : 50000;
          group.total = group.subtotal + group.shipping - group.discount;
        });

        return Object.values(grouped);
      },

      hasItems: () => {
        return get().items.length > 0;
      },

      syncCart: async () => {
        try {
          const response = await cartService.getCart();
          if (response.success && response.data.items.length > 0) {
            // ✅ فاز ۳: قبلاً اینجا id مساوی product_id ست می‌شد (نه شناسه‌ی
            // واقعی ردیف سبد) — برای محصولات بدون رنگ (حداکثر یک ردیف
            // به‌ازای هر product_id در هر سبد) این تصادفاً کار می‌کرد، ولی
            // با ورود رنگ، دو ردیف مختلف (رنگ‌های متفاوت همان محصول) هر دو
            // همان id (=product_id) را می‌گرفتند — یعنی در state محلی
            // یکی می‌شدند/تداخل می‌کردند. حالا id واقعی سرور استفاده
            // می‌شود.
            const serverItems: CartItem[] = response.data.items.map(item => ({
              id: item.id,
              product_id: item.product_id,
              variant_id: item.variant_id ?? null,
              variant: item.variant ?? null,
              seller_id: item.seller_id || 1,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              product: item.product,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));
            
            set({ items: serverItems });
          }
        } catch (error) {
          console.error('Error syncing cart:', error);
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
);