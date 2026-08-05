import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, Star, Users, Package, Heart, Loader2, ArrowLeft,
  AlertCircle, CheckCircle2, Settings, MessageCircle, Grid3x3, Info, MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProductCard } from '@/components/features/ProductCard';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { STORAGE_URL } from '@/lib/apiConfig';
import apiClient from '@/services/api/client';
import { useAuthModalStore } from '@/store/authModalStore';
import type { Product } from '@/types/models';

// ✅ شکل واقعی PublicSellerResource (backend) — قبلاً sellerData به‌طور
// ضمنی any بود و چند جا (avatar، err، old) هم صریحاً any کست می‌شدند.
interface PublicSeller {
  id: number;
  user_id: number;
  shop_name: string;
  slug: string;
  display_title: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  status: string;
  health_score: number;
  rating: number;
  reviews_count: number;
  products_count: number;
  orders_count: number;
  followers_count: number;
  is_followed_by_current_user: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

type TabId = 'products' | 'about' | 'reviews';

// تابع کمکی برای تبدیل مسیر نسبی به مطلق
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
  const openAuthModal = useAuthModalStore((state) => state.open);
  const { startConversation, openChat } = useChatStore();

  const [activeTab, setActiveTab] = useState<TabId>('products');

  // ✅ قبلاً با fetch() خام صدا زده می‌شد — بدون هدر Authorization (که فقط
  // apiClient با interceptor اضافه می‌کند). چون is_followed_by_current_user
  // در بک‌اند بر اساس $request->user() محاسبه می‌شود، برای کاربر واردشده
  // همیشه false برمی‌گشت (تا وقتی خودش یک‌بار دستی دنبال/لغو می‌کرد) —
  // یعنی دکمه‌ی «دنبال می‌کنید» برای فروشگاه‌هایی که از قبل دنبال می‌کرد،
  // در بار اول لود همیشه اشتباه «دنبال کردن» نشان می‌داد.
  const { data: sellerData, isLoading, isError } = useQuery({
    queryKey: ['seller', slug],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PublicSeller }>(`/sellers/${slug}`);
      return res.data.data;
    },
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['seller-products', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/sellers/${slug}/products`, { params: { per_page: 20 } });
      return res.data;
    },
    enabled: !!sellerData && activeTab === 'products',
  });

  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      if (!isAuthenticated) {
        openAuthModal({
          reason: 'برای دنبال کردن این فروشگاه وارد شوید.',
          onSuccess: () => followMutation.mutate(action),
        });
        throw new Error('Not authenticated');
      }

      const url = `/sellers/${sellerData!.id}/follow`;
      const res = action === 'follow'
        ? await apiClient.post(url)
        : await apiClient.delete(url);

      return res.data;
    },
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: ['seller', slug] });
      const previousSeller = queryClient.getQueryData<PublicSeller>(['seller', slug]);
      if (previousSeller) {
        queryClient.setQueryData<PublicSeller>(['seller', slug], {
          ...previousSeller,
          is_followed_by_current_user: action === 'follow',
          followers_count: action === 'follow'
            ? (Number(previousSeller.followers_count) || 0) + 1
            : Math.max(0, (Number(previousSeller.followers_count) || 0) - 1),
        });
      }
      return { previousSeller };
    },
    onError: (err: unknown, _action, context) => {
      const message = err instanceof Error ? err.message : undefined;
      if (message !== 'Not authenticated' && context?.previousSeller) {
        queryClient.setQueryData(['seller', slug], context.previousSeller);
      }
      if (message !== 'Not authenticated') {
        toast.error(message || 'خطا در برقراری ارتباط با سرور');
      }
    },
    onSuccess: (data: { is_following: boolean; followers_count: number }, action) => {
      queryClient.setQueryData<PublicSeller | undefined>(['seller', slug], (old) => {
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

  // ✅ دکمه‌ی «ارسال پیام به فروشنده» قبلاً به navigate('/chat?seller_id=...')
  // می‌رفت — روتی که اصلاً در App.tsx تعریف نشده (فقط /seller/chat برای
  // خودِ فروشنده وجود دارد، نه یک صفحه‌ی چت عمومی برای مشتری). یعنی این
  // دکمه همیشه کاربر را به یک صفحه‌ی ناموجود (۴۰۴) می‌فرستاد. حالا از همان
  // useChatStore واقعی که ProductDetailPage هم استفاده می‌کند، استفاده
  // می‌شود (ویجت چت سراسری).
  const handleMessageSeller = async () => {
    if (!sellerData) return;
    if (!isAuthenticated) {
      openAuthModal({
        reason: 'برای گفتگو با فروشنده وارد شوید.',
        onSuccess: () => void startConversation(sellerData.id).then(() => openChat()),
      });
      return;
    }
    try {
      await startConversation(sellerData.id);
      openChat();
    } catch {
      toast.error('خطا در شروع گفتگو');
    }
  };

  useEffect(() => {
    if (sellerData?.display_title) {
      document.title = `${sellerData.display_title} | ازکالا`;
    }
  }, [sellerData]);

  const isOwner = isAuthenticated && user && sellerData && user.id === sellerData.user_id;
  const products: Product[] = Array.isArray(productsData?.data)
    ? productsData.data
    : (Array.isArray(productsData?.data?.data) ? productsData.data.data : []);

  const isFollowing = sellerData?.is_followed_by_current_user || false;

  const bannerUrl = getImageUrl(sellerData?.banner);
  const logoUrl = getImageUrl(sellerData?.logo);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 text-primary-600 dark:text-primary-400 animate-spin" />
      </div>
    );
  }

  if (isError || !sellerData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
        <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">شعبه‌ای یافت نشد</h2>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> بازگشت به صفحه اصلی
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-12">
      {/* هدر و بنر فروشگاه */}
      <div className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 relative overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-20 h-20 text-primary-200 dark:text-primary-800" />
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* لوگو */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white dark:border-slate-800 shadow-md bg-gray-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={sellerData.shop_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                  <Store className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100">{sellerData.shop_name}</h1>
                {isOwner && (
                  <button
                    onClick={() => navigate('/seller/settings')}
                    className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                    title="تنظیمات فروشگاه"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                  <span className="font-bold text-gray-900 dark:text-gray-100">{Number(sellerData.rating || 0).toFixed(1)}</span>
                  <span className="text-gray-400 dark:text-gray-500">({sellerData.reviews_count} نظر)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                  <span>{sellerData.products_count} محصول</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-accent-500 dark:text-accent-400" />
                  <span>{Number(sellerData.followers_count || 0).toLocaleString('fa-IR')} دنبال‌کننده</span>
                </span>
              </div>
              {sellerData.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-2xl line-clamp-2">
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
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
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
                    onClick={() => void handleMessageSeller()}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-slate-700 overflow-x-auto">
            {(
              [
                { id: 'products', label: 'محصولات', icon: Package },
                { id: 'about', label: 'درباره ما', icon: Info },
                { id: 'reviews', label: 'نظرات', icon: MessageSquare },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 font-bold text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
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
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" /></div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} onClick={() => navigate(`/products/${product.slug}`)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
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
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">درباره فروشگاه {sellerData.shop_name}</h3>
                <p className="leading-relaxed whitespace-pre-line">
                  {sellerData.description || 'توضیحاتی توسط فروشنده ثبت نشده است.'}
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p className="font-bold">بخش نظرات به زودی با سیستم امتیازدهی یکپارچه می‌شود.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
