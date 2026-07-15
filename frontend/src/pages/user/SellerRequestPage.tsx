import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import client from '@/services/api/client'; // ✅ ایمپورت صحیح و پیش‌فرض
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Store, Hash, FileText, Loader2 } from 'lucide-react';

const SellerRequestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shop_name: '',
    national_code: '',
    description: ''
  });

  const requestMutation = useMutation({
    mutationFn: async (data: any) => {
      // ✅ استفاده از client به جای apiClient
      const res = await client.post('/seller-requests', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('درخواست شما با موفقیت ثبت شد. پس از بررسی با شما تماس خواهیم گرفت.');
      navigate('/dashboard/profile');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'خطا در ثبت درخواست');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shop_name || !formData.national_code) {
      return toast.error('لطفاً نام فروشگاه و کد ملی را وارد کنید.');
    }
    requestMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">درخواست تبدیل به فروشنده</h1>
        <p className="text-gray-500 text-sm">با پر کردن این فرم، درخواست شما برای بررسی توسط تیم ازکالا ارسال می‌شود.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-400" /> نام فروشگاه یا برند <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            value={formData.shop_name}
            onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
            placeholder="مثال: موبایل مرکزی"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400" /> کد ملی / شناسه ملی <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono text-left"
            value={formData.national_code}
            onChange={(e) => setFormData({...formData, national_code: e.target.value.replace(/\D/g, '')})}
            placeholder="فقط اعداد"
            maxLength={15}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" /> توضیحات مختصر درباره محصولات
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="چه محصولاتی می‌فروشید؟ (اختیاری)"
          />
        </div>

        <button
          type="submit"
          disabled={requestMutation.isPending}
          className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
        >
          {requestMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ثبت درخواست فروشندگی'}
        </button>
      </form>
    </div>
  );
};

export default SellerRequestPage;