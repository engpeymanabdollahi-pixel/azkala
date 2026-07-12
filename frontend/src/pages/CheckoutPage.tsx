import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle, CreditCard, MapPin, Package, ArrowLeft, Truck,
  Wallet, Percent, Shield, Gift, Tag, ChevronLeft, Sparkles,
  Home, Building2, Star, Phone as PhoneIcon, User as UserIcon,
} from 'lucide-react';
import { useCartStore, useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { orderService } from '@/services/api/order.service';
import { addressService, type Address } from '@/services/api/address.service';
import { couponService, type Coupon } from '@/services/api/coupon.service';


type Step = 'address' | 'shipping' | 'payment' | 'review';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [step, setStep] = useState<Step>('address');
  const [isOrdering, setIsOrdering] = useState(false);

  // ✅ دریافت آدرس‌های کاربر از API
  const { data: addressesData } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: addressService.getAddresses,
    enabled: isAuthenticated,
  });

  const addresses = addressesData?.data || [];
  const defaultAddress = addresses.find(a => a.is_default);

  // ✅ State برای انتخاب آدرس
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // فرم آدرس
  const [address, setAddress] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    province: 'تهران',
    city: 'تهران',
    address: '',
    postal_code: '',
  });

  // ✅ پر کردن فرم با آدرس پیش‌فرض در اولین بار
  useEffect(() => {
    if (defaultAddress && !address.address && !selectedAddressId) {
      setAddress({
        full_name: defaultAddress.full_name,
        phone: defaultAddress.phone,
        province: defaultAddress.province,
        city: defaultAddress.city,
        address: defaultAddress.address,
        postal_code: defaultAddress.postal_code || '',
      });
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress]);

  // ✅ انتخاب آدرس از لیست
  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setAddress({
      full_name: addr.full_name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      address: addr.address,
      postal_code: addr.postal_code || '',
    });
  };

  // ✅ پاک کردن انتخاب آدرس (برای وارد کردن دستی)
  const handleClearAddressSelection = () => {
    setSelectedAddressId(null);
    setAddress({
      full_name: user?.name || '',
      phone: user?.phone || '',
      province: 'تهران',
      city: 'تهران',
      address: '',
      postal_code: '',
    });
  };

  // روش ارسال
  const [shippingMethod, setShippingMethod] = useState<'express' | 'normal' | 'free'>('express');
  const shippingCosts = { express: 35000, normal: 20000, free: 0 };
  const shipping = shippingCosts[shippingMethod];

  // روش پرداخت
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'wallet'>('online');

  // کوپن تخفیف
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState<Coupon | null>(null);
  const [realDiscount, setRealDiscount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // محاسبات مالی
  const subtotal = getSubtotal();
const discount = realDiscount; // 🆕 استفاده از تخفیف واقعی
const total = Math.max(0, subtotal + shipping - discount); // جلوگیری از منفی شدن

  // اعتبارسنجی فرم آدرس
  const isAddressValid = () => {
    if (!address.full_name.trim()) { toast.error('نام و نام خانوادگی الزامی است'); return false; }
    if (!address.phone.trim()) { toast.error('شماره موبایل الزامی است'); return false; }
    if (!/^09[0-9]{9}$/.test(address.phone)) { toast.error('شماره موبایل نامعتبر است'); return false; }
    if (!address.address.trim()) { toast.error('آدرس الزامی است'); return false; }
    if (!address.postal_code.trim()) { toast.error('کد پستی الزامی است'); return false; }
    return true;
  };

  // اعمال کوپن (mock)
 const handleApplyCoupon = async () => {
  if (!couponCode.trim()) {
    toast.error('لطفاً کد تخفیف را وارد کنید');
    return;
  }

  setIsValidatingCoupon(true);
  try {
    const response = await couponService.validate(couponCode);

    if (response.success && response.data) {
      setValidatedCoupon(response.data.coupon);
      setRealDiscount(response.data.discount_amount);
      setCouponApplied(true);
      toast.success(response.data.message, { icon: '🎉' });
    } else {
      setValidatedCoupon(null);
      setRealDiscount(0);
      setCouponApplied(false);
      toast.error(response.message || 'کد تخفیف نامعتبر است');
    }
  } catch (error: any) {
    setValidatedCoupon(null);
    setRealDiscount(0);
    setCouponApplied(false);
    const message = error.response?.data?.message || 'خطا در اعتبارسنجی کد تخفیف';
    toast.error(message);
  } finally {
    setIsValidatingCoupon(false);
  }
};

  // ثبت نهایی سفارش
  const handleOrder = async () => {
  if (!isAddressValid()) return;

  setIsOrdering(true);
  try {
    const orderData = {
      shipping_address: {
        full_name: address.full_name,
        phone: address.phone,
        province: address.province,
        city: address.city,
        address: address.address,
        postal_code: address.postal_code,
      },
      payment_method: paymentMethod,
      coupon_code: validatedCoupon ? validatedCoupon.code : null, // 🆕 ارسال کد واقعی
      notes: couponApplied ? `کد تخفیف: ${validatedCoupon?.code}` : '',
    };

    const response = await orderService.createOrder(orderData);

    if (response.success) {
      const successData = {
        order_number: response.data.order_number,
        total: response.data.order.total,
        discount: realDiscount,
        items_count: items.reduce((sum, item) => sum + item.quantity, 0),
        payment_method: paymentMethod,
        shipping_address: {
          full_name: address.full_name,
          phone: address.phone,
          city: address.city,
          address: address.address,
        },
        created_at: response.data.order.created_at,
      };

      localStorage.setItem('last_order_success', JSON.stringify(successData));
      await clearCart();

      toast.success('سفارش با موفقیت ثبت شد!', { icon: '✅' });
      navigate('/order-success', { state: successData, replace: true });
    } else {
      throw new Error('خطا در ثبت سفارش');
    }
  } catch (error: any) {
    console.error('❌ خطا در ثبت سفارش:', error);

    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'اطلاعات نامعتبر است';
      toast.error(message);
    } else if (error.response?.status === 401) {
      toast.error('لطفاً ابتدا وارد حساب کاربری شوید');
      navigate('/auth');
    } else if (error.response?.status === 422) {
      const errors = error.response.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : 'اطلاعات نامعتبر است');
      } else {
        toast.error('اطلاعات وارد شده نامعتبر است');
      }
    } else {
      toast.error('خطا در ثبت سفارش. لطفاً دوباره تلاش کنید');
    }
  } finally {
    setIsOrdering(false);
  }
};

  // بررسی احراز هویت
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">برای ادامه وارد شوید</h2>
          <p className="text-gray-500 mb-6">لطفاً وارد حساب کاربری خود شوید تا بتوانید سفارش خود را تکمیل کنید</p>
          <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
            ورود به حساب
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>
    );
  }

  // سبد خرید خالی
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">سبد خرید خالی است</h2>
          <p className="text-gray-500 mb-6">قبل از تکمیل سفارش، محصولات مورد نظر خود را به سبد خرید اضافه کنید</p>
          <Button onClick={() => navigate('/products')} size="lg" className="w-full">
            مشاهده محصولات
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>
    );
  }

  const steps: { id: Step; label: string; icon: JSX.Element; color: string }[] = [
    { id: 'address', label: 'آدرس', icon: <MapPin className="w-5 h-5" />, color: 'from-primary-500 to-primary-600' },
    { id: 'shipping', label: 'ارسال', icon: <Truck className="w-5 h-5" />, color: 'from-accent-500 to-accent-600' },
    { id: 'payment', label: 'پرداخت', icon: <CreditCard className="w-5 h-5" />, color: 'from-success-500 to-success-600' },
    { id: 'review', label: 'بررسی', icon: <CheckCircle className="w-5 h-5" />, color: 'from-warning-500 to-warning-600' },
  ];
  const stepOrder: Step[] = ['address', 'shipping', 'payment', 'review'];
  const currentStepIdx = stepOrder.indexOf(step);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            تکمیل سفارش
          </h1>
          <p className="text-gray-500">لطفاً مراحل زیر را برای تکمیل خرید خود طی کنید</p>
        </div>

        {/* نوار مراحل */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => { if (currentStepIdx >= idx) setStep(s.id); }}
                  className="flex flex-col items-center gap-2 group"
                  disabled={currentStepIdx < idx}
                >
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all shadow-lg',
                    currentStepIdx > idx
                      ? `bg-gradient-to-br ${s.color} text-white shadow-lg`
                      : currentStepIdx === idx
                        ? `bg-gradient-to-br ${s.color} text-white shadow-xl scale-110`
                        : 'bg-gray-200 text-gray-400'
                  )}>
                    {currentStepIdx > idx ? <CheckCircle className="w-6 h-6" /> : s.icon}
                  </div>
                  <span className={cn(
                    'text-sm font-semibold transition-colors',
                    currentStepIdx === idx ? 'text-gray-900' :
                    currentStepIdx > idx ? 'text-gray-700' : 'text-gray-400'
                  )}>
                    {s.label}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    'w-16 sm:w-24 h-1 mx-3 rounded-full transition-all',
                    currentStepIdx > idx ? 'bg-gradient-to-r from-success-500 to-success-600' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* بخش فرم */}
          <div className="lg:col-span-2">
            {/* مرحله آدرس */}
            {step === 'address' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg animate-fade-in">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  آدرس تحویل سفارش
                </h2>

                {/* ✅ بخش جدید: انتخاب از آدرس‌های ذخیره شده */}
                {addresses.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                        آدرس‌های ذخیره شده شما
                      </h3>
                      {selectedAddressId && (
                        <button
                          onClick={handleClearAddressSelection}
                          className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          وارد کردن آدرس جدید
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => handleSelectAddress(addr)}
                          className={cn(
                            'text-right p-3 rounded-xl border-2 transition-all group',
                            selectedAddressId === addr.id
                              ? 'border-primary-500 bg-gradient-to-l from-primary-50 to-white shadow-md'
                              : 'border-gray-200 hover:border-primary-300 hover:shadow-sm bg-white'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                              selectedAddressId === addr.id
                                ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                                : 'bg-gray-100 group-hover:bg-primary-100'
                            )}>
                              {addr.title.toLowerCase().includes('خانه') ? (
                                <Home className={cn('w-4 h-4', selectedAddressId === addr.id ? 'text-white' : 'text-gray-600')} />
                              ) : addr.title.toLowerCase().includes('کار') ? (
                                <Building2 className={cn('w-4 h-4', selectedAddressId === addr.id ? 'text-white' : 'text-gray-600')} />
                              ) : (
                                <MapPin className={cn('w-4 h-4', selectedAddressId === addr.id ? 'text-white' : 'text-gray-600')} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-gray-900 text-xs">{addr.title}</span>
                                {addr.is_default && (
                                  <Badge variant="primary" size="sm">پیش‌فرض</Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">
                                {addr.address}، {addr.city}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                                <span className="flex items-center gap-0.5">
                                  <UserIcon className="w-2.5 h-2.5" />
                                  {addr.full_name}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5" dir="ltr">
                                  <PhoneIcon className="w-2.5 h-2.5" />
                                  {addr.phone}
                                </span>
                              </div>
                            </div>
                            {selectedAddressId === addr.id && (
                              <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        برای ویرایش جزئیات، می‌توانید فیلدهای زیر را تغییر دهید
                      </p>
                    </div>
                  </div>
                )}

                {/* فرم آدرس */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="نام و نام خانوادگی"
                    value={address.full_name}
                    onChange={(e) => setAddress(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                  <Input
                    label="شماره موبایل"
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                  <Input
                    label="استان"
                    value={address.province}
                    onChange={(e) => setAddress(prev => ({ ...prev, province: e.target.value }))}
                    required
                  />
                  <Input
                    label="شهر"
                    value={address.city}
                    onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="آدرس کامل"
                      value={address.address}
                      onChange={(e) => setAddress(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>
                  <Input
                    label="کد پستی"
                    value={address.postal_code}
                    onChange={(e) => setAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                    required
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => { if (isAddressValid()) setStep('shipping'); }}
                    size="lg"
                  >
                    ادامه - انتخاب روش ارسال
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* مرحله ارسال */}
            {step === 'shipping' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg animate-fade-in">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  انتخاب روش ارسال
                </h2>
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'express', label: 'ارسال پستی پیشتاز', price: 35000, days: '۲ تا ۳ روز کاری', icon: '🚚', desc: 'سریع‌ترین روش ارسال', gradient: 'from-primary-500 to-primary-600' },
                    { id: 'normal', label: 'ارسال پستی معمولی', price: 20000, days: '۵ تا ۷ روز کاری', icon: '📦', desc: 'روش اقتصادی', gradient: 'from-accent-500 to-accent-600' },
                    { id: 'free', label: 'ارسال رایگان', price: 0, days: '۷ تا ۱۰ روز کاری', condition: 'برای خریدهای بالای ۵۰۰,۰۰۰ تومان', icon: '🎁', desc: 'هدیه ازکالا به شما', gradient: 'from-success-500 to-success-600' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        'flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 group',
                        shippingMethod === method.id
                          ? 'border-primary-500 bg-gradient-to-l from-primary-50 to-white shadow-lg shadow-primary-500/10'
                          : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                      )}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={method.id}
                        checked={shippingMethod === method.id}
                        onChange={() => setShippingMethod(method.id as typeof shippingMethod)}
                        className="sr-only"
                      />
                      <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-all',
                        shippingMethod === method.id
                          ? `bg-gradient-to-br ${method.gradient} shadow-lg scale-110`
                          : 'bg-gray-100 group-hover:scale-105'
                      )}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg mb-1">{method.label}</p>
                        <p className="text-sm text-gray-500 mb-1">{method.desc}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-success-500 rounded-full"></span>
                          {method.days}
                        </p>
                        {method.condition && (
                          <p className="text-xs text-success-600 font-semibold mt-1 flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            {method.condition}
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <span className={cn(
                          'text-xl font-black',
                          method.price === 0 ? 'text-success-600' : 'text-gray-900'
                        )}>
                          {method.price === 0 ? 'رایگان' : formatPrice(method.price)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex gap-3 justify-between">
                  <Button variant="secondary" onClick={() => setStep('address')} size="lg">
                    <ChevronLeft className="w-5 h-5 ml-2 rotate-180" />
                    برگشت
                  </Button>
                  <Button onClick={() => setStep('payment')} size="lg">
                    ادامه - انتخاب پرداخت
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* مرحله پرداخت */}
            {step === 'payment' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg animate-fade-in">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-lg shadow-success-500/30">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  انتخاب روش پرداخت
                </h2>
                <div className="flex flex-col gap-3 mb-6">
                  {[
                    { id: 'online', label: 'پرداخت آنلاین', desc: 'پرداخت امن از طریق درگاه بانکی', icon: '💳', gradient: 'from-primary-500 to-primary-600' },
                    { id: 'wallet', label: 'کیف پول ازکالا', desc: 'موجودی: ۰ تومان', icon: '💰', gradient: 'from-accent-500 to-accent-600' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        'flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 group',
                        paymentMethod === method.id
                          ? 'border-success-500 bg-gradient-to-l from-success-50 to-white shadow-lg shadow-success-500/10'
                          : 'border-gray-200 hover:border-success-300 hover:shadow-md'
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id as 'online' | 'wallet')}
                        className="sr-only"
                      />
                      <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-all',
                        paymentMethod === method.id
                          ? `bg-gradient-to-br ${method.gradient} shadow-lg scale-110`
                          : 'bg-gray-100 group-hover:scale-105'
                      )}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg mb-1">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                      {paymentMethod === method.id && (
                        <CheckCircle className="w-6 h-6 text-success-500" />
                      )}
                    </label>
                  ))}
                </div>

                {/* بخش کوپن تخفیف */}
                {/* بخش کوپن تخفیف */}
<div className="border-t border-gray-100 pt-6 mt-6">
  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
    <Tag className="w-5 h-5 text-accent-500" />
    کد تخفیف
  </h3>
  <div className="flex gap-2">
    <Input
      placeholder="کد تخفیف را وارد کنید"
      value={couponCode}
      onChange={(e) => {
        setCouponCode(e.target.value.toUpperCase());
        if (couponApplied) {
          setCouponApplied(false);
          setRealDiscount(0);
          setValidatedCoupon(null);
        }
      }}
      disabled={couponApplied}
      leftIcon={<Percent className="w-5 h-5" />}
    />
    <Button
      variant="outline"
      onClick={handleApplyCoupon}
      disabled={couponApplied || isValidatingCoupon || !couponCode.trim()}
      size="lg"
      isLoading={isValidatingCoupon}
    >
      {couponApplied ? <CheckCircle className="w-5 h-5 ml-2" /> : <Sparkles className="w-5 h-5 ml-2" />}
      {couponApplied ? 'اعمال شد' : isValidatingCoupon ? 'در حال بررسی...' : 'اعمال'}
    </Button>
  </div>
  
  {couponApplied && validatedCoupon && (
    <div className="mt-3 bg-success-50 border border-success-200 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle className="w-5 h-5 text-success-600" />
        <p className="text-sm text-success-700 font-semibold">
          {validatedCoupon.description || `کد ${validatedCoupon.code} اعمال شد`}
        </p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-600">
          {validatedCoupon.type === 'percentage' 
            ? `${validatedCoupon.value}٪ تخفیف${validatedCoupon.max_discount ? ` (حداکثر ${formatPrice(validatedCoupon.max_discount)})` : ''}`
            : `${formatPrice(validatedCoupon.value)} تخفیف ثابت`
          }
        </p>
        <button
          onClick={() => {
            setCouponApplied(false);
            setCouponCode('');
            setRealDiscount(0);
            setValidatedCoupon(null);
          }}
          className="text-xs text-error-600 hover:text-error-700 font-semibold"
        >
          حذف
        </button>
      </div>
      <p className="text-xs text-success-700 font-black mt-2">
        مبلغ تخفیف: {formatPrice(realDiscount)} تومان
      </p>
    </div>
  )}
</div>

                <div className="mt-6 flex gap-3 justify-between">
                  <Button variant="secondary" onClick={() => setStep('shipping')} size="lg">
                    <ChevronLeft className="w-5 h-5 ml-2 rotate-180" />
                    برگشت
                  </Button>
                  <Button onClick={() => setStep('review')} size="lg">
                    بررسی نهایی سفارش
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* مرحله بررسی نهایی */}
            {step === 'review' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg animate-fade-in">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-lg shadow-warning-500/30">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  بررسی نهایی سفارش
                </h2>

                {/* لیست محصولات */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-500" />
                    محصولات سفارش ({items.length} کالا)
                  </h3>
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gradient-to-l from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-primary-200 transition-all">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          {item.product.main_image ? (
                            <img src={item.product.main_image} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 line-clamp-1 mb-1">{item.product.name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              تعداد: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-gray-900 text-lg">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* خلاصه هزینه‌ها */}
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 border border-primary-100 mb-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary-600" />
                    خلاصه هزینه‌ها
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">جمع کالاها</span>
                      <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">هزینه ارسال</span>
                      <span className="font-bold text-gray-900">{formatPrice(shipping)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Gift className="w-4 h-4 text-success-500" />
                          تخفیف
                        </span>
                        <span className="font-bold text-success-600">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-xl pt-4 border-t-2 border-primary-200">
                      <span className="text-gray-900">مبلغ قابل پرداخت</span>
                      <span className="text-primary-700">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* اطلاعات ارسال */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent-500" />
                    آدرس تحویل
                  </h3>
                  <p className="text-sm text-gray-700 mb-1 font-semibold">{address.full_name}</p>
                  <p className="text-sm text-gray-600 mb-1">{address.phone}</p>
                  <p className="text-sm text-gray-600">
                    {address.province}، {address.city}، {address.address}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">کد پستی: {address.postal_code}</p>
                </div>

                <div className="flex gap-3 justify-between">
                  <Button variant="secondary" onClick={() => setStep('payment')} size="lg">
                    <ChevronLeft className="w-5 h-5 ml-2 rotate-180" />
                    برگشت
                  </Button>
                  <Button
                    isLoading={isOrdering}
                    onClick={handleOrder}
                    className="flex-1"
                    size="lg"
                  >
                    <Wallet className="w-5 h-5 ml-2" />
                    پرداخت و ثبت نهایی سفارش
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* سایدبار خلاصه سفارش */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg sticky top-24">
              <h3 className="font-black text-gray-900 mb-5 flex items-center gap-3 text-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Package className="w-5 h-5 text-white" />
                </div>
                خلاصه سفارش
              </h3>

              <div className="flex flex-col gap-3 mb-5 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm gap-2">
                    <span className="text-gray-600 line-clamp-1 flex-1">{item.product.name}</span>
                    <span className="text-gray-900 font-bold whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">جمع کالاها</span>
                  <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ارسال</span>
                  <span className="font-bold text-gray-900">{formatPrice(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-success-500" />
                      تخفیف
                    </span>
                    <span className="font-bold text-success-600">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xl pt-3 border-t-2 border-primary-200">
                  <span className="text-gray-900">جمع کل</span>
                  <span className="text-primary-700">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Shield className="w-4 h-4 text-success-500" />
                  <span>پرداخت امن و مطمئن</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Truck className="w-4 h-4 text-primary-500" />
                  <span>ارسال سریع به سراسر ایران</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-4 h-4 text-accent-500" />
                  <span>ضمانت اصالت کالا</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-5"
                onClick={() => navigate('/')}
              >
                <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                بازگشت به صفحه اصلی
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}