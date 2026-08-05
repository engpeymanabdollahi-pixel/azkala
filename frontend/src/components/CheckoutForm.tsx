import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutFormSchema, CheckoutFormData } from '@/schemas/orderSchema';
import { useOrder } from '@/hooks/useOrder';
import type { CreateOrderResult } from '@/services/api/order.service';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { MapPin, Phone, User, Home as HomeIcon, Hash, MessageSquare, CreditCard, Wallet, Package } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';

// داده‌های نمونه استان و شهر (می‌توانید این آرایه را کامل‌تر کنید یا از یک فایل JSON جداگانه ایمپورت کنید)
const IRAN_LOCATIONS = [
  { province: 'تهران', cities: ['تهران', 'شهریار', 'اسلامشهر', 'ری', 'پردیس'] },
  { province: 'اصفهان', cities: ['اصفهان', 'کاشان', 'نجف‌آباد', 'شاهین‌شهر'] },
  { province: 'فارس', cities: ['شیراز', 'مرودشت', 'جهرم', 'فسا'] },
  { province: 'خراسان رضوی', cities: ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه'] },
  { province: 'آذربایجان شرقی', cities: ['تبریز', 'مراغه', 'مرند', 'اهر'] },
  { province: 'اردبیل', cities: ['اردبیل', 'گرمی', 'مشگین‌شهر', 'پارس‌آباد'] },
  // ... سایر استان‌ها را اضافه کنید
];

interface CheckoutFormProps {
  onSuccess?: (orderData: CreateOrderResult) => void;
}

const inputClass =
  'w-full pr-10 pl-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all text-sm';

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { createOrder, isLoading } = useOrder();
  const { items, hasItems, getSubtotal, getTax, getShipping, getTotal } = useCartStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      payment_method: 'online',
    },
  });

  // نظارت بر تغییر استان
  const selectedProvince = watch('shipping_address.province');
  const paymentMethod = watch('payment_method');

  // وقتی استان تغییر کرد، مقدار شهر را خالی کن تا کاربر مجبور به انتخاب شهر جدید شود
  useEffect(() => {
    if (selectedProvince) {
      setValue('shipping_address.city', '');
    }
  }, [selectedProvince, setValue]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const result = await createOrder(data);
      toast.success('سفارش شما با موفقیت ثبت شد!');
      if (onSuccess && result) {
        onSuccess(result);
      }
    } catch {
      // خطا در useOrder مدیریت شده است
    }
  };

  // پیدا کردن شهرهای مرتبط با استان انتخاب‌شده
  const availableCities = IRAN_LOCATIONS.find((p) => p.province === selectedProvince)?.cities || [];

  // ✅ قبلاً هیچ گاردی برای سبد خالی نبود — کاربر می‌توانست کل فرم را پر
  // کند و فقط بعد از ارسال، خطای ۴۰۰ «سبد خرید شما خالی است» از بک‌اند
  // بگیرد. الان همینجا و زودتر به او گفته می‌شود.
  if (!hasItems()) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">سبد خرید شما خالی است</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          برای ثبت سفارش، ابتدا چند محصول به سبد خرید خود اضافه کنید.
        </p>
        <Button onClick={() => (window.location.href = '/products')}>مشاهده محصولات</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto" dir="rtl">
      <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-5">
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            اطلاعات ارسال
          </h2>

          {/* نام گیرنده */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام گیرنده</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                {...register('shipping_address.receiver_name')}
                className={inputClass}
                placeholder="مثال: علی محمدی"
              />
            </div>
            {errors.shipping_address?.receiver_name && (
              <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.shipping_address.receiver_name.message}</p>
            )}
          </div>

          {/* شماره موبایل */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شماره موبایل</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                {...register('shipping_address.phone')}
                className={inputClass}
                placeholder="09123456789"
                dir="ltr"
              />
            </div>
            {errors.shipping_address?.phone && (
              <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.shipping_address.phone.message}</p>
            )}
          </div>

          {/* استان و شهر */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">استان</label>
              <select
                {...register('shipping_address.province')}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all text-sm"
              >
                <option value="">انتخاب استان...</option>
                {IRAN_LOCATIONS.map((loc) => (
                  <option key={loc.province} value={loc.province}>
                    {loc.province}
                  </option>
                ))}
              </select>
              {errors.shipping_address?.province && (
                <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.shipping_address.province.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شهر</label>
              <select
                {...register('shipping_address.city')}
                disabled={!selectedProvince}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all text-sm disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-500"
              >
                <option value="">{selectedProvince ? 'انتخاب شهر...' : 'ابتدا استان را انتخاب کنید'}</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.shipping_address?.city && (
                <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.shipping_address.city.message}</p>
              )}
            </div>
          </div>

          {/* آدرس دقیق */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">آدرس دقیق</label>
            <div className="relative">
              <HomeIcon className="absolute right-3 top-3 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <textarea
                {...register('shipping_address.address')}
                rows={3}
                className={cn(inputClass, 'resize-none py-2.5')}
                placeholder="آدرس کامل پستی خود را وارد کنید..."
              />
            </div>
            {errors.shipping_address?.address && (
              <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.shipping_address.address.message}</p>
            )}
          </div>

          {/* کد پستی */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد پستی</label>
            <div className="relative">
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                {...register('shipping_address.postal_code')}
                className={inputClass}
                placeholder="1234567890"
                dir="ltr"
                maxLength={10}
              />
            </div>
            {errors.shipping_address?.postal_code && (
              <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.shipping_address.postal_code.message}</p>
            )}
          </div>

          {/* یادداشت */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">یادداشت (اختیاری)</label>
            <div className="relative">
              <MessageSquare className="absolute right-3 top-3 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <textarea
                {...register('shipping_address.notes')}
                rows={2}
                className={cn(inputClass, 'resize-none py-2.5')}
                placeholder="اگر توضیح خاصی برای ارسال دارید..."
              />
            </div>
          </div>
        </div>

        {/* روش پرداخت */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            روش پرداخت
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={cn(
                'flex items-center gap-2.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                paymentMethod === 'online'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-700'
              )}
            >
              <input type="radio" value="online" {...register('payment_method')} className="w-4 h-4 text-primary-600" />
              <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">پرداخت آنلاین</span>
            </label>
            <label
              className={cn(
                'flex items-center gap-2.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                paymentMethod === 'wallet'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-700'
              )}
            >
              <input type="radio" value="wallet" {...register('payment_method')} className="w-4 h-4 text-primary-600" />
              <Wallet className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">پرداخت از کیف پول</span>
            </label>
          </div>
          {errors.payment_method && (
            <p className="mt-2 text-xs text-error-600 dark:text-error-400">{errors.payment_method.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={isLoading} className="w-full font-bold">
          {isLoading ? 'در حال ثبت سفارش...' : 'ثبت سفارش'}
        </Button>
      </form>

      {/* ✅ خلاصه سفارش — قبلاً هیچ جایی در فرآیند چک‌اوت نبود؛ کاربر قبل از
          زدن «ثبت سفارش» هیچ مروری روی اقلام و مبلغ نهایی نمی‌دید. */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 sticky top-24 space-y-4">
          <h3 className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            خلاصه سفارش ({items.length} کالا)
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-900 flex-shrink-0">
                  <SafeImage
                    src={item.product?.main_image}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                    showEmojiOnError
                    fallbackEmoji="📦"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.product?.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.quantity} عدد</p>
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>جمع کالاها</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>هزینه ارسال</span>
              <span>{getShipping() > 0 ? formatPrice(getShipping()) : 'رایگان'}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>مالیات</span>
              <span>{formatPrice(getTax())}</span>
            </div>
            <div className="flex justify-between font-black text-base text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-100 dark:border-slate-700">
              <span>مبلغ نهایی</span>
              <span className="text-primary-600 dark:text-primary-400">{formatPrice(getTotal())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
