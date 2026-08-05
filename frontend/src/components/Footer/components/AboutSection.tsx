import { Smartphone } from 'lucide-react';
import { SocialLinks } from './SocialLinks';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function AboutSection() {
  // ✅ قبلاً همین کوئری اینجا و در Header/index.tsx و Footer/ContactInfo.tsx
  // به‌طور جداگانه کپی شده بود — هوک مشترک، هم کد تکراری را حذف می‌کند هم
  // یک تایپ واقعی (نه any ضمنی) به settings می‌دهد.
  const { data: settings } = useSiteSettings();

  // جداسازی هوشمند نام سایت برای نمایش دو بخشی (اختیاری ولی زیبا)
  const siteName = settings?.site_name || 'ازکالا';
  const nameParts = siteName.split(' ');

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-black text-primary-400">{nameParts[0]}</span>
            <span className="text-2xl font-black text-white">{nameParts[1] || ''}</span>
          </div>
          <p className="text-[10px] text-gray-500 font-medium">مارکت‌پلیس لوازم جانبی</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed mb-5">
        {settings?.about_text || 'اولین مارکت‌پلیس تخصصی لوازم جانبی موبایل با رویکرد Model-First. فقط محصولات سازگار با گوشی شما را نمایش می‌دهیم.'}
      </p>
      
      {/* ارسال تنظیمات به کامپوننت شبکه‌های اجتماعی */}
      <SocialLinks settings={settings} />
    </div>
  );
}