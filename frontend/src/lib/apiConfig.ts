// VITE_API_URL has historically been configured several different ways in
// local .env files: as the bare origin (http://host:port), as the origin
// plus /api (http://host:port/api), and occasionally with the version
// segment too (http://host:port/api/v1). Normalize all of them down to the
// bare origin so API_V1_URL is always exactly <origin>/api/v1 - never
// /api/api/v1 or /api/v1/api/v1.
//
// ✅ در dev، مسیر همیشه نسبی است (/api/v1)، حتی اگر VITE_API_URL در .env
// تنظیم شده باشد — عمداً آن مقدار در dev نادیده گرفته می‌شود.
//
// چرا: localhost و 127.0.0.1 برای مرورگر دو host کاملاً جدا هستند و
// کوکی‌ای که یکی می‌سازد اصلاً برای دیگری دیده نمی‌شود (نه فقط CORS،
// مسئله‌ی خودِ domain کوکی است). اگر صفحه از localhost:5173 باز شود ولی
// درخواست‌ها مطلقاً به http://127.0.0.1:8000 بروند (که VITE_API_URL در
// .env.example همین مقدار را پیشنهاد می‌دهد — یعنی اکثر .envهای واقعی
// همین را دارند)، کوکی XSRF-TOKEN/laravel-session هیچ‌وقت برنمی‌گردد و
// هر POST با ۴۱۹ رد می‌شود، مهم نیست چطور کوکی در جاوااسکریپت خوانده
// شود. با مسیر نسبی، درخواست از همان originی می‌رود که صفحه رویش باز
// شده — vite.config.ts هم /api و /sanctum را به بک‌اند واقعی پروکسی
// می‌کند (و همان VITE_API_URL را برای تشخیص مقصد پروکسی می‌خواند)، پس از
// دید مرورگر همیشه هم‌مبدأ باقی می‌مانیم، مهم نیست کاربر از کدام
// hostname وارد شده باشد یا .env چه نوشته باشد.
//
// در production (build واقعی، نه dev server) هیچ پروکسی‌ای وجود ندارد؛
// آنجا VITE_API_URL باید صریحاً ست شود.
//
// ✅ فاز TWA preparation — بخش «Production API Config Safety»: قبلاً اگر
// VITE_API_URL در build production ست نشده بود، بی‌صدا به
// `http://127.0.0.1:8000` fallback می‌شد — یعنی اپ production تلاش
// می‌کرد به یک آدرس محلی/غیر-HTTPS وصل شود؛ روی یک origin واقعی HTTPS
// همین درخواست به‌خاطر mixed content توسط خودِ مرورگر/TWA بی‌صدا بلاک
// می‌شد و کاربر فقط یک صفحه‌ی خراب می‌دید، بدون هیچ خطای قابل تشخیص در
// کنسول. resolveProductionApiOrigin() این fallback خاموش را با یک خطای
// صریح، همان لحظه‌ی بالا آمدن اپ، جایگزین می‌کند.
//
// این throw فقط زمانی رخ می‌دهد که خودِ باندل production واقعاً در
// مرورگر اجرا شود، نه در حین خودِ `vite build` (که صرفاً کد را
// transform/bundle می‌کند، اجرایش نمی‌کند) — پس این تغییر باعث شکستن
// build نمی‌شود. در dev رفتار قبلی (مسیر نسبی از طریق پروکسی Vite)
// کاملاً دست‌نخورده می‌ماند.
function resolveProductionApiOrigin(): string {
  const configured = (import.meta.env.VITE_API_URL || '').trim();

  if (!configured) {
    throw new Error(
      '[Azkala] پیکربندی ناقص: VITE_API_URL برای build production تنظیم ' +
      'نشده است. این برنامه دیگر در production به‌صورت خاموش به ' +
      'http://127.0.0.1:8000 برنمی‌گردد — این آدرس فقط برای dev محلی است. ' +
      'مقدار HTTPS واقعی بک‌اند production را قبل از build در VITE_API_URL ' +
      'تنظیم کنید (نمونه در frontend/.env.example).'
    );
  }

  if (!/^https:\/\//i.test(configured)) {
    throw new Error(
      `[Azkala] پیکربندی ناامن: VITE_API_URL باید با https:// شروع شود ` +
      `(مقدار فعلی: "${configured}"). اتصال production به آدرس HTTP مجاز ` +
      'نیست — هم ریسک امنیتی/mixed-content دارد و هم پیش‌نیاز الزامی ' +
      'Trusted Web Activity (Digital Asset Links فقط روی HTTPS معتبر است).'
    );
  }

  return configured;
}

const isDev = import.meta.env.DEV;
const rawApiUrl = isDev ? '' : resolveProductionApiOrigin();

export const API_ORIGIN = rawApiUrl
  .trim()
  .replace(/\/+$/, '') // trailing slashes
  .replace(/\/api\/v\d+$/i, '') // .../api/v1
  .replace(/\/api$/i, ''); // .../api

export const API_V1_URL = `${API_ORIGIN}/api/v1`;
export const STORAGE_URL = `${API_ORIGIN}/storage`;

// Dev-only diagnostic: makes it obvious that requests go through the Vite
// proxy (relative path) rather than straight to VITE_API_URL, since that's
// exactly the point that's caused confusion before.
if (import.meta.env.DEV) {
  console.info(
    `%c[apiConfig] dev mode: requests use relative path via Vite proxy -> API_V1_URL=${JSON.stringify(API_V1_URL)} (VITE_API_URL=${JSON.stringify(import.meta.env.VITE_API_URL)} is only used by vite.config.ts to pick the proxy target)`,
    'color: #8b5cf6; font-weight: bold;'
  );
}
