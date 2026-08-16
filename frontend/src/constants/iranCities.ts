/**
 * مرکز تقریبی چند کلان‌شهر ایران — برای «انتخاب دستی شهر» در جریان
 * fallback مکان‌یابی (Phase 13). عمداً هیچ سرویس نقشه/geocoding خارجی
 * استفاده نشده (طبق دستور صریح این فاز)؛ این فقط یک جدول ثابت از
 * مختصات عمومی و شناخته‌شده‌ی مرکز شهرهاست، نه یک ادعای دقت آدرس.
 */
export interface IranCity {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
}

export const IRAN_MAJOR_CITIES: IranCity[] = [
  { key: 'tehran', label: 'تهران', latitude: 35.6892, longitude: 51.3890 },
  { key: 'mashhad', label: 'مشهد', latitude: 36.2970, longitude: 59.6062 },
  { key: 'isfahan', label: 'اصفهان', latitude: 32.6546, longitude: 51.6680 },
  { key: 'karaj', label: 'کرج', latitude: 35.8400, longitude: 50.9391 },
  { key: 'shiraz', label: 'شیراز', latitude: 29.5918, longitude: 52.5837 },
  { key: 'tabriz', label: 'تبریز', latitude: 38.0800, longitude: 46.2919 },
  { key: 'qom', label: 'قم', latitude: 34.6401, longitude: 50.8764 },
  { key: 'ahvaz', label: 'اهواز', latitude: 31.3183, longitude: 48.6706 },
  { key: 'kermanshah', label: 'کرمانشاه', latitude: 34.3277, longitude: 47.0778 },
  { key: 'rasht', label: 'رشت', latitude: 37.2809, longitude: 49.5832 },
  { key: 'urmia', label: 'ارومیه', latitude: 37.5527, longitude: 45.0761 },
  { key: 'kerman', label: 'کرمان', latitude: 30.2839, longitude: 57.0834 },
  { key: 'yazd', label: 'یزد', latitude: 31.8974, longitude: 54.3569 },
  { key: 'arak', label: 'اراک', latitude: 34.0917, longitude: 49.6892 },
  { key: 'hamadan', label: 'همدان', latitude: 34.7992, longitude: 48.5146 },
  { key: 'bandar-abbas', label: 'بندرعباس', latitude: 27.1865, longitude: 56.2808 },
];
