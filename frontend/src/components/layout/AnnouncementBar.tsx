import { useQuery } from '@tanstack/react-query';
import { Truck, ShieldCheck, Headphones, Sparkles } from 'lucide-react';
import { siteSettingsService } from '@/services/api/siteSettings.service';
import { AnimatedCounter } from '@/pages/HomePage/components/AnimatedCounter';
import { cn } from '@/utils/cn';
import { isSettingEnabled } from '@/utils/format';

/**
 * AnnouncementBar - نوار اطلاع‌رسانی بالای هدر
 * 
 * ✅ Dynamic: از site-settings می‌خواند
 * ✅ Admin-managed: از پنل ادمین قابل ویرایش
 * ✅ Design System: از tokens ازکالا استفاده می‌کند
 */
export function AnnouncementBar() {
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: siteSettingsService.getSiteSettings,
    staleTime: 5 * 60 * 1000,
  });

  if (!settings || !isSettingEnabled(settings.announcement_enabled)) return null;

  const text =
    settings?.announcement_text ||
    'ارسال رایگان بالای ۵۰۰ هزار تومان | ضمانت اصالت کالا | پشتیبانی ۷ روز هفته';
  const link = settings?.announcement_link || '';
  const bgColor = settings?.announcement_bg_color || 'gradient';
  const showLiveUsers = isSettingEnabled(settings.announcement_show_live_users);

  // Parse متن (با | جدا شده)
  const segments = text
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  // Icon mapping برای هر segment
  const getIcon = (segment: string) => {
    if (segment.includes('ارسال'))
      return <Truck className="w-3.5 h-3.5 text-accent-400" />;
    if (segment.includes('ضمانت') || segment.includes('اصالت'))
      return <ShieldCheck className="w-3.5 h-3.5 text-success-400" />;
    if (segment.includes('پشتیبانی'))
      return <Headphones className="w-3.5 h-3.5 text-primary-400" />;
    return <Sparkles className="w-3.5 h-3.5 text-accent-400" />;
  };

  // Background class بر اساس تنظیمات
  const bgClass =
    {
      gradient:
        'bg-gradient-to-r from-primary-900 via-primary-800 to-accent-900',
      primary: 'bg-primary-900',
      dark: 'bg-slate-900',
      success: 'bg-success-700',
    }[bgColor as string] ||
    'bg-gradient-to-r from-primary-900 via-primary-800 to-accent-900';

  // اگر link دارد، wrapper را <a> می‌کنیم
  const Wrapper = link ? 'a' : 'div';
  const wrapperProps = link
    ? {
        href: link,
        target: link.startsWith('http') ? '_blank' : undefined,
        rel: 'noopener noreferrer',
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'text-white overflow-hidden block',
        bgClass,
        link && 'hover:opacity-95 transition-opacity cursor-pointer'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-10 text-xs md:text-sm">
          {/* ✅ Marquee یکپارچه برای Mobile و Desktop */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-6 md:gap-10 animate-marquee whitespace-nowrap w-max">
              {[...segments, ...segments].map((segment, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {getIcon(segment)}
                  <span className="font-medium">{segment}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Users Badge */}
          {showLiveUsers && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 flex-shrink-0">
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
              <span className="font-semibold text-xs">
                <AnimatedCounter value={150} /> کاربر در حال مشاهده
              </span>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}