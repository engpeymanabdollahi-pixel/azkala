import { useState, ImgHTMLAttributes, memo } from 'react';
import { cn } from '@/utils/cn';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  fallbackEmoji?: string;
  showEmojiOnError?: boolean;
}

export const SafeImage = memo(({
  src,
  alt = '',
  fallback = '/images/placeholder.png',
  fallbackEmoji = '📦',
  showEmojiOnError = false,
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

  // ✅ اگر تصویر اولیه هم معتبر نبود، مستقیماً emoji نشان بده
  if ((!isValidSrc || imgError) && showEmojiOnError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-6xl',
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
      className={className}
      onError={handleError}
      loading="lazy"
     decoding="async" // ✅ این خط را برای بهینه‌سازی رمز
      {...props}
    />
  );
});

SafeImage.displayName = 'SafeImage';