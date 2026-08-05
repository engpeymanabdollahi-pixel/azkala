/**
 * کامپوننت TemplateCard - کارت محصول بهبود یافته
 * ویژگی‌ها:
 * - نشانگر تخفیف درصدی متحرک
 * - Badgeهای هوشمند (دسته‌بندی، برند، سازگاری)
 * - Progress bar برای نمایش میزان تکمیل اطلاعات محصول
 * - دکمه‌های اکشن سریع (کپی، مشاهده سریع، علاقه‌مندی‌ها)
 */

import { Copy, Eye, Heart, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/utils/cn';

interface DeviceModelRef {
  id: number;
  name: string;
}

export interface ProductTemplate {
  id: number;
  name: string;
  slug: string;
  short_description?: string;
  main_image?: string;
  gallery?: string[];
  specifications?: Record<string, unknown>;
  price: number;
  compare_price?: number | null;
  discount_price?: number | null;
  stock: number;
  views_count?: number;
  sales_count?: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  device_models?: DeviceModelRef[];
}

interface TemplateCardProps {
  template: ProductTemplate;
  onCopy: (id: number) => void;
  onQuickView: (template: ProductTemplate) => void;
  copyingId: number | null;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

/**
 * درصد تخفیف واقعی نسبت به قیمتی که مشتری می‌پردازد.
 *
 * نسخه‌ی قبلی به وجود همزمانِ compare_price و discount_price نیاز داشت. اما
 * discount_price اختیاری است — محصولی با فقط compare_price (بدون
 * discount_price جداگانه) هم واقعاً تخفیف دارد، چون قیمت فعلی همان price
 * است که از compare_price کمتر است. با شرط قبلی، نشان تخفیف روی همچین
 * محصولاتی هرگز ظاهر نمی‌شد.
 */
function calculateDiscountPercent(template: ProductTemplate, currentPrice: number): number | null {
  if (!template.compare_price || template.compare_price <= currentPrice) {
    return null;
  }

  return Math.round((1 - currentPrice / template.compare_price) * 100);
}

export function TemplateCard({
  template,
  onCopy,
  onQuickView,
  copyingId,
  isFavorite = false,
  onToggleFavorite,
}: TemplateCardProps) {
  // محاسبه درصد تکمیل اطلاعات محصول
  const calculateCompletion = () => {
    let score = 0;
    if (template.main_image) score += 20;
    if (template.short_description) score += 20;
    if (template.specifications && Object.keys(template.specifications).length > 0) score += 20;
    if (template.brand) score += 15;
    if (template.category) score += 15;
    if (template.device_models && template.device_models.length > 0) score += 10;
    return score;
  };

  const completionScore = calculateCompletion();
  const currentPrice = template.discount_price || template.price;
  const discountPercent = calculateDiscountPercent(template, currentPrice);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(price) + ' تومان';

  return (
    <div
      className={cn(
        'group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden',
        'hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:shadow-black/40 hover:-translate-y-2 hover:border-primary-300 dark:hover:border-primary-600',
        'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900',
        'transition-all duration-300 ease-out',
        'relative'
      )}
    >
      {/* بخش تصویر با افکت‌های ویژه */}
      <div className="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        <SafeImage
          src={template.main_image}
          alt={template.name}
          className={cn(
            'w-full h-full object-cover',
            'group-hover:scale-110 group-hover:rotate-1',
            'transition-transform duration-500 ease-out'
          )}
          showEmojiOnError
          fallbackEmoji="📦"
        />

        {/* Overlay گرادیانت هنگام hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* نشانگر تخفیف متحرک */}
        {discountPercent !== null && discountPercent > 0 && (
          <div className="absolute top-3 left-3 animate-pulse-soft">
            <div className="bg-gradient-to-r from-error-500 to-error-600 dark:from-error-600 dark:to-error-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg shadow-error-500/40 dark:shadow-black/40">
              %{discountPercent} تخفیف
            </div>
          </div>
        )}

        {/* Badgeهای دسته‌بندی و برند */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {template.category && (
            <Badge variant="primary" size="sm" className="backdrop-blur-md bg-white/90 dark:bg-gray-900/80 shadow-md">
              {template.category.name}
            </Badge>
          )}
          {template.brand && (
            <Badge variant="accent" size="sm" className="backdrop-blur-md bg-white/90 dark:bg-gray-900/80 shadow-md">
              {template.brand.name}
            </Badge>
          )}
        </div>

        {/* دستگاه‌های سازگار */}
        {template.device_models && template.device_models.length > 0 && (
          <div className="absolute bottom-16 right-3 flex flex-wrap gap-1 justify-end max-w-[85%]">
            {template.device_models.slice(0, 2).map((device) => (
              <Badge
                key={device.id}
                variant="gray"
                className="backdrop-blur-md bg-white/80 dark:bg-gray-900/70 text-[10px] font-bold shadow-sm"
                icon={<Smartphone className="w-3 h-3" />}
              >
                {device.name}
              </Badge>
            ))}
            {template.device_models.length > 2 && (
              <Badge variant="gray" className="backdrop-blur-md bg-white/80 dark:bg-gray-900/70 text-[10px] font-bold">
                +{template.device_models.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* دکمه علاقه‌مندی */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(template.id)}
            className="absolute bottom-16 left-3 p-2 rounded-full bg-white/90 dark:bg-gray-900/80 backdrop-blur shadow-md hover:bg-white dark:hover:bg-gray-900 transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
            type="button"
          >
            <Heart
              className={cn(
                'w-4 h-4 transition-colors',
                isFavorite ? 'fill-error-500 text-error-500' : 'text-gray-400 dark:text-gray-500'
              )}
            />
          </button>
        )}

        {/* دکمه‌های اکشن سریع - فقط هنگام hover */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => { e.stopPropagation(); onQuickView(template); }}
            className="backdrop-blur-md bg-white/95 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 shadow-lg"
          >
            <Eye className="w-4 h-4" />
            مشاهده سریع
          </Button>
        </div>
      </div>

      {/* بخش محتوا */}
      <div className="p-4 space-y-3">
        {/* نام محصول */}
        <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg line-clamp-2 min-h-[3.5rem] leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
          {template.name}
        </h3>

        {/* توضیحات کوتاه */}
        {template.short_description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {template.short_description}
          </p>
        )}

        {/* Progress bar تکمیل اطلاعات */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">تکمیل اطلاعات</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">{completionScore}%</span>
          </div>
          <div
            className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={completionScore}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>

        {/* قیمت و موجودی */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
          {/* قیمت */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-primary-600 dark:text-primary-400">
              {formatPrice(currentPrice)}
            </span>
            {template.compare_price && template.compare_price > currentPrice && (
              <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                {formatPrice(template.compare_price)}
              </span>
            )}
          </div>

          {/* موجودی */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">موجودی الگو: {template.stock} عدد</span>
            <Badge
              variant={template.stock > 0 ? 'success' : 'error'}
              size="sm"
              className="animate-fade-in"
            >
              {template.stock > 0 ? '✓ موجود' : '✕ ناموجود'}
            </Badge>
          </div>
        </div>

        {/* دکمه کپی */}
        <Button
          onClick={() => onCopy(template.id)}
          disabled={copyingId === template.id}
          isLoading={copyingId === template.id}
          fullWidth
          variant={copyingId === template.id ? 'secondary' : 'primary'}
          className={cn(
            'relative overflow-hidden',
            copyingId !== template.id && 'group/btn'
          )}
        >
          {copyingId === template.id ? (
            <span>در حال کپی...</span>
          ) : (
            <>
              <Copy className="w-4 h-4 ml-2 group-hover/btn:rotate-12 transition-transform" />
              <span>افزودن به فروشگاه من</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
