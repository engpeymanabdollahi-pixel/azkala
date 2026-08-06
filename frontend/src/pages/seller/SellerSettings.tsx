import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Upload, Save, Loader2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerService } from '@/services/api/seller.service';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

// تابع کمکی برای تبدیل مسیر نسبی به مطلق
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // حذف prefix احتمالی storage/ برای جلوگیری از تکرار
  const cleanPath = path.replace(/^storage\//, '');
  return `http://127.0.0.1:8000/storage/${cleanPath}`;
};

export default function SellerSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const [shopName, setShopName] = useState(user?.shop_name || user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(getImageUrl(user?.avatar));
  const [bannerPreview, setBannerPreview] = useState<string | null>(getImageUrl(user?.banner));

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: sellerService.updateSettings,
    onSuccess: (data) => {
      toast.success(data.message);
      updateUser(data.data);
      
      // ✅ invalidate کردن تمام کش‌های مرتبط با seller برای لود مجدد داده‌های تازه
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      
      // اگر نام فروشگاه (و در نتیجه slug) تغییر کرده، به آدرس جدید هدایت شو
      const newSlug = data.data.slug;
      if (newSlug && newSlug !== user?.slug) {
        navigate(`/seller/${newSlug}`);
      } else {
        navigate('/seller');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در به‌روزرسانی تنظیمات');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'avatar') {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      }
    }
    e.target.value = ''; 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('shop_name', shopName);
    formData.append('bio', bio);
    if (avatarFile) formData.append('avatar', avatarFile);
    if (bannerFile) formData.append('banner', bannerFile);

    updateMutation.mutate(formData);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/seller')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">تنظیمات فروشگاه</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">اطلاعات ظاهری و عمومی فروشگاه خود را مدیریت کنید</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بنر فروشگاه */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">بنر فروشگاه</label>
          <div 
            className="relative w-full h-40 bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-primary-400 transition-colors cursor-pointer group"
            onClick={() => bannerInputRef.current?.click()}
          >
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">برای آپلود بنر کلیک کنید</span>
              </div>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} className="hidden" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* لوگو فروشگاه */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">لوگو فروشگاه</label>
            <div 
              className="relative w-32 h-32 mx-auto bg-gray-100 dark:bg-slate-700 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-primary-400 transition-colors cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Store className="w-8 h-8 mb-2" />
                </div>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* اطلاعات متنی */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام فروشگاه</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="مثال: فروشگاه موبایل علی"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">درباره ما (بیوگرافی)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="توضیحات کوتاهی درباره فروشگاه و فعالیت‌های خود بنویسید..."
              />
            </div>
          </div>
        </div>

        {/* دکمه‌های عملیات */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={() => navigate('/seller')}>
            انصراف
          </Button>
          <Button type="submit" disabled={updateMutation.isPending} className="gap-2 min-w-[140px]">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </form>
    </div>
  );
}