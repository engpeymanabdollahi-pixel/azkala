import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Award, Heart, Package, Star, Store } from 'lucide-react';
import apiClient from '@/services/api/client';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/utils/cn';

interface TopSeller {
  id: number;
  shop_name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  rating: number;
  products_count: number;
  followers_count: number;
}

const fetchTopSellers = async (): Promise<TopSeller[]> => {
  const response = await apiClient.get('/sellers/top', { params: { limit: 8 } });
  return response.data?.data || [];
};

function TopSellerCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-slate-700 mx-auto mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mx-auto mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mx-auto" />
    </div>
  );
}

/**
 * فروشگاه‌های برتر — بر اساس امتیاز و تعداد دنبال‌کننده از GET /sellers/top.
 *
 * قبلاً چنین بخشی در صفحه‌ی اصلی وجود نداشت؛ خریدار هیچ راهی برای دیدن
 * فروشگاه‌های معتبر و پرامتیاز نداشت مگر با کلیک تصادفی روی محصولات آن‌ها.
 */
export function TopSellersSection() {
  const navigate = useNavigate();

  const { data: sellers = [], isLoading, isError } = useQuery({
    queryKey: ['home-top-sellers'],
    queryFn: fetchTopSellers,
    staleTime: 5 * 60 * 1000,
  });

  // اگر خطا بخورد یا هیچ فروشگاهی واجد شرایط نباشد، بخش کاملاً حذف می‌شود —
  // بهتر از نمایش یک قفسه‌ی خالی و بی‌معنی در وسط صفحه‌ی اصلی است.
  if (isError || (!isLoading && sellers.length === 0)) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-warning-400 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">فروشگاه‌های برتر</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">پرامتیازترین شعبه‌های آنلاین ازکالا</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <TopSellerCardSkeleton key={i} />)
            : sellers.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => navigate(`/seller/${seller.slug}`)}
                  className={cn(
                    'group bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-gray-100 dark:border-slate-700',
                    'hover:border-accent-300 dark:hover:border-accent-600 hover:shadow-xl hover:-translate-y-1',
                    'transition-all duration-300 text-center',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'
                  )}
                  type="button"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {seller.logo ? (
                      <SafeImage src={seller.logo} alt={seller.shop_name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-primary-500 dark:text-primary-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate mb-2 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                    {seller.shop_name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                    {seller.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-warning-400 text-warning-400" />
                        {seller.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Package className="w-3 h-3" />
                      {seller.products_count}
                    </span>
                    {seller.followers_count > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3" />
                        {seller.followers_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
        </div>
      </div>
    </section>
  );
}
