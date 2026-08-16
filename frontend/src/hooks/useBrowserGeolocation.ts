import { useCallback, useState } from 'react';

/**
 * دسترسی مرورگر به موقعیت مکانی — استخراج‌شده از الگوی از قبل تست‌شده‌ی
 * useNearbyStores.ts، تا navigator.geolocation در دو جای مختلف پروژه
 * (جستجوی «فروشگاه‌های نزدیک» و «ذخیره موقعیت با یک آدرس») تکرار نشود.
 *
 * ✅ هرگز خودکار درخواست نمی‌دهد — فقط با فراخوانی صریح requestLocation()
 * (که باید از یک کلیک واقعی کاربر بیاید) آغاز می‌شود.
 *
 * ⚠️ عمداً useNearbyStores.ts را refactor نکرده تا رفتار از‌قبل‌تست‌شده‌ی
 * آن هوک دست‌نخورده بماند — این فایل فقط برای مصرف‌کننده‌ی جدید
 * (AddressesSection) است.
 */

export type BrowserGeolocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export function useBrowserGeolocation() {
  const [status, setStatus] = useState<BrowserGeolocationStatus>('idle');
  const [coords, setCoords] = useState<GeoCoords | null>(null);

  // ✅ عمداً { coords, status } را در نتیجه‌ی خودِ Promise برمی‌گرداند، نه
  // فقط coords — چون خواندن state هوک (geolocation.status) بلافاصله بعد
  // از await در closure کامپوننت مصرف‌کننده می‌تواند stale باشد (رندر بعدی
  // هنوز اتفاق نیفتاده). این‌طوری caller همیشه نتیجه‌ی واقعی همین
  // فراخوانی را دارد، نه یک state قدیمی.
  const requestLocation = useCallback((): Promise<{ coords: GeoCoords | null; status: BrowserGeolocationStatus }> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setStatus('unavailable');
        resolve({ coords: null, status: 'unavailable' });
        return;
      }

      setStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next: GeoCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCoords(next);
          setStatus('granted');
          resolve({ coords: next, status: 'granted' });
        },
        (error) => {
          // ✅ PERMISSION_DENIED جدا از بقیه (POSITION_UNAVAILABLE/TIMEOUT)
          // چون پیام درست به کاربر باید متفاوت باشد.
          const nextStatus: BrowserGeolocationStatus = error.code === error.PERMISSION_DENIED ? 'denied' : 'error';
          setStatus(nextStatus);
          resolve({ coords: null, status: nextStatus });
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setCoords(null);
  }, []);

  return { status, coords, requestLocation, reset };
}
