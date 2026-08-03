import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Store, Star, Users, Package, Heart, Loader2, ArrowLeft, 
  AlertCircle, CheckCircle2, Settings, MessageCircle, Grid3x3, Info, MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProductCard } from '@/components/features/ProductCard';
import { useAuthStore } from '@/store/authStore';
import { API_V1_URL, STORAGE_URL } from '@/lib/apiConfig';

const API_BASE = API_V1_URL;

// تابع کمکی برای تبدیل مسیر نسبی به مطلق و پشتیبانی از هر دو کلید logo/avatar
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^storage\//, '');
  return `${STORAGE_URL}/${cleanPath}`;
};

export default function SellerPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  const { data: sellerData, isLoading, isError } = useQuery({
    queryKey: ['seller', slug],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/sellers/${slug}`);
      if (!res.ok) throw new Error('فروشنده یافت نشد');
      const result = await res.json();
      return result.data;
    },
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['seller-products', slug],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/sellers/${slug}/products?per_page=20`);
      if (!res.ok) throw new Error('خطا در دریافت محصولات');
      return await res.json();
    },
    enabled: !!sellerData && activeTab === 'products',
  });

  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      const token = localStorage.getItem('token');
      if (!token || !isAuthenticated) {
        toast.error('برای دنبال کردن فروشگاه، لطفاً ابتدا وارد حساب کاربری خود شوید.');
        navigate('/auth');
        throw new Error('Not authenticated');
      }

      const url = `${API_BASE}/sellers/${sellerData!.id}/follow`;
      const res = await fetch(url, {
        method: action === 'follow' ? 'POST' : 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'خطا در عملیات');
      }
      return await res.json();
    },
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: ['seller', slug] });
      const previousSeller = queryClient.getQueryData(['seller', slug]);
      if (previousSeller) {
        queryClient.setQueryData(['seller', slug], {
          ...previousSeller,
          is_followed_by_current_user: action === 'follow',
          followers_count: action === 'follow' 
            ? (Number(previousSeller.followers_count) || 0) + 1 
            : Math.max(0, (Number(previousSeller.followers_count) || 0) - 1),
        });
      }
      return { previousSeller };
    },
    onError: (err: any, action, context) => {
      if (err.message !== 'Not authenticated' && context?.previousSeller) {
        queryClient.setQueryData(['seller', slug], context.previousSeller);
      }
      if (err.message !== 'Not authenticated') {
        toast.error(err.message || 'خطا در برقراری ارتباط با سرور');
      }
    },
    onSuccess: (data, action) => {
      queryClient.setQueryData(['seller', slug], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          is_followed_by_current_user: data.is_following,
          followers_count: data.followers_count,
        };
      });
      toast.success(action === 'follow' ? 'شعبه به لیست علاقه‌مندی‌ها اضافه شد ❤️' : 'دنبال کردن لغو شد');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', slug] });
    },
  });

  useEffect(() => {
    if (sellerData?.display_title) {
      document.title = `${sellerData.display_title} | ازکالا`;
    }
  }, [sellerData]);

  const isOwner = isAuthenticated && user && sellerData && user.id === sellerData.id;
  const products = Array.isArray(productsData?.data) 
    ? productsData.data 
    : (Array.isArray(productsData?.data?.data) ? productsData.data.data : []);
  
  const isFollowing = sellerData?.is_followed_by_current_user || false;

  // ✅ استفاده از تابع کمکی برای اطمینان از لود صحیح عکس‌ها (پشتیبانی از logo و avatar)
  const bannerUrl = getImageUrl(sellerData?.banner);
  const logoUrl = getImageUrl(sellerData?.logo || (sellerData as any)?.avatar);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (isError || !sellerData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">شعبه‌ای یافت نشد</h2>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-primary-600 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> بازگشت به صفحه اصلی
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* هدر و بنر فروشگاه */}
      <div className="bg-white shadow-sm">
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary-100 to-accent-100 relative overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-20 h-20 text-primary-200" />
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* لوگو */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-md bg-gray-100 flex-shrink-0 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={sellerData.shop_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600">
                  <Store className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900">{sellerData.shop_name}</h1>
                {isOwner && (
                  <button 
                    onClick={() => navigate('/seller/settings')} 
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                    title="تنظیمات فروشگاه"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                  <span className="font-bold text-gray-900">{Number(sellerData.rating || 0).toFixed(1)}</span>
                  <span className="text-gray-400">({sellerData.reviews_count} نظر)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary-500" />
                  <span>{sellerData.products_count} محصول</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-accent-500" />
                  <span>{Number(sellerData.followers_count || 0).toLocaleString('fa-IR')} دنبال‌کننده</span>
                </span>
              </div>
              {sellerData.description && (
                <p className="text-gray-600 text-sm leading-relaxed max-w-2xl line-clamp-2">
                  {sellerData.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
              {!isOwner && (
                <>
                  <button
                    onClick={() => followMutation.mutate(isFollowing ? 'unfollow' : 'follow')}
                    disabled={followMutation.isPending}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
                      isFollowing 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                        : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    {followMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isFollowing ? (
                      <><CheckCircle2 className="w-5 h-5" /> دنبال می‌کنید</>
                    ) : (
                      <><Heart className="w-5 h-5" /> دنبال کردن</>
                    )}
                  </button>
                  <button 
                    onClick={() => navigate(`/chat?seller_id=${sellerData.id}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" /> ارسال پیام به فروشنده
                  </button>
                </>
              )}
              {isOwner && (
                <button 
                  onClick={() => navigate('/seller')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-accent-600 to-accent-700 hover:shadow-lg transition-all"
                >
                  <Grid3x3 className="w-5 h-5" /> ورود به پنل مدیریت
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* محتوای اصلی (تب‌ها) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {[
              { id: 'products', label: 'محصولات', icon: Package },
              { id: 'about', label: 'درباره ما', icon: Info },
              { id: 'reviews', label: 'نظرات', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-4 font-bold text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6 min-h-[400px]">
            {activeTab === 'products' && (
              <>
                {productsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map((product: any) => (
                      <ProductCard key={product.id} product={product} onClick={() => navigate(`/products/${product.slug}`)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-bold">هنوز محصولی در این فروشگاه ثبت نشده است.</p>
                    {isOwner && (
                      <button 
                        onClick={() => navigate('/seller/products/new')}
                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        افزودن اولین محصول
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'about' && (
              <div className="prose prose-sm max-w-none text-gray-700">
                <h3 className="text-lg font-bold text-gray-900 mb-3">درباره فروشگاه {sellerData.shop_name}</h3>
                <p className="leading-relaxed whitespace-pre-line">
                  {sellerData.description || 'توضیحاتی توسط فروشنده ثبت نشده است.'}
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-bold">بخش نظرات به زودی با سیستم امتیازدهی یکپارچه می‌شود.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}