import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/api/cart.service';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { CartItem, Product } from '@/types/models';
import toast from 'react-hot-toast';

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
    mutationFn: async ({ product, quantity, deviceModelId }: { 
      product: Product; 
      quantity: number; 
      deviceModelId?: number 
    }) => {
      if (!isAuthenticated) {
        return { product, quantity, isLocal: true };
      }
      await cartService.addToCart(product.id, quantity, deviceModelId);
      return { product, quantity, isLocal: false };
    },
    
    // 🎯 Optimistic Update: UI را بلافاصله آپدیت کن
    onMutate: async ({ product, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      
      // Snapshot از وضعیت قبلی
      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']) || [];
      
      // بررسی وجود محصول در سبد
      const existingItem = previousCart.find(item => item.product_id === product.id);
      
      let newCart: CartItem[];
      if (existingItem) {
        newCart = previousCart.map(item =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.price,
                updated_at: new Date().toISOString(),
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: Date.now(),
          product_id: product.id,
          seller_id: product.seller_id,
          quantity,
          price: product.price,
          total: product.price * quantity,
          product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        newCart = [...previousCart, newItem];
      }
      
      // آپدیت فوری UI
      queryClient.setQueryData(['cart'], newCart);
      
      // آپدیت Zustand store برای سازگاری
      useCartStore.getState().addItem(product, quantity);
      
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
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!isAuthenticated) {
        return { itemId, isLocal: true };
      }
      // پیدا کردن cartItemId واقعی از سرور
      const response = await cartService.getCart();
      const serverItem = response.data.items.find(item => item.product_id === itemId);
      if (serverItem) {
        await cartService.removeItem(serverItem.id);
      }
      return { itemId, isLocal: false };
    },
    
    // 🎯 Optimistic Update
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      
      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']) || [];
      
      queryClient.setQueryData(
        ['cart'],
        (old: CartItem[] = []) => old.filter((item) => item.product_id !== itemId)
      );
      
      // آپدیت Zustand store
      const localItem = useCartStore.getState().items.find(i => i.product_id === itemId);
      if (localItem) {
        useCartStore.getState().removeItem(localItem.id);
      }
      
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
    onError: (error, _itemId, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      toast.error('خطا در حذف از سبد خرید', { icon: '❌', duration: 3000 });
      console.error('Failed to remove from cart:', error);
    },
  });

  // 🔄 به‌روزرسانی تعداد با Optimistic UI
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      if (!isAuthenticated) {
        return { itemId, quantity, isLocal: true };
      }
      const response = await cartService.getCart();
      const serverItem = response.data.items.find(item => item.product_id === itemId);
      if (serverItem) {
        await cartService.updateQuantity(serverItem.id, quantity);
      }
      return { itemId, quantity, isLocal: false };
    },
    
    // 🎯 Optimistic Update
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      
      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']) || [];
      
      const previousItem = previousCart.find(item => item.product_id === itemId);
      if (!previousItem) return { previousCart };
      
      const newCart = previousCart.map(item =>
        item.product_id === itemId
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
      const localItem = useCartStore.getState().items.find(i => i.product_id === itemId);
      if (localItem) {
        useCartStore.getState().updateQuantity(localItem.id, quantity);
      }
      
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
