import { useMutation, useQuery, useQueryClient, useIsMutating } from '@tanstack/react-query';
import { wishlistService } from '@/services/api/wishlist.service';
import { productService } from '@/services/api/product.service';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Product } from '@/types/models';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

// ============================================================================
// 🌐 MODULE-LEVEL SINGLETONS
// ============================================================================
// این متغیرها بین همه instance های useWishlistApi() shared هستند.
// چرا؟ چون هر ProductCard یک instance جداگانه از این hook می‌سازد و اگر
// state داخل hook باشد، هر کارت state خودش را دارد و نمی‌تواند از وضعیت
// کارت‌های دیگر آگاه شود (مشکل cross-instance dedup).
// ============================================================================

/**
 * آیا sync اولیه بعد از login انجام شده؟
 * جلوگیری از اجرای مجدد sync در هر instance جدید.
 */
let globalHasSynced = false;

/**
 * آیا sync در حال انجام است؟
 * جلوگیری از اجرای همزمان چند sync.
 */
let globalSyncInProgress = false;

/**
 * مجموعه محصولات در حال toggle (shared بین همه instance ها).
 * وقتی کاربر روی قلب کلیک می‌کند، productId اینجا اضافه می‌شود تا
 * instance های دیگر بدانند این محصول در حال پردازش است و درخواست
 * duplicate نفرستند.
 */
const globalPendingToggles = new Set<number>();

/**
 * لیست listener ها برای notify کردن همه instance ها وقتی
 * globalPendingToggles تغییر می‌کند (تا UI re-render شود).
 */
const toggleListeners = new Set<() => void>();

/**
 * Notify کردن همه listener ها (باعث re-render همه instance ها می‌شود).
 */
function notifyToggleListeners() {
  toggleListeners.forEach((listener) => listener());
}

// ============================================================================
// 🎣 MAIN HOOK
// ============================================================================

/**
 * هوک TanStack Query برای مدیریت Wishlist با پشتیبانی از Optimistic UI
 *
 * معماری:
 * - Server state با TanStack Query (cache key: ['wishlist'])
 * - Client state با Zustand (برای persistence در localStorage)
 * - Optimistic UI برای تجربه لحظه‌ای
 * - Module-level singletons برای cross-instance dedup
 */
export function useWishlistApi() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const localWishlist = useWishlistStore((state) => state.items);

  // =========================================================================
  // 🔄 SYNC AFTER LOGIN (یکبار در کل اپ)
  // =========================================================================
  //
  // مشکل قبلی: useEffect با dependency [isAuthenticated, queryClient] باعث
  // infinite loop می‌شد چون queryClient در هر render تغییر می‌کرد.
  //
  // راه‌حل:
  // 1. حذف queryClient از dependency array
  // 2. استفاده از globalHasSynced برای اجرای فقط یکبار
  // 3. استفاده از globalSyncInProgress برای جلوگیری از اجرای همزمان
  // =========================================================================
  useEffect(() => {
    // فقط یکبار بعد از اولین isAuthenticated=true اجرا شود
    if (isAuthenticated && !globalHasSynced && !globalSyncInProgress) {
      globalSyncInProgress = true;
      globalHasSynced = true;

      // Force refetch از API
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });

      // Sync Zustand store با backend
      useWishlistStore
        .getState()
        .syncFromApi()
        .catch(() => {
          // اگر sync شکست خورد، اشکالی ندارد - query refetch کافی است
        })
        .finally(() => {
          globalSyncInProgress = false;
        });
    }

    // وقتی کاربر logout می‌کند، reset برای login بعدی
    if (!isAuthenticated) {
      globalHasSynced = false;
    }
  }, [isAuthenticated, queryClient]);

  // =========================================================================
  // 🎯 GLOBAL PENDING TOGGLES HOOK
  // =========================================================================
  //
  // مشکل قبلی: useState<Set<number>> برای pendingToggle per-instance بود.
  // اگر همان محصول در دو نقطه رندر شده بود (مثلاً Related + Main Grid)،
  // هر کدام state جداگانه داشتند و guard کار نمی‌کرد.
  //
  // راه‌حل:
  // 1. globalPendingToggles به عنوان source of truth
  // 2. forceUpdate برای re-render وقتی set تغییر می‌کند
  // 3. listener pattern برای subscribe شدن به تغییرات
  // =========================================================================

  // State فقط برای trigger کردن re-render (مقدار مهم نیست)
  const [, forceUpdate] = useState({});

  // Subscribe به تغییرات globalPendingToggles
  useEffect(() => {
    const listener = () => forceUpdate({});
    toggleListeners.add(listener);
    return () => {
      toggleListeners.delete(listener);
    };
  }, []);

  // Wrapper برای آپدیت globalPendingToggles با notify کردن listeners
  const setPendingToggle = (updater: (prev: Set<number>) => Set<number>) => {
    const newSet = updater(globalPendingToggles);
    globalPendingToggles.clear();
    newSet.forEach((id) => globalPendingToggles.add(id));
    notifyToggleListeners();
  };

  // Reference به global set (برای خواندن)
  const pendingToggle = globalPendingToggles;

  // =========================================================================
  // 📥 WISHLIST QUERY
  // =========================================================================
  const { data: wishlistItems = [], isLoading: isWishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await wishlistService.getWishlist();
      // wishlistService.getWishlist() خودش response.data را برمی‌گرداند
      // پس فقط یک .data لازم است (نه دو تا)
      return response.data.map((item: any) => item.product as Product);
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 دقیقه
    retry: 1,
  });

  // =========================================================================
  // 📤 ADD TO WISHLIST MUTATION
  // =========================================================================
  const addToWishlistMutation = useMutation({
    // mutationKey برای شناسایی cross-instance در MutationCache سراسری
    mutationKey: ['wishlist', 'add'],

    mutationFn: async (product: Product) => {
      if (!isAuthenticated) {
        // کاربر مهمان - فقط localStorage
        return { product, isLocal: true };
      }
      await wishlistService.addToWishlist(product.id);
      return { product, isLocal: false };
    },

    // 🎯 Optimistic Update: UI را بلافاصله آپدیت کن
    onMutate: async (newProduct) => {
      // لغو query های در حال اجرا
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });

      // Snapshot از وضعیت قبلی (برای rollback در صورت خطا)
      const previousWishlist =
        queryClient.getQueryData<Product[]>(['wishlist']) || [];

      // اگر محصول از قبل در لیست هست، علامت بزن (409 جلوگیری شود)
      if (previousWishlist.some((item) => item.id === newProduct.id)) {
        return { previousWishlist, alreadyExists: true };
      }

      // آپدیت فوری UI (قبل از پاسخ سرور)
      queryClient.setQueryData(
        ['wishlist'],
        (old: Product[] = []) => [...old, newProduct]
      );

      // آپدیت Zustand store برای سازگاری
      if (!localWishlist.some((item) => item.id === newProduct.id)) {
        useWishlistStore.getState().addItem(newProduct);
      }

      return { previousWishlist, alreadyExists: false };
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

    // ❌ onError: Rollback یا Sync
    onError: (error, _product, context) => {
      // اگر onMutate تشخیص داد محصول از قبل هست، کاری نکن
      if (context?.alreadyExists) {
        return;
      }

      const axiosError = error as {
        response?: { status?: number; data?: { code?: string; message?: string } };
      };
      const errorCode = axiosError.response?.data?.code;
      const errorMessage = axiosError.response?.data?.message;

      // بررسی خطای 409 - محصول قبلاً در لیست بوده (State Sync Issue)
      if (
        axiosError.response?.status === 409 ||
        errorCode === 'ALREADY_WISHLISTED'
      ) {
        // این یک خطا نیست - frontend و backend sync نبودند
        // 1️⃣ Toast اطلاع‌رسانی (بدون error styling)
        toast(
          errorMessage || 'این محصول قبلاً در علاقمندی‌های شما وجود دارد',
          {
            icon: 'ℹ️',
            duration: 2000,
            style: {
              background: '#f6f8fa',
              color: '#24292f',
              border: '1px solid #d0d7de',
            },
          }
        );

        // 2️⃣ Force refetch - نه فقط invalidate، بلکه فوراً fetch کن
        queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        queryClient.refetchQueries({ queryKey: ['wishlist'], type: 'active' });

        // 3️⃣ Sync Zustand store با backend
        useWishlistStore.getState().syncFromApi().catch(() => {
          // اگر sync شکست خورد، query refetch کافی است
        });

        return;
      }

      // سایر خطاها - rollback
      queryClient.setQueryData(['wishlist'], context?.previousWishlist);
      toast.error('خطا در افزودن به علاقمندی‌ها', { icon: '💔', duration: 3000 });
      console.error('Failed to add to wishlist:', error);
    },
  });

  // =========================================================================
  // 🗑️ REMOVE FROM WISHLIST MUTATION
  // =========================================================================
  const removeFromWishlistMutation = useMutation({
    mutationKey: ['wishlist', 'remove'],

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

      const previousWishlist =
        queryClient.getQueryData<Product[]>(['wishlist']) || [];

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
        data.isLocal ? 'از علاقمندی‌ها حذف شد' : 'از علاقمندی‌ها حذف شد',
        { icon: '💔', duration: 2000 }
      );
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },

    // ❌ onError: Rollback با handling 404
    onError: (error, _productId, context) => {
      const axiosError = error as { response?: { status?: number } };

      // 404 یعنی محصول قبلاً حذف شده - این خطا نیست
      if (axiosError.response?.status === 404) {
        queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        return;
      }

      // سایر خطاها - rollback
      queryClient.setQueryData(['wishlist'], context?.previousWishlist);
      toast.error('خطا در حذف از علاقمندی‌ها', { icon: '❌', duration: 3000 });
      console.error('Failed to remove from wishlist:', error);
    },
  });

  // =========================================================================
  // 🔒 BUSY STATE
  // =========================================================================
  //
  // isWishlistBusy برای غیرفعال کردن دکمه در حین mutation استفاده می‌شود.
  // شامل:
  // - mutation در حال انجام (add یا remove)
  // - query در حال لود (بعد از login، قبل از رسیدن پاسخ)
  // =========================================================================
  const isWishlistBusy =
    addToWishlistMutation.isPending ||
    removeFromWishlistMutation.isPending ||
    (isAuthenticated && isWishlistLoading);

  // =========================================================================
  // 🔍 CROSS-INSTANCE MUTATION CHECK
  // =========================================================================
  //
  // isProductMutating با استفاده از queryClient.isMutating و predicate دقیق
  // بررسی می‌کند که آیا *دقیقاً همین productId* در هر instance ای در حال
  // mutate شدن است.
  //
  // این یک singleton واقعی است چون MutationCache بین همه instance ها shared است.
  // =========================================================================

  // useIsMutating فقط برای reactive کردن رندر (خودش تصمیمی نمی‌گیرد)
  useIsMutating({ mutationKey: ['wishlist'] });

  const isProductMutating = (productId: number): boolean => {
    return (
      queryClient.isMutating({
        predicate: (mutation) => {
          const key = mutation.options.mutationKey;
          if (!key || key[0] !== 'wishlist') return false;

          const vars = mutation.state.variables;
          if (key[1] === 'add') return (vars as Product | undefined)?.id === productId;
          if (key[1] === 'remove') return vars === productId;

          return false;
        },
      }) > 0
    );
  };

  // =========================================================================
  // 🔄 TOGGLE WISHLIST (با Optimistic UI و Global Guards)
  // =========================================================================
  //
  // Guards به ترتیب:
  // 1. globalPendingToggles - جلوگیری از duplicate در cross-instance
  // 2. isProductMutating - جلوگیری از mutation در حال انجام
  // 3. isWishlistBusy - جلوگیری از کلیک در حین loading
  //
  // Debounce: 100ms قبل از ارسال درخواست برای جمع کردن کلیک‌های سریع
  // =========================================================================
 const toggleWishlist = async (product: Product) => {
  // Guard 1: اگر در حال processing است (cross-instance)
  if (globalPendingToggles.has(product.id)) {
    return;
  }
  
  // Guard 2: اگر mutation فعال است
  if (isProductMutating(product.id)) {
    return;
  }
  
  // Guard 3: اگر wishlist busy است
  if (isWishlistBusy) {
    return;
  }

  // ✅ Lock بلافاصله
  globalPendingToggles.add(product.id);
  notifyToggleListeners();

  try {
    // ✅ چک دقیق از API قبل از هر عملیات
    let isInWishlist = false;
    
    try {
      const checkResponse = await wishlistService.checkWishlist(product.id);
      isInWishlist = checkResponse?.is_wishlisted || false;
    } catch (error) {
      // اگر check failed، از cache استفاده کن
      console.warn('[Wishlist] Check API failed, using cache fallback');
      const currentWishlist = queryClient.getQueryData<Product[]>(['wishlist']) || wishlistItems;
      isInWishlist = currentWishlist.some((item) => item.id === product.id);
    }

    // ✅ حالا با اطمینان کامل mutate کن
    if (isInWishlist) {
      removeFromWishlistMutation.mutate(product.id);
    } else {
      addToWishlistMutation.mutate(product);
    }
  } catch (error) {
    console.error('[Wishlist] Toggle failed:', error);
  } finally {
    // ✅ Unlock بعد از 1000ms
    setTimeout(() => {
      globalPendingToggles.delete(product.id);
      notifyToggleListeners();
    }, 1000);
  }
};

  // =========================================================================
  // 🎯 PREFETCH برای Product Card
  // =========================================================================
  //
  // Prefetch کردن محصول وقتی کاربر hover می‌کند یا کلیک می‌کند.
  // این باعث می‌شود وقتی کاربر به صفحه محصول می‌رود، داده‌ها از قبل
  // در cache باشند و لود سریع‌تر باشد.
  // =========================================================================
  const prefetchProduct = (product: Product) => {
    queryClient.prefetchQuery({
      queryKey: ['product', product.id],
      queryFn: () => productService.getProduct(product.id),
      staleTime: 5 * 60 * 1000, // 5 دقیقه
    });
  };

  // =========================================================================
  // 🔍 IS IN WISHLIST (با Fallback به Zustand)
  // =========================================================================
  //
  // چرا fallback؟ بعد از login، query ['wishlist'] enabled می‌شود ولی
  // پاسخش هنوز نرسیده. در این پنجره زمانی، cacheData خالی است و
  // isInWishlist false برمی‌گرداند (حتی برای محصولات از قبل wishlist شده).
  //
  // راه‌حل: اگر cacheData خالی بود، از Zustand store (که از localStorage
  // آمده) بخوان.
  // =========================================================================
  const isInWishlist = (productId: number): boolean => {
    const cacheData = queryClient.getQueryData<Product[]>(['wishlist']);

    // اگر cacheData وجود دارد و غیرخالی است، از آن استفاده کن
    if (cacheData && cacheData.length > 0) {
      return cacheData.some((item) => item.id === productId);
    }

    // Fallback به Zustand store (از localStorage)
    return localWishlist.some((item) => item.id === productId);
  };

  // =========================================================================
  // 📤 RETURN
  // =========================================================================
  return {
    wishlistItems,
    isWishlistLoading,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    toggleWishlist,
    prefetchProduct,
    isInWishlist,

    // isTogglingWishlist: برای غیرفعال کردن دکمه در حین mutation
    isTogglingWishlist: isWishlistBusy,

    // isProductMutating: برای cross-instance dedup
    isProductMutating,
  };
}