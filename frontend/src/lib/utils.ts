import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * ادغام کلاس‌های Tailwind با clsx برای مدیریت conditionals
 * @param inputs کلاس‌های CSS
 * @returns رشته کلاس‌های ادغام شده
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * فرمت کردن قیمت به تومان
 * @param price قیمت به ریال
 * @returns قیمت فرمت شده به تومان
 */
export function formatPrice(price: number): string {
  const toman = Math.floor(price / 10);
  return toman.toLocaleString('fa-IR');
}

/**
 * فرمت کردن تاریخ شمسی
 * @param date تاریخ میلادی
 * @returns تاریخ شمسی فرمت شده
 */
export function formatDateJalali(date: string | Date): string {
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

/**
 * بررسی اعتبار ایمیل
 * @param email آدرس ایمیل
 * @returns true اگر ایمیل معتبر باشد
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * بررسی اعتبار شماره موبایل ایران
 * @param phone شماره موبایل
 * @returns true اگر شماره معتبر باشد
 */
export function isValidIranianPhone(phone: string): boolean {
  const phoneRegex = /^09[0-9]{9}$/;
  return phoneRegex.test(phone);
}

/**
 * تبدیل اعداد انگلیسی به فارسی
 * @param str رشته ورودی
 * @returns رشته با اعداد فارسی
 */
export function toPersianNumbers(str: string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (digit) => persianNumbers[parseInt(digit)]);
}

/**
 * تبدیل اعداد فارسی به انگلیسی
 * @param str رشته ورودی
 * @returns رشته با اعداد انگلیسی
 */
export function toEnglishNumbers(str: string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[۰-۹]/g, (digit) => persianNumbers.indexOf(digit).toString());
}

/**
 * حذف کاراکترهای خاص از رشته
 * @param str رشته ورودی
 * @returns رشته پاکسازی شده
 */
export function sanitizeString(str: string): string {
  return str.replace(/[<>\"'&]/g, '');
}

/**
 * محاسبه تخفیف
 * @param originalPrice قیمت اصلی
 * @param discountedPrice قیمت با تخفیف
 * @returns درصد تخفیف
 */
export function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * تأخیر(async delay)
 * @param ms میلی‌ثانیه
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ذخیره در localStorage با مدیریت خطا
 * @param key کلید
 * @param value مقدار
 */
export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('localStorage save failed:', error);
  }
}

/**
 * خواندن از localStorage با مدیریت خطا
 * @param key کلید
 * @param defaultValue مقدار پیش‌فرض
 * @returns مقدار ذخیره شده یا پیش‌فرض
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('localStorage get failed:', error);
    return defaultValue;
  }
}

/**
 * حذف از localStorage
 * @param key کلید
 */
export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('localStorage remove failed:', error);
  }
}
