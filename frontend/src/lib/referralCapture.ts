import { useAuthStore } from '@/store/authStore';

// ==================== Referral Capture (Phase 2) ====================
// ✅ مسیر واقعی این پروژه صفحه‌ی مستقل «/register» ندارد (ثبت‌نام از
// طریق AuthModal — یک مودال قابل‌بازشدن روی هر صفحه — انجام می‌شود، نه
// یک route اختصاصی). لینک نمونه‌ی درخواست (`/register?ref=CODE`) هنوز
// کار می‌کند چون همین ماژول روی *هر* بارگذاری/ناوبری اپ، صرف‌نظر از
// اینکه کدام route match شود، query param را می‌خواند — نه فقط داخل یک
// صفحه‌ی خاص. (`/register` خودش چون در App.tsx تعریف نشده، توسط
// catch-all `path="*"` به «/» ریدایرکت می‌شود؛ این ریدایرکت اتفاق
// می‌افتد، اما capture قبل از آن، در همان رندر اول، انجام شده است.)

const REFERRAL_STORAGE_KEY = 'azkala-referral-code';

/** همان الفبای امن سمت بک‌اند (ReferralService) — بدون 0/O/1/I/L. */
const REFERRAL_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

function normalizeCode(raw: string): string | null {
  const normalized = raw.trim().toUpperCase();
  return REFERRAL_CODE_PATTERN.test(normalized) ? normalized : null;
}

/**
 * `?ref=CODE` را از URL جاری می‌خواند و در صورت معتبر بودنِ فرمت، در
 * localStorage ذخیره می‌کند تا تا لحظه‌ی تکمیل ثبت‌نام (که ممکن است چند
 * صفحه/چند مرحله طول بکشد) باقی بماند.
 *
 * ⚠️ اینجا صرفاً یک بهینه‌سازی UX است، نه مرجع اعتبارسنجی — Backend
 * (ReferralService) دوباره و مستقل کد را validate می‌کند؛ این مقدار
 * هرگز به‌عنوان authorization یا حقیقت نهایی در نظر گرفته نمی‌شود.
 */
export function captureReferralFromLocation(search: string): void {
  const params = new URLSearchParams(search);
  const raw = params.get('ref');
  if (!raw) return;

  const code = normalizeCode(raw);
  if (!code) return;

  // ✅ اگر کاربر همین الان لاگین است و این کد دقیقاً همان کد خودش است
  // (مثلاً خودش روی لینک اشتراک‌گذاری خودش کلیک کرده)، ذخیره/ارسال نشود.
  const currentUserCode = useAuthStore.getState().user?.referral_code;
  if (currentUserCode && currentUserCode === code) return;

  localStorage.setItem(REFERRAL_STORAGE_KEY, code);
}

/** کد ذخیره‌شده (اگر وجود داشته باشد) را برای ارسال با درخواست ثبت‌نام برمی‌گرداند. */
export function getStoredReferralCode(): string | null {
  return localStorage.getItem(REFERRAL_STORAGE_KEY);
}

/** بعد از اینکه بک‌اند تصمیم capture را گرفت (موفق یا ناموفق)، مقدار stale پاک می‌شود. */
export function clearStoredReferralCode(): void {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
}
