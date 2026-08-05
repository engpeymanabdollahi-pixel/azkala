/**
 * کامپوننت QuickViewModal - مودال مشاهده سریع محصول
 * ویژگی‌ها:
 * - گالری تصاویر با قابلیت اسلاید
 * - نمایش کامل مشخصات فنی (Specifications)
 * - لیست دستگاه‌های سازگار (Device Models)
 * - دکمه کپی سریع از داخل مودال
 */

import { Copy, Check, Smartphone } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import type { ProductTemplate } from './TemplateCard';

interface QuickViewModalProps {
  template: ProductTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (id: number) => void;
  copyingId: number | null;
}

export function QuickViewModal({
  template,
  isOpen,
  onClose,
  onCopy,
  copyingId,
}: QuickViewModalProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(price) + ' تومان';

  if (!template) return null;

  const currentPrice = template.discount_price || template.price;
  // همان قاعده‌ی TemplateCard: تخفیف فقط به مقایسه‌ی compare_price با قیمت
  // فعلی نیاز دارد، نه به وجود جداگانه‌ی discount_price.
  const discountPercent = template.compare_price && template.compare_price > currentPrice
    ? Math.round((1 - currentPrice / template.compare_price) * 100)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="مشاهده سریع محصول"
      size="xl"
      showCloseButton
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ستون تصاویر */}
        <div className="space-y-4">
          {/* تصویر اصلی */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <SafeImage
              src={template.main_image}
              alt={template.name}
              className="w-full h-full object-cover"
              showEmojiOnError
              fallbackEmoji="📦"
            />

            {/* نشانگر تخفیف */}
            {discountPercent !== null && discountPercent > 0 && (
              <div className="absolute top-4 left-4">
                <div className="bg-gradient-to-r from-error-500 to-error-600 dark:from-error-600 dark:to-error-500 text-white px-4 py-2 rounded-full text-sm font-black shadow-lg">
                  %{discountPercent} تخفیف ویژه
                </div>
              </div>
            )}
          </div>

          {/* گالری تصاویر کوچک */}
          {template.gallery && template.gallery.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {template.gallery.map((img, idx) => (
                <button
                  key={idx}
                  className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  type="button"
                  aria-label={`تصویر ${idx + 1}`}
                >
                  <SafeImage
                    src={img}
                    alt={`تصویر ${idx + 1}`}
                    className="w-full h-full object-cover"
                    showEmojiOnError
                    fallbackEmoji="🖼️"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ستون اطلاعات */}
        <div className="space-y-5">
          {/* هدر اطلاعات */}
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">
              {template.name}
            </h2>

            {/* Badgeها */}
            <div className="flex flex-wrap gap-2 mb-3">
              {template.category && (
                <Badge variant="primary">{template.category.name}</Badge>
              )}
              {template.brand && (
                <Badge variant="accent">{template.brand.name}</Badge>
              )}
              {template.stock > 0 ? (
                <Badge variant="success">✓ موجود در انبار</Badge>
              ) : (
                <Badge variant="error">✕ ناموجود</Badge>
              )}
            </div>
          </div>

          {/* قیمت */}
          <div className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                {formatPrice(currentPrice)}
              </span>
              {template.compare_price && template.compare_price > currentPrice && (
                <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                  {formatPrice(template.compare_price)}
                </span>
              )}
            </div>
          </div>

          {/* توضیحات */}
          {template.short_description && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-sm">توضیحات محصول</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {template.short_description}
              </p>
            </div>
          )}

          {/* مشخصات فنی */}
          {template.specifications && Object.keys(template.specifications).length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm">مشخصات فنی</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(template.specifications).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-500 dark:text-gray-400">{key}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* دستگاه‌های سازگار */}
          {template.device_models && template.device_models.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                دستگاه‌های سازگار ({template.device_models.length})
              </h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {template.device_models.map((device) => (
                  <Badge
                    key={device.id}
                    variant="gray"
                    className="text-xs"
                    icon={<Check className="w-3 h-3 text-success-500" />}
                  >
                    {device.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* دکمه کپی */}
          <Button
            onClick={() => onCopy(template.id)}
            disabled={copyingId === template.id}
            isLoading={copyingId === template.id}
            fullWidth
            size="lg"
            className="mt-4"
          >
            {copyingId === template.id ? (
              <span>در حال کپی کردن...</span>
            ) : (
              <>
                <Copy className="w-5 h-5 ml-2" />
                <span>افزودن این محصول به فروشگاه من</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
