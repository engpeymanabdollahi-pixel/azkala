import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import client from '@/services/api/client';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Store, Hash, FileText, Loader2, MapPin, Phone, CheckCircle2, Info } from 'lucide-react';

const SellerRequestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shop_name: '',
    national_code: '',
    phone: '',
    description: ''
  });

  const requestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await client.post('/seller-requests', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.', { icon: '🎉' });
      navigate('/dashboard/profile');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shop_name || !formData.national_code || !formData.phone) {
      return toast.error('لطفاً فیلدهای ستاره‌دار را به درستی تکمیل کنید.');
    }
    if (!/^09[0-9]{9}$/.test(formData.phone)) {
      return toast.error('شماره موبایل وارد شده نامعتبر است.');
    }
    requestMutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in">
      {/* هدر فرم */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full mb-4 shadow-lg shadow-primary-500/10">
          <Store className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">درخواست همکاری و فروشندگی</h1>
        <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
          به خانواده بزرگ فروشندگان ازکالا بپیوندید. با پر کردن این فرم، درخواست شما جهت بررسی و احراز هویت به تیم پشتیبانی ارسال می‌شود.
        </p>
      </div>

      {/* باکس اصلی فرم */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 px-6 py-4 border-b border-primary-100 flex items-center gap-3">
          <Info className="w-5 h-5 text-primary-600" />
          <p className="text-sm font-bold text-primary-800">تکمیل اطلاعات زیر الزامی است</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* نام فروشگاه */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Store className="w-4 h-4 text-gray-400" /> نام فروشگاه یا برند <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all"
                value={formData.shop_name}
                onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                placeholder="مثال: دیجیتال سنتر"
              />
            </div>

            {/* کد ملی */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" /> کد ملی / شناسه ملی <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all font-mono text-left"
                value={formData.national_code}
                onChange={(e) => setFormData({...formData, national_code: e.target.value.replace(/\D/g, '')})}
                placeholder="فقط اعداد (۱۰ یا ۱۱ رقم)"
                maxLength={11}
              />
            </div>
          </div>

          {/* شماره تماس */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" /> شماره موبایل جهت تماس <span className="text-error-500">*</span>
            </label>
            <input
              type="tel"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all font-mono text-left"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
              placeholder="مثال: 09123456789"
              maxLength={11}
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-success-500" />
              نتیجه بررسی از طریق این شماره به شما اطلاع داده خواهد شد.
            </p>
          </div>

          {/* توضیحات */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> توضیحات تکمیلی (اختیاری)
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="لطفاً به صورت مختصر درباره نوع محصولات، سابقه فروش یا هر نکته‌ای که به بررسی سریع‌تر کمک می‌کند بنویسید..."
            />
          </div>

          {/* دکمه ارسال */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={requestMutation.isPending}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary-500/30"
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ارسال درخواست...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  ثبت نهایی درخواست
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerRequestPage;