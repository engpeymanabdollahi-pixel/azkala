import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, Package, Truck, Download, ShoppingBag,
  Copy, Home, FileText, PartyPopper, Clock, MapPin,
  DollarSign, ChevronLeft, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

// ✅ تغییر: full_name به receiver_name برای هماهنگی با بک‌اند
interface OrderSuccessData {
  order_number: string;
  total: number;
  items_count?: number; // اختیاری کردیم تا اگر بک‌اند نفرستاد، خطا ندهد
  payment_method?: string;
  shipping_address?: {
    receiver_name: string;
    phone: string;
    city: string;
    address: string;
  };
  created_at?: string;
}

export function OrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData, setOrderData] = useState<OrderSuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stateData = location.state as OrderSuccessData | undefined;
    const storedData = localStorage.getItem('last_order_success');

    if (stateData) {
      setOrderData(stateData);
      localStorage.setItem('last_order_success', JSON.stringify(stateData));
    } else if (storedData) {
      try {
        setOrderData(JSON.parse(storedData));
      } catch {
        navigate('/orders');
      }
    } else {
      navigate('/orders');
    }
  }, [location.state, navigate]);

  const handleCopyOrderNumber = () => {
    if (orderData?.order_number) {
      navigator.clipboard.writeText(orderData.order_number);
      setCopied(true);
      toast.success('شماره سفارش کپی شد', { icon: '📋' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadInvoice = () => {
    toast.success('فاکتور در حال دانلود...', { icon: '📥' });
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-success-50/30 via-white to-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Success Icon */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-success-500 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-success-500/30 animate-bounce-once">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-warning-400 to-warning-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <PartyPopper className="w-5 h-5 text-white" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-4 mb-2">
            سفارش شما با موفقیت ثبت شد! 🎉
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            از خرید شما متشکریم. سفارش شما در حال پردازش است.
          </p>
        </div>

        {/* Order Number Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-success-200 p-5 mb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">شماره سفارش</p>
                <p className="font-black text-gray-900 text-sm">{orderData.order_number}</p>
              </div>
            </div>
            <button
              onClick={handleCopyOrderNumber}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                copied
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700'
              )}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  کپی شد
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  کپی
                </>
              )}
            </button>
          </div>

          <div className="bg-gradient-to-l from-success-50 to-primary-50 border border-success-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Sparkles className="w-4 h-4 text-warning-500 flex-shrink-0" />
              <p className="leading-relaxed">
                شماره سفارش را یادداشت کنید. برای پیگیری سفارش به این شماره نیاز دارید.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h3 className="font-black text-gray-900 text-base mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            خلاصه سفارش
          </h3>

          <div className="space-y-2.5">
            {orderData.items_count && (
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="w-4 h-4 text-gray-400" />
                  تعداد کالاها
                </span>
                <span className="font-bold text-gray-900 text-sm">
                  {orderData.items_count} عدد
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4 text-gray-400" />
                مبلغ کل
              </span>
              <span className="font-black text-primary-700 text-base">
                {formatPrice(orderData.total)}
              </span>
            </div>

            {orderData.created_at && (
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  تاریخ ثبت
                </span>
                <span className="font-semibold text-gray-900 text-sm">
                  {new Date(orderData.created_at).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            {orderData.payment_method && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4 text-gray-400" />
                  روش پرداخت
                </span>
                <Badge variant="primary" size="sm">
                  {orderData.payment_method === 'online' ? 'آنلاین' :
                   orderData.payment_method === 'card_to_card' ? 'کارت به کارت' : 'کیف پول'}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        {orderData.shipping_address && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h3 className="font-black text-gray-900 text-base mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent-600" />
              آدرس تحویل
            </h3>

            <div className="bg-gradient-to-l from-accent-50 to-white border border-accent-200 rounded-xl p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-700 font-black text-sm">
                      {orderData.shipping_address.receiver_name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500">گیرنده</p>
                    <p className="font-bold text-gray-900 text-xs truncate">
                      {orderData.shipping_address.receiver_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-success-700 text-xs">📞</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500">تماس</p>
                    <p className="font-bold text-gray-900 text-xs" dir="ltr">
                      {orderData.shipping_address.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:col-span-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-primary-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-500">آدرس</p>
                    <p className="font-semibold text-gray-900 text-xs leading-relaxed">
                      {orderData.shipping_address.address}، {orderData.shipping_address.city}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-gradient-to-l from-primary-50 to-white border border-primary-100 rounded-2xl p-5 mb-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary-600" />
            مراحل پردازش سفارش
          </h3>

          <div className="relative">
            <div className="absolute top-4 right-4 left-4 h-0.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full w-[10%]" />
            </div>

            <div className="relative flex justify-between">
              {[
                { label: 'ثبت سفارش', icon: CheckCircle, active: true, current: true },
                { label: 'پرداخت', icon: DollarSign, active: false, current: false },
                { label: 'پردازش', icon: Package, active: false, current: false },
                { label: 'ارسال', icon: Truck, active: false, current: false },
                { label: 'تحویل', icon: CheckCircle, active: false, current: false },
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md',
                      step.current
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white scale-110 ring-4 ring-primary-100'
                        : step.active
                        ? 'bg-gradient-to-br from-success-500 to-success-600 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold',
                      step.current ? 'text-primary-700' : 'text-gray-400'
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <Button
            size="lg"
            onClick={() => navigate('/orders')}
            className="gap-2"
          >
            <Package className="w-5 h-5" />
            مشاهده سفارشات من
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="w-5 h-5" />
            بازگشت به فروشگاه
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleDownloadInvoice}
            className="gap-2 md:col-span-2"
          >
            <Download className="w-5 h-5" />
            دانلود فاکتور سفارش
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-gradient-to-l from-warning-50 to-accent-50 border border-warning-200 rounded-2xl p-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-warning-900 text-sm mb-1">اطلاعیه مهم</h4>
              <p className="text-xs text-warning-800 leading-relaxed">
                پیامک تایید سفارش به شماره شما ارسال خواهد شد. 
                برای پیگیری سفارش می‌توانید از بخش "سفارشات من" استفاده کنید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default OrderSuccessPage;
