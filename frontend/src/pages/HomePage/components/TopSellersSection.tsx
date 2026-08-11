import { useQuery } from '@tanstack/react-query';
import { Award } from 'lucide-react';
import apiClient from '@/services/api/client';
import { SellerCard, type SellerData } from '@/components/marketplace';

/**
 * فروشگاه‌های برتر — بر اساس امتیاز و تعداد دنبال‌کننده از GET /sellers/top.
 *
 * ✅ Refactored: از SellerCard Marketplace استفاده می‌کند به جای inline card
 * این یعنی:
 * - DRY principle رعایت شده
 * - Design System یکپارچه در همه جا
 * - نگهداری ساده‌تر
 */
export function TopSellersSection() {
  const { data: sellers = [], isLoading, isError } = useQuery({
    queryKey: ['home-top-sellers'],
    queryFn: async (): Promise<SellerData[]> => {
      const response = await apiClient.get('/sellers/top', { params: { limit: 8 } });
      const rawData = response.data?.data || [];
      // تطبیق با SellerData interface (اضافه کردن status پیش‌فرض)
      return rawData.map((s: any) => ({
        ...s,
        status: s.status || 'active',
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // اگر خطا بخورد یا هیچ فروشگاهی واجد شرایط نباشد، بخش کاملاً حذف می‌شود
  if (isError || (!isLoading && sellers.length === 0)) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-warning-400 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                فروشگاه‌های برتر
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                پرامتیازترین شعبه‌های آنلاین ازکالا
              </p>
            </div>
          </div>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <TopSellerCardSkeleton key={i} />)
            : sellers.map((seller, index) => (
                <SellerCard
                  key={seller.id}
                  seller={seller}
                  variant="compact"
                  showActions={false}
                  showStats={true}
                  index={index}
                />
              ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton مخصوص Top Sellers
 * چون SellerCard skeleton داخلی ندارد، اینجا نگه داشته می‌شود
 */
function TopSellerCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 animate-pulse text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 mx-auto mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mx-auto mb-1.5" />
      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mx-auto" />
    </div>
  );
}