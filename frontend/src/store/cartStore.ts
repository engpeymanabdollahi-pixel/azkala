// src/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, CartSellerGroup, Product } from '@/types/models';
import { cartService } from '@/services/api/cart.service';

interface CartState {
  items: CartItem[];
  appliedCoupon: string | null;
  couponDiscount: number;
  isDrawerOpen: boolean;

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
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

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find((item) => item.product_id === product.id);

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          const maxStock = product.stock;

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
          cartService.addToCart(product.id, quantity).catch(err => {
            console.error('Error syncing cart:', err);
          });

          return;
        }

        if (quantity > product.stock) {
          return;
        }

        const newItem: CartItem = {
          id: cartIdCounter++,
          product_id: product.id,
          seller_id: product.seller_id,
          quantity,
          price: product.price,
          total: product.price * quantity,
          product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set({ items: [...items, newItem] });

        // 🔄 Sync با سرور
        cartService.addToCart(product.id, quantity).catch(err => {
          console.error('Error syncing cart:', err);
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));

        // 🔄 Sync با سرور
        cartService.getCart().then(res => {
          const serverItem = res.data.items.find(item => item.product_id === itemId);
          if (serverItem) {
            cartService.removeItem(serverItem.id);
          }
        }).catch(err => console.error('Error removing from cart:', err));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const item = get().items.find((i) => i.id === itemId);
        if (item && quantity > item.product.stock) {
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  total: quantity * item.price,
                  updated_at: new Date().toISOString(),
                }
              : item
          ),
        }));

        // 🔄 Sync با سرور
        cartService.getCart().then(res => {
          const serverItem = res.data.items.find(item => item.product_id === itemId);
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
            const serverItems: CartItem[] = response.data.items.map(item => ({
              id: item.product_id,
              product_id: item.product_id,
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