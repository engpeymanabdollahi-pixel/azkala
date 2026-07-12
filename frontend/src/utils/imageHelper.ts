/**
 * Helper برای مدیریت تصاویر با fallback
 * اگر تصویر خارجی لود نشد، از placeholder داخلی استفاده می‌کند
 */
export const getProductImage = (
  image?: string | null,
  type: 'product' | 'brand' | 'model' = 'product'
): string => {
  // اگر تصویر معتبر و محلی است، برگردان
  if (image && (image.startsWith('/images/') || image.startsWith('data:'))) {
    return image;
  }

  // Fallback بر اساس نوع
  const placeholders = {
    product: '/images/placeholder.png',
    brand: '/images/brand-placeholder.png',
    model: '/images/phone-placeholder.png',
  };

  return placeholders[type];
};

/**
 * بررسی اینکه آیا URL یک تصویر خارجی است
 */
export const isExternalImage = (url?: string | null): boolean => {
  if (!url) return false;
  return url.startsWith('http') && !url.includes(window.location.hostname);
};

/**
 * گرفتن emoji به عنوان placeholder سریع
 */
export const getCategoryIcon = (categoryName: string): string => {
  const icons: Record<string, string> = {
    'قاب گوشی': '📱',
    'قاب': '📱',
    'گلس': '🛡️',
    'شارژر': '🔌',
    'هندزفری': '🎧',
    'هدفون': '🎧',
    'پاوربانک': '🔋',
    'کابل': '🔗',
    'ساعت': '⌚',
    'پایه': '📱',
    'default': '📦',
  };

  for (const [key, icon] of Object.entries(icons)) {
    if (categoryName.includes(key)) return icon;
  }

  return icons.default;
};