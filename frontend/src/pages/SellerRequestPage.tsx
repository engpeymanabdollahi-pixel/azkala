import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  CheckCircle, Store, User, Clock, Building2, Home, Loader2, 
  ArrowLeft, Upload, FileText, CreditCard, MapPin, Briefcase, XCircle
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// ==================== Schema Definitions ====================
const initialSchema = z.object({
  full_name: z.string().min(3, 'حداقل ۳ کاراکتر'),
  national_code: z.string().regex(/^\d{10}$/, '۱۰ رقم'),
  phone: z.string().regex(/^09\d{9}$/, 'مثال: 09123456789'),
  province: z.string().min(1, 'استان را انتخاب کنید'),
  city: z.string().min(1, 'شهر را انتخاب کنید'),
  proposed_shop_name: z.string().min(3, 'حداقل ۳ کاراکتر'),
  business_activity: z.string().min(10, 'حداقل ۱۰ کاراکتر - لطفاً حوزه فعالیت و محصولات خود را توضیح دهید'),
});

const documentsSchema = z.object({
  bank_account: z.string().min(10, 'شماره شبا یا حساب معتبر نیست'),
  id_card_image: z.any().refine((files) => files?.length > 0, 'تصویر کارت ملی الزامی است'),
  business_license_image: z.any().optional(),
});

type InitialFormData = z.infer<typeof initialSchema>;
type DocumentsFormData = z.infer<typeof documentsSchema>;

// ==================== Helper: Status Mapping (3 Stages) ====================
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending_initial':
      return { step: 1, title: 'بررسی اولیه', desc: 'درخواست شما در صف بررسی اولیه قرار دارد', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock };
    case 'pending_documents':
      return { step: 2, title: 'بارگذاری مدارک', desc: 'لطفاً مدارک هویتی و مالی خود را بارگذاری کنید', color: 'text-blue-600', bg: 'bg-blue-50', icon: Upload };
    case 'pending_final':
      return { step: 3, title: 'بررسی نهایی', desc: 'مدارک شما در حال بررسی نهایی است', color: 'text-purple-600', bg: 'bg-purple-50', icon: Clock };
    case 'approved':
      return { step: 3, title: 'تایید نهایی', desc: 'تبریک! شعبه آنلاین شما فعال است', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
    case 'rejected':
      return { step: 0, title: 'رد شده', desc: 'درخواست شما متأسفانه رد شده است', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
    default:
      return { step: 0, title: 'شروع', desc: 'فرم اولیه را پر کنید', color: 'text-gray-600', bg: 'bg-gray-50', icon: User };
  }
};

// ==================== Complete Provinces & Cities List ====================
const provinces = [
  { id: 'alborz', name: 'البرز', cities: ['کرج', 'فردیس', 'نظرآباد', 'ساوجبلاغ', 'طالقان'] },
  { id: 'ardabil', name: 'اردبیل', cities: ['اردبیل', 'پارس‌آباد', 'مشکین‌شهر', 'خلخال', 'گرمی'] },
  { id: 'bushehr', name: 'بوشهر', cities: ['بوشهر', 'برازجان', 'کنگان', 'دیلم', 'گناوه'] },
  { id: 'chaharmahal', name: 'چهارمحال و بختیاری', cities: ['شهرکرد', 'بروجن', 'فارسان', 'لردگان'] },
  { id: 'east_azerbaijan', name: 'آذربایجان شرقی', cities: ['تبریز', 'مراغه', 'مرند', 'میانه', 'اهر'] },
  { id: 'fars', name: 'فارس', cities: ['شیراز', 'مرودشت', 'جهرم', 'فسا', 'کازرون', 'لار'] },
  { id: 'gilan', name: 'گیلان', cities: ['رشت', 'لاهیجان', 'بندر انزلی', 'آستارا', 'تالش'] },
  { id: 'golestan', name: 'گلستان', cities: ['گرگان', 'گنبد کاووس', 'علی‌آباد', 'آق‌قلا', 'بندر ترکمن'] },
  { id: 'hamadan', name: 'همدان', cities: ['همدان', 'ملایر', 'نهاوند', 'تویسرکان', 'اسدآباد'] },
  { id: 'hormozgan', name: 'هرمزگان', cities: ['بندرعباس', 'قشم', 'کیش', 'بندر لنگه', 'میناب'] },
  { id: 'ilam', name: 'ایلام', cities: ['ایلام', 'دهلران', 'آبدانان', 'دره‌شهر'] },
  { id: 'isfahan', name: 'اصفهان', cities: ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر', 'لنجان'] },
  { id: 'kerman', name: 'کرمان', cities: ['کرمان', 'رفسنجان', 'جیرفت', 'سیرجان', 'بم'] },
  { id: 'kermanshah', name: 'کرمانشاه', cities: ['کرمانشاه', 'اسلام‌آباد غرب', 'کنگاور', 'صحنه', 'هرسین'] },
  { id: 'khuzestan', name: 'خوزستان', cities: ['اهواز', 'آبادان', 'خرمشهر', 'دزفول', 'بهبهان', 'شوشتر'] },
  { id: 'kohgiluyeh', name: 'کهگیلویه و بویراحمد', cities: ['یاسوج', 'دوگنبدان', 'دهدشت', 'لیکک'] },
  { id: 'kordestan', name: 'کردستان', cities: ['سنندج', 'سقز', 'مریوان', 'بانه', 'قروه'] },
  { id: 'lorestan', name: 'لرستان', cities: ['خرم‌آباد', 'بروجرد', 'دورود', 'الیگودرز', 'کوهدشت'] },
  { id: 'markazi', name: 'مرکزی', cities: ['اراک', 'ساوه', 'خمین', 'محلات', 'دلیجان'] },
  { id: 'mazandaran', name: 'مازندران', cities: ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'نوشهر', 'چالوس'] },
  { id: 'north_khorasan', name: 'خراسان شمالی', cities: ['بجنورد', 'اسفراین', 'شیروان', 'آشخانه'] },
  { id: 'qazvin', name: 'قزوین', cities: ['قزوین', 'تاکستان', 'آبیک', 'بوئین‌زهرا'] },
  { id: 'qom', name: 'قم', cities: ['قم', 'کهک', 'جعفریه'] },
  { id: 'semnan', name: 'سمنان', cities: ['سمنان', 'شاهرود', 'دامغان', 'گرمسار'] },
  { id: 'sistan', name: 'سیستان و بلوچستان', cities: ['زاهدان', 'چابهار', 'زابل', 'ایرانشهر', 'خاش'] },
  { id: 'south_khorasan', name: 'خراسان جنوبی', cities: ['بیرجند', 'قائن', 'فردوس', 'طبس'] },
  { id: 'tehran', name: 'تهران', cities: ['تهران', 'ری', 'شمیرانات', 'اسلامشهر', 'پاکدشت', 'ورامین', 'دماوند'] },
  { id: 'west_azerbaijan', name: 'آذربایجان غربی', cities: ['ارومیه', 'خوی', 'میاندوآب', 'بوکان', 'مهاباد'] },
  { id: 'yazd', name: 'یزد', cities: ['یزد', 'میبد', 'اردکان', 'تفت', 'بافق'] },
  { id: 'zanjan', name: 'زنجان', cities: ['زنجان', 'ابهر', 'خرمدره', 'ماه‌نشان'] },
];

// ==================== Main Component ====================
export default function SellerRequestPage() {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState('');

  // دریافت وضعیت درخواست
  const { data: requestData, isLoading, refetch } = useQuery({
    queryKey: ['seller-request-status'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/user/seller-request-status`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (!res.ok) return null; 
      const data = await res.json();
      return data.data;
    },
    retry: false,
  });

  const statusConfig = getStatusConfig(requestData?.status || 'no_request');
  const currentStatus = requestData?.status || 'no_request';

  // --- View 1: فرم ثبت‌نام اولیه ---
  const InitialForm = () => {
    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<InitialFormData>({ 
      resolver: zodResolver(initialSchema) 
    });
    
    const watchedProvince = watch('province');

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const provinceId = e.target.value;
      setSelectedProvince(provinceId);
      setValue('province', provinceId);
      setValue('city', '');
    };

    const { mutate, isPending } = useMutation({
      mutationFn: async (data: InitialFormData) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/seller-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'خطا در ثبت درخواست');
        return res.json();
      },
      onSuccess: () => {
        toast.success('درخواست اولیه ثبت شد. منتظر تایید ادمین باشید.');
        refetch();
      },
      onError: (error: any) => toast.error(error.message),
    });

    const selectedProvinceData = provinces.find(p => p.id === watchedProvince);

    return (
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">نام و نام خانوادگی <span className="text-red-500">*</span></label>
            <input {...register('full_name')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="نام کامل" />
            {errors.full_name && <p className="text-red-500 text-xs mt-1.5">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">کد ملی <span className="text-red-500">*</span></label>
            <input {...register('national_code')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dir-ltr text-left font-mono" placeholder="1234567890" maxLength={10} />
            {errors.national_code && <p className="text-red-500 text-xs mt-1.5">{errors.national_code.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">شماره موبایل <span className="text-red-500">*</span></label>
            <input {...register('phone')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dir-ltr text-left font-mono" placeholder="09123456789" maxLength={11} />
            {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">نام پیشنهادی فروشگاه <span className="text-red-500">*</span></label>
            <input {...register('proposed_shop_name')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="مثال: موبایل تهران" />
            {errors.proposed_shop_name && <p className="text-red-500 text-xs mt-1.5">{errors.proposed_shop_name.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline-block ml-1" />
              استان <span className="text-red-500">*</span>
            </label>
            <select 
              {...register('province')}
              onChange={handleProvinceChange}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            >
              <option value="">انتخاب استان...</option>
              {provinces.map(province => (
                <option key={province.id} value={province.id}>{province.name}</option>
              ))}
            </select>
            {errors.province && <p className="text-red-500 text-xs mt-1.5">{errors.province.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline-block ml-1" />
              شهر <span className="text-red-500">*</span>
            </label>
            <select 
              {...register('city')}
              disabled={!selectedProvinceData}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{selectedProvinceData ? 'انتخاب شهر...' : 'ابتدا استان را انتخاب کنید'}</option>
              {selectedProvinceData?.cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors.city && <p className="text-red-500 text-xs mt-1.5">{errors.city.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Briefcase className="w-4 h-4 inline-block ml-1" />
            حوزه فعالیت و محصولات <span className="text-red-500">*</span>
          </label>
          <textarea 
            {...register('business_activity')}
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" 
            placeholder="لطفاً حوزه فعالیت خود و محصولات اصلی که قصد فروش آن‌ها را دارید توضیح دهید..."
          />
          {errors.business_activity && <p className="text-red-500 text-xs mt-1.5">{errors.business_activity.message}</p>}
        </div>

        <button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 mt-4 font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-70 shadow-lg shadow-blue-500/20">
          {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ارسال...</> : <>ارسال درخواست اولیه <ArrowLeft className="w-5 h-5" /></>}
        </button>
      </form>
    );
  };

  // --- View 2: فرم بارگذاری مدارک ---
  const DocumentsForm = () => {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<DocumentsFormData>({ 
      resolver: zodResolver(documentsSchema) 
    });
    
    const { mutate, isPending } = useMutation({
      mutationFn: async (data: DocumentsFormData) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('bank_account', data.bank_account);
        if (data.id_card_image?.[0]) formData.append('id_card_image', data.id_card_image[0]);
        if (data.business_license_image?.[0]) formData.append('business_license_image', data.business_license_image[0]);

        const res = await fetch(`${API_BASE}/seller-requests/${requestData.id}/upload-documents`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'خطا در بارگذاری مدارک');
        return res.json();
      },
      onSuccess: () => {
        toast.success('مدارک بارگذاری شد. منتظر بررسی نهایی ادمین باشید.');
        refetch();
      },
      onError: (error: any) => toast.error(error.message),
    });

    return (
      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-3">
          <p className="text-sm text-blue-800 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>تایید اولیه انجام شد. لطفاً مدارک زیر را برای فعال‌سازی نهایی بارگذاری کنید.</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 inline-block ml-1" />
            شماره شبا یا حساب بانکی <span className="text-red-500">*</span>
          </label>
          <input {...register('bank_account')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dir-ltr text-left font-mono" placeholder="IR000000000000000000000000" />
          {errors.bank_account && <p className="text-red-500 text-xs mt-1.5">{errors.bank_account.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline-block ml-1" />
            تصویر کارت ملی <span className="text-red-500">*</span>
          </label>
          <input type="file" accept="image/*" onChange={(e) => setValue('id_card_image', e.target.files)} className="w-full p-3 border border-gray-200 rounded-xl text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          {errors.id_card_image && <p className="text-red-500 text-xs mt-1.5">{String(errors.id_card_image.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Building2 className="w-4 h-4 inline-block ml-1" />
            تصویر پروانه کسب (اختیاری)
          </label>
          <input type="file" accept="image/*" onChange={(e) => setValue('business_license_image', e.target.files)} className="w-full p-3 border border-gray-200 rounded-xl text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100" />
        </div>

        <button type="submit" disabled={isPending} className="w-full bg-green-600 text-white py-3.5 rounded-xl hover:bg-green-700 mt-4 font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-70 shadow-lg shadow-green-500/20">
          {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال بارگذاری...</> : <>بارگذاری و ارسال برای بررسی نهایی <Upload className="w-5 h-5" /></>}
        </button>
      </form>
    );
  };

  // --- View 3: وضعیت‌های انتظار یا رد ---
  const StatusView = () => (
    <div className={`text-center py-8 animate-in fade-in zoom-in-95 duration-300 ${statusConfig.bg} rounded-xl border border-gray-100`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${statusConfig.bg.replace('50', '100')}`}>
        <statusConfig.icon className={`w-10 h-10 ${statusConfig.color}`} />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${statusConfig.color}`}>{statusConfig.title}</h3>
      <p className="text-gray-600 text-sm mb-5 px-6 leading-relaxed">{statusConfig.desc}</p>
      
      {requestData?.status === 'rejected' && requestData?.rejection_reason && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-5 mx-6 text-right">
          <p className="text-sm font-bold text-red-700 mb-1.5">دلیل رد درخواست:</p>
          <p className="text-sm text-red-600">{requestData.rejection_reason}</p>
        </div>
      )}

      <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold transition-colors text-sm flex items-center gap-2 mx-auto shadow-sm">
        <Home className="w-4 h-4" /> بازگشت به صفحه اصلی
      </button>
    </div>
  );

  // --- View 4: تایید نهایی ---
  const ApprovedView = () => (
    <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <Store className="w-12 h-12 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">شعبه آنلاین شما فعال است! 🎉</h3>
      <p className="text-gray-600 mb-6 text-sm leading-relaxed px-6">اکنون می‌توانید وارد پنل مدیریت شوید و محصولات خود را ثبت کنید.</p>
      <button onClick={() => navigate('/seller')} className="px-10 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center gap-2 mx-auto text-base">
        ورود به پنل مدیریت فروشگاه <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );

  // ==================== Render Logic ====================
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative" dir="rtl">
      <button onClick={() => navigate('/')} className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium bg-white px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md border border-gray-100">
        <Home className="w-5 h-5" /> <span>صفحه اصلی</span>
      </button>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h1 className="text-2xl font-black text-gray-800 mb-8 text-center leading-snug">
          افتتاح شعبه آنلاین
        </h1>

        {/* Stepper Indicator - Always Visible */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 -translate-y-1/2 mx-12" />
            <div 
              className="absolute top-1/2 left-0 h-1 -z-10 -translate-y-1/2 transition-all duration-500 mx-12" 
              style={{ 
                width: `${(statusConfig.step / 3) * 100}%`, 
                right: 'auto',
                backgroundColor: statusConfig.step === 3 && currentStatus === 'approved' ? '#10b981' : '#2563eb'
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
                <div key={item.step} className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted 
                      ? 'bg-green-500 text-white border-green-500' 
                      : isCurrent 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-400 border-gray-200'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <span className="text-base font-bold">{item.step}</span>}
                  </div>
                  <span className={`text-xs font-bold ${
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
        {currentStatus === 'no_request' && <InitialForm />}
        {currentStatus === 'pending_initial' && <StatusView />}
        {currentStatus === 'pending_documents' && <DocumentsForm />}
        {currentStatus === 'pending_final' && <StatusView />}
        {currentStatus === 'approved' && <ApprovedView />}
        {currentStatus === 'rejected' && <StatusView />}
      </div>
    </div>
  );
}