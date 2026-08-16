import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  User, Mail, Phone, Calendar, Edit2, Save, X, Lock,
  Shield, Store, ArrowLeft, Gift, Copy, Link2, Users, ChevronDown, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { useWishlistStore } from '@/store/wishlistStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { orderService } from '@/services/api/order.service';
import { profileService } from '@/services/api/profile.service';
import { couponService } from '@/services/api/coupon.service';
import { referralService, type ReferralListItem } from '@/services/api/referral.service';
import apiClient from '@/services/api/client';
import { formatPrice } from '@/utils/format';

// ✅ Referral System Phase 3: برچسب/رنگ فارسی هر وضعیت — یک‌جا تعریف
// شده تا کارت خلاصه و لیست تاریخچه هر دو از همین منبع واحد استفاده کنند.
const REFERRAL_STATUS_META: Record<ReferralListItem['status'], { label: string; variant: 'gray' | 'primary' | 'success' | 'error' }> = {
  pending: { label: 'در انتظار خرید اول', variant: 'gray' },
  qualified: { label: 'واجد شرایط پاداش', variant: 'primary' },
  rewarded: { label: 'پاداش دریافت شد', variant: 'success' },
  cancelled: { label: 'لغو شده', variant: 'error' },
  rejected: { label: 'رد شده', variant: 'error' },
};

// ✅ قبلاً status فقط 'pending' | 'approved' | 'rejected' بود، ولی مقادیر
// واقعی pending_initial/pending_documents/pending_final/approved/rejected
// هستند (رجوع به SellerRequestPage.tsx). چون هیچ حالت واقعیِ «در انتظار»
// دقیقاً 'pending' نمی‌شود، کارت وضعیت پایین‌تر برای هر سه مرحله‌ی واقعیِ
// در جریان، توضیح و برچسبِ کاملاً خالی نشان می‌داد.
interface SellerRequestStatus {
  status: 'pending_initial' | 'pending_documents' | 'pending_final' | 'approved' | 'rejected';
  rejection_reason?: string;
}

const isSellerRequestPending = (status: SellerRequestStatus['status']) =>
  status === 'pending_initial' || status === 'pending_documents' || status === 'pending_final';

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

export function ProfileSection() {
  const { user, updateUser } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  // ✅ باید بالای early return زیر (`if (!user) return null`) تعریف شود، وگرنه
  // تعداد هوک‌های فراخوانی‌شده بین رندرها فرق می‌کند و React با خطای
  // "Rendered more hooks than during the previous render" کرش می‌کند.
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  // کوئری سفارشات
  const { data: ordersData } = useQuery({
    queryKey: ['my-orders-profile'],
    queryFn: () => orderService.getOrders(1),
  });

  // ✅ کوئری واقعی کوپن‌های فعال کاربر (قبلاً عدد «۳» هاردکد بود)
  const { data: couponsData } = useQuery({
    queryKey: ['my-coupons-profile'],
    queryFn: () => couponService.getMyCoupons(),
  });

  // ✅ Referral System Phase 2: کد/لینک دعوت کاربر جاری. GET /user/referral
  // خودش lazy کد را (اگر هنوز نداشت) تولید می‌کند، پس نیازی به mutation
  // جداگانه نیست.
  const { data: referralData } = useQuery({
    queryKey: ['my-referral-profile'],
    queryFn: () => referralService.getMyReferral(),
  });
  const referral = referralData?.data;

  // ✅ Referral System Phase 3: تاریخچه‌ی دعوت‌ها (getMyReferrals تا
  // پیش از این فاز در جایی صدا زده نمی‌شد). enabled فقط وقتی کارت
  // «دعوت از دوستان» اصلاً چیزی برای نمایش دارد (referral آماده شده)
  // اجرا می‌شود.
  const { data: referralHistoryData } = useQuery({
    queryKey: ['my-referrals-history'],
    queryFn: () => referralService.getMyReferrals(),
    enabled: !!referral,
  });
  const referralHistory = referralHistoryData?.data ?? [];
  const [showReferralHistory, setShowReferralHistory] = useState(false);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} کپی شد`, { icon: '📋' });
  };

  // ✅ کوئری وضعیت درخواست فروشندگی
  const { data: sellerRequestData } = useQuery({
    queryKey: ['seller-request-status'],
    queryFn: async (): Promise<SellerRequestStatus | null> => {
      try {
        const response = await apiClient.get('/user/seller-request-status');
        // این اندپوینت آبجکت درخواست را مستقیماً برمی‌گرداند (نه داخل کلید data)،
        // ولی نسخه‌ی قدیمی‌تر آن را داخل {success, data} می‌پیچید. مثل
        // SellerRequestPage هر دو شکل را می‌پذیریم؛ خواندن مستقیم response.data.data
        // باعث می‌شد مقدار undefined شود و کارت وضعیت درخواست هیچ‌وقت نمایش داده نشود.
        return response.data?.data ?? response.data ?? null;
      } catch (error) {
        // اگر بک‌اند 404 داد (یعنی درخواستی وجود ندارد)، به جای خطا، null برگردان
        const status = error instanceof Error && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
        if (status === 404 || status === 403) {
          return null;
        }
        throw error; // سایر خطاها را پرتاب کن
      }
    },
    retry: false,
  });

  const ordersCount = ordersData?.data?.total ?? 0;
  const activeCouponsCount = couponsData?.data?.length ?? 0;

  const updateMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (response) => {
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('اطلاعات به‌روزرسانی شد', { icon: '✅' });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'خطا در به‌روزرسانی'));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
      toast.success('رمز عبور تغییر کرد', { icon: '🔒' });
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'خطا در تغییر رمز'));
    },
  });

  if (!user) return null;

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error('نام الزامی است'); return; }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) { toast.error('ایمیل معتبر نیست'); return; }
    updateMutation.mutate(formData);
  };

  // ✅ «امتیاز وفاداری» قبلاً یک عدد ثابت (۸۵۰) بود — هیچ سیستم امتیاز
  // وفاداری‌ای در بک‌اند وجود ندارد، پس این کارت کامل حذف شد به‌جای نمایش
  // یک عدد جعلی. «کوپن فعال» حالا از /coupons/my واقعی می‌آید.
  const userStats = [
    { label: 'سفارشات', value: ordersCount, icon: '📦' },
    { label: 'علاقه‌مندی‌ها', value: wishlistItems.length, icon: '❤️' },
    { label: 'کوپن فعال', value: activeCouponsCount, icon: '🎁' },
  ];

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'نامشخص';

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-black border-2 border-white/30">
            {user.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black truncate">{user.name}</h2>
            <p className="text-white/90 text-sm flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
            <div className="flex gap-2 mt-1.5">
              <Badge variant="primary" className="bg-white/20 border-white/30 text-white text-[10px]">
                {user.role === 'seller' ? 'فروشنده' : user.role === 'admin' ? 'مدیر' : 'مشتری'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {userStats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{stat.label}</span>
            </div>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">
              {stat.value.toLocaleString('fa-IR')}
            </p>
          </div>
        ))}
      </div>

      {/* ✅ Referral System Phase 2/3: کارت «دعوت از دوستان» — کد/لینک +
          خلاصه‌ی پاداش (Phase 3) + تاریخچه‌ی جمع‌وجورِ قابل‌بازشدن. مبلغ
          پاداش هیچ‌جا هاردکد نیست — همیشه از پاسخ بک‌اند خوانده می‌شود. */}
      {referral && (
        <div className="bg-gradient-to-br from-accent-50 to-white dark:from-accent-900/20 dark:to-slate-800 border border-accent-100 dark:border-accent-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/40 rounded-xl flex items-center justify-center text-accent-600 dark:text-accent-400 flex-shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">دعوت از دوستان</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                کد و لینک دعوت خودتان را با دوستانتان به اشتراک بگذارید.
              </p>
            </div>
            {referral.total_referrals > 0 && (
              <Badge variant="primary" className="mr-auto gap-1">
                <Users className="w-3 h-3" />
                {referral.total_referrals.toLocaleString('fa-IR')} دعوت
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">کد معرف من</p>
                <p className="font-black text-gray-900 dark:text-gray-100 text-sm tracking-widest truncate">{referral.referral_code}</p>
              </div>
              <Button variant="outline" size="xs" onClick={() => handleCopy(referral.referral_code, 'کد معرف')} className="gap-1 flex-shrink-0">
                <Copy className="w-3 h-3" />
                کپی کد
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">لینک دعوت</p>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-xs truncate">{referral.referral_link}</p>
              </div>
              <Button variant="outline" size="xs" onClick={() => handleCopy(referral.referral_link, 'لینک دعوت')} className="gap-1 flex-shrink-0">
                <Link2 className="w-3 h-3" />
                کپی لینک
              </Button>
            </div>
          </div>

          {/* ✅ Referral System Phase 3: مجموع پاداش دریافتی — فقط وقتی
              حداقل یک پاداش گرفته شده باشد نمایش داده می‌شود (هیچ‌وقت
              «۰ تومان پاداش» را به‌عنوان یک دستاورد نشان نمی‌دهیم). */}
          {referral.rewarded_referrals > 0 && (
            <div className="mt-2 flex items-center justify-between gap-2 p-2.5 bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <Award className="w-4 h-4 text-success-600 dark:text-success-400 flex-shrink-0" />
                <p className="text-xs font-bold text-success-700 dark:text-success-400">
                  مجموع پاداش دریافتی از {referral.rewarded_referrals.toLocaleString('fa-IR')} دعوت موفق
                </p>
              </div>
              <p className="text-sm font-black text-success-700 dark:text-success-400 flex-shrink-0">
                {formatPrice(referral.total_earned_rewards)}
              </p>
            </div>
          )}

          {/* ✅ تاریخچه‌ی جمع‌وجور — پیش‌فرض بسته، فقط با کلیک کاربر باز
              می‌شود؛ هر ردیف وضعیت واقعی از بک‌اند را نشان می‌دهد، نه
              حدس فرانت. */}
          {referralHistory.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowReferralHistory((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-900/60 rounded-lg transition-colors"
              >
                <span>تاریخچه‌ی دعوت‌ها ({referralHistory.length.toLocaleString('fa-IR')})</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showReferralHistory && 'rotate-180')} />
              </button>

              {showReferralHistory && (
                <div className="mt-1.5 space-y-1.5 max-h-64 overflow-y-auto">
                  {referralHistory.map((item, idx) => {
                    const meta = REFERRAL_STATUS_META[item.status];
                    const date = new Date(item.registered_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });

                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-700">
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{date}</p>
                          <Badge variant={meta.variant} className="mt-0.5 text-[10px]">{meta.label}</Badge>
                        </div>
                        {item.reward && (
                          <p className="text-xs font-black text-success-600 dark:text-success-400 flex-shrink-0">
                            {formatPrice(item.reward.amount)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* کارت درخواست فروشندگی (همیشه نمایش داده می‌شود مگر اینکه کاربر قبلاً فروشنده شده باشد) */}
      {user.role !== 'seller' && !sellerRequestData && (
        <div className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 border border-primary-100 dark:border-primary-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">فروشنده شوید!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  محصولات خود را در ازکالا به هزاران مشتری بفروشید.
                </p>
              </div>
            </div>
            <Link
              to="/seller-request"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors w-full sm:w-auto justify-center"
            >
              ثبت درخواست
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ✅ کارت پیگیری درخواست فروشندگی (فقط اگر درخواستی وجود داشته باشد نمایش داده می‌شود) */}
      {sellerRequestData && user.role !== 'seller' && (
        <div className={cn(
          'rounded-2xl p-5 border shadow-sm',
          sellerRequestData.status === 'approved' ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800' :
          sellerRequestData.status === 'rejected' ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800' :
          'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
        )}>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                sellerRequestData.status === 'approved' ? 'bg-success-100 dark:bg-success-900/40 text-success-600 dark:text-success-400' :
                sellerRequestData.status === 'rejected' ? 'bg-error-100 dark:bg-error-900/40 text-error-600 dark:text-error-400' :
                'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
              )}>
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  وضعیت درخواست فروشندگی
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {sellerRequestData.status === 'pending_initial' && 'درخواست شما در صف بررسی اولیه ادمین قرار دارد.'}
                  {sellerRequestData.status === 'pending_documents' && 'تأیید اولیه انجام شد. برای ادامه به صفحه‌ی درخواست فروشندگی بروید و مدارک خود را بارگذاری کنید.'}
                  {sellerRequestData.status === 'pending_final' && 'مدارک شما دریافت شد و در حال بررسی نهایی است.'}
                  {sellerRequestData.status === 'approved' && 'تبریک! درخواست شما تأیید شده است. اکنون می‌توانید محصولات خود را ثبت کنید.'}
                  {sellerRequestData.status === 'rejected' && `درخواست شما رد شده است. دلیل: ${sellerRequestData.rejection_reason || 'عدم احراز شرایط'}`}
                </p>
              </div>
            </div>

            <Badge
              variant={sellerRequestData.status === 'approved' ? 'success' : sellerRequestData.status === 'rejected' ? 'error' : 'primary'}
              className={isSellerRequestPending(sellerRequestData.status) ? 'animate-pulse' : ''}
            >
              {isSellerRequestPending(sellerRequestData.status) && 'در حال بررسی'}
              {sellerRequestData.status === 'approved' && 'تأیید شده'}
              {sellerRequestData.status === 'rejected' && 'رد شده'}
            </Badge>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 font-bold text-xs transition-all border-b-4',
              activeTab === 'info' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
            )}
          >
            <User className="w-4 h-4" />
            اطلاعات حساب
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 font-bold text-xs transition-all border-b-4',
              activeTab === 'security' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
            )}
          >
            <Shield className="w-4 h-4" />
            امنیت
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'info' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">اطلاعات شخصی</h3>
                {!isEditing ? (
                  <Button variant="outline" size="xs" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-3 h-3 ml-1" />
                    ویرایش
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="outline" size="xs" onClick={() => {
                      setIsEditing(false);
                      setFormData({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '' });
                    }} disabled={updateMutation.isPending}>
                      <X className="w-3 h-3 ml-1" />
                      انصراف
                    </Button>
                    <Button size="xs" onClick={handleSave} disabled={updateMutation.isPending} isLoading={updateMutation.isPending}>
                      <Save className="w-3 h-3 ml-1" />
                      ذخیره
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <Input label="نام" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} leftIcon={<User className="w-4 h-4" />} />
                  <Input label="ایمیل" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} leftIcon={<Mail className="w-4 h-4" />} />
                  <Input label="موبایل" type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} leftIcon={<Phone className="w-4 h-4" />} className="md:col-span-2" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { icon: User, label: 'نام', value: user.name, color: 'from-primary-500 to-primary-600' },
                    { icon: Mail, label: 'ایمیل', value: user.email, color: 'from-accent-500 to-accent-600' },
                    { icon: Phone, label: 'موبایل', value: user.phone || 'ثبت نشده', color: 'from-success-500 to-success-600' },
                    { icon: Calendar, label: 'تاریخ عضویت', value: joinDate, color: 'from-warning-500 to-warning-600' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-gradient-to-l from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                        <div className={cn('w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm flex-shrink-0', item.color)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.label}</p>
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ✅ این تب قبلاً یک کپی کامل و جعلی از تنظیمات امنیتی بود (ادعای
              2FA فعال، دستگاه‌های متصل ساختگی، دکمه‌ی حذف حساب بدون
              onClick) — دقیقاً همان محتوا در SecuritySection.tsx (صفحه‌ی
              واقعی و روت‌شده‌ی /dashboard/security) هم وجود داشت. به‌جای
              نگه‌داشتن دو نسخه از یک محتوای جعلی، اینجا فقط یک لینک واقعی
              به همان صفحه نشان داده می‌شود. */}
          {activeTab === 'security' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h4 className="font-black text-gray-900 dark:text-gray-100 text-sm mb-1">مدیریت امنیت حساب</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
                تغییر رمز عبور و سایر تنظیمات امنیتی در صفحه‌ی اختصاصی امنیت انجام می‌شود.
              </p>
              <Link to="/dashboard/security">
                <Button size="sm" className="gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  رفتن به صفحه امنیت
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                تغییر رمز عبور
              </h3>
              <button onClick={() => { setShowPasswordModal(false); setPasswordData({ current_password: '', password: '', password_confirmation: '' }); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2.5">
              <Input label="رمز فعلی" type="password" value={passwordData.current_password} onChange={(e) => setPasswordData(p => ({ ...p, current_password: e.target.value }))} leftIcon={<Lock className="w-4 h-4" />} />
              <Input label="رمز جدید" type="password" value={passwordData.password} onChange={(e) => setPasswordData(p => ({ ...p, password: e.target.value }))} leftIcon={<Lock className="w-4 h-4" />} />
              <Input label="تکرار رمز جدید" type="password" value={passwordData.password_confirmation} onChange={(e) => setPasswordData(p => ({ ...p, password_confirmation: e.target.value }))} leftIcon={<Lock className="w-4 h-4" />} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" size="md" onClick={() => setShowPasswordModal(false)} disabled={changePasswordMutation.isPending}>انصراف</Button>
              <Button className="flex-1" size="md" onClick={() => changePasswordMutation.mutate(passwordData)} disabled={!passwordData.current_password || !passwordData.password || !passwordData.password_confirmation} isLoading={changePasswordMutation.isPending}>
                <Lock className="w-4 h-4 ml-1" />
                تغییر رمز
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProfileSection;
