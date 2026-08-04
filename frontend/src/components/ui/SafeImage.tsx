import { useState, ImgHTMLAttributes, memo } from 'react';
import { cn } from '@/utils/cn';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: string;
  fallbackEmoji?: string;
  showEmojiOnError?: boolean;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
}

export const SafeImage = memo(({
  src,
  alt = '',
  fallback = '/images/placeholder.png',
  fallbackEmoji = '📦',
  showEmojiOnError = false,
  aspectRatio = 'auto',
  className,
  onError,
  ...props
}: SafeImageProps) => {
  const [imgError, setImgError] = useState(false);
  
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
    <img
      src={currentSrc}
      alt={alt}
      className={cn(aspectRatioClasses[aspectRatio], className)}
      onError={handleError}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});

SafeImage.displayName = 'SafeImage';