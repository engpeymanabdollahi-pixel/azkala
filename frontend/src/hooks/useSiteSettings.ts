// src/hooks/useSiteSettings.ts
import { useQuery } from '@tanstack/react-query';
import { siteSettingsService, type SiteSettings } from '@/services/api/siteSettings.service';

// ✅ قبلاً همین کوئری (queryKey: ['site-settings'] + apiClient.get('/site-settings')
// در try/catch) به‌طور جداگانه در Header/index.tsx و Footer/AboutSection.tsx
// و Footer/ContactInfo.tsx کپی شده بود — هر سه با queryKey یکسان (پس
// react-query کش را به‌اشتراک می‌گذاشت و درخواست شبکه‌ی تکراری نمی‌ساخت)،
// ولی هر بار settings با یک any ضمنی مصرف می‌شد. یک هوک مشترک با تایپ واقعی
// SiteSettings هم کد تکراری را حذف می‌کند هم این مغایرت را می‌بندد.
export function useSiteSettings() {
  return useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: () => siteSettingsService.getSiteSettings(),
    staleTime: 1000 * 60 * 30, // ۳۰ دقیقه کش (تنظیمات سایت به‌ندرت تغییر می‌کند)
  });
}
