import { memo } from 'react';
import { ShoppingCart, Star, CheckCircle, Heart, Eye, Flame, Award, Store, Scale } from 'lucide-react';
import { useModelStore, useCartStore } from '@/store';
import { useWishlistApi } from '@/hooks/api/useWishlistApi';
import { useCompareStore } from '@/store/compareStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/marketplace/ProductImage';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { DeviceCompatibility } from './DeviceCompatibility';

/**
 * ProductCard - Marketplace Component (Smart Merge)
 *
 * ترکیب بهترین ویژگی‌های دو نسخه:
 * - پایه: کد battle-tested قدیمی (prefetch, list variant, warranty, bestSeller)
 * - ویژگی‌های جدید: DeviceCompatibility marketplace, compact variant, sponsored flag
 *
 * بر اساس سند مرجع ازکالا - بخش "Marketplace Components"
 *
 * Features:
 * - ۲ Variant اصلی: grid, list (برای ProductListPage)
 * - Prefetch در hover (UX بهینه)
 * - ۱۱ State: Default, Hover, Loading, OutOfStock, Discount, Featured, Sponsored, New, LowStock, Compatible, Incompatible
 * - DeviceCompatibility inline
 * - RTL-first + Dark mode
 * - Accessibility (ARIA + keyboard)
 * - Stagger animation
 */

// ==================== Types ====================

export type ProductCardVariant = 'grid' | 'list';

export interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  onClick?: () => void;
  variant?: ProductCardVariant;
  index?: number;
  /** Sponsored flag (برای تبلیغات) */
  isSponsored?: boolean;
  /** استفاده از DeviceCompatibility marketplace (به جای inline ساده) */
  useAdvancedCompatibility?: boolean;
}

// ==================== Main Component ====================

export const ProductCard = memo(function ProductCard({
  product,
  onViewDetails,
  onClick,
  variant = 'grid',
  index = 0,
  isSponsored = false,
  useAdvancedCompatibility = false,
}: ProductCardProps) {
  const { selectedModel } = useModelStore();
  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist, prefetchProduct } = useWishlistApi();

  const isWishlisted = isInWishlist(product.id);
    const { isCompared, toggleProduct } = useCompareStore();
  const inCompare = isCompared(product.id);

  const isCompatible = selectedModel
    ? product.compatible_models?.some((m) => m.id === selectedModel.id) ?? false
    : true;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    onViewDetails?.(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0) {
      toast.error('این محصول موجود نیست', { icon: '❌' });
      return;
    }

    addItem(product, 1);
    toast.success('محصول به سبد خرید اضافه شد', {
      icon: '🛒',
      duration: 2200,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  // پیش‌واکشی محصول هنگام hover تا باز شدن صفحه‌ی جزئیات آنی حس شود
  const handleMouseEnter = () => {
    prefetchProduct(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails?.(product);
  };

  // محاسبه درصد تخفیف
  const discountPercent =
    product.compare_price && product.compare_price > product.price
      ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
      : 0;

  // بررسی موجودی کم
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // بررسی پرفروش بودن
  const isBestSeller = product.sales_count && product.sales_count > 100;

  // بررسی جدید بودن (کمتر از ۳۰ روز)
  const isNew = product.created_at
    ? Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
    : false;

  // استایل پایه کارت با انیمیشن ورود staggered
  const baseCardClasses = cn(
    'group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden',
    'border border-gray-200 dark:border-gray-700',
    'hover:border-primary-300 dark:hover:border-primary-600',
    'hover:shadow-2xl dark:hover:shadow-black/40',
    'transition-all duration-300 ease-out cursor-pointer',
    'hover:scale-[1.02] active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
    'animate-in fade-in slide-in-from-bottom-2',
    // Sponsored subtle indicator
    isSponsored && 'ring-1 ring-warning-200 dark:ring-warning-800'
  );

  // تأخیر پلکانی
  const staggerStyle = index > 0 ? { animationDelay: `${index * 50}ms` } : undefined;

  // ==================== List Variant ====================
  if (variant === 'list') {
    return (
      <div
        className={baseCardClasses}
        style={staggerStyle}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        role="article"
        aria-label={`محصول ${product.name}`}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      >
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-50 dark:bg-gray-700 overflow-hidden">
          <ProductImage
  src={product.main_image}
  alt={product.name}
  variant="grid"
  discountPercent={discountPercent}
  isNew={product.is_new}
  isBestseller={product.is_bestseller}
  priority={index < 4}
  width={400}
  height={400}
/>
          {discountPercent > 0 && (
            <div className="absolute top-1 right-1 animate-in fade-in zoom-in duration-300">
              <Badge variant="error" className="text-xs px-1.5 py-0.5 shadow-lg">
                {discountPercent}٪
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 p-3 flex flex-col gap-1.5">
          {/* سازگاری با دستگاه - List variant */}
          {selectedModel && product.compatible_models && product.compatible_models.length > 0 && (
            useAdvancedCompatibility ? (
              <DeviceCompatibility
                devices={product.compatible_models}
                selectedDevice={selectedModel}
                variant="inline"
              />
            ) : isCompatible ? (
              <div className="flex items-center gap-1 text-success-600 dark:text-success-400 text-xs font-semibold bg-success-50 dark:bg-success-900/20 px-2 py-1 rounded-lg w-fit">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>سازگار با {selectedModel.name}</span>
              </div>
            ) : null
          )}

          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-relaxed group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {product.name}
          </h3>

          {product.seller && (
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Store className="w-3 h-3" />
              {product.seller.shop_name}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-gray-400 dark:text-gray-500 line-through decoration-gray-400">
                  {formatPrice(product.compare_price)}
                </span>
              )}
              <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(product.price)}
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="text-xs active:scale-95 transition-transform"
            >
              <ShoppingCart className="w-3.5 h-3.5 ml-1.5" />
              افزودن
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Grid Variant (Default) ====================
  return (
    <div
      className={baseCardClasses}
      style={staggerStyle}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      role="article"
      aria-label={`محصول ${product.name}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      {/* بخش تصویر */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
        <SafeImage
          src={product.main_image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          fallbackEmoji="📦"
          showEmojiOnError
        />

        {/* Badgeهای بالا سمت راست */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <Badge
              variant="error"
              className="shadow-lg animate-pulse-soft dark:shadow-black/30"
              icon={<Flame className="w-3 h-3" />}
            >
              {discountPercent}٪ تخفیف
            </Badge>
          )}
          {isBestSeller && (
            <Badge
              variant="accent"
              className="shadow-lg dark:shadow-black/30"
              icon={<Award className="w-3 h-3" />}
            >
              پرفروش
            </Badge>
          )}
          {isNew && (
            <Badge variant="success" className="shadow-lg dark:shadow-black/30">
              جدید
            </Badge>
          )}
          {isSponsored && (
            <Badge variant="gray" className="text-[10px] shadow-lg dark:shadow-black/30">
              تبلیغ
            </Badge>
          )}
        </div>

        {/* Badge موجودی کم - بالا سمت چپ */}
        {isLowStock && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="warning" className="shadow-lg text-xs dark:shadow-black/30">
              فقط {product.stock} عدد
            </Badge>
          </div>
        )}

        {/* Overlay ناموجود */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in z-20">
            <span className="text-white font-bold text-lg bg-black/40 px-6 py-2 rounded-xl shadow-xl">
              ناموجود
            </span>
          </div>
        )}

        {/* دکمه علاقمندی */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-2 left-2 w-9 h-9 rounded-full flex items-center justify-center z-20',
            'opacity-0 group-hover:opacity-100 transition-all duration-300',
            'bg-white dark:bg-gray-800 shadow-lg hover:scale-110 active:scale-95',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            isWishlisted
              ? 'text-red-500 opacity-100'
              : 'text-gray-400 hover:text-red-400 dark:text-gray-500 dark:hover:text-red-400',
            isLowStock && 'top-10'
          )}
          aria-label="افزودن به علاقه‌مندی‌ها"
        >
          <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
        </button>

        {/* دکمه مقایسه - کنار دکمه علاقه‌مندی (top-left) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleProduct({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              compare_price: product.compare_price,
              main_image: product.main_image,
              rating: product.rating,
              reviews_count: product.reviews_count,
              specifications: product.specifications,
              compatible_models: product.compatible_models,
              seller: product.seller,
              category: product.category,
            });
          }}
          className={cn(
            'absolute top-2 left-12 w-9 h-9 rounded-full flex items-center justify-center z-20',
            'opacity-0 group-hover:opacity-100 transition-all duration-300',
            'bg-white dark:bg-gray-800 shadow-lg hover:scale-110 active:scale-95',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            inCompare
              ? 'text-primary-500 opacity-100'
              : 'text-gray-400 hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400'
          )}
          aria-label={inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
          title={inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
        >
          <Scale className={cn('w-4 h-4', inCompare && 'fill-current')} />
        </button>

        {/* دکمه مشاهده سریع */}
        <button
          onClick={handleQuickView}
          className={cn(
            'absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20',
            'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs font-semibold',
            'px-4 py-2 rounded-full shadow-lg',
            'opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0',
            'transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400',
            'active:scale-95',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900'
          )}
          aria-label="مشاهده سریع"
        >
          <Eye className="w-3.5 h-3.5" />
          مشاهده سریع
        </button>
      </div>

      {/* بخش اطلاعات */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* سازگاری با دستگاه - Grid variant */}
        {selectedModel && product.compatible_models && product.compatible_models.length > 0 && (
          useAdvancedCompatibility ? (
            <DeviceCompatibility
              devices={product.compatible_models}
              selectedDevice={selectedModel}
              variant="inline"
            />
          ) : isCompatible ? (
            <div className="flex items-center gap-1 text-success-600 dark:text-success-400 text-xs font-semibold bg-success-50 dark:bg-success-900/20 px-2 py-1 rounded-lg w-fit">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>سازگار با {selectedModel.name}</span>
            </div>
          ) : null
        )}

        {/* نام محصول */}
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-relaxed group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* نام فروشنده */}
        {product.seller && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 flex items-center gap-1">
            <Store className="w-3 h-3" />
            {product.seller.shop_name}
          </p>
        )}

        {/* امتیاز و نظرات */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-3.5 h-3.5 transition-colors',
                    star <= Math.round(product.rating!)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              ({product.reviews_count})
            </span>
          </div>
        )}

        {/* گارانتی */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1.5 rounded-lg">
          <svg
            className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>گارانتی اصالت و سلامت</span>
        </div>

        <div className="flex-1" />

        {/* قیمت و دکمه */}
        <div className="flex items-end justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col">
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 dark:text-gray-500 line-through decoration-gray-400">
                {formatPrice(product.compare_price)}
              </span>
            )}
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(product.price)}
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-shrink-0 active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-4 h-4 ml-1.5" />
            افزودن
          </Button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';