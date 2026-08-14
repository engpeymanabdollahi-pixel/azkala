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
      
      // اگر محصول از قبل در لیست هست، کاری نکن
      if (previousWishlist.some(item => item.id === newProduct.id)) {
        return { previousWishlist, alreadyExists: true };
      }
      
      // آپدیت فوری UI
      queryClient.setQueryData(['wishlist'], (old: Product[] = []) => [...old, newProduct]);
      
      // آپدیت Zustand store برای سازگاری
      if (!localWishlist.some(item => item.id === newProduct.id)) {
        useWishlistStore.getState().addItem(newProduct);
      }
      
      return { previousWishlist, alreadyExists: false };
    },
    
    // ✅ onSuccess: Toast و refetch
    // (شاخه‌ی data.alreadyExists قبلاً اینجا مرده بود — mutationFn هیچ‌وقت
    // چنین فیلدی برنمی‌گرداند؛ حالت «قبلاً در لیست بوده» واقعاً توسط
    // onError با context.alreadyExists/کد ۴۰۹ مدیریت می‌شود، همان‌طور که
    // پایین‌تر هم هست.)
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
      if (context?.alreadyExists) {
        return;
      }
      
      // بررسی خطای 409 - محصول قبلاً در لیست بوده
      const axiosError = error as { response?: { status?: number; data?: { code?: string; message?: string } } };
      const errorCode = axiosError.response?.data?.code;
      const errorMessage = axiosError.response?.data?.message;
      
      if (axiosError.response?.status === 409 || errorCode === 'ALREADY_WISHLISTED') {
        // این یک خطا نیست، فقط اطلاع‌رسانی می‌کنیم
        toast(errorMessage || 'این محصول قبلاً در علاقمندی‌های شما وجود دارد', { 
          icon: 'ℹ️', 
          duration: 2000,
          style: {
            background: '#f6f8fa',
            color: '#24292f',
            border: '1px solid #d0d7de',
          },
        });
        // Refetch برای اطمینان از sync بودن داده‌ها
        queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        return;
      }
      
      // سایر خطاها - rollback
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
    // ✅ قبلاً هر خطایی (حتی 404 «این محصول در علاقه‌مندی‌های شما نیست») به‌عنوان
    // شکست واقعی نمایش داده می‌شد و rollback می‌کرد. اما وقتی محصول از قبل حذف
    // شده (مثلاً به‌خاطر دوبار کلیک سریع، دو درخواست DELETE می‌رفت؛ اولی موفق،
    // دومی 404) این یعنی هدف کاربر (نبودن محصول در لیست) در واقع محقق شده —
    // نه یک خطای واقعی. نمایش toast خطا + rollback (که می‌توانست محصول را
    // دوباره در UI برگرداند در حالی که سرور واقعاً حذفش کرده بود) رفتار غلطی
    // بود. الگوی این بلوک دقیقاً مثل مدیریت 409 در addToWishlistMutation است.
    onError: (error, _productId, context) => {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        return;
      }

      queryClient.setQueryData(['wishlist'], context?.previousWishlist);
      toast.error('خطا در حذف از علاقمندی‌ها', { icon: '❌', duration: 3000 });
      console.error('Failed to remove from wishlist:', error);
    },
  });

  // 🔄 Toggle با Optimistic UI
  //
  // ✅ قبلاً وضعیت «آیا در wishlist هست؟» از روی wishlistItems (که از useQuery
  // و رندر قبلی کامپوننت گرفته می‌شود) خوانده می‌شد — یک کلوژر بالقوه stale.
  // بین لحظه‌ی mutate شدن (که queryClient.setQueryData را به‌صورت optimistic
  // آپدیت می‌کند) و رندر بعدی React که wishlistItems را به‌روز می‌کند، یک
  // پنجره‌ی زمانی کوتاه هست؛ دوبار کلیک سریع روی دکمه‌ی قلب در همین پنجره
  // هر دو بار همان جهت (مثلاً هر دو add، یا هر دو remove) را می‌دیدند و دو
  // درخواست همزمان به سرور می‌فرستادند (یکی موفق، دومی 409/404). حالا مستقیم
  // از cache زنده‌ی queryClient خوانده می‌شود که همیشه به‌روز است.
  const toggleWishlist = (product: Product) => {
    const currentWishlist = queryClient.getQueryData<Product[]>(['wishlist']) || wishlistItems;
    const isInWishlist = currentWishlist.some((item) => item.id === product.id);

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
    // ✅ برای غیرفعال‌کردن دکمه در حین درخواست — یک لایه‌ی دفاعی اضافه در
    // کنار خواندن زنده از queryClient در toggleWishlist، تا کلیک سریع
    // روی دکمه‌ی قلب هرگز دو درخواست هم‌زمان نفرستد.
    isTogglingWishlist: addToWishlistMutation.isPending || removeFromWishlistMutation.isPending,
  };
}
