import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, Shield, Eye, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در تغییر رمز');
    },
  });

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-100 p-3">
        <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5 mb-1">
          <Shield className="w-4 h-4 text-primary-600" />
          امنیت حساب
        </h3>
        <p className="text-[11px] text-gray-600">مدیریت رمز عبور و تنظیمات امنیتی</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2.5 p-2.5 bg-white border border-gray-100 rounded-lg hover:border-primary-200 transition-all">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm">تغییر رمز عبور</h4>
            <p className="text-[10px] text-gray-600">آخرین تغییر: ۲ ماه پیش</p>
          </div>
          <Button variant="outline" size="xs" onClick={() => setShowPasswordModal(true)}>
            <span className="text-[10px]">تغییر</span>
          </Button>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 bg-white border border-gray-100 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-gray-900 text-sm">احراز هویت دو مرحله‌ای</h4>
              <Badge variant="success" size="sm">فعال</Badge>
            </div>
            <p className="text-[10px] text-gray-600">افزایش امنیت حساب</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 bg-white border border-gray-100 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm">دستگاه‌های متصل</h4>
            <p className="text-[10px] text-gray-600">۲ دستگاه فعال</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gradient-to-l from-error-50 to-white border-2 border-error-200 rounded-lg">
        <h4 className="font-black text-error-700 text-sm mb-1 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          منطقه خطر
        </h4>
        <p className="text-[10px] text-gray-600 mb-2">با حذف حساب، تمام اطلاعات پاک خواهد شد.</p>
        <Button variant="danger" size="xs">
          <span className="text-[10px]">حذف حساب</span>
        </Button>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-primary-600" />
                تغییر رمز عبور
              </h3>
              <button onClick={() => { setShowPasswordModal(false); setPasswordData({ current_password: '', password: '', password_confirmation: '' }); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
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