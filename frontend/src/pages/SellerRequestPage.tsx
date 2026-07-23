import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  CheckCircle, Store, User, Clock, ShieldCheck, 
  ArrowLeft, Building2, CreditCard 
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// ==================== Schema Definitions ====================

// مرحله ۱: اطلاعات هویتی اولیه
const initialSchema = z.object({
  full_name: z.string().min(3, 'نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد'),
  national_code: z.string().regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد'),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
  proposed_shop_name: z.string().min(3, 'نام پیشنهادی فروشگاه باید حداقل ۳ کاراکتر باشد').optional(),
});

// مرحله ۲: تکمیل اطلاعات کسب‌وکار و مالی (پس از تأیید ادمین)
const completionSchema = z.object({
  shop_name: z.string().min(3, 'نام فروشگاه الزامی است'),
  shop_alias: z.string().regex(/^[a-z0-9-]*$/, 'آدرس فقط می‌تواند شامل حروف انگلیسی، اعداد و خط تیره باشد').optional().or(z.literal('')),
  bank_name: z.string().min(2, 'نام بانک را انتخاب یا وارد کنید'),
  bank_account: z.string().min(10, 'شماره حساب یا شبا معتبر نیست'),
  accept_terms: z.boolean().refine(val => val === true, 'پذیرش قوانین الزامی است'),
});

type InitialFormData = z.infer<typeof initialSchema>;
type CompletionFormData = z.infer<typeof completionSchema>;

// ==================== Main Component ====================

export default function SellerRequestPage() {
  const navigate = useNavigate();

  // دریافت وضعیت فعلی درخواست فروشندگی کاربر
     const { data: requestStatus, isLoading, refetch } = useQuery({
    queryKey: ['seller-request-status'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      // ✅ اصلاح شد: اضافه کردن /v1/
      const res = await fetch('/api/v1/user/seller-request-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return null; 
      return res.json();
    },
    retry: false,
  });

  // --- View 1: فرم ثبت‌نام اولیه ---
  const InitialForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<InitialFormData>({
      resolver: zodResolver(initialSchema),
    });

               const { mutate, isPending } = useMutation({
      mutationFn: async (data: InitialFormData) => {
        const token = localStorage.getItem('token');
        // ✅ اصلاح شد: اضافه کردن /v1/
        const res = await fetch('/api/v1/seller-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'خطا در ثبت درخواست اولیه');
        }
        return res.json();
      },
      // ... بقیه کد بدون تغییر
      onSuccess: () => {
        toast.success('درخواست اولیه شما ثبت شد. پس از تأیید ادمین اطلاع‌رسانی خواهد شد.');
        refetch(); // این خط باعث می‌شود فرم به طور خودکار به حالت "PendingView" تغییر کند
      },
      onError: (error: any) => toast.error(error.message),
    });

    return (
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" /> اطلاعات هویتی شما
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">نام و نام خانوادگی <span className="text-red-500">*</span></label>
            <input {...register('full_name')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="مثال: علی محمدی" />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">کد ملی <span className="text-red-500">*</span></label>
            <input {...register('national_code')} className="w-full p-3 border border-gray-300 rounded-lg dir-ltr text-left" placeholder="1234567890" maxLength={10} />
            {errors.national_code && <p className="text-red-500 text-xs mt-1">{errors.national_code.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700">شماره موبایل <span className="text-red-500">*</span></label>
          <input {...register('phone')} className="w-full p-3 border border-gray-300 rounded-lg dir-ltr text-left" placeholder="09123456789" maxLength={11} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700">نام پیشنهادی فروشگاه (اختیاری)</label>
          <input {...register('proposed_shop_name')} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="مثال: لوازم جانبی موبایل تهران" />
          <p className="text-xs text-gray-500 mt-1">این نام پس از تأیید ادمین به عنوان نام رسمی شعبه شما ثبت می‌شود.</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 mt-4 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'در حال ارسال...' : 'ارسال درخواست و انتظار برای تأیید'}
          <ArrowLeft className="w-5 h-5" />
        </button>
      </form>
    );
  };

  // --- View 2: صفحه انتظار تأیید ---
  const PendingView = () => (
    <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">درخواست شما در حال بررسی است</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        اطلاعات اولیه شما با موفقیت ثبت شد و در صف بررسی تیم پشتیبانی ازکالا قرار گرفت. 
        <br />
        <span className="font-bold text-gray-800">معمولاً این فرآیند کمتر از ۲۴ ساعت زمان می‌برد.</span>
        <br />
        پس از تأیید، برای تکمیل اطلاعات بانکی و افتتاح رسمی شعبه، به این صفحه بازگردید.
      </p>
      <button
        onClick={() => navigate('/user/dashboard')}
        className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-colors"
      >
        بازگشت به داشبورد کاربری
      </button>
    </div>
  );

  // --- View 3: فرم تکمیل اطلاعات (فقط پس از تأیید ادمین) ---
    // --- View 3: فرم تکمیل اطلاعات (فقط پس از تأیید ادمین) ---
  const CompletionForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<CompletionFormData>({
      resolver: zodResolver(completionSchema),
      defaultValues: {
        shop_name: requestStatus?.proposed_shop_name || '',
        accept_terms: false
      }
    });

    const { mutate, isPending } = useMutation({
      mutationFn: async (data: CompletionFormData) => {
        const token = localStorage.getItem('token');
        // ✅ اصلاح شده: اضافه کردن /v1/ و استفاده از optional chaining برای id
        const res = await fetch(`/api/v1/seller-requests/${requestStatus?.id}/complete`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(data),
        });
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({})); // جلوگیری از کرش در صورت پاسخ غیر JSON
          throw new Error(err.message || 'خطا در تکمیل اطلاعات');
        }
        return res.json();
      },
      onSuccess: () => {
        toast.success('تبریک! شعبه آنلاین شما با موفقیت افتتاح شد.');
        refetch(); // به‌روزرسانی برای نمایش صفحه نهایی
      },
      onError: (error: any) => toast.error(error.message || 'خطای ناشناخته'),
    });

    return (
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-green-600" /> تکمیل اطلاعات شعبه و مالی
        </h3>
        
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-4">
          <p className="text-sm text-green-800 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>تبریک! درخواست اولیه شما تأیید شد. اکنون اطلاعات زیر را برای فعال‌سازی کامل شعبه و دریافت تسویه‌حساب وارد کنید.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">نام رسمی فروشگاه <span className="text-red-500">*</span></label>
            <input {...register('shop_name')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="نامی که مشتریان می‌بینند" />
            {errors.shop_name && <p className="text-red-500 text-xs mt-1">{errors.shop_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">آدرس اینترنتی اختصاصی (اختیاری)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm dir-ltr bg-gray-100 px-3 py-3 rounded-lg border border-gray-300 whitespace-nowrap">azkala.ir/seller/</span>
              <input {...register('shop_alias')} className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dir-ltr text-left" placeholder="my-shop" />
            </div>
            {errors.shop_alias && <p className="text-red-500 text-xs mt-1">{errors.shop_alias.message}</p>}
            <p className="text-xs text-gray-500 mt-1">اگر وب‌سایت یا آدرس خاصی ندارید، این قسمت را خالی بگذارید.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">نام بانک <span className="text-red-500">*</span></label>
            <select {...register('bank_name')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white">
              <option value="">انتخاب کنید...</option>
              <option value="melat">بانک ملت</option>
              <option value="melli">بانک ملی</option>
              <option value="saman">بانک سامان</option>
              <option value="pasargad">بانک پاسارگاد</option>
              <option value="tejarat">بانک تجارت</option>
              <option value="other">سایر بانک‌ها</option>
            </select>
            {errors.bank_name && <p className="text-red-500 text-xs mt-1">{errors.bank_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">شماره حساب یا شبا <span className="text-red-500">*</span></label>
            <input {...register('bank_account')} className="w-full p-3 border border-gray-300 rounded-lg dir-ltr text-left" placeholder="IR000000000000000000000000 یا شماره حساب" />
            {errors.bank_account && <p className="text-red-500 text-xs mt-1">{errors.bank_account.message}</p>}
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mt-6 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <input type="checkbox" {...register('accept_terms')} className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500" />
          <span className="text-sm text-gray-700 leading-relaxed">
            <a href="/terms" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">قوانین و مقررات</a> فعالیت فروشندگان در ازکالا و کسر ۵٪ کمیسیون از هر سفارش موفق را مطالعه کرده و می‌پذیرم.
          </span>
        </label>
        {errors.accept_terms && <p className="text-red-500 text-xs">{errors.accept_terms.message}</p>}
        
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-green-600 text-white py-3.5 rounded-xl hover:bg-green-700 mt-4 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> در حال ثبت نهایی...</>
          ) : (
            <>ثبت نهایی و افتتاح رسمی شعبه <CheckCircle className="w-5 h-5" /></>
          )}
        </button>
      </form>
    );
  };

  // --- View 4: شعبه فعال ---
  const ActiveView = () => (
    <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Store className="w-12 h-12 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">شعبه آنلاین شما فعال است! 🎉</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        تبریک می‌گوییم! تمام مراحل تأیید هویت و تکمیل اطلاعات با موفقیت انجام شد. 
        <br />
        اکنون می‌توانید وارد پنل مدیریت شوید و اولین محصولات خود را ثبت کنید.
      </p>
      <button
        onClick={() => navigate('/seller')}
        className="px-8 py-3.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all font-bold flex items-center gap-2 mx-auto"
      >
        ورود به پنل مدیریت فروشگاه
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );

  // ==================== Render Logic ====================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // تعیین وضعیت فعلی برای نمایش کامپوننت مناسب
  let currentView = <InitialForm />;
  let activeStep = 1;

  if (requestStatus) {
    if (requestStatus.status === 'pending') {
      currentView = <PendingView />;
      activeStep = 1; // هنوز در مرحله انتظار
    } else if (requestStatus.status === 'approved' && !requestStatus.bank_account) {
      currentView = <CompletionForm />;
      activeStep = 2; // در حال تکمیل اطلاعات
    } else if (requestStatus.status === 'approved' && requestStatus.bank_account) {
      currentView = <ActiveView />;
      activeStep = 2; // تکمیل شده
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            شعبه آنلاین کسب‌وکار خود را در ازکالا افتتاح کنید
          </h1>
          <p className="text-gray-600 text-lg">
            بدون نیاز به وب‌سایت، محصولات خود را به هزاران مشتری هدفمند معرفی کنید.
          </p>
        </div>

        {/* Progress Indicator (فقط در فرم‌ها نمایش داده می‌شود) */}
        {requestStatus?.status !== 'approved' || !requestStatus?.bank_account ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="flex justify-between mb-10 px-4 relative">
              {/* Background Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 -z-10 mx-8 rounded-full" />
              {/* Active Line */}
              <div 
                className={`absolute top-5 left-0 h-1 bg-blue-600 -z-10 mx-8 rounded-full transition-all duration-500`} 
                style={{ width: activeStep === 2 ? 'calc(100% - 4rem)' : '0%', right: 'auto', left: '2rem' }} 
              />
              
              {/* Step 1 */}
              <div className={`flex flex-col items-center ${activeStep >= 1 ? 'text-blue-600' : 'text-gray-300'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300 shadow-sm ${activeStep >= 1 ? 'border-blue-600' : 'border-gray-300'}`}>
                  {activeStep > 1 ? <CheckCircle className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <span className="text-sm mt-3 font-bold">۱. ثبت‌نام اولیه</span>
              </div>

              {/* Step 2 */}
              <div className={`flex flex-col items-center ${activeStep >= 2 ? 'text-blue-600' : 'text-gray-300'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300 shadow-sm ${activeStep >= 2 ? 'border-blue-600' : 'border-gray-300'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-sm mt-3 font-bold">۲. تکمیل اطلاعات</span>
              </div>
            </div>
            
            {currentView}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {currentView}
          </div>
        )}
      </div>
    </div>
  );
}