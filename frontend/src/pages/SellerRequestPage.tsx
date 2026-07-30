import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  CheckCircle, Store, User, Clock, Building2, Home, Loader2, 
  ArrowLeft, Upload, FileText, CreditCard, MapPin, Briefcase, XCircle, AlertCircle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// ==================== 1. Schema Definitions ====================
const initialSchema = z.object({
  full_name: z.string().min(3, 'حداقل ۳ کاراکتر وارد کنید'),
  national_code: z.string().regex(/^\d{10}$/, 'کد ملی باید دقیقاً ۱۰ رقم باشد'),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست (مثال: 09123456789)'),
  province: z.string().min(1, 'لطفاً استان را انتخاب کنید'),
  city: z.string().min(1, 'لطفاً شهر را انتخاب کنید'),
  proposed_shop_name: z.string().min(3, 'حداقل ۳ کاراکتر وارد کنید'),
  business_activity: z.string().min(10, 'لطفاً توضیحات کامل‌تری ارائه دهید (حداقل ۱۰ کاراکتر)'),
});

const documentsSchema = z.object({
  bank_account: z.string().min(10, 'شماره شبا یا حساب معتبر نیست (حداقل ۱۰ کاراکتر)'),
  // ✅ اعتبارسنجی دقیق فایل: باید FileList باشد و حداقل یک فایل داشته باشد
  id_card_image: z.any().refine((files) => files instanceof FileList && files.length > 0, 'بارگذاری تصویر کارت ملی الزامی است'),
  business_license_image: z.any().optional(),
});

type InitialFormData = z.infer<typeof initialSchema>;
type DocumentsFormData = z.infer<typeof documentsSchema>;

// ==================== 2. Helper: Status Mapping ====================
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending_initial':
      return { step: 1, title: 'در انتظار بررسی اولیه', desc: 'درخواست شما ثبت شد و در صف بررسی کارشناسان قرار دارد.', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock };
    case 'pending_documents':
      return { step: 2, title: 'بارگذاری مدارک', desc: 'تبریک! درخواست اولیه شما تأیید شد. لطفاً مدارک هویتی و مالی خود را بارگذاری کنید.', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Upload };
    case 'pending_final':
      return { step: 3, title: 'بررسی نهایی', desc: 'مدارک شما با موفقیت دریافت شد و در حال بررسی نهایی برای افتتاح شعبه است.', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: Clock };
    case 'approved':
      return { step: 3, title: 'تأیید نهایی و افتتاح شعبه', desc: 'تبریک می‌گوییم! شعبه آنلاین شما با موفقیت فعال شد.', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle };
    case 'rejected':
      return { step: 0, title: 'درخواست رد شد', desc: 'متأسفانه درخواست شما با مشکل مواجه شد. لطفاً دلیل ذکر شده را بررسی کنید.', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle };
    default:
      return { step: 1, title: 'شروع فرآیند', desc: 'لطفاً فرم زیر را با دقت تکمیل کنید تا فرآیند افتتاح شعبه آغاز شود.', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: User };
  }
};

// ==================== 3. Provinces & Cities Data ====================
const provinces = [
  { id: 'tehran', name: 'تهران', cities: ['تهران', 'ری', 'شمیرانات', 'اسلامشهر', 'پاکدشت', 'ورامین', 'دماوند'] },
  { id: 'isfahan', name: 'اصفهان', cities: ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر', 'لنجان'] },
  { id: 'fars', name: 'فارس', cities: ['شیراز', 'مرودشت', 'جهرم', 'فسا', 'کازرون', 'لار'] },
  { id: 'khorasan_razavi', name: 'خراسان رضوی', cities: ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'قوچان'] },
  { id: 'azarbaijan_sharghi', name: 'آذربایجان شرقی', cities: ['تبریز', 'مراغه', 'مرند', 'میانه', 'اهر'] },
  { id: 'mazandaran', name: 'مازندران', cities: ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'نوشهر', 'چالوس'] },
  { id: 'gilan', name: 'گیلان', cities: ['رشت', 'لاهیجان', 'بندر انزلی', 'آستارا', 'تالش'] },
  { id: 'khuzestan', name: 'خوزستان', cities: ['اهواز', 'آبادان', 'خرمشهر', 'دزفول', 'بهبهان', 'شوشتر'] },
];

// ==================== 4. Main Component ====================
export default function SellerRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProvince, setSelectedProvince] = useState('');

  const getToken = () => localStorage.getItem('token');

  // دریافت وضعیت درخواست
  const { data: requestData, isLoading } = useQuery({
    queryKey: ['seller-request-status'],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;

      const res = await fetch(`${API_BASE}/user/seller-request-status`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      
      if (!res.ok) return null; 
      const json = await res.json();
      return json.data || json; 
    },
    retry: false,
  });

  const statusConfig = getStatusConfig(requestData?.status || 'no_request');
  const currentStatus = requestData?.status || 'no_request';

  // --- Mutation 1: فرم ثبت‌نام اولیه ---
  const initialMutation = useMutation({
    mutationFn: async (data: InitialFormData) => {
      const token = getToken();
      if (!token) throw new Error('لطفاً ابتدا وارد حساب کاربری خود شوید.');

      const res = await fetch(`${API_BASE}/seller-requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json' 
        },
        body: JSON.stringify(data),
      });
      
      const errorData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errorData.message || `خطای سرور: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      toast.success('درخواست اولیه با موفقیت ثبت شد. منتظر تأیید ادمین باشید.');
      queryClient.invalidateQueries({ queryKey: ['seller-request-status'] });
    },
    onError: (error: any) => toast.error(error.message),
  });

  // --- Mutation 2: فرم بارگذاری مدارک (نسخه ضدگلوله) ---
  const documentsMutation = useMutation({
    mutationFn: async (data: DocumentsFormData) => {
      const token = getToken();
      if (!token) throw new Error('لطفاً ابتدا وارد حساب کاربری خود شوید.');
      if (!requestData?.id) throw new Error('شناسه درخواست یافت نشد. لطفاً صفحه را رفرش کنید.');

      const formData = new FormData();
      formData.append('bank_account', data.bank_account);
      
      // ✅ استخراج ایمن و دقیق فایل از FileList
      const idCardFiles = data.id_card_image as unknown as FileList | undefined;
      if (idCardFiles && idCardFiles.length > 0) {
        formData.append('id_card_image', idCardFiles[0]);
      }

      const licenseFiles = data.business_license_image as unknown as FileList | undefined;
      if (licenseFiles && licenseFiles.length > 0) {
        formData.append('business_license_image', licenseFiles[0]);
      }

      const res = await fetch(`${API_BASE}/seller-requests/${requestData.id}/upload-documents`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
          // ⚠️ نکته حیاتی: Content-Type را دستی ست نکنید. مرورگر آن را با boundary صحیح تنظیم می‌کند.
        },
        body: formData,
      });

      const responseJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errorMsg = 'خطای ناشناخته در سرور';
        if (responseJson.message) {
          errorMsg = responseJson.message;
        } else if (responseJson.errors) {
          // استخراج اولین پیام خطای ولیدیشن لاراول
          const firstErrorKey = Object.keys(responseJson.errors)[0];
          errorMsg = responseJson.errors[firstErrorKey][0];
        } else {
          errorMsg = `خطای سرور: ${res.status}`;
        }
        throw new Error(errorMsg);
      }
      
      return responseJson;
    },
    onSuccess: () => {
      toast.success('مدارک با موفقیت بارگذاری شد. منتظر بررسی نهایی ادمین باشید.');
      queryClient.invalidateQueries({ queryKey: ['seller-request-status'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطا در بارگذاری مدارک');
    },
  });

  // ==================== Render Helpers ====================
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">در حال دریافت وضعیت درخواست...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4 sm:p-6 relative" dir="rtl">
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium bg-white/80 backdrop-blur px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md border border-gray-100"
      >
        <Home className="w-4 h-4" /> <span>صفحه اصلی</span>
      </button>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">افتتاح شعبه آنلاین</h1>
          <p className="text-gray-500 text-sm">برای شروع فروش در ازکالا، مراحل زیر را تکمیل کنید</p>
        </div>

        {/* Stepper Indicator */}
        <div className="mb-10 px-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -z-10 -translate-y-1/2 mx-12 rounded-full" />
            <div 
              className="absolute top-1/2 left-0 h-1 -z-10 -translate-y-1/2 transition-all duration-700 ease-out mx-12 rounded-full" 
              style={{ 
                width: `${((statusConfig.step - 1) / 2) * 100}%`, 
                right: 'auto',
                backgroundColor: currentStatus === 'approved' ? '#10b981' : '#2563eb'
              }} 
            />
            
            {[
              { step: 1, label: 'ثبت اولیه' },
              { step: 2, label: 'احراز هویت' },
              { step: 3, label: 'افتتاح شعبه' }
            ].map((item) => {
              const isCompleted = statusConfig.step > item.step;
              const isCurrent = statusConfig.step === item.step;
              
              return (
                <div key={item.step} className="flex flex-col items-center gap-2 bg-white px-2 relative z-10">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30' 
                      : isCurrent 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-110' 
                        : 'bg-white text-gray-300 border-gray-200'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="text-sm sm:text-base font-bold">{item.step}</span>}
                  </div>
                  <span className={`text-xs sm:text-sm font-bold transition-colors ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Based on Status */}
        {currentStatus === 'no_request' && (
          <InitialForm 
            selectedProvince={selectedProvince} 
            setSelectedProvince={setSelectedProvince} 
            onSubmit={initialMutation.mutate} 
            isPending={initialMutation.isPending} 
          />
        )}
        
        {currentStatus === 'pending_initial' && <StatusView config={statusConfig} requestData={requestData} navigate={navigate} />}
        
        {currentStatus === 'pending_documents' && (
          <DocumentsForm 
            onSubmit={documentsMutation.mutate} 
            isPending={documentsMutation.isPending} 
          />
        )}
        
        {currentStatus === 'pending_final' && <StatusView config={statusConfig} requestData={requestData} navigate={navigate} />}
        {currentStatus === 'approved' && <ApprovedView navigate={navigate} />}
        {currentStatus === 'rejected' && <StatusView config={statusConfig} requestData={requestData} navigate={navigate} />}
      </div>
    </div>
  );
}

// ==================== 5. Sub-Components ====================

function InitialForm({ selectedProvince, setSelectedProvince, onSubmit, isPending }: any) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<InitialFormData>({ 
    resolver: zodResolver(initialSchema) 
  });
  
  const watchedProvince = watch('province');
  const selectedProvinceData = provinces.find((p: any) => p.id === watchedProvince);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setValue('province', provinceId);
    setValue('city', '');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">نام و نام خانوادگی <span className="text-red-500">*</span></label>
          <input {...register('full_name')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" placeholder="مثال: علی احمدی" />
          {errors.full_name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.full_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">کد ملی <span className="text-red-500">*</span></label>
          <input {...register('national_code')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dir-ltr text-left font-mono" placeholder="1234567890" maxLength={10} />
          {errors.national_code && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.national_code.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">شماره موبایل <span className="text-red-500">*</span></label>
          <input {...register('phone')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dir-ltr text-left font-mono" placeholder="09123456789" maxLength={11} />
          {errors.phone && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">نام پیشنهادی فروشگاه <span className="text-red-500">*</span></label>
          <input {...register('proposed_shop_name')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" placeholder="مثال: دیجیتال استور" />
          {errors.proposed_shop_name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.proposed_shop_name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2"><MapPin className="w-4 h-4 inline-block ml-1 text-gray-400" /> استان <span className="text-red-500">*</span></label>
          <select {...register('province')} onChange={handleProvinceChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white">
            <option value="">انتخاب استان...</option>
            {provinces.map((province: any) => <option key={province.id} value={province.id}>{province.name}</option>)}
          </select>
          {errors.province && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.province.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2"><MapPin className="w-4 h-4 inline-block ml-1 text-gray-400" /> شهر <span className="text-red-500">*</span></label>
          <select {...register('city')} disabled={!selectedProvinceData} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed">
            <option value="">{selectedProvinceData ? 'انتخاب شهر...' : 'ابتدا استان را انتخاب کنید'}</option>
            {selectedProvinceData?.cities.map((city: string) => <option key={city} value={city}>{city}</option>)}
          </select>
          {errors.city && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.city.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2"><Briefcase className="w-4 h-4 inline-block ml-1 text-gray-400" /> حوزه فعالیت و محصولات <span className="text-red-500">*</span></label>
        <textarea {...register('business_activity')} rows={4} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm resize-none" placeholder="لطفاً حوزه فعالیت خود و محصولات اصلی که قصد فروش آن‌ها را دارید توضیح دهید..." />
        {errors.business_activity && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.business_activity.message}</p>}
      </div>

      <button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 mt-2 font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
        {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ارسال...</> : <>ارسال درخواست اولیه <ArrowLeft className="w-5 h-5" /></>}
      </button>
    </form>
  );
}

function DocumentsForm({ onSubmit, isPending }: any) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<DocumentsFormData>({ 
    resolver: zodResolver(documentsSchema) 
  });

  // ✅ استیت برای نگهداری پیش‌نمایش تصاویر
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  // ✅ هندلرهای انتخاب فایل برای ساخت پیش‌نمایش
  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setValue('id_card_image', files);
    if (files && files[0]) {
      setIdCardPreview(URL.createObjectURL(files[0]));
    }
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setValue('business_license_image', files);
    if (files && files[0]) {
      setLicensePreview(URL.createObjectURL(files[0]));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 font-medium leading-relaxed">تأیید اولیه انجام شد. لطفاً مدارک زیر را برای فعال‌سازی نهایی و دریافت تسویه‌حساب بارگذاری کنید.</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2"><CreditCard className="w-4 h-4 inline-block ml-1 text-gray-400" /> شماره شبا یا حساب بانکی <span className="text-red-500">*</span></label>
        <input {...register('bank_account')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dir-ltr text-left font-mono" placeholder="IR000000000000000000000000" />
        {errors.bank_account && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.bank_account.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2"><FileText className="w-4 h-4 inline-block ml-1 text-gray-400" /> تصویر کارت ملی <span className="text-red-500">*</span></label>
        <div className="relative">
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/jpg" 
            onChange={handleIdCardChange} // ✅ استفاده از هندلر جدید
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center group">
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-gray-600 group-hover:text-blue-600 font-medium">برای انتخاب تصویر کارت ملی کلیک کنید</p>
            <p className="text-xs text-gray-400 mt-1">فرمت‌های مجاز: JPG, PNG (حداکثر ۵ مگابایت)</p>
          </div>
        </div>
        {/* ✅ نمایش پیش‌نمایش عکس انتخاب شده */}
        {idCardPreview && (
          <div className="mt-3 relative inline-block">
            <img src={idCardPreview} alt="پیش‌نمایش کارت ملی" className="h-32 rounded-lg object-cover border border-blue-200 shadow-sm" />
            <button 
              type="button" 
              onClick={() => { setIdCardPreview(null); setValue('id_card_image', null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
        {errors.id_card_image && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {String(errors.id_card_image.message)}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2"><Building2 className="w-4 h-4 inline-block ml-1 text-gray-400" /> تصویر پروانه کسب <span className="text-gray-400 font-normal text-xs">(اختیاری)</span></label>
        <div className="relative">
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/jpg" 
            onChange={handleLicenseChange} // ✅ استفاده از هندلر جدید
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center group">
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-gray-600 group-hover:text-blue-600 font-medium">برای انتخاب تصویر جواز کسب کلیک کنید</p>
          </div>
        </div>
        {/* ✅ نمایش پیش‌نمایش عکس انتخاب شده */}
        {licensePreview && (
          <div className="mt-3 relative inline-block">
            <img src={licensePreview} alt="پیش‌نمایش جواز کسب" className="h-32 rounded-lg object-cover border border-blue-200 shadow-sm" />
            <button 
              type="button" 
              onClick={() => { setLicensePreview(null); setValue('business_license_image', null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <button type="submit" disabled={isPending} className="w-full bg-green-600 text-white py-3.5 rounded-xl hover:bg-green-700 mt-2 font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 hover:shadow-green-500/30">
        {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال بارگذاری...</> : <>بارگذاری و ارسال برای بررسی نهایی <Upload className="w-5 h-5" /></>}
      </button>
    </form>
  );
}

function StatusView({ config, requestData, navigate }: any) {
  return (
    <div className={`text-center py-8 animate-in fade-in zoom-in-95 duration-500 ${config.bg} rounded-2xl border ${config.border}`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${config.bg.replace('50', '100')}`}>
        <config.icon className={`w-10 h-10 ${config.color}`} />
      </div>
      <h3 className={`text-xl font-black mb-3 ${config.color}`}>{config.title}</h3>
      <p className="text-gray-600 text-sm mb-6 px-8 leading-relaxed">{config.desc}</p>
      
      {requestData?.status === 'rejected' && requestData?.rejection_reason && (
        <div className="bg-white/60 border border-red-200 p-4 rounded-xl mb-6 mx-6 text-right backdrop-blur-sm">
          <p className="text-sm font-bold text-red-700 mb-1.5 flex items-center gap-2"><XCircle className="w-4 h-4" /> دلیل رد درخواست:</p>
          <p className="text-sm text-red-600 leading-relaxed">{requestData.rejection_reason}</p>
        </div>
      )}

      <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-bold transition-all text-sm flex items-center gap-2 mx-auto shadow-sm hover:shadow-md">
        <Home className="w-4 h-4" /> بازگشت به صفحه اصلی
      </button>
    </div>
  );
}

function ApprovedView({ navigate }: any) {
  return (
    <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Store className="w-12 h-12 text-green-600" />
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-3">شعبه آنلاین شما فعال است! 🎉</h3>
      <p className="text-gray-600 mb-8 text-sm leading-relaxed px-6">اکنون می‌توانید وارد پنل مدیریت شوید، محصولات خود را ثبت کنید و فروش را آغاز نمایید.</p>
      <button onClick={() => navigate('/seller')} className="px-10 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all font-bold flex items-center gap-2 mx-auto text-base">
        ورود به پنل مدیریت فروشگاه <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );
}