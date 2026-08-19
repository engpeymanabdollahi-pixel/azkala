import { Smartphone, Laptop, Tablet, Watch, Headphones, type LucideIcon } from 'lucide-react';

/**
 * ✅ Device-First Architecture فاز ۵: نگاشت DeviceFamily.icon به کامپوننت
 * واقعی Lucide.
 *
 * device_families.icon یک رشته‌ی آزاد (`string|nullable`) است که یک ادمین
 * از فرم AdminDeviceFamiliesPage.tsx وارد می‌کند (برچسب فرم: «آیکون
 * (اختیاری، نام lucide-react)»). این رشته مستقیماً از DB/API می‌آید —
 * یعنی **هرگز** نباید مستقیم به یک import/require پویا یا resolve کامپوننت
 * دلخواه (`LucideIcons[userInput]` روی کل namespace) پاس داده شود؛ چنین
 * الگویی یعنی هر مقداری که در DB بنشیند (یا از طریق یک باگ/حمله‌ی احتمالی
 * تزریق شود) می‌تواند به اجرای هر export دلخواهی از یک پکیج منجر شود.
 *
 * به‌جایش این‌جا یک allow-list صریح و بسته است — فقط همان مجموعه‌ی کوچکی
 * از آیکون‌هایی که از قبل در deviceType.ts/DeviceCompatibility.tsx/
 * DeviceSelector.tsx برای همین منظور import شده بودند. یک نام تأییدنشده
 * همیشه `null` برمی‌گرداند (نه throw، نه کرش) — تصمیم fallback با
 * صدازننده است (resolveDeviceIcon در deviceType.ts).
 */
const APPROVED_FAMILY_ICONS: Readonly<Record<string, LucideIcon>> = {
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Headphones,
};

/**
 * نام آیکونِ خانواده (از device_families.icon) را به کامپوننت Lucide واقعی
 * resolve می‌کند. اگر مقدار خالی/نامشخص/خارج از allow-list باشد، `null`
 * برمی‌گرداند — کرش نمی‌کند، کامپوننت دلخواه اجرا نمی‌کند.
 */
export function resolveFamilyIcon(iconName: string | null | undefined): LucideIcon | null {
  if (!iconName) return null;
  return APPROVED_FAMILY_ICONS[iconName] ?? null;
}
