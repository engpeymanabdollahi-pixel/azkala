/**
 * SafeImage - کامپوننت تصویر ایمن با ویژگی‌های پیشرفته
 * 
 * مطابق Design System ازکالا:
 * - Lazy loading هوشمند
 * - Priority loading برای LCP images
 * - Blur placeholder
 * - Fallback با emoji
 * - Aspect ratio های استاندارد
 * - CLS prevention با width/height
 * 
 * استفاده:
 * ```tsx
 * // عادی (lazy)
 * <SafeImage src={url} alt="..." />
 * 
 * // LCP image (priority)
 * <SafeImage src={url} alt="..." priority />
 * 
 * // با dimensions (برای CLS prevention)
 * <SafeImage src={url} alt="..." width={400} height={400} />
 * ```
 */

import { useState, ImgHTMLAttributes, memo } from 'react';
import { cn } from '@/utils/cn';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string; // ✅ اجباری برای accessibility
  fallback?: string;
  fallbackEmoji?: string;
  showEmojiOnError?: boolean;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
  /** Priority loading برای LCP images (loading="eager" + fetchpriority="high") */
  priority?: boolean;
  /** ابعاد صریح برای CLS prevention */
  width?: number | string;
  height?: number | string;
  /** نمایش blur placeholder هنگام لود */
  blurPlaceholder?: boolean;
}

export const SafeImage = memo(({
  src,
  alt,
  fallback = '/images/placeholder.svg',
  fallbackEmoji = '📦',
  showEmojiOnError = false,
  aspectRatio = 'auto',
  priority = false,
  width,
  height,
  blurPlaceholder = true,
  className,
  onError,
  ...props
}: SafeImageProps) => {
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // ✅ اگر src خالی یا null است، مستقیماً از placeholder استفاده کن
  const isValidSrc = src && src.trim() !== '' && src !== 'null';
  const [currentSrc, setCurrentSrc] = useState(
    isValidSrc ? src : fallback
  );

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc === fallback) {
      setImgError(true);
      return;
    }
    setCurrentSrc(fallback);
    setImgError(true);
    if (onError) onError(e);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: '',
  };

  // ✅ اگر تصویر اولیه هم معتبر نبود، مستقیماً emoji نشان بده
  if ((!isValidSrc || imgError) && showEmojiOnError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 text-6xl',
        aspectRatioClasses[aspectRatio],
        className
      )}>
        {fallbackEmoji}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClasses[aspectRatio], className)}>
      {/* Blur Placeholder */}
      {blurPlaceholder && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 animate-pulse" />
      )}

      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          aspectRatioClasses[aspectRatio],
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        // ✅ Priority vs Lazy
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        // ✅ Dimensions برای CLS prevention
        width={width}
        height={height}
        {...props}
      />
    </div>
  );
});

SafeImage.displayName = 'SafeImage';