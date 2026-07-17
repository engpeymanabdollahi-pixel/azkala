import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

export default function SellerRequestPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // شبیه‌سازی ارسال درخواست (بعداً به API متصل می‌شود)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success('درخواست شما با موفقیت ثبت شد!');
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">درخواست ثبت شد!</h2>
          <p className="text-gray-600 mb-6">
            تیم بررسی ازکالا درخواست شما را بررسی کرده و نتیجه را از طریق پیامک یا ایمیل اطلاع‌رسانی خواهد کرد.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            بازگشت به داشبورد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Store className="w-6 h-6" />
              درخواست فروشندگی در ازکالا
            </h1>
            <p className="text-primary-100 mt-2 text-sm">
              فرم زیر را پر کنید تا تیم ما در سریع‌ترین زمان ممکن با شما تماس بگیرد.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <Input 
              label="نام فروشگاه یا برند" 
              placeholder="مثال: فروشگاه دیجیتال پیمان" 
              required 
              leftIcon={<Store className="w-4 h-4" />} 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="شماره تماس" type="tel" placeholder="09123456789" required />
              <Input label="ایمیل" type="email" placeholder="example@email.com" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">توضیحات فعالیت</label>
              <textarea 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                rows={4}
                placeholder="لطفاً به اختصار توضیح دهید چه محصولاتی می‌فروشید..."
                required
              />
            </div>

            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 leading-relaxed">
                با ثبت این فرم، شما <a href="/terms" className="underline font-bold hover:text-blue-900">قوانین و مقررات</a> فروشندگان ازکالا را می‌پذیرید.
              </p>
            </div>

            <Button type="submit" className="w-full py-3 text-base" disabled={isSubmitting} isLoading={isSubmitting}>
              {isSubmitting ? 'در حال ارسال...' : 'ثبت درخواست فروشندگی'}
              {!isSubmitting && <ArrowRight className="w-4 h-4 mr-2" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}