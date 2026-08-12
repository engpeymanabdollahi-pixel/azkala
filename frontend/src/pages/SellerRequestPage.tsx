import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  CheckCircle, Store, User, Clock, Building2, Home, Loader2,
  ArrowLeft, Upload, FileText, CreditCard, MapPin, Briefcase, XCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, type NavigateFunction, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '@/services/api/client';
import { useAuthStore } from '@/store/authStore';
import { toLatinDigits } from '@/utils/digits';

// ==================== 0. Helper: Extract Backend Error ====================
function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response;
    if (response?.data?.errors) {
      const first = Object.values(response.data.errors)[0];
      if (first?.[0]) return first[0];
    }
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

// ==================== 1. Schema Definitions ====================
const initialSchema = z.object({
  full_name: z.string().min(3, 'حداقل ۳ کاراکتر وارد کنید'),
  national_code: z
    .string()
    .transform(toLatinDigits)
    .refine((value) => /^\d{10}$/.test(value), 'کد ملی باید دقیقاً ۱۰ رقم باشد'),
  phone: z
    .string()
    .transform(toLatinDigits)
    .refine((value) => /^09\d{9}$/.test(value), 'شماره موبایل معتبر نیست (مثال: 09123456789)'),
  province: z.string().min(1, 'لطفاً استان را انتخاب کنید'),
  city: z.string().min(1, 'لطفاً شهر را انتخاب کنید'),
  proposed_shop_name: z.string().min(3, 'حداقل ۳ کاراکتر وارد کنید'),
  business_activity: z.string().min(10, 'لطفاً توضیحات کامل‌تری ارائه دهید (حداقل ۱۰ کاراکتر)'),
  accepted_terms: z.boolean().refine((val) => val === true, {
    message: 'پذیرش قوانین و مقررات ازکالا الزامی است',
  }),
});

const documentsSchema = z.object({
  bank_account: z.string().min(10, 'شماره شبا یا حساب معتبر نیست (حداقل ۱۰ کاراکتر)'),
  bank_name: z.string().min(2, 'نام بانک را وارد کنید'),
  shop_alias: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است')
    .max(50, 'حداکثر ۵۰ کاراکتر')
    .optional()
    .or(z.literal('')),
  id_card_image: z.custom<FileList>((files) => files instanceof FileList && files.length > 0, 'بارگذاری تصویر کارت ملی الزامی است'),
  business_license_image: z.custom<FileList | undefined>().optional(),
});

type InitialFormData = z.infer<typeof initialSchema>;
type DocumentsFormData = z.infer<typeof documentsSchema>;

// ==================== 2. Types ====================
interface SellerRequestStatusData {
  id: number;
  status: 'pending_initial' | 'pending_documents' | 'pending_final' | 'approved' | 'rejected';
  proposed_shop_name?: string;
  bank_account?: string | null;
  rejection_reason?: string | null;
}

interface StatusConfig {
  step: number;
  title: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof Clock;
}

interface InitialFormProps {
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  onSubmit: (data: InitialFormData) => void;
  isPending: boolean;
}

interface DocumentsFormProps {
  onSubmit: (data: DocumentsFormData) => void;
  isPending: boolean;
}

interface StatusViewProps {
  config: StatusConfig;
  requestData: SellerRequestStatusData | null | undefined;
  navigate: NavigateFunction;
  onResubmit?: () => void;
}

// ==================== 3. Helper: Status Mapping ====================
const getStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case 'pending_initial':
      return { step: 1, title: 'در انتظار بررسی اولیه', desc: 'درخواست شما ثبت شد و در صف بررسی کارشناسان قرار دارد.', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: Clock };
    case 'pending_documents':
      return { step: 2, title: 'بارگذاری مدارک', desc: 'تبریک! درخواست اولیه شما تأیید شد. لطفاً مدارک هویتی و مالی خود را بارگذاری کنید.', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: Upload };
    case 'pending_final':
      return { step: 3, title: 'بررسی نهایی', desc: 'مدارک شما با موفقیت دریافت شد و در حال بررسی نهایی برای افتتاح شعبه است.', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: Clock };
    case 'approved':
      return { step: 3, title: 'تأیید نهایی و افتتاح شعبه', desc: 'تبریک می‌گوییم! شعبه آنلاین شما با موفقیت فعال شد.', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: CheckCircle };
    case 'rejected':
      return { step: 0, title: 'درخواست رد شد', desc: 'متأسفانه درخواست شما با مشکل مواجه شد. لطفاً دلیل ذکر شده را بررسی کنید.', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: XCircle };
    default:
      return { step: 1, title: 'شروع فرآیند', desc: 'لطفاً فرم زیر را با دقت تکمیل کنید تا فرآیند افتتاح شعبه آغاز شود.', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-slate-800', border: 'border-gray-200 dark:border-slate-700', icon: User };
  }
};

// ==================== 4. Provinces & Cities Data ====================
const provinces = [
  { id: 'east_azerbaijan', name: 'آذربایجان شرقی', cities: ['تبریز', 'مراغه', 'مرند', 'میانه', 'اهر'] },
  { id: 'west_azerbaijan', name: 'آذربایجان غربی', cities: ['ارومیه', 'خوی', 'مهاباد', 'بوکان', 'سلماس'] },
  { id: 'ardabil', name: 'اردبیل', cities: ['اردبیل', 'مشگین‌شهر', 'پارس‌آباد', 'خلخال'] },
  { id: 'isfahan', name: 'اصفهان', cities: ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر'] },
  { id: 'alborz', name: 'البرز', cities: ['کرج', 'نظرآباد', 'هشتگرد', 'ماهدشت'] },
  { id: 'ilam', name: 'ایلام', cities: ['ایلام', 'دهلران', 'آبدانان', 'ایوان'] },
  { id: 'bushehr', name: 'بوشهر', cities: ['بوشهر', 'برازجان', 'گناوه', 'کنگان'] },
  { id: 'tehran', name: 'تهران', cities: ['تهران', 'ری', 'شمیرانات', 'اسلامشهر', 'پاکدشت', 'ورامین', 'دماوند'] },
  { id: 'chaharmahal_bakhtiari', name: 'چهارمحال و بختیاری', cities: ['شهرکرد', 'بروجن', 'فارسان'] },
  { id: 'south_khorasan', name: 'خراسان جنوبی', cities: ['بیرجند', 'قائنات', 'فردوس'] },
  { id: 'khorasan_razavi', name: 'خراسان رضوی', cities: ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'قوچان'] },
  { id: 'north_khorasan', name: 'خراسان شمالی', cities: ['بجنورد', 'شیروان', 'اسفراین'] },
  { id: 'khuzestan', name: 'خوزستان', cities: ['اهواز', 'آبادان', 'خرمشهر', 'دزفول', 'بهبهان', 'شوشتر'] },
  { id: 'zanjan', name: 'زنجان', cities: ['زنجان', 'ابهر', 'خدابنده'] },
  { id: 'semnan', name: 'سمنان', cities: ['سمنان', 'شاهرود', 'دامغان', 'گرمسار'] },
  { id: 'sistan_baluchestan', name: 'سیستان و بلوچستان', cities: ['زاهدان', 'چابهار', 'ایرانشهر', 'زابل'] },
  { id: 'fars', name: 'فارس', cities: ['شیراز', 'مرودشت', 'جهرم', 'فسا', 'کازرون', 'لار'] },
  { id: 'qazvin', name: 'قزوین', cities: ['قزوین', 'آبیک', 'تاکستان'] },
  { id: 'qom', name: 'قم', cities: ['قم'] },
  { id: 'kurdistan', name: 'کردستان', cities: ['سنندج', 'سقز', 'مریوان', 'بانه'] },
  { id: 'kerman', name: 'کرمان', cities: ['کرمان', 'رفسنجان', 'سیرجان', 'بم', 'جیرفت'] },
  { id: 'kermanshah', name: 'کرمانشاه', cities: ['کرمانشاه', 'اسلام‌آباد غرب', 'پاوه', 'سنقر'] },
  { id: 'kohgiluyeh_boyerahmad', name: 'کهگیلویه و بویراحمد', cities: ['یاسوج', 'گچساران', 'دهدشت'] },
  { id: 'golestan', name: 'گلستان', cities: ['گرگان', 'گنبد کاووس', 'علی‌آباد کتول'] },
  { id: 'gilan', name: 'گیلان', cities: ['رشت', 'لاهیجان', 'بندر انزلی', 'آستارا', 'تالش'] },
  { id: 'lorestan', name: 'لرستان', cities: ['خرم‌آباد', 'بروجرد', 'دورود', 'الیگودرز'] },
  { id: 'mazandaran', name: 'مازندران', cities: ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'نوشهر', 'چالوس'] },
  { id: 'markazi', name: 'مرکزی', cities: ['اراک', 'ساوه', 'خمین', 'محلات'] },
  { id: 'hormozgan', name: 'هرمزگان', cities: ['بندرعباس', 'میناب', 'قشم', 'بندرلنگه'] },
  { id: 'hamadan', name: 'همدان', cities: ['همدان', 'ملایر', 'نهاوند', 'تویسرکان'] },
  { id: 'yazd', name: 'یزد', cities: ['یزد', 'میبد', 'اردکان', 'بافق'] },
];

// ==================== 5. Main Component ====================
export default function SellerRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [isResubmitting, setIsResubmitting] = useState(false);

  // دریافت وضعیت درخواست
  const { data: requestData, isLoading } = useQuery({
    queryKey: ['seller-request-status'],
    queryFn: async (): Promise<SellerRequestStatusData | null> => {
      try {
        const res = await apiClient.get('/user/seller-request-status');
        return res.data?.data ?? res.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // ✅ دریافت URL تصویر پس‌زمینه از تنظیمات سایت
  const { data: siteSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/site-settings');
      return res.data?.data || res.data || {};
    },
    staleTime: 10 * 60 * 1000,
  });
  const bgImageUrl = (siteSettings as any)?.seller_request_bg_image || '/images/iran-aerial.jpg';

  const currentStatus = isResubmitting ? 'no_request' : requestData?.status || 'no_request';
  const statusConfig = getStatusConfig(currentStatus);

  // Mutation 1: فرم ثبت‌نام اولیه
  const initialMutation = useMutation({
    mutationFn: async (data: InitialFormData) => {
      if (!isAuthenticated) throw new Error('لطفاً ابتدا وارد حساب کاربری خود شوید.');
      const res = await apiClient.post('/seller-requests', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('درخواست اولیه با موفقیت ثبت شد. منتظر تأیید ادمین باشید.');
      setIsResubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['seller-request-status'] });
    },
    onError: (error: unknown) => toast.error(extractErrorMessage(error, 'خطا در ثبت درخواست')),
  });

  // Mutation 2: فرم بارگذاری مدارک
  const documentsMutation = useMutation({
    mutationFn: async (data: DocumentsFormData) => {
      if (!isAuthenticated) throw new Error('لطفاً ابتدا وارد حساب کاربری خود شوید.');
      if (!requestData?.id) throw new Error('شناسه درخواست یافت نشد. لطفاً صفحه را رفرش کنید.');

      const formData = new FormData();
      formData.append('bank_account', data.bank_account);
      formData.append('bank_name', data.bank_name);
      if (data.shop_alias) formData.append('shop_alias', data.shop_alias);

      const idCardFiles = data.id_card_image;
      if (idCardFiles && idCardFiles.length > 0) {
        formData.append('id_card_image', idCardFiles[0]);
      }

      const licenseFiles = data.business_license_image;
      if (licenseFiles && licenseFiles.length > 0) {
        formData.append('business_license_image', licenseFiles[0]);
      }

      const res = await apiClient.post(`/seller-requests/${requestData.id}/upload-documents`, formData);
      return res.data;
    },
    onSuccess: () => {
      toast.success('مدارک با موفقیت بارگذاری شد. منتظر بررسی نهایی ادمین باشید.');
      queryClient.invalidateQueries({ queryKey: ['seller-request-status'] });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'خطا در بارگذاری مدارک'));
    },
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">در حال دریافت وضعیت درخواست...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative" dir="rtl">
      {/* ✅ پس‌زمینه هوایی ایران */}
      <div
        key={bgImageUrl}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-500"
        style={{ backgroundImage: `url(${bgImageUrl})` }}
        aria-hidden="true"
      />
      {/* Overlay برای خوانایی محتوا */}
      <div className="fixed inset-0 bg-white/85 dark:bg-slate-900/90 pointer-events-none backdrop-blur-[2px]" aria-hidden="true" />

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium bg-white/80 dark:bg-slate-800/80 backdrop-blur px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-700 z-10"
      >
        <Home className="w-4 h-4" /> <span>صفحه اصلی</span>
      </button>

      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 p-6 sm:p-10 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">افتتاح شعبه آنلاین</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">برای شروع فروش در ازکالا، مراحل زیر را تکمیل کنید</p>
        </div>

        {/* Stepper Indicator */}
        <div className="mb-10 px-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 dark:bg-slate-700 -z-10 -translate-y-1/2 mx-12 rounded-full" />
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
                <div key={item.step} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800 px-2 relative z-10">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30'
                      : isCurrent
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-110'
                        : 'bg-white dark:bg-slate-800 text-gray-300 dark:text-slate-600 border-gray-200 dark:border-slate-700'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="text-sm sm:text-base font-bold">{item.step}</span>}
                  </div>
                  <span className={`text-xs sm:text-sm font-bold transition-colors ${
                    isCompleted ? 'text-green-600 dark:text-green-400' : isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
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
        {currentStatus === 'rejected' && (
          <StatusView config={statusConfig} requestData={requestData} navigate={navigate} onResubmit={() => setIsResubmitting(true)} />
        )}
      </div>
    </div>
  );
}

// ==================== 6. Sub-Components ====================

function InitialForm({ setSelectedProvince, onSubmit, isPending }: InitialFormProps) {
  const { user } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<InitialFormData>({
    resolver: zodResolver(initialSchema),
  });

  // ✅ پر کردن مقادیر پیش‌فرض بعد از mount
  useEffect(() => {
    if (user?.phone) setValue('phone', user.phone);
    if (user?.name) setValue('full_name', user.name);
  }, [user, setValue]);

  const watchedProvince = watch('province');
  const selectedProvinceData = provinces.find((p) => p.id === watchedProvince);

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
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نام و نام خانوادگی <span className="text-red-500">*</span></label>
          <input {...register('full_name')} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100" placeholder="مثال: علی احمدی" />
          {errors.full_name && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.full_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">کد ملی <span className="text-red-500">*</span></label>
          <input {...register('national_code')} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dir-ltr text-left font-mono bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100" placeholder="1234567890" maxLength={10} />
          {errors.national_code && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.national_code.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">شماره موبایل <span className="text-red-500">*</span></label>
          <input {...register('phone')} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dir-ltr text-left font-mono bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100" placeholder="09123456789" maxLength={11} />
          {errors.phone && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نام پیشنهادی فروشگاه <span className="text-red-500">*</span></label>
          <input {...register('proposed_shop_name')} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100" placeholder="مثال: دیجیتال استور" />
          {errors.proposed_shop_name && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.proposed_shop_name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"><MapPin className="w-4 h-4 inline-block ml-1 text-gray-400 dark:text-gray-500" /> استان <span className="text-red-500">*</span></label>
          <select {...register('province')} onChange={handleProvinceChange} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100">
            <option value="">انتخاب استان...</option>
            {provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
          </select>
          {errors.province && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.province.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"><MapPin className="w-4 h-4 inline-block ml-1 text-gray-400 dark:text-gray-500" /> شهر <span className="text-red-500">*</span></label>
          <select {...register('city')} disabled={!selectedProvinceData} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed">
            <option value="">{selectedProvinceData ? 'انتخاب شهر...' : 'ابتدا استان را انتخاب کنید'}</option>
            {selectedProvinceData?.cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          {errors.city && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.city.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"><Briefcase className="w-4 h-4 inline-block ml-1 text-gray-400 dark:text-gray-500" /> حوزه فعالیت و محصولات <span className="text-red-500">*</span></label>
        <textarea {...register('business_activity')} rows={4} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100" placeholder="لطفاً حوزه فعالیت خود و محصولات اصلی که قصد فروش آن‌ها را دارید توضیح دهید..." />
        {errors.business_activity && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.business_activity.message}</p>}
      </div>

      {/* ✅ چک‌باکس قوانین و مقررات ازکالا */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
        <input
          type="checkbox"
          id="accepted_terms"
          {...register('accepted_terms')}
          className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer flex-shrink-0"
        />
        <label htmlFor="accepted_terms" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer select-none">
          اینجانب{' '}
          <Link
            to="/terms"
            target="_blank"
            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            قوانین و مقررات ازکالا
          </Link>
          {' '}و{' '}
          <Link
            to="/terms#privacy"
            target="_blank"
            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            سیاست حفظ حریم خصوصی
          </Link>
          {' '}را مطالعه کرده و می‌پذیرم.
        </label>
      </div>
      {errors.accepted_terms && (
        <p className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors.accepted_terms.message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3.5 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 mt-2 font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
        {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ارسال...</> : <>ارسال درخواست اولیه <ArrowLeft className="w-5 h-5" /></>}
      </button>
    </form>
  );
}

function DocumentsForm({ onSubmit, isPending }: DocumentsFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<DocumentsFormData>({
    resolver: zodResolver(documentsSchema)
  });

  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setValue('id_card_image', files ?? undefined as unknown as FileList);
    if (files && files[0]) {
      setIdCardPreview(URL.createObjectURL(files[0]));
    }
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setValue('business_license_image', files ?? undefined);
    if (files && files[0]) {
      setLicensePreview(URL.createObjectURL(files[0]));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium leading-relaxed">تأیید اولیه انجام شد. لطفاً مدارک زیر را برای فعال‌سازی نهایی و دریافت تسویه‌حساب بارگذاری کنید.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"><CreditCard className="w-4 h-4 inline-block ml-1 text-gray-400 dark:text-gray-500" /> نام بانک <span className="text-red-500">*</span></label>
          <input {...register('bank_name')} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100" placeholder="مثال: بانک ملت" />
          {errors.bank_name && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.bank_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"><CreditCard className="w-4 h-4 inline-block ml-1 text-gray-400 dark:text-gray-500" /> شماره شبا یا حساب بانکی <span className="text-red-500">*</span></label>
          <input {...register('bank_account')} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm dir-ltr text-left font-mono bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100" placeholder="IR000000000000000000000000" />
          {errors.bank_account && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.bank_account.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"><Store className="w-4 h-4 inline-block ml-1 text-gray-400 dark:text-gray-500" /> نام مستعار آدرس فروشگاه <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">(اختیاری)</span></label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap">azkala.ir/seller/</span>
          <input {...register('shop_alias')} dir="ltr" className="flex-1 p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-left font-mono bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100" placeholder="my-shop" />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">اگر خالی بگذارید، از نام فروشگاه شما به‌صورت خودکار ساخته می‌شود.</p>
        {errors.shop_alias && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.shop_alias.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"><FileText className="w-4 h-4 inline-block ml-1 text-gray-400 dark:text-gray-500" /> تصویر کارت ملی <span className="text-red-500">*</span></label>
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg, image/png, image/jpg"
            onChange={handleIdCardChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all text-center group">
            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">برای انتخاب تصویر کارت ملی کلیک کنید</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">فرمت‌های مجاز: JPG, PNG (حداکثر ۵ مگابایت)</p>
          </div>
        </div>
        {idCardPreview && (
          <div className="mt-3 relative inline-block">
            <img src={idCardPreview} alt="پیش‌نمایش کارت ملی" className="h-32 rounded-lg object-cover border border-blue-200 dark:border-blue-800 shadow-sm" />
            <button
              type="button"
              onClick={() => { setIdCardPreview(null); setValue('id_card_image', undefined as unknown as FileList); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
        {errors.id_card_image && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {String(errors.id_card_image.message)}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"><Building2 className="w-4 h-4 inline-block ml-1 text-gray-400 dark:text-gray-500" /> تصویر پروانه کسب <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">(اختیاری)</span></label>
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg, image/png, image/jpg"
            onChange={handleLicenseChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all text-center group">
            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">برای انتخاب تصویر جواز کسب کلیک کنید</p>
          </div>
        </div>
        {licensePreview && (
          <div className="mt-3 relative inline-block">
            <img src={licensePreview} alt="پیش‌نمایش جواز کسب" className="h-32 rounded-lg object-cover border border-blue-200 dark:border-blue-800 shadow-sm" />
            <button
              type="button"
              onClick={() => { setLicensePreview(null); setValue('business_license_image', undefined); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <button type="submit" disabled={isPending} className="w-full bg-green-600 dark:bg-green-500 text-white py-3.5 rounded-xl hover:bg-green-700 dark:hover:bg-green-600 mt-2 font-bold transition-all flex items-center justify-center gap-2 text-base disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 hover:shadow-green-500/30">
        {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال بارگذاری...</> : <>بارگذاری و ارسال برای بررسی نهایی <Upload className="w-5 h-5" /></>}
      </button>
    </form>
  );
}

function StatusView({ config, requestData, navigate, onResubmit }: StatusViewProps) {
  const Icon = config.icon;
  return (
    <div className={`text-center py-8 animate-in fade-in zoom-in-95 duration-500 ${config.bg} rounded-2xl border ${config.border}`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-white/60 dark:bg-white/5`}>
        <Icon className={`w-10 h-10 ${config.color}`} />
      </div>
      <h3 className={`text-xl font-black mb-3 ${config.color}`}>{config.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 px-8 leading-relaxed">{config.desc}</p>

      {requestData?.status === 'rejected' && requestData?.rejection_reason && (
        <div className="bg-white/60 dark:bg-slate-800/60 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-6 mx-6 text-right backdrop-blur-sm">
          <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1.5 flex items-center gap-2"><XCircle className="w-4 h-4" /> دلیل رد درخواست:</p>
          <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{requestData.rejection_reason}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onResubmit && (
          <button onClick={onResubmit} className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 font-bold transition-all text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <RefreshCw className="w-4 h-4" /> ارسال درخواست مجدد
          </button>
        )}
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500 font-bold transition-all text-sm flex items-center gap-2 shadow-sm hover:shadow-md">
          <Home className="w-4 h-4" /> بازگشت به صفحه اصلی
        </button>
      </div>
    </div>
  );
}

function ApprovedView({ navigate }: { navigate: NavigateFunction }) {
  return (
    <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Store className="w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-3">شعبه آنلاین شما فعال است! 🎉</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm leading-relaxed px-6">اکنون می‌توانید وارد پنل مدیریت شوید، محصولات خود را ثبت کنید و فروش را آغاز نمایید.</p>
      <button onClick={() => navigate('/seller')} className="px-10 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all font-bold flex items-center gap-2 mx-auto text-base">
        ورود به پنل مدیریت فروشگاه <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );
}