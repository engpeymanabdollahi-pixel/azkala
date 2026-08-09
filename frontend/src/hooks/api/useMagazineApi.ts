import { useQuery } from '@tanstack/react-query';
import { magazineService } from '@/services/api';
import type {
  MagazineCategoryFilter,
  MagazineQueryParams,
} from '@/types/magazine.types';

/**
 * React Query keys برای magazine
 * 
 * این keys برای invalidate و refetch استفاده می‌شوند
 */
export const magazineKeys = {
  all: ['magazine'] as const,
  lists: () => [...magazineKeys.all, 'list'] as const,
  list: (params: MagazineQueryParams) => [...magazineKeys.lists(), params] as const,
  details: () => [...magazineKeys.all, 'detail'] as const,
  detail: (slug: string) => [...magazineKeys.details(), slug] as const,
  deviceNews: (modelId: number) => [...magazineKeys.all, 'device-news', modelId] as const,
  featured: () => [...magazineKeys.all, 'featured'] as const,
  stats: () => [...magazineKeys.all, 'stats'] as const,
};

/**
 * دریافت لیست مقالات با pagination و فیلتر
 * 
 * استفاده:
 *   const { data, isLoading, error } = useMagazineArticles({ page: 1, category: 'news' });
 */
export function useMagazineArticles(params: MagazineQueryParams = {}) {
  return useQuery({
    queryKey: magazineKeys.list(params),
    queryFn: () => magazineService.getArticles(params),
    staleTime: 1000 * 60 * 5, // 5 دقیقه
    gcTime: 1000 * 60 * 30, // 30 دقیقه (قبلاً cacheTime)
  });
}

/**
 * دریافت جزئیات کامل یک مقاله
 * 
 * استفاده:
 *   const { data, isLoading, error } = useMagazineArticle('iphone-15-review');
 * 
 * نکته: view_count در backend افزایش می‌یابد
 */
export function useMagazineArticle(slug: string | undefined) {
  return useQuery({
    queryKey: magazineKeys.detail(slug || ''),
    queryFn: () => magazineService.getArticle(slug!),
    enabled: !!slug, // فقط وقتی slug موجود است fetch کن
    staleTime: 1000 * 60 * 2, // 2 دقیقه
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * دریافت اخبار مرتبط با یک دستگاه خاص
 * 
 * ⭐ این hook برای DeviceNewsWidget در HomePage استفاده می‌شود
 * 
 * استفاده:
 *   const { data, isLoading } = useDeviceNews(15, 5);
 */
export function useDeviceNews(modelId: number | undefined, limit: number = 8) {
  return useQuery({
    queryKey: magazineKeys.deviceNews(modelId || 0),
    queryFn: () => magazineService.getDeviceNews(modelId!, limit),
    enabled: !!modelId, // فقط وقتی modelId موجود است fetch کن
    staleTime: 1000 * 60 * 10, // 10 دقیقه
    gcTime: 1000 * 60 * 60, // 1 ساعت
  });
}

/**
 * دریافت مقالات ویژه
 * 
 * استفاده:
 *   const { data } = useMagazineFeatured(5, selectedModel?.id);
 */
export function useMagazineFeatured(limit: number = 5, deviceId?: number) {
  return useQuery({
    queryKey: [...magazineKeys.featured(), { limit, deviceId }],
    queryFn: () => magazineService.getFeatured(limit, deviceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * دریافت آمار کلی مجله
 */
export function useMagazineStats() {
  return useQuery({
    queryKey: magazineKeys.stats(),
    queryFn: () => magazineService.getStats(),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
}

/**
 * Helper: فیلتر بر اساس دسته‌بندی
 * 
 * استفاده:
 *   const { data } = useMagazineByCategory('review');
 */
export function useMagazineByCategory(
  category: Exclude<MagazineCategoryFilter, 'all'>,
  params: Omit<MagazineQueryParams, 'category'> = {}
) {
  return useQuery({
    queryKey: [...magazineKeys.lists(), 'category', category, params],
    queryFn: () => magazineService.getArticlesByCategory(category, params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}