// src/pages/ContactPage.tsx
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import apiClient from '@/services/api/client';
import toast from 'react-hot-toast';

export function ContactPage() {
  const { isAuthenticated } = useAuthStore();
  const openAuthModal = useAuthModalStore((state) => state.open);

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  // ✅ قبلاً این فرم هیچ‌وقت هیچ‌جا واقعاً ارسال نمی‌شد — فقط یک
  // setTimeout(1000ms) و بعد toast «با موفقیت ارسال شد» بود. کاربری که
  // مثلاً برای درخواست حذف حساب (طبق راهنمایی صفحه‌ی امنیت) اینجا پیام
  // می‌فرستاد، فکر می‌کرد پیامش رسیده، در حالی که هیچ داده‌ای در هیچ‌جا
  // ذخیره نمی‌شد. حالا واقعاً به‌عنوان یک تیکت پشتیبانی واقعی
  // (POST /tickets — همان سیستمی که TicketsSection استفاده می‌کند) ثبت
  // می‌شود. چون آن endpoint نیاز به احراز هویت دارد، کاربر مهمان قبل از
  // ارسال به ورود هدایت می‌شود.
  const submitMessage = async () => {
    setLoading(true);
    try {
      await apiClient.post('/tickets', {
        subject: formData.subject || 'پیام از فرم تماس با ما',
        description: formData.message,
        priority: 'medium',
        category: 'general',
      });
      toast.success('پیام شما با موفقیت ارسال شد و به‌زودی پاسخ داده می‌شود');
      setFormData({ subject: '', message: '' });
    } catch {
      toast.error('خطا در ارسال پیام. لطفاً دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error('لطفاً متن پیام را وارد کنید');
      return;
    }

    if (!isAuthenticated) {
      openAuthModal({
        reason: 'برای ارسال پیام به پشتیبانی وارد حساب کاربری خود شوید.',
        onSuccess: () => void submitMessage(),
      });
      return;
    }

    await submitMessage();
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-gray-100 mb-3">تماس با ما</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">کارشناسان ما آماده پاسخگویی به سوالات شما هستند</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* اطلاعات تماس */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              اطلاعات تماس
            </h2>
            <div className="space-y-5">
              {[
                { icon: Phone, title: 'تلفن پشتیبانی', value: '۰۲۱-۱۲۳۴۵۶۷۸', desc: 'شنبه تا پنجشنبه ۹ صبح تا ۶ عصر' },
                { icon: Mail, title: 'ایمیل', value: 'support@azkala.ir', desc: 'پاسخگویی ظرف ۲۴ ساعت' },
                { icon: MapPin, title: 'آدرس', value: 'تهران، خیابان ولیعصر، پلاک ۱۲۳', desc: 'طبقه سوم، واحد ۵' },
                { icon: Clock, title: 'ساعات کاری', value: 'شنبه تا چهارشنبه: ۹-۱۸', desc: 'پنجشنبه: ۹-۱۴' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-gray-800 dark:text-gray-200">{item.value}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* فرم تماس */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ارسال پیام
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="موضوع" placeholder="مشکل در سفارش، راهنمایی محصول، ..."
                value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پیام شما</label>
                <textarea rows={5} className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="لطفاً پیام خود را بنویسید..."
                  value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
              </div>
              {!isAuthenticated && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  برای ارسال پیام، ابتدا وارد حساب کاربری خود می‌شوید.
                </p>
              )}
              <Button type="submit" isLoading={loading} className="w-full" rightIcon={<Send className="w-4 h-4" />}>
                ارسال پیام
              </Button>
            </form>
          </div>
        </div>

        {/* نقشه (نمادین) */}
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500">
            نقشه تعاملی گوگل مپ (آدرس: تهران، خیابان ولیعصر، پلاک ۱۲۳)
          </div>
        </div>
      </div>
    </div>
  );
}
export default ContactPage;
