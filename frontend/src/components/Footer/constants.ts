import { Shield, Truck, CreditCard, RefreshCw } from 'lucide-react';
import type { TrustBadge, QuickLink, ServiceLink, TrustCertificate } from './types';

// ==================== Trust Badges (نوار اعتماد بالا) ====================

export const TRUST_BADGES: TrustBadge[] = [
  {
    icon: Shield,
    title: 'ضمانت اصالت',
    desc: 'تمام محصولات ۱۰۰٪ اصل',
    color: 'from-primary-500 to-primary-600',
  },
  {
    icon: Truck,
    title: 'ارسال سریع',
    desc: 'تحویل ۲۴ تا ۷۲ ساعته',
    color: 'from-accent-500 to-accent-600',
  },
  {
    icon: RefreshCw,
    title: 'بازگشت کالا',
    desc: '۷ روز ضمانت بازگشت',
    color: 'from-success-500 to-success-600',
  },
  {
    icon: CreditCard,
    title: 'پرداخت امن',
    desc: 'درگاه پرداخت معتبر',
    color: 'from-blue-500 to-blue-600',
  },
];

// ==================== Quick Links (دسترسی سریع) ====================

// ✅ آیتم «دسته‌بندی‌ها» قبلاً اینجا بود ولی به routeMap ای وصل بود که به
// یک مسیر /categories ناموجود اشاره می‌کرد (رجوع به کامنت routeMap در
// index.tsx). چون صفحه‌ی مستقلی برای «همه دسته‌بندی‌ها» در سایت نیست، به‌جای
// وصل کردنش به یک مقصد نادرست یا تکراری، حذف شد.
export const QUICK_LINKS: QuickLink[] = [
  { id: 'home', label: 'صفحه اصلی' },
  { id: 'products', label: 'همه محصولات' },
  { id: 'brands', label: 'برندها' },
  { id: 'orders', label: 'سفارشات من' },
  { id: 'wishlist', label: 'علاقه‌مندی‌ها' },
];

// ==================== Customer Service Links ====================

export const SERVICE_LINKS: ServiceLink[] = [
  { label: 'راهنمای خرید', path: '/help' },
  { label: 'شرایط بازگشت کالا', path: '/guarantee' },
  { label: 'سوالات متداول', path: '/help' },
  { label: 'تماس با پشتیبانی', path: '/contact' },
  { label: 'ثبت شکایات', path: '/contact' },
  { label: 'حریم خصوصی', path: '/terms' },
];

// ==================== Trust Certificates (نمادهای اعتماد) ====================

export const TRUST_CERTIFICATES: TrustCertificate[] = [
  {
    icon: Shield,
    label: 'نماد',
    title: 'اینماد',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Shield,
    label: 'نماد',
    title: 'ساماندهی',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: CreditCard,
    label: 'درگاه',
    title: 'زرین‌پال',
    color: 'from-purple-500 to-purple-600',
  },
];

// ✅ CONTACT_INFO، SOCIAL_LINKS و SUPPORT_HOURS قبلاً همین‌جا بودند، ولی هیچ
// مصرف‌کننده‌ای نداشتند و مدت‌ها بود از واقعیت عقب افتاده بودند:
// - ContactInfo.tsx از اول شکل‌داده‌ی محلی خودش را با مقادیر fallback متفاوت
//   (که حالا با AboutSection.tsx و ContactInfo.tsx از useSiteSettings واقعی
//   می‌آید) داشت، نه این آرایه.
// - SocialLinks.tsx واقعی فقط اینستاگرام/تلگرام/توییتر را (دقیقاً هماهنگ با
//   ستون‌های واقعی instagram_url/telegram_url/twitter_url در بک‌اند) و فقط
//   وقتی admin واقعاً URL تنظیم کرده باشد نشان می‌دهد؛ SOCIAL_LINKS اینجا حتی
//   یک آیتم واتساپ داشت که بک‌اند اصلاً چنین فیلدی ندارد.
// - SUPPORT_HOURS.time («۸ صبح تا ۸ شب») حتی با fallback واقعی «۹ تا ۱۸» در
//   ContactInfo.tsx تناقض داشت — دو مقدار متفاوت برای یک مفهوم، در دو جای
//   نزدیک به هم.
// نگه‌داشتن دو منبع داده‌ی موازی که هیچ‌کدام مطمئن نیستند کدام واقعاً رندر
// می‌شود، دقیقاً همان دامی است که این باگ‌ها را ساخت.

export const COPYRIGHT_YEAR = new Date().toLocaleDateString('fa-IR', {
  year: 'numeric',
}).replace(/[\d]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);