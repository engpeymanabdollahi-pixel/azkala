import { Smartphone, type LucideIcon } from 'lucide-react';
import { resolveFamilyIcon } from '@/utils/familyIcon';

/**
 * برچسب و آیکون دستگاه انتخابی کاربر.
 *
 * ✅ Device-First Architecture — حذف نهایی device_brands.type: این ماژول
 * قبلاً یک fallback کامل type-based (mobile/laptop/tablet/accessory) داشت
 * که وقتی family داده‌ای نداشت به کار می‌آمد. آن ستون از دیتابیس حذف شد و
 * دیگر در هیچ پاسخ API ای وجود ندارد — پس هیچ برندی «type دارد ولی family
 * ندارد» نمی‌تواند باشد؛ منبع حقیقتِ آیکون و برچسب اکنون منحصراً
 * DeviceFamily است. اگر family به هر دلیلی موجود نبود (مثلاً پاسخ API ای
 * که هنوز family را eager-load نمی‌کند)، یک پیش‌فرضِ خنثی (نه حدسِ نوعِ
 * دستگاه) برگردانده می‌شود.
 */

const DEFAULT_LABEL = 'دستگاه';

/**
 * آیکون دستگاه را family-first resolve می‌کند: brand.family?.icon اگر در
 * allow-list باشد، وگرنه Smartphone به‌عنوان پیش‌فرضِ خنثی.
 */
export function resolveDeviceIcon(brand?: {
  family?: { icon?: string | null } | null;
} | null): LucideIcon {
  return resolveFamilyIcon(brand?.family?.icon) ?? Smartphone;
}

/**
 * برچسبِ دستگاه را family-first resolve می‌کند: brand.family?.name اگر
 * موجود بود، وگرنه یک پیش‌فرضِ خنثی («دستگاه») — نه حدسِ نوع بر اساس یک
 * ستونی که دیگر وجود ندارد.
 */
export function resolveDeviceLabel(brand?: {
  family?: { name?: string | null } | null;
} | null): string {
  const familyName = brand?.family?.name?.trim();
  return familyName || DEFAULT_LABEL;
}

/**
 * نام کامل و طبیعیِ دستگاه برای نمایش در پیام‌ها: «لپ‌تاپ ایسوس ZenBook 14».
 * اگر برند نامشخص بود، فقط به نام مدل و برچسب بسنده می‌کند.
 */
export function formatDeviceName(
  modelName: string,
  brandName: string | undefined | null,
  brand?: {
    family?: { name?: string | null } | null;
  } | null
): string {
  const label = resolveDeviceLabel(brand);
  return brandName ? `${label} ${brandName} ${modelName}` : `${label} ${modelName}`;
}
