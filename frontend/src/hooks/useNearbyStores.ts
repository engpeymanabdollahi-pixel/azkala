import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nearbyStoreService } from '@/services/api/nearbyStore.service';
import { IRAN_MAJOR_CITIES } from '@/constants/iranCities';

/**
 * مکان‌یابی برای «فروشگاه‌های نزدیک شما» — Phase 13 (Location Fallback).
 *
 * ✅ هرگز به‌تنهایی به GPS متکی نیست و هرگز به‌صورت خودکار در لود صفحه
 * درخواست مکان مرورگر نمی‌دهد (باید با یک کلیک کاربر آغاز شود). دو مسیر
 * مستقل برای گرفتن مختصات وجود دارد:
 *   ۱. موقعیت مرورگر (navigator.geolocation) — با اکشن صریح کاربر.
 *   ۲. انتخاب دستی شهر از یک لیست ثابت (بدون هیچ سرویس نقشه/geocoding
 *      خارجی — رجوع به کامنت constants/iranCities.ts).
 * آدرس‌های ذخیره‌شده‌ی کاربر (addresses) عمداً به‌عنوان یک منبع مکان اینجا
 * استفاده نشده‌اند: جدول addresses هیچ ستون latitude/longitude ای ندارد
 * (فقط province/city/address متنی — رجوع به migration)، و افزودن یک
 * سرویس geocoding برای تبدیل متن به مختصات دقیقاً همان «سرویس نقشه‌ی
 * خارجی» است که Phase 20 صریحاً برای این فاز ممنوع کرده.
 */

export type NearbyStoreLocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';

interface Coords {
  lat: number;
  lng: number;
}

// ✅ گرد کردن به ۳ رقم اعشار (≈۱۱۰ متر) — دقیقاً هم‌راستا با کلید کش
// سمت بک‌اند (NearbyStoreService) — تا لرزش/jitter طبیعی GPS بین چند
// خواندن پشت‌سرهم، یک queryKey جدید و یک درخواست شبکه‌ی تکراری نسازد.
const round = (value: number) => Math.round(value * 1000) / 1000;

export function useNearbyStores(productId: number | undefined) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<NearbyStoreLocationStatus>('idle');
  const [selectedCityKey, setSelectedCityKey] = useState<string | null>(null);

  const requestBrowserLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }

    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSelectedCityKey(null);
        setStatus('granted');
      },
      (error) => {
        // ✅ PERMISSION_DENIED / POSITION_UNAVAILABLE / TIMEOUT — هر سه با
        // یک وضعیت خطای قابل‌فهم مدیریت می‌شوند، نه یک کرش بی‌صدا.
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const selectCity = useCallback((cityKey: string) => {
    const city = IRAN_MAJOR_CITIES.find((c) => c.key === cityKey);
    if (!city) return;

    setCoords({ lat: city.latitude, lng: city.longitude });
    setSelectedCityKey(cityKey);
    setStatus('granted');
  }, []);

  const clearLocation = useCallback(() => {
    setCoords(null);
    setSelectedCityKey(null);
    setStatus('idle');
  }, []);

  const roundedLat = coords ? round(coords.lat) : null;
  const roundedLng = coords ? round(coords.lng) : null;

  const query = useQuery({
    queryKey: ['nearby-stores', productId, roundedLat, roundedLng],
    queryFn: () =>
      nearbyStoreService.search({
        productId: productId as number,
        lat: coords!.lat,
        lng: coords!.lng,
      }),
    enabled: !!productId && !!coords,
    staleTime: 60 * 1000, // ✅ هم‌راستا با TTL کش سمت بک‌اند
    retry: 1,
  });

  return {
    // Location state
    status,
    coords,
    selectedCityKey,
    cities: IRAN_MAJOR_CITIES,
    requestBrowserLocation,
    selectCity,
    clearLocation,

    // Search result
    stores: query.data?.stores ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
