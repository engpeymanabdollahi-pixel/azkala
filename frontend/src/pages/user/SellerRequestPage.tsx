import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../services/api/client';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SellerRequestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shop_name: '',
    national_code: '',
    description: ''
  });

  const requestMutation = useMutation({
    mutationFn: async (data: any) => {
      // فرض بر این است که این روت در بک‌اند برای کاربر لاگین‌شده تعریف شده است
      const res = await apiClient.post('/user/seller-request', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('درخواست شما با موفقیت ثبت شد. پس از بررسی با شما تماس خواهیم گرفت.');
      navigate('/profile');
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">درخواست تبدیل به فروشنده</h1>
      <p className="text-gray-500 mb-6 text-sm">با پر کردن این فرم، درخواست شما برای بررسی توسط تیم ازکالا ارسال می‌شود.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نام فروشگاه یا برند *</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={formData.shop_name}
            onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
            placeholder="مثال: موبایل مرکزی"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">کد ملی / شناسه ملی *</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={formData.national_code}
            onChange={(e) => setFormData({...formData, national_code: e.target.value})}
            placeholder="فقط اعداد"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات مختصر درباره محصولات</label>
          <textarea
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="چه محصولاتی می‌فروشید؟"
          />
        </div>

        <button
          type="submit"
          disabled={requestMutation.isPending}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
        >
          {requestMutation.isPending ? 'در حال ارسال...' : 'ثبت درخواست فروشندگی'}
        </button>
      </form>
    </div>
  );
};

export default SellerRequestPage;