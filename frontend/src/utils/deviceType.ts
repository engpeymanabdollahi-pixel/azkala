import { Laptop, Smartphone, Tablet, type LucideIcon } from 'lucide-react';

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
