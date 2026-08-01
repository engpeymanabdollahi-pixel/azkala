import { Shield, CheckCircle, Clock, RefreshCw, Truck, Award } from 'lucide-react';

export function GuaranteePage() {
  const guarantees = [
    { icon: Shield, title: 'ضمانت اصالت کالا', desc: 'همه محصولات با گارانتی اصالت و کیفیت عرضه می‌شوند. در صورت مشاهده هرگونه مغایرت، کالا تعویض یا وجه بازگردانده می‌شود.' },
    { icon: RefreshCw, title: '۷ روز ضمانت بازگشت', desc: 'در صورت وجود نقص فنی یا مغایرت با مشخصات، تا ۷ روز پس از تحویل می‌توانید کالا را مرجوع کنید.' },
    { icon: Clock, title: 'گارانتی ۱۸ ماهه', desc: 'تمامی محصولات دارای گارانتی ۱۸ ماهه از نمایندگی‌های معتبر هستند.' },
    { icon: Truck, title: 'ارسال سریع و ایمن', desc: 'بسته‌بندی حرفه‌ای و ارسال با بیمه کامل.' },
  ];

  const returnSteps = [
    { step: 1, title: 'ثبت درخواست', desc: 'از طریق پنل کاربری یا تماس با پشتیبانی' },
    { step: 2, title: 'بررسی کارشناس', desc: 'ظرف ۲۴ ساعت وضعیت بررسی می‌شود' },
    { step: 3, title: 'ارسال کالا', desc: 'کالا را به آدرس مشخص شده ارسال کنید' },
    { step: 4, title: 'تعویض یا عودت وجه', desc: 'پس از تایید، کالا تعویض یا وجه بازگردانده می‌شود' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <Shield className="w-20 h-20 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 mb-3">گارانتی و اصالت کالا</h1>
          <p className="text-gray-600">خرید مطمئن با ضمانت ازکالا</p>
        </div>

        {/* تضمین‌ها */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {guarantees.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border">
                <Icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* مراحل بازگشت کالا */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            مراحل بازگشت کالا
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {returnSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-blue-600">{step.step}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* شرایط بازگشت */}
        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            شرایط بازگشت کالا
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• کالا باید در بسته‌بندی اصلی و بدون آسیب فیزیکی باشد</li>
            <li>• اعلام مشکل حداکثر تا ۷ روز پس از تحویل</li>
            <li>• داشتن فاکتور خرید</li>
            <li>• کالاهای مصرفی و شخصی (مانند هدفون، ایرباد) فقط در صورت نقص فنی قابل بازگشت هستند</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
export default GuaranteePage;
