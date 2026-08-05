/**
 * تشخیص «فعال بودن» یک آیتم ناوبری بر اساس مسیر فعلی.
 *
 * ✅ این تابع قبلاً به‌طور مستقل و تکراری هم در index.tsx و هم در
 * MobileMenu.tsx نوشته شده بود (با همان باگ در هر دو نسخه): برای مسیرهایی
 * با کوئری‌استرینگ مثل «/products?discount=true» فقط بخش قبل از «?» مقایسه
 * می‌شد، پس هر آدرس /products/* — حتی بدون discount=true در URL — به اشتباه
 * «فعال» نشان داده می‌شد. چون دو پیاده‌سازی جدا بودند، فیکس در یکی به‌معنای
 * فراموش‌شدن دیگری بود؛ حالا یک نسخه‌ی مشترک، هر دو را تغذیه می‌کند.
 */
export function isPathActive(currentPath: string, currentSearch: string, path: string): boolean {
  if (path === '/') return currentPath === '/';

  const [pathPart, queryPart] = path.split('?');
  if (!currentPath.startsWith(pathPart)) return false;
  if (!queryPart) return true;

  const expectedParams = new URLSearchParams(queryPart);
  const actualParams = new URLSearchParams(currentSearch);
  return Array.from(expectedParams.entries()).every(
    ([key, value]) => actualParams.get(key) === value
  );
}
