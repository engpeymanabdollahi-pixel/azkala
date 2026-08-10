import { useQuery } from '@tanstack/react-query';
import { adService } from '@/services/api/ad.service';
import type { Ad } from '@/services/api/ad.service';
import { Megaphone, Loader2 } from 'lucide-react';

/**
 * AdSidebar Component
 * 
 * نمایش تبلیغات فعال در ستون کناری مجله
 * - فقط تبلیغات با position='sidebar' نمایش داده می‌شوند
 * - حداکثر ۵ تبلیغ
 * - مرتب‌شده بر اساس priority و created_at
 */
export default function AdSidebar({ position = 'sidebar', limit = 5 }: { position?: string; limit?: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ads', position, limit],
    queryFn: () => adService.getActiveAds(position, limit),
    staleTime: 1000 * 60 * 5, // 5 دقیقه
    gcTime: 1000 * 60 * 30, // 30 دقیقه
  });

  const ads = data?.data ?? [];

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>در حال بارگذاری...</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-slate-800 rounded-xl h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return null; // در صورت خطا، sidebar را نشان نده
  }

  // Empty State
  if (ads.length === 0) {
    return null; // اگر تبلیغی نبود، چیزی نشان نده
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <Megaphone className="w-4 h-4" />
        <span>تبلیغات</span>
      </div>

      {/* Ads List */}
      {ads.map((ad: Ad) => (
        <a
          key={ad.id}
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
          title={ad.title}
        >
          <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 bg-white dark:bg-slate-800">
            {/* Image */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-sm font-bold line-clamp-2 leading-snug">
                {ad.title}
              </p>
            </div>

            {/* Sponsored badge */}
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
              تبلیغ
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}