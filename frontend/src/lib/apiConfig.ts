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
// آنجا VITE_API_URL باید صریحاً ست شود، وگرنه به آدرس پیش‌فرض برمی‌گردیم.
const isDev = import.meta.env.DEV;
const rawApiUrl = isDev ? '' : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000');

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
