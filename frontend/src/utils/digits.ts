/**
 * تبدیل ارقام فارسی و عربی به ارقام لاتین.
 *
 * `\d` در جاوااسکریپت فقط ۰ تا ۹ لاتین را می‌گیرد. یعنی هر جا ورودی عددی با
 * regex اعتبارسنجی یا پاک‌سازی می‌شود، کاربری که با کیبورد فارسی تایپ می‌کند
 * بی‌صدا شکست می‌خورد:
 *
 *   /^09\d{9}$/.test('۰۹۱۲۳۴۵۶۷۸۹')  →  false
 *   '۱۲۳۴۵'.replace(/\D/g, '')        →  ''
 *
 * کد پیامک هم معمولاً با ارقام فارسی می‌آید، پس حتی چسباندن آن هم کار نمی‌کند.
 *
 * ورودی کاربر باید همیشه پیش از اعتبارسنجی یا ارسال از اینجا رد شود.
 */

const PERSIAN_ZERO = 0x06f0; // ۰
const ARABIC_ZERO = 0x0660; // ٠

export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (char) => {
    const code = char.charCodeAt(0);

    const value =
      code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9
        ? code - PERSIAN_ZERO
        : code - ARABIC_ZERO;

    return String(value);
  });
}

/** فقط ارقام را نگه می‌دارد، پس از یکسان‌سازی فارسی و عربی به لاتین */
export function digitsOnly(input: string): string {
  return toLatinDigits(input).replace(/\D/g, '');
}
