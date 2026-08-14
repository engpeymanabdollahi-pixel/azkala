import { Truck, Zap, Clock, AlertTriangle, PackageCheck } from 'lucide-react';
import Seo from '@/components/Seo';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { formatPrice, isSettingEnabled } from '@/utils/format';

/**
 * روش‌ها و هزینه‌ی ارسال — قبلاً چنین صفحه‌ای اصلاً وجود نداشت؛ اطلاعات
 * ارسال فقط به‌صورت پراکنده و گاهی ناهماهنگ در TermsPage/HelpPage/هدر
 * تکرار می‌شد (مثلاً هزینه‌ی پیش‌تاز در یک‌جا ۳۵,۰۰۰ و در جای دیگر رقم
 * دیگری بود). این صفحه به‌جای عدد هاردکد، مستقیم از همان تنظیمات واقعی
 * ارسال (shipping group در پنل ادمین) می‌خواند — یعنی وقتی ادمین هزینه‌ی
 * پستی را تغییر می‌دهد، این صفحه هم خودکار به‌روز می‌شود، نه اینکه دوباره
 * جایی هاردکد بماند.
 */
export function ShippingPage() {
  const { data: settings, isLoading } = useSiteSettings();

  const methods = [
    {
      key: 'post_pishtaz',
      title: 'پست پیشتاز',
      icon: Truck,
      enabled: isSettingEnabled(settings?.post_pishtaz_enabled),
      cost: settings?.post_pishtaz_cost,
      eta: '۲ تا ۴ روز کاری',
    },
    {
      key: 'tipax',
      title: 'تیپاکس',
      icon: PackageCheck,
      enabled: isSettingEnabled(settings?.tipax_enabled),
      cost: settings?.tipax_cost,
      eta: '۱ تا ۳ روز کاری (عمدتاً کلان‌شهرها)',
    },
    {
      key: 'express',
      title: 'ارسال فوری',
      icon: Zap,
      enabled: isSettingEnabled(settings?.express_delivery_enabled),
      cost: settings?.express_delivery_cost,
      eta: 'همان روز تا ۲۴ ساعت (فقط برخی مناطق)',
    },
  ].filter((m) => m.enabled);

  const freeShippingEnabled = isSettingEnabled(settings?.free_shipping_enabled);
  const freeShippingMin = settings?.free_shipping_min_amount ? Number(settings.free_shipping_min_amount) : null;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-12">
      <Seo
        title="روش‌ها و هزینه‌ی ارسال"
        description="روش‌های ارسال، هزینه و زمان تقریبی تحویل سفارش در ازکالا."
        canonical="/shipping"
      />
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <Truck className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-3">روش‌ها و هزینه‌ی ارسال</h1>
          <p className="text-gray-600 dark:text-gray-400">اطلاعات زیر بر اساس تنظیمات فعلی فروشگاه به‌روز نگه داشته می‌شود</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {freeShippingEnabled && freeShippingMin && (
              <div className="mb-6 bg-gradient-to-l from-success-50 to-white dark:from-success-900/20 dark:to-slate-800 border border-success-200 dark:border-success-800 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-success-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">ارسال رایگان</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    برای سفارش‌های بالای {formatPrice(freeShippingMin)}، هزینه‌ی ارسال رایگان است.
                  </p>
                </div>
              </div>
            )}

            {methods.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mb-8">
                {methods.map((method, i) => {
                  const Icon = method.icon;
                  return (
                    <div key={method.key} className={i > 0 ? 'border-t border-gray-100 dark:border-slate-700' : ''}>
                      <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100">{method.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            {method.eta}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-black text-gray-900 dark:text-gray-100">
                            {method.cost ? formatPrice(Number(method.cost)) : 'بر اساس سفارش'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center mb-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  در حال حاضر روش ارسال فعالی در تنظیمات ثبت نشده است. برای اطلاع از روش ارسال سفارش خود، هنگام تسویه‌حساب بررسی کنید یا با پشتیبانی تماس بگیرید.
                </p>
              </div>
            )}
          </>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            نکات مهم درباره‌ی ارسال
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• چون محصولات ازکالا توسط فروشندگان مستقل ارسال می‌شوند، زمان دقیق تحویل ممکن است بین سفارش‌های مختلف متفاوت باشد.</li>
            <li>• ازکالا برای تأخیرهای ناشی از شرکت‌های پستی/باربری (نه فروشنده) مسئولیت مستقیم نمی‌پذیرد، اما در پیگیری همراه شماست.</li>
            <li>• وضعیت سفارش را می‌توانید از بخش «سفارشات من» در پنل کاربری پیگیری کنید.</li>
            <li>• در صورت آسیب‌دیدگی مرسوله هنگام تحویل، پیش از باز کردن کامل بسته با پشتیبانی تماس بگیرید تا فرآیند بررسی/جایگزینی آغاز شود.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
export default ShippingPage;
