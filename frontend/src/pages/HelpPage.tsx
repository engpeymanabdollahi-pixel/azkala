import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ShoppingCart, Truck, CreditCard, RefreshCw, Shield, Store, UserCog } from 'lucide-react';

export function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // ✅ سوالات فروشنده و حساب کاربری قبلاً در این صفحه اصلاً نبودند — فقط
  // خرید/پرداخت/ارسال/مرجوعی پوشش داده می‌شد، با این‌که ازکالا مارکت‌پلیس
  // است و بخش فروشندگی جدا و مهمی دارد.
  const faqs = [
    { q: 'چگونه می‌توانم دستگاه خود را انتخاب کنم؟', a: 'در بالای صفحه روی دکمه «دستگاه خود را انتخاب کنید» کلیک کنید و نوع دستگاه (گوشی، تبلت یا لپ‌تاپ)، برند و مدل آن را انتخاب کنید. پس از انتخاب، فقط محصولات سازگار نمایش داده می‌شوند.' },
    { q: 'چگونه از سازگاری محصول مطمئن شوم؟', a: 'پس از انتخاب دستگاه، محصولاتی که با آن سازگار هستند دارای نشان «سازگار با دستگاه شما» هستند. همچنین در صفحه جزئیات محصول، وضعیت سازگاری نمایش داده می‌شود.' },
    { q: 'هزینه و روش‌های ارسال چیست؟', a: 'روش‌ها و هزینه‌ی به‌روز ارسال (بر اساس تنظیمات فعلی فروشگاه) در صفحه‌ی «روش‌ها و هزینه‌ی ارسال» موجود است.' },
    { q: 'چگونه سفارش خود را پیگیری کنم؟', a: 'وارد حساب کاربری خود شوید و به بخش «سفارشات من» بروید. با کلیک روی هر سفارش، جزئیات و وضعیت آن را مشاهده می‌کنید.' },
    { q: 'ضمانت بازگشت کالا چگونه است؟', a: 'در صورت مغایرت کالا با مشخصات یا وجود نقص فنی، تا ۷ روز پس از تحویل می‌توانید کالا را مرجوع کنید. جزئیات کامل در «گارانتی و بازگشت کالا» آمده است.' },
    { q: 'چگونه از تخفیف‌ها استفاده کنم؟', a: 'کد تخفیف را در صفحه تسویه حساب در بخش «کد تخفیف» وارد کنید. پس از اعمال، مبلغ تخفیف از کل سفارش کسر می‌شود.' },
    { q: 'چطور در ازکالا فروشنده شوم؟', a: 'از صفحه‌ی «درخواست فروشندگی» فرم ثبت‌نام را تکمیل کنید. پس از تأیید ازکالا، می‌توانید محصولات خود را در پنل فروشنده اضافه کنید. شرایط کامل فروشندگی (کمیسیون، تسویه، تعهدات) در «شرایط و ضوابط فروشندگان» آمده است.' },
    { q: 'کمیسیون فروش ازکالا چقدر است؟', a: 'نرخ پیش‌فرض کمیسیون ۵٪ از مبلغ هر سفارش موفق است؛ برخی فروشگاه‌ها ممکن است نرخ اختصاصی داشته باشند که در پنل فروشنده (بخش تسویه‌حساب) قابل مشاهده است.' },
    { q: 'چطور رمز عبور یا اطلاعات حساب کاربری‌ام را تغییر دهم؟', a: 'از بخش «تنظیمات حساب» در پنل کاربری می‌توانید اطلاعات پروفایل، رمز عبور و آدرس‌های خود را مدیریت کنید.' },
    { q: 'اگر با فروشنده یا سفارشم مشکل داشته باشم چه کنم؟', a: 'ابتدا از طریق چت داخل صفحه‌ی سفارش با فروشنده در ارتباط باشید. اگر مشکل حل نشد، از بخش «تیکت پشتیبانی» در پنل کاربری یا صفحه‌ی «تماس با ما» شکایت خود را ثبت کنید.' },
  ];

  const topics = [
    { icon: ShoppingCart, title: 'نحوه ثبت سفارش', desc: 'مراحل خرید از ازکالا' },
    { icon: Truck, title: 'روش‌های ارسال', desc: 'مشاهده هزینه و زمان تحویل' },
    { icon: CreditCard, title: 'روش‌های پرداخت', desc: 'پرداخت آنلاین، کیف پول' },
    { icon: RefreshCw, title: 'مرجوعی کالا', desc: 'شرایط و ضمانت بازگشت' },
    { icon: Shield, title: 'گارانتی', desc: 'ضمانت اصالت کالا' },
    { icon: Store, title: 'فروشندگی', desc: 'ثبت‌نام و کمیسیون فروش' },
    { icon: UserCog, title: 'حساب کاربری', desc: 'مدیریت پروفایل و امنیت' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <HelpCircle className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-3">راهنمای استفاده از ازکالا</h1>
          <p className="text-gray-600 dark:text-gray-400">پاسخ سوالات خود را پیدا کنید</p>
        </div>

        {/* موضوعات راهنما */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {topics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md cursor-pointer">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{topic.title}</p>
              </div>
            );
          })}
        </div>

        {/* سوالات متداول */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-blue-600 text-white p-5">
            <h2 className="text-xl font-bold">سوالات متداول</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setOpenIndex(openIndex === idx ? null : idx)}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{faq.q}</h3>
                  {openIndex === idx ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                </div>
                {openIndex === idx && <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* پشتیبانی */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-3">هنوز سوالی دارید؟</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">کارشناسان ما آماده پاسخگویی هستند</p>
          <a href="/contact" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">تماس با پشتیبانی →</a>
        </div>
      </div>
    </div>
  );
}
export default HelpPage;
