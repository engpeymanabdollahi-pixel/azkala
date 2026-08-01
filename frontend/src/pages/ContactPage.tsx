// src/pages/ContactPage.tsx
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('لطفاً تمام فیلدهای ضروری را پر کنید');
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('پیام شما با موفقیت ارسال شد');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('خطا در ارسال پیام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">تماس با ما</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">کارشناسان ما آماده پاسخگویی به سوالات شما هستند</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* اطلاعات تماس */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
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
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-gray-800">{item.value}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* فرم تماس */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              ارسال پیام
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="نام و نام خانوادگی" placeholder="علی رضایی"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="ایمیل" type="email" placeholder="example@domain.com"
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              <Input label="موضوع" placeholder="مشکل در سفارش، راهنمایی محصول، ..."
                value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">پیام شما</label>
                <textarea rows={5} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="لطفاً پیام خود را بنویسید..."
                  value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
              </div>
              <Button type="submit" isLoading={loading} className="w-full" rightIcon={<Send className="w-4 h-4" />}>
                ارسال پیام
              </Button>
            </form>
          </div>
        </div>

        {/* نقشه (نمادین) */}
        <div className="mt-12 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="h-64 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
            نقشه تعاملی گوگل مپ (آدرس: تهران، خیابان ولیعصر، پلاک ۱۲۳)
          </div>
        </div>
      </div>
    </div>
  );
}
export default ContactPage;
