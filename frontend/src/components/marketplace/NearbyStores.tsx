import { MapPin, Navigation, Store as StoreIcon, PackageCheck, Phone } from 'lucide-react';
import { useNearbyStores } from '@/hooks/useNearbyStores';
import { cn } from '@/utils/cn';

export interface NearbyStoresProps {
  productId: number;
  className?: string;
}

/**
 * «فروشگاه‌های نزدیک شما» — بخش جدید صفحه‌ی جزئیات محصول (Phase 17).
 *
 * ✅ بدون نقشه (Phase 20 صریحاً برای این فاز ممنوع کرده) — فقط لیست
 * فروشگاه‌ها مرتب‌شده بر اساس فاصله. ✅ هرگز یک بخش خالی/جعلی رندر
 * نمی‌شود — قبل از داشتن مکان یا وقتی هیچ فروشگاهی پیدا نشود، پیام‌های
 * حالت مشخص نشان داده می‌شوند، نه یک section خالی گمراه‌کننده.
 */
export function NearbyStores({ productId, className }: NearbyStoresProps) {
  const {
    status,
    coords,
    cities,
    requestBrowserLocation,
    selectCity,
    stores,
    meta,
    isLoading,
    isError,
  } = useNearbyStores(productId);

  // ✅ قبل از داشتن مکان: کل section فقط یک دعوت‌به‌عمل کوچک است — هیچ
  // درخواست خودکار geolocation در لود صفحه انجام نمی‌شود.
  if (!coords) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700',
          'rounded-xl p-4 font-sans',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <StoreIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">فروشگاه‌های نزدیک شما</h3>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          برای دیدن فروشگاه‌های فیزیکی نزدیک شما که این محصول را موجود دارند، مکان خود را مشخص کنید.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={requestBrowserLocation}
            disabled={status === 'requesting'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            <Navigation className="w-4 h-4" />
            {status === 'requesting' ? 'در حال دریافت موقعیت...' : 'استفاده از موقعیت من'}
          </button>

          <select
            defaultValue=""
            onChange={(e) => e.target.value && selectCity(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-200"
          >
            <option value="" disabled>
              یا انتخاب شهر...
            </option>
            {cities.map((city) => (
              <option key={city.key} value={city.key}>
                {city.label}
              </option>
            ))}
          </select>
        </div>

        {status === 'denied' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            دسترسی به موقعیت مکانی رد شد. می‌توانید شهر خود را از لیست بالا انتخاب کنید.
          </p>
        )}
        {status === 'unavailable' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند. لطفاً شهر خود را انتخاب کنید.
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            دریافت موقعیت با خطا مواجه شد. لطفاً دوباره تلاش کنید یا شهر خود را انتخاب کنید.
          </p>
        )}
      </div>
    );
  }

  // ✅ حالت لودینگ
  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 font-sans', className)}>
        <div className="flex items-center gap-2 mb-3">
          <StoreIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">فروشگاه‌های نزدیک شما</h3>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-14 bg-gray-100 dark:bg-slate-700 rounded-lg" />
          <div className="h-14 bg-gray-100 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    );
  }

  // ✅ خطای واقعی شبکه/سرور — نه فقط «صفر نتیجه»
  if (isError) {
    return (
      <div className={cn('bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 font-sans', className)}>
        <div className="flex items-center gap-2 mb-2">
          <StoreIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">فروشگاه‌های نزدیک شما</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">مشکلی در دریافت فروشگاه‌های نزدیک پیش آمد.</p>
      </div>
    );
  }

  // ✅ هیچ فروشگاهی این محصول را به‌صورت فیزیکی موجود ندارد — این یک
  // وضعیت طبیعی است (اکثر محصولات هنوز موجودی فیزیکی ثبت‌شده ندارند)، نه
  // خطا؛ ولی هرگز یک لیست ساختگی نشان داده نمی‌شود.
  if (stores.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 font-sans', className)}>
        <div className="flex items-center gap-2 mb-2">
          <StoreIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">فروشگاه‌های نزدیک شما</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          در حال حاضر هیچ فروشگاه فیزیکی نزدیک شما این محصول را موجود ندارد.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 font-sans', className)}>
      <div className="flex items-center gap-2 mb-3">
        <StoreIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="font-bold text-gray-900 dark:text-gray-100">
          فروشگاه‌های نزدیک شما {meta ? `(${meta.total})` : ''}
        </h3>
      </div>

      <ul className="space-y-2">
        {stores.map((store) => (
          <li
            key={store.id}
            className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{store.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{[store.city, store.address].filter(Boolean).join('، ') || 'آدرس ثبت نشده'}</span>
              </p>
              {store.phone && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  {store.phone}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs font-medium text-primary-700 dark:text-primary-400 whitespace-nowrap">
                {formatDistance(store.distance_meters)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-green-700 dark:text-green-400">
                <PackageCheck className="w-3.5 h-3.5" />
                موجود
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} متر`;
  return `${(meters / 1000).toFixed(1)} کیلومتر`;
}
