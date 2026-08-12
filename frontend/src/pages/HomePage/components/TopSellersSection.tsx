import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, ChevronLeft, CheckCircle } from 'lucide-react';
import apiClient from '@/services/api/client';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import type { SellerData } from '@/components/marketplace';

/**
 * فروشگاه‌های برتر — با اسکرول افقی + لوگوی بزرگ
 *
 * مطابق سند مرجع ازکالا (بخش ۸ Marketplace):
 * - SellerCard با هویت بصری منحصربه‌فرد
 * - ۸۰٪ بالای کارت = لوگو
 * - اسکرول افقی با indicator
 */
export function TopSellersSection() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: sellers = [], isLoading, isError } = useQuery({
    queryKey: ['home-top-sellers'],
    queryFn: async (): Promise<SellerData[]> => {
      const response = await apiClient.get('/sellers/top', { params: { limit: 12 } });
      const rawData = response.data?.data || [];
      return rawData.map((s: any) => ({
        ...s,
        status: s.status || 'active',
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // بررسی وضعیت اسکرول
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        ref.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [sellers]);

   const scroll = (direction: 'next' | 'prev') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // عرض یک کارت + gap
      // در RTL، scrollBy با left مثبت به سمت چپ می‌رود (که در RTL "عقب" است)
      // برای رفتن به "جلو" (ادامه لیست)، باید left منفی باشد
      scrollRef.current.scrollBy({
        left: direction === 'next' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isError || (!isLoading && sellers.length === 0)) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-warning-400 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                فروشگاه‌های برتر
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                بهترین تجربه خرید با فروشندگان مورد اعتماد
              </p>
            </div>
          </div>
        </div>

        {/* Sellers Container با اسکرول افقی */}
        <div className="relative">
          {/* Scroll Container */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-4 py-3" style={{ minWidth: 'max-content' }}>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <TopSellerCardSkeleton key={i} />)
                : sellers.map((seller, index) => (
                    <TopSellerCard
                      key={seller.id}
                      seller={seller}
                      index={index}
                      onClick={() => navigate(`/seller/${seller.slug}`)}
                    />
                  ))}
            </div>
          </div>

          {/* Left Scroll Indicator (Gradient + Arrow) */}
          {canScrollRight && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-start z-10 group"
              aria-label="نمایش فروشگاه‌های بیشتر"
            >
              {/* Gradient Fade */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/80 to-white dark:via-slate-900/80 dark:to-slate-900 pointer-events-none" />
              
              {/* Arrow Button */}
              <div className="relative ml-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 dark:border-slate-700 group-hover:border-primary-500 group-hover:scale-110 transition-all">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-500 animate-pulse" />
              </div>
            </button>
          )}

          {/* Right Scroll Indicator (اگر اسکرول به راست ممکن باشد) */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-end z-10 group"
              aria-label="نمایش فروشگاه‌های قبلی"
            >
              {/* Gradient Fade */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-white dark:via-slate-900/80 dark:to-slate-900 pointer-events-none" />
              
              {/* Arrow Button */}
              <div className="relative mr-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 dark:border-slate-700 group-hover:border-primary-500 group-hover:scale-110 transition-all">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-500 rotate-180" />
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ==================== TopSellerCard ====================
interface TopSellerCardProps {
  seller: SellerData;
  index: number;
  onClick: () => void;
}

function TopSellerCard({ seller, index, onClick }: TopSellerCardProps) {
  const isVerified = !!seller.verified_at;
  const shopName = seller.shop_name || seller.name || 'فروشگاه';

  // تولید gradient منحصربه‌فرد
  const gradients = [
    'from-primary-500 to-accent-500',
    'from-success-500 to-primary-500',
    'from-warning-500 to-error-500',
    'from-accent-500 to-warning-500',
    'from-primary-600 to-success-500',
    'from-error-500 to-accent-500',
    'from-primary-500 to-warning-500',
    'from-accent-600 to-primary-500',
  ];

  const hash = shopName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];
  const firstLetter = shopName.trim()[0] || 'ف';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 w-48 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden',
        'border-2 border-gray-100 dark:border-slate-700',
        'hover:border-primary-300 dark:hover:border-primary-700',
        'hover:shadow-xl transition-all duration-300',
        'hover:scale-105',
        'focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-800',
        'group'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* ===== ۸۰٪ بالا: لوگو ===== */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        {seller.logo ? (
          <SafeImage
            src={seller.logo}
            alt={shopName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          // Fallback: حرف اول + gradient
          <div className={cn(
            'w-full h-full bg-gradient-to-br flex items-center justify-center',
            gradient
          )}>
            <span className="text-6xl font-black text-white drop-shadow-lg">
              {firstLetter}
            </span>
          </div>
        )}

        {/* Verified Badge - طلایی */}
        {isVerified && (
          <div className="absolute top-2 right-2">
            <div className="w-8 h-8 bg-gradient-to-br from-warning-400 to-warning-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* ===== ۲۰٪ پایین: اطلاعات ===== */}
      <div className="p-3 text-center">
        {/* نام فروشگاه */}
        <h3 className="font-black text-sm text-gray-900 dark:text-white line-clamp-1 mb-1.5">
          {shopName}
        </h3>

        {/* Stats */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          {seller.rating && seller.rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-warning-500">⭐</span>
              <span className="font-bold">{seller.rating.toFixed(1)}</span>
            </div>
          )}
          
          {seller.rating && seller.rating > 0 && seller.products_count && (
            <span className="text-gray-300 dark:text-slate-600">|</span>
          )}

          {seller.products_count !== undefined && (
            <div className="flex items-center gap-1">
              <span>📦</span>
              <span className="font-bold">{formatNumber(seller.products_count)}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ==================== Skeleton ====================
function TopSellerCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-48 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-slate-700 animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mx-auto" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );
}