import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ShoppingCart, Truck, CreditCard, RefreshCw, Shield } from 'lucide-react';

export function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: 'چگونه می‌توانم دستگاه خود را انتخاب کنم؟', a: 'در بالای صفحه روی دکمه «دستگاه خود را انتخاب کنید» کلیک کنید و نوع دستگاه (گوشی، تبلت یا لپ‌تاپ)، برند و مدل آن را انتخاب کنید. پس از انتخاب، فقط محصولات سازگار نمایش داده می‌شوند.' },
    { q: 'چگونه از سازگاری محصول مطمئن شوم؟', a: 'پس از انتخاب دستگاه، محصولاتی که با آن سازگار هستند دارای نشان «سازگار با دستگاه شما» هستند. همچنین در صفحه جزئیات محصول، وضعیت سازگاری نمایش داده می‌شود.' },
    { q: 'هزینه ارسال چقدر است؟', a: 'ارسال برای خریدهای بالای ۵۰۰,۰۰۰ تومان رایگان است. در غیر این صورت هزینه ارسال بر اساس روش انتخابی (پیشتاز ۳۵,۰۰۰ تومان، معمولی ۲۰,۰۰۰ تومان) محاسبه می‌شود.' },
    { q: 'چگونه سفارش خود را پیگیری کنم؟', a: 'وارد حساب کاربری خود شوید و به بخش «سفارشات من» بروید. با کلیک روی هر سفارش، جزئیات و وضعیت آن را مشاهده می‌کنید.' },
    { q: 'ضمانت بازگشت کالا چگونه است؟', a: 'در صورت مغایرت کالا با مشخصات یا وجود نقص فنی، تا ۷ روز پس از تحویل می‌توانید کالا را مرجوع کنید.' },
    { q: 'چگونه از تخفیف‌ها استفاده کنم؟', a: 'کد تخفیف را در صفحه تسویه حساب در بخش «کد تخفیف» وارد کنید. پس از اعمال، مبلغ تخفیف از کل سفارش کسر می‌شود.' },
  ];

  const topics = [
    { icon: ShoppingCart, title: 'نحوه ثبت سفارش', desc: 'مراحل خرید از ازکالا' },
    { icon: Truck, title: 'روش‌های ارسال', desc: 'مشاهده هزینه و زمان تحویل' },
    { icon: CreditCard, title: 'روش‌های پرداخت', desc: 'پرداخت آنلاین، کیف پول' },
    { icon: RefreshCw, title: 'مرجوعی کالا', desc: 'شرایط و ضمانت بازگشت' },
    { icon: Shield, title: 'گارانتی', desc: 'ضمانت اصالت کالا' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <HelpCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 mb-3">راهنمای استفاده از ازکالا</h1>
          <p className="text-gray-600">پاسخ سوالات خود را پیدا کنید</p>
        </div>

        {/* موضوعات راهنما */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {topics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm border hover:shadow-md cursor-pointer">
                <Icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-800">{topic.title}</p>
              </div>
            );
          })}
        </div>

        {/* سوالات متداول */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="bg-blue-600 text-white p-5">
            <h2 className="text-xl font-bold">سوالات متداول</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setOpenIndex(openIndex === idx ? null : idx)}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                  {openIndex === idx ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>
                {openIndex === idx && <p className="text-gray-600 text-sm mt-3 pt-3 border-t">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* پشتیبانی */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 text-center">
          <p className="text-gray-700 mb-3">هنوز سوالی دارید؟</p>
          <p className="text-gray-500 text-sm mb-4">کارشناسان ما آماده پاسخگویی هستند</p>
          <a href="/contact" className="inline-flex items-center gap-2 text-blue-600 font-bold">تماس با پشتیبانی →</a>
        </div>
      </div>
    </div>
  );
}
export default HelpPage;
