import { FileText, Shield, Users, CreditCard, Truck, Eye } from 'lucide-react';

export function TermsPage() {
  const sections = [
    { icon: Users, title: 'ثبت‌نام و حساب کاربری', content: 'برای استفاده از خدمات ازکالا، ثبت‌نام و ایجاد حساب کاربری الزامی است. کاربر موظف به ارائه اطلاعات صحیح است.' },
    { icon: CreditCard, title: 'پرداخت و تسویه', content: 'پرداخت‌ها از طریق درگاه بانکی معتبر انجام می‌شود. در صورت لغو سفارش، وجه طی ۷۲ ساعت به حساب کاربر بازگردانده می‌شود.' },
    { icon: Truck, title: 'ارسال و تحویل', content: 'زمان تحویل سفارش به عوامل مختلفی بستگی دارد. ازکالا در قبال تأخیرهای ناشی از شرکت‌های پستی مسئولیتی ندارد.' },
    { icon: Shield, title: 'مسئولیت فروشندگان', content: 'محصولات توسط فروشندگان مستقل عرضه می‌شوند. ازکالا نقش واسطه دارد و مسئولیت کیفیت کالا بر عهده فروشنده است.' },
    { icon: Eye, title: 'حریم خصوصی', content: 'اطلاعات کاربری نزد ازکالا محفوظ است و به هیچ شخص ثالثی منتقل نمی‌شود.' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <FileText className="w-20 h-20 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 mb-3">قوانین و مقررات</h1>
          <p className="text-gray-600">لطفاً قبل از استفاده از خدمات ازکالا، این قوانین را مطالعه کنید</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <div key={i} className="p-6 border-b border-gray-100 last:border-0">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">{section.title}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
          <p className="text-sm text-gray-700">
            <strong>توجه:</strong> استفاده از خدمات ازکالا به معنای پذیرش تمامی قوانین و مقررات فوق است.
            ازکالا حق تغییر قوانین را بدون اطلاع قبلی محفوظ می‌دارد.
          </p>
        </div>
      </div>
    </div>
  );
}