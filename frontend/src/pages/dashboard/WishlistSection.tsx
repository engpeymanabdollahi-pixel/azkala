import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Flame, Loader2, Store, UserX } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import type { Product } from '@/types/models';
import toast from 'react-hot-toast';
import apiClient from '@/services/api/client';

// ✅ شکل واقعی پاسخ PublicSellerResource — قبلاً followedSellers از نوع
// any[] بود و seller: any تایپ می‌شد.
interface FollowedSeller {
  id: number;
  shop_name: string;
  slug: string;
  logo: string | null;
  products_count: number;
  followers_count: number;
}

export function WishlistSection() {
  const navigate = useNavigate();
  const { items, removeItem, clearWishlist, syncFromApi, isSyncing } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // State برای فروشگاه‌های دنبال‌شده
  const [followedSellers, setFollowedSellers] = useState<FollowedSeller[]>([]);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);

  // 🆕 Sync از API هنگام لود
  useEffect(() => {
    if (isAuthenticated && items.length === 0) {
      syncFromApi();
    }
    if (isAuthenticated) {
      fetchFollowedSellers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchFollowedSellers = async () => {
    setIsLoadingSellers(true);
    try {
      const res = await apiClient.get('/user/followed-sellers');
      setFollowedSellers(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching followed sellers:', error);
    } finally {
      setIsLoadingSellers(false);
    }
  };

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

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* بخش محصولات مورد علاقه */}
      {items.length > 0 && (
        <div className="space-y-3">
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
                      {/* ✅ فیکس واقعی: ستون واقعی discount_percentage است، نه discount —
                          قبلاً این بج هیچ‌وقت نشان داده نمی‌شد حتی برای محصولات واقعاً تخفیف‌دار */}
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

      {/* بخش فروشگاه‌های دنبال‌شده */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary-500 fill-primary-500" />
            <h3 className="font-black text-gray-900 dark:text-gray-100">
              فروشگاه‌های دنبال‌شده
            </h3>
          </div>
        </div>

        {isLoadingSellers ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : followedSellers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {followedSellers.slice(0, 4).map((seller) => (
              <div
                key={seller.id}
                onClick={() => navigate(`/seller/${seller.slug}`)}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 overflow-hidden flex-shrink-0">
                  <SafeImage
                    src={seller.logo}
                    alt={seller.shop_name}
                    className="w-full h-full object-cover"
                    showEmojiOnError
                    fallbackEmoji="🏬"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{seller.shop_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Store className="w-3 h-3" /> {seller.products_count} محصول
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {seller.followers_count.toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-6 text-center">
            <UserX className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">هنوز فروشگاهی را دنبال نکرده‌اید.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="mt-3">
              کشف فروشگاه‌ها
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
export default WishlistSection;
