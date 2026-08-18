import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart, Trash2, Flame, Loader2, Store } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Product } from '@/types/models';
import toast from 'react-hot-toast';
import apiClient from '@/services/api/client';
import { SellerCard, type SellerData } from '@/components/marketplace/SellerCard';

type TabKey = 'products' | 'stores';

export function WishlistSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, removeItem, clearWishlist, syncFromApi, isSyncing } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('products');

  // 🆕 React Query برای فروشگاه‌های دنبال‌شده (جایگزین useState + useEffect)
  // staleTime: 60s - تا هنگام سوییچ تب refetch بی‌دلیل نشود
  const {
    data: followedSellers = [],
    isLoading: isLoadingSellers,
  } = useQuery<SellerData[]>({
    queryKey: ['followed-sellers'],
    queryFn: async () => {
      const res = await apiClient.get('/user/followed-sellers');
      return (res.data?.data ?? []) as SellerData[];
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  // 🆕 Mutation برای unfollow (مطابق KB: optimistic update)
  const unfollowMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      await apiClient.delete(`/sellers/${sellerId}/follow`);
    },
    onSuccess: (_data, sellerId) => {
      // Optimistic: حذف از لیست
      queryClient.setQueryData<SellerData[]>(['followed-sellers'], (prev) =>
        prev?.filter((s) => s.id !== sellerId) ?? []
      );
      toast.success('دنبال کردن فروشگاه لغو شد', { icon: '✓' });
    },
    onError: () => {
      toast.error('خطا در لغو دنبال کردن');
    },
  });

  // Sync از API هنگام لود
  useEffect(() => {
    if (isAuthenticated && items.length === 0) {
      syncFromApi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.stock === 0) {
      toast.error('محصول موجود نیست');
      return;
    }
    addItem(product, 1);
    toast.success('به سبد اضافه شد', { icon: '🛒' });
  };

  const handleRemove = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    removeItem(product.id);
    toast.success('حذف شد', { icon: '🗑️' });
  };

  const handleUnfollow = async (sellerId: number) => {
    await unfollowMutation.mutateAsync(sellerId);
  };

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
      </div>
    );
  }

  // Empty State فقط اگر هر دو تب خالی باشند
  if (items.length === 0 && followedSellers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
        <EmptyState
          icon={<Heart className="w-12 h-12" />}
          title="علاقه‌مندی‌های شما خالی است"
          description="محصولات یا فروشگاه‌های مورد علاقه خود را اضافه کنید"
          action={
            <Button onClick={() => navigate('/products')} size="md">
              مشاهده محصولات
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══════════════════ Tab Header ═══════════════════ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-1.5 flex gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300',
            activeTab === 'products'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
          )}
        >
          <Heart className={cn(
            'w-4 h-4 transition-all',
            activeTab === 'products' && 'fill-current'
          )} />
          <span>محصولات</span>
          <span className={cn(
            'text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center',
            activeTab === 'products'
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
          )}>
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300',
            activeTab === 'stores'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
          )}
        >
          <Store className="w-4 h-4" />
          <span>فروشگاه‌ها</span>
          <span className={cn(
            'text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center',
            activeTab === 'stores'
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
          )}>
            {followedSellers.length}
          </span>
        </button>
      </div>

      {/* ═══════════════════ Products Tab ═══════════════════ */}
      {activeTab === 'products' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {items.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-8 text-center">
              <Heart className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mb-1">
                هیچ محصولی در علاقه‌مندی‌ها نیست
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                روی آیکون قلب محصولات کلیک کنید تا اینجا نمایش داده شوند
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
                مشاهده محصولات
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header با تعداد و دکمه حذف همه */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-error-500 fill-error-500" />
                  <h3 className="font-black text-gray-900 dark:text-gray-100">
                    {items.length} محصول مورد علاقه
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    if (window.confirm('همه محصولات از علاقه‌مندی‌ها حذف شوند؟')) {
                      clearWishlist();
                      toast.success('همه حذف شدند');
                    }
                  }}
                  className="text-error-600 dark:text-error-400"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-[10px]">حذف همه</span>
                </Button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.slug}`)}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex gap-2">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <SafeImage
                          src={product.main_image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          showEmojiOnError
                          fallbackEmoji="❤️"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-xs line-clamp-2 mb-1">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1 mb-1">
                          {product.stock === 0 ? (
                            <Badge variant="error" size="sm">ناموجود</Badge>
                          ) : (
                            <Badge variant="success" size="sm">موجود</Badge>
                          )}
                          {!!product.discount_percentage && product.discount_percentage > 0 && (
                            <Badge variant="error" size="sm">
                              <Flame className="w-2.5 h-2.5" />
                              {product.discount_percentage}٪
                            </Badge>
                          )}
                        </div>
                        <p className="font-black text-primary-700 dark:text-primary-400 text-sm">
                          {formatPrice(product.price)}
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 mr-1">تومان</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stock === 0}
                        className="flex-1 gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span className="text-[10px]">افزودن به سبد</span>
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={(e) => handleRemove(e, product)}
                        className="text-error-600 dark:text-error-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {items.length > 4 && (
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full">
                  بازگشت به بالا
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ Stores Tab ═══════════════════ */}
      {activeTab === 'stores' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {isLoadingSellers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : followedSellers.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-8 text-center">
              <Store className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mb-1">
                هنوز فروشگاهی را دنبال نکرده‌اید
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                فروشگاه‌های مورد علاقه خود را دنبال کنید تا از محصولات جدیدشان باخبر شوید
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
                کشف فروشگاه‌ها
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header فروشگاه‌ها */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary-500 fill-primary-500" />
                  <h3 className="font-black text-gray-900 dark:text-gray-100">
                    {followedSellers.length} فروشگاه دنبال‌شده
                  </h3>
                </div>
              </div>

              {/* Grid از SellerCard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {followedSellers.map((seller) => (
                  <SellerCard
                    key={seller.id}
                    seller={seller}
                    variant="default"
                    onUnfollow={handleUnfollow}
                    showStats={true}
                    showActions={true}
                    showDescription={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WishlistSection;