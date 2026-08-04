import { ShoppingCart, Star, CheckCircle, Heart, Eye, Flame, Award, ShieldCheck } from 'lucide-react';
import { useModelStore, useCartStore } from '@/store';
import { useWishlistApi } from '@/hooks/api/useWishlistApi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const { selectedModel } = useModelStore();
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist, prefetchProduct } = useWishlistApi();
  
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
    toggleWishlist(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails?.(product);
  };

  // 🎯 Smart Prefetch on hover
  const handleMouseEnter = () => {
    prefetchProduct(product);
    queryClient.prefetchQuery({
      queryKey: ['product', product.slug],
      staleTime: 10 * 60 * 1000,
    });
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
      <div
        className="group flex bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98]"
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
      >
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-50 dark:bg-slate-700">
          <SafeImage
            src={product.main_image}
            alt={product.name}
            fallbackEmoji="📦"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            aspectRatio="square"
          />
          {discountPercent > 0 && (
            <div className="absolute top-1 right-1">
              <Badge variant="error" className="text-xs px-1.5 py-0.5 shadow-lg">
                {discountPercent}٪
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 p-3 flex flex-col gap-1">
          {selectedModel && isCompatible && (
            <div className="flex items-center gap-1 text-success-600 dark:text-success-400 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>سازگار با {selectedModel.name}</span>
            </div>
          )}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-relaxed group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {product.name}
          </h3>
          {product.seller && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{product.seller.shop_name}</p>
          )}
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col">
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
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
              className="text-xs active:scale-95"
            >
              افزودن
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // نمای گرید (پیش‌فرض)
  return (
    <div
      className="group relative flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-2xl dark:hover:shadow-2xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
    >
      {/* بخش تصویر */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-slate-700">
        <SafeImage
          src={product.main_image}
          alt={product.name}
          fallbackEmoji="📦"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          aspectRatio="square"
        />

        {/* Badgeهای بالا سمت راست */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <Badge 
              variant="error" 
              className="shadow-lg animate-pulse-soft"
              icon={<Flame className="w-3 h-3" />}
            >
              {discountPercent}٪ تخفیف
            </Badge>
          )}
          {isBestSeller && (
            <Badge 
              variant="accent" 
              className="shadow-lg"
              icon={<Award className="w-3 h-3" />}
            >
              پرفروش
            </Badge>
          )}
        </div>

        {/* Badge موجودی کم - بالا سمت چپ */}
        {isLowStock && (
          <div className="absolute top-2 left-2">
            <Badge variant="warning" className="shadow-lg text-xs">
              فقط {product.stock} عدد
            </Badge>
          </div>
        )}

        {/* Overlay ناموجود */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
            <span className="text-white font-bold text-lg bg-black/40 px-6 py-2 rounded-xl shadow-xl">
              ناموجود
            </span>
          </div>
        )}

        {/* دکمه علاقمندی */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-2 left-2 w-9 h-9 rounded-full flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-all duration-300',
            'bg-white dark:bg-slate-800 shadow-lg hover:scale-110',
            isWishlisted ? 'text-red-500 opacity-100' : 'text-gray-400 dark:text-gray-500 hover:text-red-400',
            isLowStock && 'top-10'
          )}
          aria-label="افزودن به علاقه‌مندی‌ها"
        >
          <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
        </button>

        {/* دکمه مشاهده سریع */}
        <button
          onClick={handleQuickView}
          className={cn(
            'absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5',
            'bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-gray-700 dark:text-gray-300 text-xs font-semibold',
            'px-4 py-2 rounded-full shadow-lg',
            'opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0',
            'transition-all duration-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400'
          )}
          aria-label="مشاهده سریع"
        >
          <Eye className="w-3.5 h-3.5" />
          مشاهده سریع
        </button>
      </div>

      {/* بخش اطلاعات */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* سازگاری با مدل گوشی */}
        {selectedModel && isCompatible && (
          <div className="flex items-center gap-1 text-success-600 dark:text-success-400 text-xs font-semibold bg-success-50 dark:bg-success-900/20 px-2 py-1 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>سازگار با {selectedModel.name}</span>
          </div>
        )}

        {/* نام محصول */}
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-relaxed group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* نام فروشنده */}
        {product.seller && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 flex items-center gap-1">
            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
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

        {/* گارانتی */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 px-2 py-1.5 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
          <span>گارانتی اصالت و سلامت</span>
        </div>

        <div className="flex-1" />

        {/* قیمت و دکمه */}
        <div className="flex items-end justify-between gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
          <div className="flex flex-col">
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
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
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className="flex-shrink-0 active:scale-95"
          >
            افزودن
          </Button>
        </div>
      </div>
    </div>
  );
}