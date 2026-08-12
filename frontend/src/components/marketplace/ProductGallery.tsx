import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Flame, CheckCircle, X, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/utils/cn';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  discountPercent?: number;
  inStock: boolean;
  className?: string;
}

/**
 * ProductGallery - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * قابلیت‌ها:
 * - Main Image با Zoom on hover
 * - Thumbnail Navigation
 * - Discount Badge
 * - Stock Badge
 * - RTL + Responsive
 */
export function ProductGallery({
  images,
  productName,
  discountPercent = 0,
  inStock,
  className,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const handleImageZoom = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handlePrevImage = useCallback(() => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  }, [images.length]);

  return (
    <div className={cn('space-y-2.5', className)}>
      {/* Main Image با Zoom */}
      <div
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-md group',
          isZoomed && 'cursor-zoom-out'
        )}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleImageZoom}
      >
        <div className="aspect-square relative overflow-hidden">
          <SafeImage
            src={images[selectedImage]}
            alt={productName}
            className={cn(
              'w-full h-full object-contain p-4 transition-transform duration-300',
              isZoomed && 'scale-150'
            )}
            style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : {}}
            fallbackEmoji="📦"
            showEmojiOnError={true}
          />

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="error" className="shadow-lg">
                <Flame className="w-3.5 h-3.5 ml-1" />
                {discountPercent}٪
              </Badge>
            </div>
          )}

          {/* Stock Badge */}
          <div className="absolute top-3 left-3 z-10">
            {inStock ? (
              <Badge variant="success" className="shadow-md">
                <CheckCircle className="w-3 h-3 ml-0.5" />
                موجود
              </Badge>
            ) : (
              <Badge variant="error" className="shadow-md">
                <X className="w-3 h-3 ml-0.5" />
                ناموجود
              </Badge>
            )}
          </div>

          {/* Zoom Indicator */}
          {!isZoomed && images[selectedImage] && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Maximize2 className="w-3 h-3" />
              زوم
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                aria-label="تصویر قبلی"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                aria-label="تصویر بعدی"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={cn(
                'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white dark:bg-gray-800',
                selectedImage === idx
                  ? 'border-primary-500 shadow-md scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              )}
              aria-label={`تصویر ${idx + 1}`}
            >
              <SafeImage src={img} alt="" className="w-full h-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}