import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutFormSchema, CheckoutFormData } from '@/schemas/orderSchema';
import { useOrder } from '@/hooks/useOrder';
import { toast } from 'react-hot-toast';

interface CheckoutFormProps {
  onSuccess?: (orderData: any) => void;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { createOrder, isLoading } = useOrder();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      payment_method: 'online',
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const result = await createOrder(data);
      toast.success('سفارش شما با موفقیت ثبت شد!');
      
      if (onSuccess && result) {
        onSuccess(result);
      }
    } catch (error) {
      // خطا در useOrder مدیریت شده است
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">اطلاعات ارسال</h2>

      {/* نام گیرنده */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">نام گیرنده</label>
        <input
          {...register('shipping_address.receiver_name')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="مثال: علی محمدی"
        />
        {errors.shipping_address?.receiver_name && (
          <p className="mt-1 text-sm text-red-600">{errors.shipping_address.receiver_name.message}</p>
        )}
      </div>

      {/* شماره موبایل */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">شماره موبایل</label>
        <input
          {...register('shipping_address.phone')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="09123456789"
          dir="ltr"
        />
        {errors.shipping_address?.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.shipping_address.phone.message}</p>
        )}
      </div>

      {/* استان و شهر */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">استان</label>
          <input
            {...register('shipping_address.province')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="مثال: تهران"
          />
          {errors.shipping_address?.province && (
            <p className="mt-1 text-sm text-red-600">{errors.shipping_address.province.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">شهر</label>
          <input
            {...register('shipping_address.city')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="مثال: تهران"
          />
          {errors.shipping_address?.city && (
            <p className="mt-1 text-sm text-red-600">{errors.shipping_address.city.message}</p>
          )}
        </div>
      </div>

      {/* آدرس دقیق */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">آدرس دقیق</label>
        <textarea
          {...register('shipping_address.address')}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="آدرس کامل پستی خود را وارد کنید..."
        />
        {errors.shipping_address?.address && (
          <p className="mt-1 text-sm text-red-600">{errors.shipping_address.address.message}</p>
        )}
      </div>

      {/* کد پستی */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">کد پستی</label>
        <input
          {...register('shipping_address.postal_code')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="1234567890"
          dir="ltr"
          maxLength={10}
        />
        {errors.shipping_address?.postal_code && (
          <p className="mt-1 text-sm text-red-600">{errors.shipping_address.postal_code.message}</p>
        )}
      </div>

      {/* یادداشت */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت (اختیاری)</label>
        <textarea
          {...register('shipping_address.notes')}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="اگر توضیح خاصی برای ارسال دارید..."
        />
        {errors.shipping_address?.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.shipping_address.notes.message}</p>
        )}
      </div>

      {/* روش پرداخت */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">روش پرداخت</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="radio" value="online" {...register('payment_method')} className="w-4 h-4 text-blue-600" />
            <span className="mr-2 text-gray-700">پرداخت آنلاین</span>
          </label>
          <label className="flex items-center">
            <input type="radio" value="wallet" {...register('payment_method')} className="w-4 h-4 text-blue-600" />
            <span className="mr-2 text-gray-700">پرداخت از کیف پول</span>
          </label>
        </div>
        {errors.payment_method && (
          <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
        )}
      </div>

      {/* دکمه ثبت سفارش */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'در حال ثبت سفارش...' : 'ثبت سفارش'}
      </button>
    </form>
  );
}