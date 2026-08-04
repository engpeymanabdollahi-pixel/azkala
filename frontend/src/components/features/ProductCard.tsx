import { useState, useCallback } from 'react';
import { ShoppingCart, Star, CheckCircle, Heart, Eye, Flame, Award, Zap } from 'lucide-react';
import { useModelStore, useCartStore } from '@/store';
import { useWishlistStore } from '@/store/wishlistStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { SafeImage } from '@/components/ui/SafeImage';

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  onClick?: () => void;
  variant?: 'grid' | 'list';
}

export function ProductCard({
  product,
  onViewDetails,
  onClick,
  variant = 'grid',
}: ProductCardProps) {
  const { selectedModel } = useModelStore();
  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();

  const [imgError, setImgError] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  const isCompatible = selectedModel
    ? product.compatible_models?.some((m) => m.id === selectedModel.id) ?? false
    : true;

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }
    onViewDetails?.(product);
  }, [onClick, onViewDetails, product]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
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
  }, [product, addItem]);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);

    if (!isWishlisted) {
      toast.success('به علاقه‌مندی‌ها اضافه شد', {
        icon: '❤️',
        duration: 1500,
      });
    } else {
      toast.success('از علاقه‌مندی‌ها حذف شد', {
        icon: '🗑️',
        duration: 1500,
      });
    }
  }, [product, toggleItem, isWishlisted]);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails?.(product);
  }, [onViewDetails, product]);

  // محاسبه درصد تخفیف
  const discountPercent = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  // بررسی موجودی کم
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // بررسی پرفروش بودن
  const isBestSeller = product.sales_count && product.sales_count > 100;

  // تولید رنگ گرادینت بر اساس دسته‌بندی یا ID محصول
  const gradientColors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-pink-500',
  ];
  const gradientIndex = product.id % gradientColors.length;
  const cardGradient = gradientColors[gradientIndex];

  // نمای لیستی
  if (variant === 'list') {
    return (
      <div
        className="group flex bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
        onClick={handleCardClick}
      >
        <div className="relative w-40 h-40 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800">
          <SafeImage
            src={product.main_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            fallbackEmoji="📦"
            showEmojiOnError
            onError={() => setImgError(true)}
          />
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2">
              <Badge 
                variant="error" 
                className={cn(
                  "text-xs px-2 py-1 shadow-lg",
                  `bg-gradient-to-r ${cardGradient} text-white`
                )}
              >
                <Flame className="w-3 h-3 ml-1" />
                {discountPercent}٪
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col gap-2">
          {selectedModel && isCompatible && (
            <div className="flex items-center gap-1 text-success-600 dark:text-success-400 text-xs font-bold bg-success-50 dark:bg-success-900/30 px-2 py-1 rounded-lg w-fit">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>سازگار با {selectedModel.name}</span>
            </div>
          )}
          <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 leading-relaxed group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {product.name}
          </h3>
          {product.seller && (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Award className="w-3 h-3" />
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
                      'w-4 h-4',
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
                <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300">
                {formatPrice(product.price)}
              </span>
            </div>
            <Button
              size="md"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              className={cn(
                "text-sm font-bold shadow-lg hover:shadow-xl",
                `bg-gradient-to-r ${cardGradient} hover:opacity-90`
              )}
            >
              افزودن
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // نمای گرید (پیش‌فرض) - با رنگ‌ها و افکت‌های بیشتر
  return (
    <div
      className="group relative flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border-2 border-gray-100 dark:border-slate-700 hover:border-transparent hover:shadow-2xl hover:shadow-primary-500/20 dark:hover:shadow-primary-500/30 transition-all duration-500 cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-1"
      onClick={handleCardClick}
    >
      {/* بخش تصویر با گرادینت رنگی */}
      <div className={cn(
        "relative aspect-square overflow-hidden",
        `bg-gradient-to-br ${cardGradient}`
      )}>
        <SafeImage
          src={product.main_image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700 ease-out mix-blend-overlay opacity-90 group-hover:opacity-100"
          fallbackEmoji="📦"
          showEmojiOnError
          onError={() => setImgError(true)}
        />

        {/* Badgeهای بالا سمت راست با استایل شیشه‌ای */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <Badge 
              variant="error" 
              className="shadow-lg animate-pulse-soft backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 text-red-600 dark:text-red-400 border-2 border-red-500"
              icon={<Flame className="w-3 h-3" />}
            >
              {discountPercent}٪ تخفیف
            </Badge>
          )}
          {isBestSeller && (
            <Badge 
              variant="accent" 
              className="shadow-lg backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 text-amber-600 dark:text-amber-400 border-2 border-amber-500"
              icon={<Award className="w-3 h-3" />}
            >
              پرفروش
            </Badge>
          )}
          {isLowStock && (
            <Badge 
              variant="warning" 
              className="shadow-lg backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 text-orange-600 dark:text-orange-400 border-2 border-orange-500"
              icon={<Zap className="w-3 h-3" />}
            >
              فقط {product.stock} عدد
            </Badge>
          )}
        </div>

        {/* Overlay ناموجود */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in">
            <span className="text-white font-black text-xl bg-gradient-to-r from-red-500 to-pink-500 px-6 py-3 rounded-2xl shadow-2xl border-2 border-white/20">
              ناموجود
            </span>
          </div>
        )}

        {/* دکمه علاقمندی با انیمیشن */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-2 left-2 w-10 h-10 rounded-full flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-all duration-300',
            'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg hover:scale-110 active:scale-90',
            isWishlisted 
              ? 'text-red-500 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-800' 
              : 'text-gray-400 hover:text-red-400',
            isLowStock && 'top-28'
          )}
          aria-label="افزودن به علاقه‌مندی‌ها"
        >
          <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
        </button>

        {/* دکمه مشاهده سریع با گرادینت */}
        <button
          onClick={handleQuickView}
          className={cn(
            'absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2',
            'bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-gray-700 dark:text-gray-200 text-xs font-black',
            'px-5 py-2.5 rounded-full shadow-2xl border-2 border-gray-200 dark:border-slate-600',
            'opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0',
            'transition-all duration-300 hover:shadow-primary-500/30 hover:border-primary-300 dark:hover:border-primary-500 hover:scale-105 active:scale-95'
          )}
          aria-label="مشاهده سریع"
        >
          <Eye className="w-4 h-4" />
          مشاهده سریع
        </button>
      </div>

      {/* بخش اطلاعات با گرادینت پس‌زمینه */}
      <div className="p-4 flex flex-col gap-2.5 flex-1 bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
        {/* سازگاری با مدل گوشی */}
        {selectedModel && isCompatible && (
          <div className="flex items-center gap-1 text-success-600 dark:text-success-400 text-xs font-bold bg-gradient-to-r from-success-50 to-emerald-50 dark:from-success-900/30 dark:to-emerald-900/30 px-2.5 py-1.5 rounded-xl border border-success-200 dark:border-success-800">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>سازگار با {selectedModel.name}</span>
          </div>
        )}

        {/* نام محصول */}
        <h3 className="font-black text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-primary-400 dark:group-hover:from-primary-400 dark:group-hover:to-primary-300 transition-all min-h-[2.75rem]">
          {product.name}
        </h3>

        {/* نام فروشنده */}
        {product.seller && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", cardGradient)}></span>
            {product.seller.shop_name}
          </p>
        )}

        {/* امتیاز و نظرات */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= Math.round(product.rating!)
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                      : 'text-gray-200 dark:text-gray-600'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
              ({product.reviews_count})
            </span>
          </div>
        )}

        {/* گارانتی */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 px-2.5 py-2 rounded-xl border border-gray-200 dark:border-slate-600">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-semibold">گارانتی اصالت و سلامت</span>
        </div>

        <div className="flex-1" />

        {/* قیمت و دکمه */}
        <div className="flex items-end justify-between gap-2 pt-3 border-t-2 border-gray-100 dark:border-slate-700">
          <div className="flex flex-col">
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 dark:text-gray-500 line-through font-medium">
                {formatPrice(product.compare_price)}
              </span>
            )}
            <span className={cn(
              "text-xl font-black text-transparent bg-clip-text bg-gradient-to-r",
              cardGradient
            )}>
              {formatPrice(product.price)}
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className={cn(
              "flex-shrink-0 font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
              `bg-gradient-to-r ${cardGradient} text-white border-0`
            )}
          >
            افزودن
          </Button>
        </div>
      </div>
    </div>
  );
}
