import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, Store as StoreIcon, PackageCheck, Phone, Clock, ChevronDown, BookMarked, ChevronLeft } from 'lucide-react';
import { useNearbyStores } from '@/hooks/useNearbyStores';
import { useAuthStore } from '@/store/authStore';
import { addressService } from '@/services/api/address.service';
import { cn } from '@/utils/cn';
import type { NearbyStore } from '@/types/models';

// ✅ همان ترتیب/برچسب day_of_week سمت بک‌اند (Store::hours) و همان
// چیزی که SellerStores.tsx برای همین منظور استفاده می‌کند — ۰=یکشنبه.
const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

function formatHourTime(time?: string | null): string {
  // ✅ ستون‌های TIME بک‌اند به شکل "09:00:00" برمی‌گردند؛ فقط ساعت:دقیقه لازم است.
  if (!time) return '';
  return time.slice(0, 5);
}

/**
 * ساعات کاری فروشگاه — کامپکت و پیش‌فرض بسته: خلاصه‌ی «امروز» همیشه
 * دیده می‌شود، جزئیات کامل هفته فقط با کلیک باز می‌شود (بدون مودال).
 */
function StoreHoursSummary({ hours }: { hours: NearbyStore['hours'] }) {
  const [expanded, setExpanded] = useState(false);

  if (!hours || hours.length === 0) return null;

  const todayIndex = new Date().getDay(); // ✅ JS: ۰=یکشنبه...۶=شنبه — دقیقاً همان قرارداد day_of_week
  const today = hours.find((h) => h.day_of_week === todayIndex);
  const todayLabel = today
    ? today.is_closed
      ? 'امروز تعطیل'
      : `امروز: ${formatHourTime(today.opens_at)} تا ${formatHourTime(today.closes_at)}`
    : 'ساعات کاری';

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <Clock className="w-3 h-3 flex-shrink-0" />
        {todayLabel}
        <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <ul className="mt-1 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400 pr-4">
          {hours.map((h) => (
            <li
              key={h.day_of_week}
              className={cn(h.day_of_week === todayIndex && 'font-bold text-gray-700 dark:text-gray-200')}
            >
              {WEEKDAYS[h.day_of_week]}: {h.is_closed ? 'تعطیل' : `${formatHourTime(h.opens_at)} تا ${formatHourTime(h.closes_at)}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * انتخاب یکی از آدرس‌های ذخیره‌شده‌ی کاربر (با مختصات) به‌عنوان منبع
 * مکان — Nearby Stores Completion Phase.
 *
 * ✅ فقط با کلیک کاربر روی «آدرس‌های ذخیره‌شده» بارگذاری می‌شود (lazy
 * enabled)، هرگز همراه با خودِ صفحه‌ی محصول. ✅ فقط عنوان آدرس («خانه»/
 * «محل کار») نشان داده می‌شود، هرگز مختصات خام. ✅ آدرس‌های بدون مختصات
 * اصلاً در لیست انتخاب ظاهر نمی‌شوند.
 */
function SavedAddressPicker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['nearby-stores-saved-addresses'],
    queryFn: addressService.getAddresses,
    staleTime: 60 * 1000,
  });

  const usableAddresses = (data?.data ?? []).filter(
    (a) => a.latitude != null && a.longitude != null
  );

  if (isLoading) {
    return <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">در حال بارگذاری آدرس‌ها...</p>;
  }

  if (usableAddresses.length === 0) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
        این آدرس موقعیت مکانی ذخیره‌شده ندارد. از بخش «آدرس‌های من» می‌توانید موقعیت یکی از آدرس‌هایتان را ثبت کنید.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {usableAddresses.map((address) => (
        <button
          key={address.id}
          type="button"
          onClick={() => onSelect(address.latitude as number, address.longitude as number)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-gray-700 dark:text-gray-200 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
        >
          {address.title}
        </button>
      ))}
    </div>
  );
}

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
    selectCoordinates,
    stores,
    meta,
    isLoading,
    isError,
  } = useNearbyStores(productId);

  const { isAuthenticated } = useAuthStore();
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);

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

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowSavedAddresses((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                showSavedAddresses
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400'
                  : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:border-primary-400'
              )}
            >
              <BookMarked className="w-4 h-4" />
              استفاده از آدرس ذخیره‌شده
            </button>
          )}

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

        {showSavedAddresses && isAuthenticated && (
          <SavedAddressPicker onSelect={(lat, lng) => selectCoordinates(lat, lng)} />
        )}

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
              <StoreHoursSummary hours={store.hours} />
              {/* ✅ فاز ۴.۱: لینک به صفحه‌ی عمومی فروشنده — فقط وقتی
                  seller_slug واقعاً پر است (فروشنده هنوز فعال است).
                  اگر فروشنده حذف/غیرفعال شده، هیچ لینکی رندر نمی‌شود
                  (fallback غیرقابل‌کلیک، بدون لینک شکسته به ۴۰۴). */}
              {store.seller_slug && (
                <Link
                  to={`/seller/${store.seller_slug}`}
                  className="inline-flex items-center gap-0.5 mt-1 text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  مشاهده فروشگاه
                  <ChevronLeft className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs font-medium text-primary-700 dark:text-primary-400 whitespace-nowrap">
                {formatDistance(store.distance_meters)}
              </span>
              {/* ✅ فاز ۴.۲: تعداد واقعی موجودی به‌جای برچسب عمومی «موجود» —
                  store.stock از قبل در پاسخ بک‌اند بود ولی اینجا خوانده
                  نمی‌شد. */}
              <span className="inline-flex items-center gap-1 text-[11px] text-green-700 dark:text-green-400 whitespace-nowrap">
                <PackageCheck className="w-3.5 h-3.5" />
                موجودی: {store.stock.toLocaleString('fa-IR')} عدد
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
