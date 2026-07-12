import { useState } from 'react';
import { ShoppingCart, Star, CheckCircle, Heart, Eye, Flame, Award } from 'lucide-react';
import { useModelStore, useCartStore } from '@/store';
import { useWishlistStore } from '@/store/wishlistStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

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

  // بررسی پرفروش بودن (فرضی - می‌توانید از API بگیرید)
  const isBestSeller = product.sales_count && product.sales_count > 100;

  // نمای لیستی
  if (variant === 'list') {
    return (
      <div
        className="group flex bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
        onClick={handleCardClick}
      >
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-50">
          {!imgError ? (
            <img
              src={product.main_image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-100 to-gray-200">
              📦
            </div>
          )}
          {discountPercent > 0 && (
            <div className="absolute top-1 right-1">
              <Badge variant="error" className="text-xs px-1.5 py-0.5">
                {discountPercent}٪
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 p-3 flex flex-col gap-1">
          {selectedModel && isCompatible && (
            <div className="flex items-center gap-1 text-success-600 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>سازگار با {selectedModel.name}</span>
            </div>
          )}
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-relaxed group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          {product.seller && (
            <p className="text-xs text-gray-400">{product.seller.shop_name}</p>
          )}
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col">
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
              <span className="text-base font-bold text-primary-600">
                {formatPrice(product.price)}
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
              className="text-xs"
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
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-primary-300 hover:shadow-2xl transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* بخش تصویر */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {!imgError ? (
          <img
            src={product.main_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-100 to-gray-200">
            📦
          </div>
        )}

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
            'bg-white shadow-lg hover:scale-110',
            isWishlisted ? 'text-red-500 opacity-100' : 'text-gray-400 hover:text-red-400',
            isLowStock && 'top-10' // جابجایی به پایین اگر badge موجودی کم وجود دارد
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
            'bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-semibold',
            'px-4 py-2 rounded-full shadow-lg',
            'opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0',
            'transition-all duration-300 hover:bg-primary-50 hover:text-primary-600'
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
          <div className="flex items-center gap-1 text-success-600 text-xs font-semibold bg-success-50 px-2 py-1 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>سازگار با {selectedModel.name}</span>
          </div>
        )}

        {/* نام محصول */}
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-relaxed group-hover:text-primary-600 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* نام فروشنده */}
        {product.seller && (
          <p className="text-xs text-gray-400 line-clamp-1 flex items-center gap-1">
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
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
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              ({product.reviews_count})
            </span>
          </div>
        )}

        {/* گارانتی */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg">
          <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>گارانتی اصالت و سلامت</span>
        </div>

        <div className="flex-1" />

        {/* قیمت و دکمه */}
        <div className="flex items-end justify-between gap-2 pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
            <span className="text-lg font-bold text-primary-600">
              {formatPrice(product.price)}
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className="flex-shrink-0"
          >
            افزودن
          </Button>
        </div>
      </div>
    </div>
  );
}