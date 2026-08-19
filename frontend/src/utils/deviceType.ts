import { Laptop, Smartphone, Tablet, type LucideIcon } from 'lucide-react';
import { resolveFamilyIcon } from '@/utils/familyIcon';

/**
 * برچسب و آیکون فارسی برای نوع دستگاه انتخابی کاربر.
 *
 * جای دیگری از اپ فرض می‌کرد دستگاه انتخابی همیشه «گوشی» است — چون در ابتدا
 * مدال هدر فقط موبایل داشت. از وقتی لپ‌تاپ و تبلت هم اضافه شدند، آن فرض غلط
 * از آب درآمد: کاربری که برای لپ‌تاپش دستگاه انتخاب کرده بود، همه‌جا پیام
 * «با گوشی شما سازگار نیست» می‌دید — گمراه‌کننده، چون اصلاً گوشی‌ای در کار
 * نبود.
 */

export type DeviceType = 'mobile' | 'laptop' | 'tablet' | 'accessory' | null | undefined;

const LABELS: Record<'mobile' | 'laptop' | 'tablet' | 'accessory', string> = {
  mobile: 'گوشی',
  laptop: 'لپ‌تاپ',
  tablet: 'تبلت',
  accessory: 'دستگاه',
};

const ICONS: Record<'mobile' | 'laptop' | 'tablet' | 'accessory', LucideIcon> = {
  mobile: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  accessory: Smartphone,
};

/** برچسب نوع دستگاه؛ برای مقدار نامشخص «دستگاه» برمی‌گرداند، نه حدس اشتباه. */
export function getDeviceTypeLabel(type: DeviceType): string {
  if (type && type in LABELS) return LABELS[type];
  return 'دستگاه';
}

export function getDeviceTypeIcon(type: DeviceType): LucideIcon {
  if (type && type in ICONS) return ICONS[type];
  return Smartphone;
}

/**
 * ✅ Device-First Architecture فاز ۵: آیکون دستگاه را family-first
 * resolve می‌کند — family منبع حقیقت است، type فقط fallback سازگاری.
 *
 * ترتیب دقیق (برای حفظ کامل UX فعلی، چون family.icon امروز فقط برای ۶
 * برند واقعی پر است):
 *   ۱. اگر brand.family?.icon یک نام تأییدشده در allow-list باشد → همان.
 *   ۲. وگرنه (family.icon نال/نامعتبر/family اصلاً موجود نیست) → دقیقاً
 *      همان منطق قدیمیِ type-based (getDeviceTypeIcon) — یعنی برای هر
 *      برندی که هنوز آیکون خانواده ندارد، رفتار فعلی صفر تغییر می‌کند.
 */
export function resolveDeviceIcon(brand?: {
  type?: DeviceType;
  family?: { icon?: string | null } | null;
} | null): LucideIcon {
  const fromFamily = resolveFamilyIcon(brand?.family?.icon);
  if (fromFamily) return fromFamily;
  return getDeviceTypeIcon(brand?.type);
}

/**
 * نام کامل و طبیعیِ دستگاه برای نمایش در پیام‌ها: «لپ‌تاپ ایسوس ZenBook 14».
 * اگر برند نامشخص بود، فقط به نام مدل و برچسب نوع بسنده می‌کند.
 */
export function formatDeviceName(
  modelName: string,
  brandName: string | undefined | null,
  type: DeviceType
): string {
  const typeLabel = getDeviceTypeLabel(type);
  return brandName ? `${typeLabel} ${brandName} ${modelName}` : `${typeLabel} ${modelName}`;
}
