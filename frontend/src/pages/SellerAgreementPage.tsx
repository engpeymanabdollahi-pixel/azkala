import {
  Store, IdCard, PackageSearch, Percent, Wallet, RotateCcw,
  ShieldOff, Copyright, Ban, AlertOctagon, HeartHandshake,
} from 'lucide-react';
import Seo from '@/components/Seo';
import { useSiteSettings } from '@/hooks/useSiteSettings';

/**
 * شرایط و ضوابط فروشندگان — قبلاً هیچ سند مستقلی برای این موضوع وجود
 * نداشت، با این‌که چک‌باکس ثبت‌نام فروشنده (SellerRequestPage.tsx) از
 * متقاضی می‌خواست «قوانین و مقررات ازکالا» را بپذیرد؛ آن لینک به TermsPage
 * عمومیِ خریداران می‌رفت که هیچ تعهدی درباره‌ی کمیسیون، تسویه، کالای
 * ممنوعه یا نقض مالکیت فکری نداشت — یعنی فروشنده به‌چیزی متعهد می‌شد که
 * صفحه‌اش اصلاً وجود نداشت.
 *
 * نرخ کمیسیون (۵٪) واقعی و مستقیم از رفتار فعلی بک‌اند گرفته شده
 * (OrderService::processCommission → config('azkala.default_commission_rate', 5.00)،
 * قابل‌بازنویسی به‌ازای هر فروشنده با seller_commission_rate) — نه یک عدد
 * فرضی.
 *
 * قابل بازنویسی از تنظیمات ادمین (seller_terms_text).
 */
export function SellerAgreementPage() {
  const { data: settings } = useSiteSettings();
  const overrideText = settings?.seller_terms_text?.trim();

  const sections = [
    {
      icon: IdCard,
      title: '۱. ثبت‌نام و احراز هویت',
      content:
        'برای فعالیت به‌عنوان فروشنده، تکمیل «درخواست فروشندگی» و ارائه‌ی اطلاعات صحیح کسب‌وکار (نام فروشگاه، اطلاعات تماس، مدارک درخواستی) الزامی است. تأیید نهایی درخواست با ازکالا است. ارائه‌ی اطلاعات نادرست یا جعلی می‌تواند به رد درخواست یا مسدودسازی حساب فروشنده منجر شود.',
    },
    {
      icon: PackageSearch,
      title: '۲. صحت اطلاعات محصول، قیمت و موجودی',
      content:
        'فروشنده مسئول درج دقیق نام، توضیحات، تصاویر واقعی، قیمت و موجودی هر محصول است. کالا باید دقیقاً مطابق آنچه در آگهی درج شده تحویل داده شود. به‌روزرسانی موجودی برعهده‌ی فروشنده است تا از فروش کالای ناموجود جلوگیری شود.',
    },
    {
      icon: Store,
      title: '۳. ارسال و کیفیت خدمات',
      content:
        'فروشنده موظف است سفارش را در بازه‌ی زمانی معقول (متناسب با روش ارسال انتخابی خریدار) بسته‌بندی و تحویل شرکت حمل دهد. تأخیر مکرر یا کیفیت پایین بسته‌بندی می‌تواند مبنای اخطار یا تعلیق حساب فروشنده باشد.',
    },
    {
      icon: RotateCcw,
      title: '۴. بازگشت کالا و رسیدگی به شکایات',
      content:
        'فروشنده موظف به رعایت «شرایط بازگشت کالا» (صفحه‌ی گارانتی) و پاسخ‌گویی به‌موقع به درخواست‌های بازگشت/تعویض ثبت‌شده از طریق پلتفرم است. در صورت تأیید درخواست بازگشت، مبلغ متناظر طبق سیاست بازگشت وجه به خریدار بازگردانده می‌شود.',
    },
    {
      icon: Percent,
      title: '۵. کمیسیون فروش',
      content:
        'ازکالا بابت هر سفارش موفق (پرداخت‌شده و غیرلغوشده)، کمیسیونی با نرخ پیش‌فرض ۵٪ از مبلغ سفارش کسر می‌کند، مگر اینکه نرخ اختصاصی دیگری برای فروشگاه شما در پنل ادمین تنظیم شده باشد. نرخ کمیسیون در پنل فروشنده (بخش تسویه‌حساب) قابل مشاهده است.',
    },
    {
      icon: Wallet,
      title: '۶. تسویه‌حساب',
      content:
        'مبلغ خالص فروش (پس از کسر کمیسیون) طبق چرخه‌ی تسویه‌ی ازکالا به کیف‌پول فروشنده واریز و از طریق پنل فروشنده (بخش «تسویه‌حساب») قابل پیگیری و برداشت است. جزئیات هر تراکنش تسویه (مبلغ سفارش، کمیسیون کسرشده، مبلغ خالص) در همان بخش ثبت می‌شود.',
    },
    {
      icon: Ban,
      title: '۷. کالاهای ممنوعه و محدودیت‌های فروش',
      content:
        'فروش کالای قاچاق، تقلبی، فاقد مجوز قانونی لازم (در صورت نیاز به مجوز خاص طبق قوانین کشور، مانند برخی تجهیزات ارتباطی یا پزشکی)، یا هرگونه کالای ممنوعه طبق قوانین جمهوری اسلامی ایران، به‌شدت ممنوع است. فروشنده موظف است پیش از عرضه‌ی هر کالا از قانونی و مجاز بودن آن اطمینان حاصل کند؛ مسئولیت حقوقی نقض این بند مستقیماً بر عهده‌ی فروشنده است.',
    },
    {
      icon: Copyright,
      title: '۸. مالکیت فکری',
      content:
        'فروشنده متعهد است فقط از تصاویر و توضیحات واقعی و متعلق به خود (یا مجاز به استفاده) بارگذاری کند و از استفاده‌ی غیرمجاز از برند، لوگو یا محتوای سایر اشخاص (از جمله سازندگان اصلی گوشی/برند) بدون مجوز خودداری کند. عرضه‌ی کالای تقلبی (Fake/Replica) به‌جای اصل، تخلف محسوب و منجر به حذف محصول و احتمالاً تعلیق حساب می‌شود.',
    },
    {
      icon: ShieldOff,
      title: '۹. تعلیق و لغو همکاری',
      content:
        'ازکالا در صورت نقض مکرر این شرایط، شکایات مستند خریداران، یا فعالیت مشکوک، حق تعلیق موقت یا لغو دائم دسترسی فروشنده به پلتفرم را برای خود محفوظ می‌دارد. در صورت تعلیق، تسویه‌ی مبالغ معوق طبق بررسی موارد باز (سفارش‌های در حال بازگشت/شکایت) انجام می‌شود.',
    },
    {
      icon: AlertOctagon,
      title: '۱۰. تخلف و گزارش کاربران',
      content:
        'خریداران می‌توانند از طریق پنل کاربری یا تیکت پشتیبانی، فروشنده یا سفارش خاصی را گزارش کنند. ازکالا موارد گزارش‌شده را بررسی و در صورت لزوم با فروشنده در تماس خواهد بود.',
    },
    {
      icon: HeartHandshake,
      title: '۱۱. همکاری با ازکالا',
      content:
        'فروشنده موظف به پاسخ‌گویی به‌موقع به پیام‌های خریداران (از طریق چت داخل پلتفرم) و درخواست‌های ازکالا برای رفع مشکلات سفارش است. این شرایط علاوه بر «قوانین و مقررات» عمومی ازکالا اعمال می‌شود؛ در صورت تعارض، شرایط اختصاصی این صفحه برای فعالیت فروشندگی حاکم است.',
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-12">
      <Seo
        title="شرایط و ضوابط فروشندگان"
        description="شرایط، تعهدات و کمیسیون فروش برای فروشندگان مارکت‌پلیس ازکالا."
        canonical="/seller-agreement"
      />
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <Store className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-3">شرایط و ضوابط فروشندگان</h1>
          <p className="text-gray-600 dark:text-gray-400">
            این صفحه مکمل «قوانین و مقررات» عمومی است و مخصوص کاربرانی است که به‌عنوان فروشنده در ازکالا فعالیت می‌کنند
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
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
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{section.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>توجه:</strong> ثبت درخواست فروشندگی در ازکالا به معنای پذیرش این شرایط، علاوه بر{' '}
            <a href="/terms" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              قوانین و مقررات عمومی
            </a>{' '}
            سایت است.
          </p>
        </div>
      </div>
    </div>
  );
}
export default SellerAgreementPage;
