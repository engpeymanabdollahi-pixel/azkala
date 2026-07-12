// ==================== Price Formatting ====================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

export function formatDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= discountedPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

// ==================== Number Formatting ====================

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (digit) => PERSIAN_DIGITS[parseInt(digit)]);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

// ==================== Date Formatting ====================

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'همین الان';
  if (diffMins < 60) return `${toPersianDigits(diffMins)} دقیقه پیش`;
  if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
  if (diffDays < 30) return `${toPersianDigits(diffDays)} روز پیش`;
  return formatDate(d);
}
