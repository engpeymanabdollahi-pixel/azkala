import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, Shield, AlertCircle, X, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { profileService } from '@/services/api/profile.service';

export function SecuritySection() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const changePasswordMutation = useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
      toast.success('رمز عبور تغییر کرد', { icon: '🔒' });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(message || 'خطا در تغییر رمز');
    },
  });

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
        <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5 mb-1">
          <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          امنیت حساب
        </h3>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">مدیریت رمز عبور و تنظیمات امنیتی</p>
      </div>

      {/* ✅ این صفحه قبلاً یک کپی کامل از تب «امنیت» درون ProfileSection بود،
          با همان ادعاهای جعلی: «احراز هویت دو مرحله‌ای: فعال» (در حالی که
          2FA اصلاً در بک‌اند پیاده‌سازی نشده)، «۲ دستگاه فعال» (هیچ
          ردیابی نشستی در بک‌اند وجود ندارد)، و «آخرین تغییر: ۲ ماه پیش»
          (هیچ ستونی مثل password_changed_at در دیتابیس نیست). این ادعاها
          حذف شدند تا صفحه فقط چیزی را نشان دهد که واقعاً پشتش داده هست. */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg hover:border-primary-200 dark:hover:border-primary-700 transition-all">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">تغییر رمز عبور</h4>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">برای امنیت بیشتر، رمز عبور خود را به‌صورت دوره‌ای تغییر دهید</p>
          </div>
          <Button variant="outline" size="xs" onClick={() => setShowPasswordModal(true)}>
            <span className="text-[10px]">تغییر</span>
          </Button>
        </div>
      </div>

      {/* ✅ دکمه‌ی «حذف حساب» قبلاً هیچ onClick ای نداشت — هیچ endpoint واقعی
          هم برای حذف حساب در بک‌اند وجود ندارد؛ به‌جای شبیه‌سازی یک قابلیت
          ناموجود، مسیر واقعی (تماس با پشتیبانی) نشان داده می‌شود. */}
      <div className="mt-4 p-3 bg-gradient-to-l from-error-50 to-white dark:from-error-900/20 dark:to-slate-800 border-2 border-error-200 dark:border-error-800 rounded-lg">
        <h4 className="font-black text-error-700 dark:text-error-400 text-sm mb-1 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          منطقه خطر
        </h4>
        <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-2">
          حذف حساب کاربری در حال حاضر از طریق پشتیبانی انجام می‌شود.
        </p>
        <Link to="/contact">
          <Button variant="danger" size="xs" className="gap-1">
            <LifeBuoy className="w-3 h-3" />
            <span className="text-[10px]">تماس با پشتیبانی برای حذف حساب</span>
          </Button>
        </Link>
      </div>

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
export default SecuritySection;
