import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Phone, Package, Shield, Edit2, Save, X, LogOut,
  Heart, MapPin, Bell, Clock, Star, Gift, Calendar, Award,
  ChevronLeft, Lock, Eye, ShoppingBag, Truck, CheckCircle,
  AlertCircle, Loader2, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { useWishlistStore } from '@/store/wishlistStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { orderService } from '@/services/api/order.service';
import { profileService } from '@/services/api/profile.service';

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security' | 'notifications'>('profile');
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });

  // ✅ State جدید برای تغییر رمز
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Sync form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  // Fetch orders for real stats
  const { data: ordersData } = useQuery({
    queryKey: ['my-orders-profile'],
    queryFn: () => orderService.getOrders(1),
    enabled: isAuthenticated,
  });

  const ordersCount = ordersData?.data?.total ?? 0;

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (response) => {
      updateUser(response.data.user);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['my-orders-profile'] });
      toast.success('اطلاعات با موفقیت به‌روزرسانی شد', { icon: '✅' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.errors
        ? Object.values(error.response.data.errors)[0][0]
        : 'خطا در به‌روزرسانی اطلاعات';
      toast.error(message);
    },
  });

  // ✅ Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
      toast.success('رمز عبور با موفقیت تغییر کرد', { icon: '🔒' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطا در تغییر رمز عبور';
      toast.error(message);
    },
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center animate-fade-in">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">ابتدا وارد شوید</h2>
          <p className="text-gray-600 text-sm mb-5">برای دسترسی به پروفایل خود وارد شوید</p>
          <Button onClick={() => navigate('/auth')} size="md" className="w-full">
            ورود به حساب
            <ChevronLeft className="w-4 h-4 mr-1.5 rotate-180" />
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('نام الزامی است');
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('ایمیل معتبر نیست');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleLogout = () => {
    logout();
    toast.success('با موفقیت خارج شدید', { icon: '👋' });
    navigate('/');
  };

  const userStats = [
    { label: 'سفارشات', value: ordersCount, icon: Package, gradient: 'from-primary-500 to-primary-600', path: '/orders' },
    { label: 'علاقه‌مندی‌ها', value: wishlistItems.length, icon: Heart, gradient: 'from-error-500 to-error-600', path: '/wishlist' },
    { label: 'امتیاز وفاداری', value: 850, icon: Star, gradient: 'from-warning-500 to-warning-600', path: '#' },
    { label: 'کوپن فعال', value: 3, icon: Gift, gradient: 'from-accent-500 to-accent-600', path: '#' },
  ];

  const tabs = [
    { id: 'profile', label: 'پروفایل', icon: User },
    { id: 'addresses', label: 'آدرس‌ها', icon: MapPin },
    { id: 'security', label: 'امنیت', icon: Shield },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell },
  ];

  const getRoleBadge = () => {
    switch (user.role) {
      case 'seller': return { label: 'فروشنده', variant: 'accent' as const, icon: ShoppingBag };
      case 'admin': return { label: 'مدیر', variant: 'primary' as const, icon: Shield };
      default: return { label: 'مشتری', variant: 'primary' as const, icon: User };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-3 md:px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-5 animate-fade-in">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            پروفایل من
          </h1>
          <p className="text-gray-600 text-sm">مدیریت اطلاعات حساب کاربری</p>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-5 text-white mb-5 relative overflow-hidden shadow-xl animate-fade-in">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl font-black border-4 border-white/30 shadow-lg">
                {user.name?.[0] || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                <Edit2 className="w-4 h-4 text-primary-600" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-right">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5">
                <h2 className="text-xl md:text-2xl font-black">{user.name}</h2>
                <Badge variant={roleBadge.variant} className="bg-white/20 backdrop-blur-sm border-white/30 text-white text-[10px]">
                  <roleBadge.icon className="w-3 h-3 ml-0.5" />
                  {roleBadge.label}
                </Badge>
              </div>
              <p className="text-white/90 text-sm mb-2 flex items-center gap-1.5 justify-center md:justify-start">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>عضویت از ۱۴۰۳</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-[11px]">
                  <Award className="w-3 h-3" />
                  <span>سطح: طلایی</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 min-w-[150px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">امتیاز وفاداری</span>
                </div>
                <p className="text-2xl font-black">۸۵۰</p>
                <p className="text-[10px] text-white/80">تا سطح بعدی: ۱۵۰</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          {userStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <button
                key={idx}
                onClick={() => stat.path !== '#' && navigate(stat.path)}
                className="group bg-white rounded-xl p-3 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all text-right animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    'w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform',
                    stat.gradient
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:-translate-x-1 transition-all" />
                </div>
                <p className="text-lg font-black text-gray-900 mb-0.5">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString('fa-IR') : stat.value}
                </p>
                <p className="text-[11px] text-gray-600 font-medium">{stat.label}</p>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-3 font-bold text-xs transition-all border-b-4 whitespace-nowrap flex-shrink-0',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 md:p-5">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                    <User className="w-5 h-5 text-primary-600" />
                    اطلاعات حساب
                  </h3>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-3.5 h-3.5 ml-1" />
                      ویرایش
                    </Button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => {
                        setIsEditing(false);
                        setFormData({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '' });
                      }} disabled={updateMutation.isPending}>
                        <X className="w-3.5 h-3.5 ml-1" />
                        انصراف
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} isLoading={updateMutation.isPending}>
                        <Save className="w-3.5 h-3.5 ml-1" />
                        ذخیره
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="نام و نام خانوادگی"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      leftIcon={<User className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="ایمیل"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      leftIcon={<Mail className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="شماره موبایل"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      leftIcon={<Phone className="w-4 h-4" />}
                      className="md:col-span-2"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {[
                      { icon: User, label: 'نام و نام خانوادگی', value: user.name, color: 'from-primary-500 to-primary-600' },
                      { icon: Mail, label: 'ایمیل', value: user.email, color: 'from-accent-500 to-accent-600' },
                      { icon: Phone, label: 'شماره موبایل', value: user.phone || 'ثبت نشده', color: 'from-success-500 to-success-600' },
                      { icon: Calendar, label: 'تاریخ عضویت', value: '۱۴۰۳/۰۳/۲۹', color: 'from-warning-500 to-warning-600' },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-gradient-to-l from-gray-50 to-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all group"
                        >
                          <div className={cn(
                            'w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform',
                            item.color
                          )}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 mb-0.5">{item.label}</p>
                            <p className="font-bold text-gray-900 text-sm truncate">{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="animate-fade-in text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-black text-gray-900 text-base mb-1">سیستم آدرس‌ها</h3>
                <p className="text-gray-600 text-sm mb-4">به زودی اضافه خواهد شد</p>
                <Badge variant="warning" size="sm">در حال توسعه</Badge>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="animate-fade-in">
                <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-1.5">
                  <Shield className="w-5 h-5 text-primary-600" />
                  امنیت حساب
                </h3>
                <div className="space-y-2.5">
                  {/* ✅ دکمه تغییر رمز با onClick */}
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all group">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm mb-0.5">تغییر رمز عبور</h4>
                      <p className="text-[11px] text-gray-600">آخرین تغییر: ۲ ماه پیش</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="xs"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <span className="text-[11px]">تغییر رمز</span>
                      <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all group">
                    <div className="w-11 h-11 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="font-bold text-gray-900 text-sm">احراز هویت دو مرحله‌ای</h4>
                        <Badge variant="success" size="sm">فعال</Badge>
                      </div>
                      <p className="text-[11px] text-gray-600">افزایش امنیت حساب</p>
                    </div>
                    <Button variant="outline" size="xs">
                      <span className="text-[11px]">مدیریت</span>
                      <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all group">
                    <div className="w-11 h-11 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm mb-0.5">دستگاه‌های متصل</h4>
                      <p className="text-[11px] text-gray-600">۲ دستگاه فعال</p>
                    </div>
                    <Button variant="outline" size="xs">
                      <span className="text-[11px]">مشاهده</span>
                      <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-5 p-4 bg-gradient-to-l from-error-50 to-white border-2 border-error-200 rounded-xl">
                  <h4 className="font-black text-error-700 text-sm mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    منطقه خطر
                  </h4>
                  <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
                    با حذف حساب، تمام اطلاعات شما برای همیشه پاک خواهد شد.
                  </p>
                  <Button variant="danger" size="xs">
                    <span className="text-[11px]">حذف حساب کاربری</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="animate-fade-in">
                <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-1.5">
                  <Bell className="w-5 h-5 text-primary-600" />
                  تنظیمات اعلان‌ها
                </h3>
                <div className="space-y-2">
                  {[
                    { title: 'اعلان‌های سفارش', desc: 'دریافت اعلان برای وضعیت سفارشات', enabled: true },
                    { title: 'تخفیف‌ها و پیشنهادات', desc: 'اطلاع‌رسانی تخفیف‌های ویژه', enabled: true },
                    { title: 'خبرنامه', desc: 'دریافت ایمیل هفتگی', enabled: false },
                    { title: 'اعلان‌های پیامکی', desc: 'دریافت پیامک برای رویدادهای مهم', enabled: true },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm mb-0.5">{item.title}</h4>
                        <p className="text-[11px] text-gray-600">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mr-2">
                        <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <Button variant="danger" className="w-full" size="md" onClick={handleLogout}>
          <LogOut className="w-4 h-4 ml-1.5" />
          خروج از حساب کاربری
        </Button>
      </div>

      {/* ✅ Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-primary-600" />
                تغییر رمز عبور
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ current_password: '', password: '', password_confirmation: '' });
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                label="رمز عبور فعلی"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Input
                label="رمز عبور جدید"
                type="password"
                value={passwordData.password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, password: e.target.value }))}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Input
                label="تکرار رمز عبور جدید"
                type="password"
                value={passwordData.password_confirmation}
                onChange={(e) => setPasswordData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div className="mt-3 p-2.5 bg-primary-50 border border-primary-100 rounded-lg">
              <p className="text-[11px] text-primary-700 leading-relaxed">
                🔒 رمز عبور باید حداقل ۸ کاراکتر و شامل حروف و اعداد باشد.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                size="md"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ current_password: '', password: '', password_confirmation: '' });
                }}
                disabled={changePasswordMutation.isPending}
              >
                انصراف
              </Button>
              <Button
                className="flex-1"
                size="md"
                onClick={() => changePasswordMutation.mutate(passwordData)}
                disabled={
                  changePasswordMutation.isPending ||
                  !passwordData.current_password ||
                  !passwordData.password ||
                  !passwordData.password_confirmation
                }
                isLoading={changePasswordMutation.isPending}
              >
                <Lock className="w-4 h-4 ml-1.5" />
                تغییر رمز
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}