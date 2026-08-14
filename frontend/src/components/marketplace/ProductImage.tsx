/**
 * ProductImage - کامپوننت اختصاصی تصویر محصول
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * Wrapper around SafeImage با ویژگی‌های اختصاصی Marketplace:
 * - Badge های overlay (Discount, New, Bestseller)
 * - Fallback با emoji محصول
 * - Aspect ratio استاندارد محصول (1:1 برای grid, 3:4 برای detail)
 * - Priority loading برای LCP
 * 
 * استفاده:
 * ```tsx
 * <ProductImage
 *   src={product.main_image}
 *   alt={product.name}
 *   variant="grid"
 *   discountPercent={25}
 *   isNew={true}
 *   priority={false}
 * />
 * ```
 */

import { Flame, Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/utils/cn';

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  /** نوع نمایش: grid (1:1) یا detail (1:1) یا horizontal (4:3) */
  variant?: 'grid' | 'detail' | 'horizontal';
  /** درصد تخفیف (badge قرمز) */
  discountPercent?: number;
  /** محصول جدید (badge آبی) */
  isNew?: boolean;
  /** پرفروش (badge طلایی) */
  isBestseller?: boolean;
  /** Priority loading برای LCP */
  priority?: boolean;
  /** ابعاد صریح */
  width?: number | string;
  height?: number | string;
  /** کلاس اضافی */
  className?: string;
}

export function ProductImage({
  src,
  alt,
  variant = 'grid',
  discountPercent = 0,
  isNew = false,
  isBestseller = false,
  priority = false,
  width,
  height,
  className,
}: ProductImageProps) {
  const variantAspectRatio = {
    grid: 'square' as const,
    detail: 'square' as const,
    horizontal: 'landscape' as const,
  };

  const hasDiscount = discountPercent > 0;
  const hasBadge = hasDiscount || isNew || isBestseller;

  return (
    <div className={cn('relative group overflow-hidden rounded-lg', className)}>
      {/* Main Image */}
      <SafeImage
        src={src}
        alt={alt}
        aspectRatio={variantAspectRatio[variant]}
        priority={priority}
        width={width}
        height={height}
        fallbackEmoji="📦"
        showEmojiOnError={true}
        blurPlaceholder={true}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Badges Overlay */}
      {hasBadge && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <Badge variant="error" size="sm" className="text-[10px] shadow-lg font-black">
              <Flame className="w-3 h-3 ml-0.5" />
              {discountPercent}٪
            </Badge>
          )}
          {/* ✅ variant «info» در Badge وجود ندارد (باعث می‌شد این بج بدون
              هیچ رنگی رندر شود) — با «جدید» در ProductCard.tsx هماهنگ شد. */}
          {isNew && (
            <Badge variant="success" size="sm" className="text-[10px] shadow-lg font-black">
              <Sparkles className="w-3 h-3 ml-0.5" />
              جدید
            </Badge>
          )}
          {isBestseller && (
            <Badge variant="accent" size="sm" className="text-[10px] shadow-lg font-black">
              <Crown className="w-3 h-3 ml-0.5" />
              پرفروش
            </Badge>
          )}
        </div>
      )}

      {/* Low Stock / Out of Stock Overlay (می‌توان بعداً اضافه کرد) */}
    </div>
  );
}