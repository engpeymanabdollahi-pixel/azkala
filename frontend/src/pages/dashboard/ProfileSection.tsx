import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Phone, Calendar, Edit2, Save, X, Lock,
  Shield, Eye, Award, AlertCircle, Store, ArrowLeft
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
import apiClient from '@/services/api/client'; // فرض بر این است که apiClient default export است. اگر نیست، آکولاد بگذارید: { apiClient }
import axios from 'axios';

export function ProfileSection() {
  const queryClient = useQueryClient();
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

  // ✅ کوئری جدید برای دریافت وضعیت درخواست فروشندگی
    // ✅ کوئری ضد گلوله برای دریافت وضعیت درخواست فروشندگی
  const { data: sellerRequestData, isError } = useQuery({
    queryKey: ['seller-request-status'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/user/seller-request-status');
        return response.data.data; // اگر درخواستی نباشد، بک‌اند باید null برگرداند
      } catch (error: any) {
        // اگر بک‌اند 404 داد (یعنی درخواستی وجود ندارد)، به جای خطا، null برگردان
        if (error.response?.status === 404 || error.response?.status === 403) {
          return null;
        }a
        throw error; // سایر خطاها را پرتاب کن
      }
    },
    retry: false, 
  });

  const ordersCount = ordersData?.data?.total ?? 0;

  const updateMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (response) => {
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('اطلاعات به‌روزرسانی شد', { icon: '✅' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.errors
        ? Object.values(error.response.data.errors)[0][0]
        : 'خطا در به‌روزرسانی';
      toast.error(message);
    },
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

  if (!user) return null;

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error('نام الزامی است'); return; }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) { toast.error('ایمیل معتبر نیست'); return; }
    updateMutation.mutate(formData);
  };

  const userStats = [
    { label: 'سفارشات', value: ordersCount, icon: '📦' },
    { label: 'علاقه‌مندی‌ها', value: wishlistItems.length, icon: '❤️' },
    { label: 'امتیاز وفاداری', value: 850, icon: '⭐' },
    { label: 'کوپن فعال', value: 3, icon: '🎁' },
  ];

  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

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
              <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-[10px]">
                <Award className="w-3 h-3" />
                <span>سطح: طلایی</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {userStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[10px] text-gray-600 font-medium">{stat.label}</span>
            </div>
            <p className="text-lg font-black text-gray-900">
              {typeof stat.value === 'number' ? stat.value.toLocaleString('fa-IR') : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* کارت درخواست فروشندگی (همیشه نمایش داده می‌شود مگر اینکه کاربر قبلاً فروشنده شده باشد) */}
      {user.role !== 'seller' && !sellerRequestData && (
        <div className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">فروشنده شوید!</h3>
                <p className="text-sm text-gray-500 mt-1">
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
        <div className={`rounded-2xl p-5 border shadow-sm ${
          sellerRequestData.status === 'approved' ? 'bg-green-50 border-green-200' :
          sellerRequestData.status === 'rejected' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                sellerRequestData.status === 'approved' ? 'bg-green-100 text-green-600' :
                sellerRequestData.status === 'rejected' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  وضعیت درخواست فروشندگی
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {sellerRequestData.status === 'pending' && 'درخواست شما در صف بررسی ادمین قرار دارد.'}
                  {sellerRequestData.status === 'approved' && 'تبریک! درخواست شما تأیید شده است. اکنون می‌توانید محصولات خود را ثبت کنید.'}
                  {sellerRequestData.status === 'rejected' && `درخواست شما رد شده است. دلیل: ${sellerRequestData.rejection_reason || 'عدم احراز شرایط'}`}
                </p>
              </div>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              sellerRequestData.status === 'approved' ? 'bg-green-200 text-green-800' :
              sellerRequestData.status === 'rejected' ? 'bg-red-200 text-red-800' :
              'bg-blue-200 text-blue-800 animate-pulse'
            }`}>
              {sellerRequestData.status === 'pending' && 'در حال بررسی'}
              {sellerRequestData.status === 'approved' && 'تأیید شده'}
              {sellerRequestData.status === 'rejected' && 'رد شده'}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 font-bold text-xs transition-all border-b-4',
              activeTab === 'info' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-600 hover:bg-gray-50'
            )}
          >
            <User className="w-4 h-4" />
            اطلاعات حساب
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 font-bold text-xs transition-all border-b-4',
              activeTab === 'security' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-600 hover:bg-gray-50'
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
                <h3 className="text-sm font-black text-gray-900">اطلاعات شخصی</h3>
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
                    { icon: Calendar, label: 'تاریخ عضویت', value: '۱۴۰۳/۰۳/۲۹', color: 'from-warning-500 to-warning-600' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-gradient-to-l from-gray-50 to-white rounded-lg border border-gray-100">
                        <div className={cn('w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm', item.color)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500">{item.label}</p>
                          <p className="font-bold text-gray-900 text-sm truncate">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
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
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
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
export default ProfileSection;
