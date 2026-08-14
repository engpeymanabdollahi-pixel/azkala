import { Lock, Database, Cookie, Share2, ShieldCheck, UserCog, Mail } from 'lucide-react';
import Seo from '@/components/Seo';
import { useSiteSettings } from '@/hooks/useSiteSettings';

/**
 * حریم خصوصی — قبلاً صفحه‌ی مستقلی وجود نداشت؛ لینک «حریم خصوصی» در فوتر و
 * در چک‌باکس ثبت‌نام فروشنده فقط به یک لنگر (#privacy) داخل صفحه‌ی قوانین
 * می‌رفت که شامل یک جمله‌ی کلی بود («اطلاعات کاربری نزد ازکالا محفوظ است»)
 * — نه یک سیاست حریم خصوصی واقعی که بگوید چه داده‌ای، چرا و چطور جمع‌آوری
 * می‌شود. محتوای این صفحه با رفتار واقعی سیستم هماهنگ است (نه ادعای
 * استفاده از سرویس‌هایی مثل Google Analytics که در کد پروژه پیاده‌سازی
 * نشده‌اند).
 *
 * قابل بازنویسی از تنظیمات ادمین (privacy_text) — اگر ادمین متن رسمی خودش
 * را وارد کند، به‌جای بخش‌های ساختاریافته‌ی پیش‌فرض نمایش داده می‌شود.
 */
export function PrivacyPage() {
  const { data: settings } = useSiteSettings();
  const overrideText = settings?.privacy_text?.trim();

  const sections = [
    {
      icon: Database,
      title: 'چه اطلاعاتی جمع‌آوری می‌شود',
      content: [
        'اطلاعات حساب کاربری: نام، شماره موبایل، ایمیل (در صورت ارائه) و رمز عبور رمزنگاری‌شده.',
        'اطلاعات سفارش: آدرس تحویل، اقلام خریداری‌شده، مبلغ و روش پرداخت.',
        'اطلاعات فروشندگان: علاوه بر موارد بالا، نام فروشگاه، اطلاعات تماس کسب‌وکار و مدارک احراز هویت ارسالی هنگام ثبت‌درخواست فروشندگی.',
        'محتوای تولیدشده توسط شما: پیام‌های چت با فروشنده/پشتیبانی، نظرات و امتیاز محصولات، تیکت‌های پشتیبانی.',
        'اطلاعات فنی محدود: آدرس IP و User-Agent مرورگر شما صرفاً در لاگ‌های امنیتی سرور برای جلوگیری از سوءاستفاده (مثل تلاش‌های ورود مشکوک) ثبت می‌شود؛ ازکالا از هیچ سرویس ردیابی یا تحلیل رفتار کاربر (مثل Google Analytics) استفاده نمی‌کند.',
      ],
    },
    {
      icon: Cookie,
      title: 'کوکی و ذخیره‌سازی محلی مرورگر',
      content: [
        'برای ورود و نگه‌داشتن نشست شما، یک کوکی امنیتی ضروری (CSRF/نشست) استفاده می‌شود که صرفاً برای شناسایی درخواست‌های معتبر شماست، نه ردیابی تبلیغاتی.',
        'برخی اطلاعات غیرحساس (مثل دستگاه انتخابی شما برای فیلتر کردن محصولات سازگار، یا حالت تیره/روشن) در حافظه‌ی محلی مرورگر (localStorage) شما ذخیره می‌شود و هیچ‌وقت به سرورهای شخص ثالث ارسال نمی‌شود.',
        'در حال حاضر هیچ کوکی تبلیغاتی یا ردیابی شخص ثالث (مثل Google Ads، Facebook Pixel) در ازکالا استفاده نمی‌شود.',
      ],
    },
    {
      icon: Share2,
      title: 'چه زمانی اطلاعات شما به اشتراک گذاشته می‌شود',
      content: [
        'با فروشنده‌ای که از او خرید می‌کنید: اطلاعات لازم برای پردازش و ارسال سفارش (نام، آدرس، شماره تماس).',
        'با شرکت پستی/باربری منتخب: اطلاعات لازم برای تحویل مرسوله.',
        'با درگاه پرداخت: در صورتی که پرداخت آنلاین توسط ادمین فعال شده باشد، مبلغ تراکنش به درگاه بانکی معتبر ارسال می‌شود؛ اطلاعات کارت بانکی شما هرگز روی سرورهای ازکالا ذخیره نمی‌شود.',
        'با مراجع قانونی: فقط در صورت الزام قانونی و با حکم مرجع ذی‌صلاح.',
        'ازکالا اطلاعات شما را به هیچ شخص ثالثی برای مقاصد تبلیغاتی نمی‌فروشد یا اجاره نمی‌دهد.',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'نگهداری و امنیت اطلاعات',
      content: [
        'رمز عبور شما به‌صورت یک‌طرفه (hash) ذخیره می‌شود و حتی کارکنان ازکالا هم امکان مشاهده‌ی آن را ندارند.',
        'اطلاعات حساب شما تا زمانی که حساب کاربری فعال است نگهداری می‌شود. سوابق سفارش طبق الزامات قانونی (از جمله مقررات مالیاتی) برای مدت لازم آرشیو می‌شود، حتی پس از حذف حساب.',
        'دسترسی به داده‌های کاربران در سیستم مدیریتی ازکالا محدود به کارکنان مجاز (ادمین) است.',
      ],
    },
    {
      icon: UserCog,
      title: 'حقوق شما نسبت به اطلاعاتتان',
      content: [
        'مشاهده و ویرایش اطلاعات پروفایل: از طریق «تنظیمات حساب کاربری» در هر زمان قابل انجام است.',
        'درخواست حذف حساب: از طریق تیکت پشتیبانی قابل درخواست است؛ توجه داشته باشید برخی سوابق تراکنش ممکن است طبق الزامات قانونی همچنان آرشیو بماند.',
        'اصلاح اطلاعات نادرست: از طریق پشتیبانی یا مستقیم در پروفایل کاربری.',
      ],
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-12">
      <Seo
        title="حریم خصوصی"
        description="سیاست حریم خصوصی ازکالا — این‌که چه اطلاعاتی جمع‌آوری، چطور نگهداری و در چه مواردی به اشتراک گذاشته می‌شود."
        canonical="/privacy"
      />
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <Lock className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-3">حریم خصوصی</h1>
          <p className="text-gray-600 dark:text-gray-400">
            آخرین به‌روزرسانی: {new Date().toLocaleDateString('fa-IR')}
          </p>
        </div>

        {overrideText ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{overrideText}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {sections.map((section, i) => {
              const Icon = section.icon;
              return (
                <div key={i} className="p-6 border-b border-gray-100 dark:border-slate-700 last:border-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{section.title}</h2>
                      <ul className="space-y-2">
                        {section.content.map((line, j) => (
                          <li key={j} className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex gap-2">
                            <span className="text-blue-400 dark:text-blue-500 flex-shrink-0">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
            <Mail className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>
              برای هرگونه سؤال درباره‌ی حریم خصوصی یا درخواست دسترسی/حذف اطلاعات، از{' '}
              <a href="/contact" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                صفحه‌ی تماس با ما
              </a>{' '}
              با پشتیبانی در ارتباط باشید.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
export default PrivacyPage;
