import { memo } from 'react';
import { ShoppingCart, Star, CheckCircle, Heart, Eye, Flame, Award, ShieldCheck, Zap } from 'lucide-react';
import { useModelStore, useCartStore } from '@/store';
import { useWishlistApi } from '@/hooks/api/useWishlistApi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  onClick?: () => void;
  variant?: 'grid' | 'list';
  index?: number; // For staggered animations
}

export const ProductCard = memo(({
  product,
  onViewDetails,
  onClick,
  variant = 'grid',
  index = 0,
}: ProductCardProps) => {
  const { selectedModel } = useModelStore();
  const { addItem } = useCartStore();
  // useWishlistApi نه useWishlistStore: Optimistic UI با rollback، به‌علاوه‌ی
  // prefetch محصول. این سومین باری است که این فایل به store برمی‌گردد، چون هر
  // بار از پایه‌ای منشعب می‌شود که هوک را ندارد.
  const { isInWishlist, toggleWishlist, prefetchProduct } = useWishlistApi();

  const isWishlisted = isInWishlist(product.id);

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
    // toast داخل خودِ hook زده می‌شود، کنار rollback؛ اینجا تکرارش کنیم برای یک
    // عمل دو پیام نشان داده می‌شود.
    toggleWishlist(product);
  };

  // پیش‌واکشی هنگام hover تا باز شدن صفحه‌ی جزئیات آنی حس شود
  const handleMouseEnter = () => {
    prefetchProduct(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails?.(product);
  };

  // محاسبه درصد تخفیف
  const discountPercent = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  // بررسی موجودی کم
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // بررسی پرفروش بودن
  const isBestSeller = product.sales_count && product.sales_count > 100;


  // نمای لیستی
  if (variant === 'list') {
    return (
      <Card
        variant={discountPercent > 0 ? 'accent' : 'tinted'}
        interactive
        entranceDelay={index * 50}
        className="group flex"
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        role="article"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      >
        {/* Image Section */}
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-50 dark:bg-gray-700">
          <SafeImage
            src={product.main_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            showEmojiOnError
            fallbackEmoji="📦"
          />
          {discountPercent > 0 && (
            <div className="absolute top-1 right-1 animate-bounce-in">
              <Badge variant="error" className="text-xs px-1.5 py-0.5 shadow-lg">
                {discountPercent}٪
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 flex flex-col gap-1.5">
          {selectedModel && isCompatible && (
            // شکل قرصی هم‌شکل با حالت گرید — قبلاً اینجا فقط متن ساده بود، در
            // حالی که همین نشان در نمای گرید پس‌زمینه‌ی رنگی دارد.
            <div className="flex items-center gap-1 text-success-600 dark:text-success-400 text-xs font-semibold bg-success-50 dark:bg-success-900/20 px-2.5 py-1 rounded-lg w-fit">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>سازگار با {selectedModel.name}</span>
            </div>
          )}
          <h3 className={cn(
            'font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-relaxed',
            'group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300'
          )}>
            {product.name}
          </h3>
          {product.seller && (
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
              {product.seller.shop_name}
            </p>
          )}
          {/* امتیاز — در نمای گرید بود، در نمای لیستی از قلم افتاده بود */}
          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-3.5 h-3.5',
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
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-gray-400 dark:text-gray-500 line-through decoration-error-500/50">
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
              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
              className={cn(
                'text-xs transition-all duration-300',
                'active:scale-95 hover:shadow-lg'
              )}
            >
              افزودن
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // نمای گرید (پیش‌فرض)
  return (
    <Card
      // ته‌رنگ بر اساس وضعیت خودِ محصول انتخاب می‌شود، نه تصادفی: تخفیف‌دار
      // نارنجی، سازگار با دستگاهِ انتخابیِ کاربر سبز، بقیه فیروزه‌ای ملایم.
      // این‌طور رنگ یک نشانه است نه تزیین.
      variant={discountPercent > 0 ? 'accent' : selectedModel && isCompatible ? 'success' : 'tinted'}
      interactive
      entranceDelay={index * 50}
      className="group flex flex-col hover:scale-[1.02]"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
        <SafeImage
          src={product.main_image}
          alt={product.name}
          className={cn(
            'w-full h-full object-cover',
            'group-hover:scale-110 transition-transform duration-700 ease-out'
          )}
          showEmojiOnError
          fallbackEmoji="📦"
        />

        {/* Badges - Top Right */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <Badge 
              variant="error" 
              className={cn(
                'shadow-lg animate-bounce-in',
                'bg-gradient-to-r from-error-500 to-error-600 text-white border-0'
              )}
              icon={<Flame className="w-3 h-3 animate-pulse" />}
            >
              {discountPercent}٪ تخفیف
            </Badge>
          )}
          {isBestSeller && (
            <Badge 
              variant="accent" 
              className="shadow-lg bg-gradient-to-r from-accent-500 to-accent-600 text-white border-0"
              icon={<Award className="w-3 h-3" />}
            >
              پرفروش
            </Badge>
          )}
        </div>

        {/* Low Stock Badge - Top Left */}
        {isLowStock && (
          <div className="absolute top-2 left-2 animate-pulse-soft">
            <Badge variant="warning" className="shadow-lg text-xs" icon={<Zap className="w-3 h-3" />}>
              فقط {product.stock} عدد
            </Badge>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
            <span className="text-white font-bold text-lg bg-black/40 px-6 py-2 rounded-xl shadow-xl border border-white/20">
              ناموجود
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-2 left-2 w-9 h-9 rounded-full flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out',
            'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg',
            'hover:scale-110 active:scale-95',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
            isWishlisted 
              ? 'text-red-500 opacity-100' 
              : 'text-gray-400 dark:text-gray-500 hover:text-red-400',
            isLowStock && 'top-10'
          )}
          aria-label={isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          type="button"
        >
          <Heart className={cn('w-4 h-4 transition-all', isWishlisted && 'fill-current scale-110')} />
        </button>

        {/* Quick View Button */}
        <button
          onClick={handleQuickView}
          className={cn(
            'absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5',
            'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs font-semibold',
            'px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700',
            'opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0',
            'transition-all duration-300 ease-out',
            'hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400',
            'hover:shadow-xl hover:scale-105 active:scale-95',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none'
          )}
          aria-label="مشاهده سریع"
          type="button"
        >
          <Eye className="w-3.5 h-3.5" />
          مشاهده سریع
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Compatibility Badge */}
        {selectedModel && isCompatible && (
          <div className="flex items-center gap-1 text-success-600 dark:text-success-400 text-xs font-semibold bg-success-50 dark:bg-success-900/20 px-2.5 py-1.5 rounded-xl animate-in fade-in">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>سازگار با {selectedModel.name}</span>
          </div>
        )}

        {/* Product Name */}
        <h3 className={cn(
          'font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-relaxed',
          'group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300',
          'min-h-[2.5rem]'
        )}>
          {product.name}
        </h3>

        {/* Seller Name */}
        {product.seller && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-primary-400 dark:bg-primary-500 rounded-full"></span>
            {product.seller.shop_name}
          </p>
        )}

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-1.5 group/rating">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-3.5 h-3.5 transition-all duration-200',
                    'group-hover/rating:scale-110',
                    star <= Math.round(product.rating!)
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
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

        {/* Warranty Badge */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
          <span>گارانتی اصالت و سلامت</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price & Add to Cart */}
        <div className="flex items-end justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col gap-0.5">
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 dark:text-gray-500 line-through decoration-error-500/50">
                {formatPrice(product.compare_price)}
              </span>
            )}
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400 tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className={cn(
              'flex-shrink-0 transition-all duration-300',
              'active:scale-95 hover:shadow-lg hover:-translate-y-0.5',
              'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800'
            )}
          >
            افزودن
          </Button>
        </div>
      </div>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';