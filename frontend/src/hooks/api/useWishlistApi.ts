import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '@/services/api/wishlist.service';
import { productService } from '@/services/api/product.service';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Product } from '@/types/models';
import toast from 'react-hot-toast';

/**
 * هوک TanStack Query برای مدیریت Wishlist با پشتیبانی از Optimistic UI
 * - Server state را با TanStack Query مدیریت می‌کند
 * - Client state را با Zustand sync می‌کند
 * - Optimistic UI برای تجربه کاربری لحظه‌ای
 */
export function useWishlistApi() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const localWishlist = useWishlistStore((state) => state.items);
  
  // 📥 دریافت Wishlist از API (فقط برای کاربران لاگین)
  const { data: wishlistItems = [], isLoading: isWishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await wishlistService.getWishlist();
      return response.data.data.map((item) => item.product as Product);
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 دقیقه
    retry: 1,
  });

  // 📤 افزودن به Wishlist با Optimistic UI
  const addToWishlistMutation = useMutation({
    mutationFn: async (product: Product) => {
      if (!isAuthenticated) {
        // کاربر لاگین نیست - فقط localStorage
        return { product, isLocal: true };
      }
      await wishlistService.addToWishlist(product.id);
      return { product, isLocal: false };
    },
    
    // 🎯 Optimistic Update: UI را بلافاصله آپدیت کن
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      
      // Snapshot از وضعیت قبلی
      const previousWishlist = queryClient.getQueryData<Product[]>(['wishlist']) || [];
      
      // آپدیت فوری UI
      queryClient.setQueryData(['wishlist'], (old: Product[] = []) => [...old, newProduct]);
      
      // آپدیت Zustand store برای سازگاری
      if (!localWishlist.some(item => item.id === newProduct.id)) {
        useWishlistStore.getState().addItem(newProduct);
      }
      
      return { previousWishlist };
    },
    
    // ✅ onSuccess: Toast و refetch
    onSuccess: (data) => {
      toast.success(
        data.isLocal 
          ? 'به علاقمندی‌ها اضافه شد (ذخیره موقت)' 
          : 'به علاقمندی‌ها اضافه شد',
        { icon: '❤️', duration: 2000 }
      );
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    
    // ❌ onError: Rollback
    onError: (error, _product, context) => {
      queryClient.setQueryData(['wishlist'], context?.previousWishlist);
      toast.error('خطا در افزودن به علاقمندی‌ها', { icon: '💔', duration: 3000 });
      console.error('Failed to add to wishlist:', error);
    },
  });

  // 🗑️ حذف از Wishlist با Optimistic UI
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!isAuthenticated) {
        return { productId, isLocal: true };
      }
      await wishlistService.removeFromWishlist(productId);
      return { productId, isLocal: false };
    },
    
    // 🎯 Optimistic Update
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      
      const previousWishlist = queryClient.getQueryData<Product[]>(['wishlist']) || [];
      
      queryClient.setQueryData(
        ['wishlist'],
        (old: Product[] = []) => old.filter((p) => p.id !== productId)
      );
      
      // آپدیت Zustand store
      useWishlistStore.getState().removeItem(productId);
      
      return { previousWishlist };
    },
    
    // ✅ onSuccess
    onSuccess: (data) => {
      toast.success(
        data.isLocal 
          ? 'از علاقمندی‌ها حذف شد' 
          : 'از علاقمندی‌ها حذف شد',
        { icon: '💔', duration: 2000 }
      );
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    
    // ❌ onError: Rollback
    onError: (error, _productId, context) => {
      queryClient.setQueryData(['wishlist'], context?.previousWishlist);
      toast.error('خطا در حذف از علاقمندی‌ها', { icon: '❌', duration: 3000 });
      console.error('Failed to remove from wishlist:', error);
    },
  });

  // 🔄 Toggle با Optimistic UI
  const toggleWishlist = (product: Product) => {
    const isInWishlist = wishlistItems.some((item) => item.id === product.id);
    
    if (isInWishlist) {
      removeFromWishlistMutation.mutate(product.id);
    } else {
      addToWishlistMutation.mutate(product);
    }
  };

  // 🎯 Prefetch برای Product Card
  //
  // نسخه‌ی قبلی این تابع پارامترش را نادیده می‌گرفت و به‌جای محصول، کلید
  // ['wishlist'] را آن هم بدون queryFn prefetch می‌کرد — یعنی عملاً هیچ کاری
  // نمی‌کرد. حالا واقعاً همان محصول را از پیش می‌گیرد، از مسیر productService
  // که روی apiClient سوار است (نه fetch با آدرس هاردکد، وگرنه روی دامنه‌ی جدا
  // درخواست به خودِ فرانت‌اند می‌رود).
  const prefetchProduct = (product: Product) => {
    queryClient.prefetchQuery({
      queryKey: ['product', product.id],
      queryFn: () => productService.getProduct(product.id),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    wishlistItems,
    isWishlistLoading,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    toggleWishlist,
    prefetchProduct,
    isInWishlist: (productId: number) => wishlistItems.some((item) => item.id === productId),
  };
}
