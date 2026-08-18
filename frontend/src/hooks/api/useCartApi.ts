import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/api/cart.service';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { CartItem, Product, ProductVariant } from '@/types/models';
import toast from 'react-hot-toast';

/**
 * ✅ Variant/Color System فاز ۳: هویت یک آیتم سبد اکنون product_id +
 * variant_id است، نه فقط product_id (که قبلاً به‌عنوان «itemId» به این
 * mutation ها پاس داده می‌شد). variantId اختیاری است — عدم ارسال آن
 * دقیقاً همان محصول legacy (بدون رنگ) را هدف می‌گیرد.
 */
const sameItem = (item: { product_id: number; variant_id?: number | null }, productId: number, variantId: number | null) =>
  item.product_id === productId && (item.variant_id ?? null) === variantId;

/**
 * هوک TanStack Query برای مدیریت Cart با پشتیبانی از Optimistic UI
 * - Server state را با TanStack Query مدیریت می‌کند
 * - Client state را با Zustand sync می‌کند
 * - Optimistic UI برای تجربه کاربری لحظه‌ای
 */
export function useCartApi() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // 📥 دریافت Cart از API (فقط برای کاربران لاگین)
  const { data: cartItems = [], isLoading: isCartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await cartService.getCart();
      return response.data.items.map((item): CartItem => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        variant: item.variant ?? null,
        seller_id: item.seller_id || 1,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product: item.product as Product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 دقیقه
    retry: 1,
  });

  // 📤 افزودن به Cart با Optimistic UI
  const addToCartMutation = useMutation({
    mutationFn: async ({ product, quantity, deviceModelId, variant }: {
      product: Product;
      quantity: number;
      deviceModelId?: number;
      // ✅ فاز ۳: اختیاری — عدم ارسال یعنی محصول بدون رنگ (legacy)
      variant?: ProductVariant | null;
    }) => {
      if (!isAuthenticated) {
        return { product, quantity, isLocal: true };
      }
      await cartService.addToCart(product.id, quantity, deviceModelId, variant?.id ?? undefined);
      return { product, quantity, isLocal: false };
    },

    // 🎯 Optimistic Update: UI را بلافاصله آپدیت کن
    onMutate: async ({ product, quantity, variant }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot از وضعیت قبلی
      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']) || [];

      const variantId = variant?.id ?? null;
      // ✅ فاز ۳: هویت آیتم product_id + variant_id — رنگ متفاوت همان
      // محصول یک آیتم جدا می‌شود، نه merge با آیتم دیگر.
      const existingItem = previousCart.find((item) => sameItem(item, product.id, variantId));

      let newCart: CartItem[];
      if (existingItem) {
        newCart = previousCart.map(item =>
          sameItem(item, product.id, variantId)
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.price,
                updated_at: new Date().toISOString(),
              }
            : item
        );
      } else {
        const unitPrice = variant?.final_price ?? product.price;
        const newItem: CartItem = {
          id: Date.now(),
          product_id: product.id,
          variant_id: variantId,
          variant: variant
            ? { id: variant.id, color_name: variant.color_name, color_code: variant.color_code, sku: variant.sku }
            : null,
          seller_id: product.seller_id,
          quantity,
          price: unitPrice,
          total: unitPrice * quantity,
          product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        newCart = [...previousCart, newItem];
      }

      // آپدیت فوری UI
      queryClient.setQueryData(['cart'], newCart);

      // آپدیت Zustand store برای سازگاری
      useCartStore.getState().addItem(product, quantity, variant ?? null);

      return { previousCart };
    },
    
    // ✅ onSuccess: Toast و refetch
    onSuccess: (data) => {
      toast.success(
        data.isLocal 
          ? 'به سبد خرید اضافه شد (ذخیره موقت)' 
          : 'به سبد خرید اضافه شد',
        { icon: '🛒', duration: 2000 }
      );
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    
    // ❌ onError: Rollback
    onError: (error, _variables, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      toast.error('خطا در افزودن به سبد خرید', { icon: '❌', duration: 3000 });
      console.error('Failed to add to cart:', error);
    },
  });

  // 🗑️ حذف از Cart با Optimistic UI
  // ✅ فاز ۳: قبلاً پارامتر «itemId» در واقع همیشه product_id بود (تمام
  // فراخوان‌های واقعی همین‌طور صدا می‌زدند) — الان صریحاً یک آبجکت
  // {productId, variantId?} می‌گیرد تا رنگ درست هدف گرفته شود.
  const removeFromCartMutation = useMutation({
    mutationFn: async ({ productId, variantId = null }: { productId: number; variantId?: number | null }) => {
      if (!isAuthenticated) {
        return { productId, variantId, isLocal: true };
      }
      // پیدا کردن cartItemId واقعی از سرور، از طریق product_id + variant_id
      const response = await cartService.getCart();
      const serverItem = response.data.items.find(item => sameItem(item, productId, variantId));
      if (serverItem) {
        await cartService.removeItem(serverItem.id);
      }
      return { productId, variantId, isLocal: false };
    },

    // 🎯 Optimistic Update
    onMutate: async ({ productId, variantId = null }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']) || [];

      queryClient.setQueryData(
        ['cart'],
        (old: CartItem[] = []) => old.filter((item) => !sameItem(item, productId, variantId))
      );

      // آپدیت Zustand store
      useCartStore.getState().removeItem(productId, variantId);

      return { previousCart };
    },

    // ✅ onSuccess
    onSuccess: (data) => {
      toast.success(
        data.isLocal
          ? 'از سبد خرید حذف شد'
          : 'از سبد خرید حذف شد',
        { icon: '🗑️', duration: 2000 }
      );
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },

    // ❌ onError: Rollback
    onError: (error, _variables, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      toast.error('خطا در حذف از سبد خرید', { icon: '❌', duration: 3000 });
      console.error('Failed to remove from cart:', error);
    },
  });

  // 🔄 به‌روزرسانی تعداد با Optimistic UI
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, variantId = null, quantity }: { productId: number; variantId?: number | null; quantity: number }) => {
      if (!isAuthenticated) {
        return { productId, variantId, quantity, isLocal: true };
      }
      const response = await cartService.getCart();
      const serverItem = response.data.items.find(item => sameItem(item, productId, variantId));
      if (serverItem) {
        await cartService.updateQuantity(serverItem.id, quantity);
      }
      return { productId, variantId, quantity, isLocal: false };
    },

    // 🎯 Optimistic Update
    onMutate: async ({ productId, variantId = null, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']) || [];

      const previousItem = previousCart.find(item => sameItem(item, productId, variantId));
      if (!previousItem) return { previousCart };

      const newCart = previousCart.map(item =>
        sameItem(item, productId, variantId)
          ? {
              ...item,
              quantity,
              total: quantity * item.price,
              updated_at: new Date().toISOString(),
            }
          : item
      );

      queryClient.setQueryData(['cart'], newCart);

      // آپدیت Zustand store
      useCartStore.getState().updateQuantity(productId, quantity, variantId);

      return { previousCart };
    },
    
    // ✅ onSuccess
    onSuccess: (data) => {
      if (!data.isLocal) {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    },
    
    // ❌ onError: Rollback
    onError: (error, _variables, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      toast.error('خطا در به‌روزرسانی تعداد', { icon: '❌', duration: 3000 });
      console.error('Failed to update quantity:', error);
    },
  });

  // 🎯 Prefetch برای Product Card
  const prefetchCart = () => {
    queryClient.prefetchQuery({
      queryKey: ['cart'],
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    cartItems,
    isCartLoading,
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    prefetchCart,
    isInCart: (productId: number) => cartItems.some((item) => item.product_id === productId),
    getCartItem: (productId: number) => cartItems.find((item) => item.product_id === productId),
  };
}
