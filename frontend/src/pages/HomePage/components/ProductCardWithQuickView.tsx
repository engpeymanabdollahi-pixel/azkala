import { memo, useState, useRef, useCallback } from 'react';
import { Star, Eye, ShoppingBag, Heart, TrendingUp } from 'lucide-react';
import { useWishlistApi } from '@/hooks/api/useWishlistApi';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Product } from '@/types/models';
import { SafeImage } from '@/components/ui/SafeImage';

interface ProductCardWithQuickViewProps {
  product: Product;
  onClick: () => void;
  onQuickAdd: (e: React.MouseEvent) => void;
}

/**
 * کامپوننت کارت محصول با قابلیت مشاهده سریع
 * - Optimistic UI برای افزودن به علاقمندی‌ها
 * - Prefetch on hover برای navigation لحظه‌ای
 * - SafeImage با fallback emoji
 * - Skeleton loading تا زمانی که کارت visible شود
 */
export const ProductCardWithQuickView = memo(({ 
  product, 
  onClick, 
  onQuickAdd 
}: ProductCardWithQuickViewProps) => {
  const [showQuickView, setShowQuickView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isInWishlist, toggleWishlist, prefetchProduct, isTogglingWishlist, isProductMutating } = useWishlistApi();

  const isWishlisted = isInWishlist(product.id);
  // ✅ فاز ۴ تسک P0: اگر همین محصول از یک instance دیگر (مثلاً همین محصول
  // در گرید اصلی هم رندر شده) هم‌زمان در حال mutate شدن باشد، این کارت هم
  // باید busy دیده شود — رجوع به کامنت isProductMutating در useWishlistApi.ts.
  const isWishlistBusyForThisProduct = isTogglingWishlist || isProductMutating(product.id);

  // 🎯 Smart Prefetch: وقتی موس روی کارت می‌رود، کوئری wishlist را prefetch کن
  const handleMouseEnter = useCallback(() => {
    prefetchProduct(product);
  }, [product, prefetchProduct]);

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWishlistBusyForThisProduct) return;
    // ✅ Optimistic UI توسط useWishlistApi مدیریت می‌شود
    toggleWishlist(product);
  }, [product, toggleWishlist, isWishlistBusyForThisProduct]);

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        className="group relative bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:scale-[1.02] active:scale-95"
        onClick={onClick}
      >
        {/* تصویر محصول با SafeImage */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
          <SafeImage
            src={product.main_image}
            alt={product.name}
            fallbackEmoji="📦"
            showEmojiOnError
            className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500"
          />
          
          {/* دکمه‌های Quick Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center gap-2 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button 
              className="w-11 h-11 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 transition-all hover:scale-110 shadow-xl active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickView(true);
              }}
              aria-label="مشاهده سریع"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(e);
              }}
              className="w-11 h-11 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-success-600 hover:text-white dark:hover:bg-success-500 transition-all hover:scale-110 shadow-xl active:scale-95"
              aria-label="افزودن به سبد خرید"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
            <button
              className={cn(
                "w-11 h-11 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl active:scale-95",
                "disabled:cursor-not-allowed disabled:hover:scale-100",
                isWishlisted
                  ? "text-error-500 dark:text-error-400"
                  : "hover:bg-error-500 hover:text-white dark:hover:bg-error-600"
              )}
              onClick={handleWishlistToggle}
              disabled={isWishlistBusyForThisProduct}
              aria-label={isWishlisted ? 'حذف از علاقمندی‌ها' : 'افزودن به علاقمندی‌ها'}
            >
              <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
            </button>
          </div>
        </div>

        {/* اطلاعات محصول */}
        <div className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3.5 h-3.5',
                    i < Math.floor(product.rating || 0)
                      ? 'text-warning-400 fill-warning-400'
                      : 'text-gray-300 dark:text-slate-600'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({product.reviews_count || 0})
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
            <span className="text-lg font-black text-gray-900 dark:text-white">
              {formatPrice(product.price)}
            </span>
            {product.sales_count && product.sales_count > 0 && (
              <span className="text-xs text-success-600 dark:text-success-400 font-bold bg-success-50 dark:bg-success-900/20 px-2 py-1 rounded-lg flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {product.sales_count} فروش
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal مشاهده سریع */}
      <Modal
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        size="lg"
        title={product.name}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 rounded-2xl overflow-hidden">
            <SafeImage
              src={product.main_image}
              alt={product.name}
              fallbackEmoji="📦"
              showEmojiOnError
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-5 h-5',
                      i < Math.floor(product.rating || 0)
                        ? 'text-warning-400 fill-warning-400'
                        : 'text-gray-300 dark:text-slate-600'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ({product.reviews_count || 0} نظر)
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
              {product.description}
            </p>
            <div className="text-3xl font-black text-primary-700 dark:text-primary-400 mb-4">
              {formatPrice(product.price)}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClick} className="flex-1">
                مشاهده جزئیات
              </Button>
              <Button variant="outline" onClick={onQuickAdd}>
                <ShoppingBag className="w-4 h-4 ml-1" />
                افزودن به سبد
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison برای بهینه‌سازی re-render
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name
  );
});

ProductCardWithQuickView.displayName = 'ProductCardWithQuickView';
export default ProductCardWithQuickView;
