import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Newspaper, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { useMagazineArticles, useMagazineStats } from '@/hooks/api/useMagazineApi';
import type { MagazineCategoryFilter } from '@/types/magazine.types';
import CategoryTabs from '@/components/magazine/CategoryTabs';
import ArticleGrid, { ArticleGridSkeleton } from '@/components/magazine/ArticleGrid';
import ArticleCard from '@/components/magazine/ArticleCard';
import { cn } from '@/utils/cn';

const PER_PAGE = 12;

/**
 * صفحه لیست مقالات مجله
 * 
 * Route: /magazine
 * 
 * Features:
 * - فیلتر دسته‌بندی (با sync به URL)
 * - جستجو با debounce
 * - Pagination
 * - Featured article در بالای صفحه اول
 */
export default function MagazinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: statsData } = useMagazineStats();
  const stats = statsData?.data;
  const [activeCategory, setActiveCategory] = useState<MagazineCategoryFilter>(
    (searchParams.get('category') as MagazineCategoryFilter) || 'all'
  );
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounce search (500ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, debouncedSearch]);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (activeCategory !== 'all') params.category = activeCategory;
    if (currentPage > 1) params.page = String(currentPage);
    if (debouncedSearch) params.search = debouncedSearch;
    setSearchParams(params, { replace: true });
  }, [activeCategory, currentPage, debouncedSearch, setSearchParams]);

  const { data, isLoading, error, refetch } = useMagazineArticles({
    page: currentPage,
    per_page: PER_PAGE,
    category: activeCategory === 'all' ? undefined : activeCategory,
    search: debouncedSearch || undefined,
  });

  const articles = data?.data ?? [];
  const meta = data?.meta;
  const hasPagination = meta && meta.last_page > 1;

  const handleCategoryChange = useCallback((category: MagazineCategoryFilter) => {
    setActiveCategory(category);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Page Header - بنر مدرن */}
      <div className="relative overflow-hidden bg-slate-900">
        {/* بلورهای متحرک */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* الگوی شبکه */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-primary-300 text-xs font-bold mb-5">
                <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                مجله{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-accent-400">
                  ازکالا
                </span>
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-xl leading-relaxed">
                آخرین اخبار، بررسی‌ها و راهنمای خرید دنیای فناوری 
              </p>
            </div>

            {/* آمار زنده */}
            {stats && (
              <div className="flex items-center gap-4">
               
                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
                  <p className="text-3xl font-black text-white">{stats.total_views}</p>
                  <p className="text-xs text-gray-400 mt-1">مجموع بازدید</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در مقالات..."
              className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          className="mb-8"
        />

        {/* Content States */}
        {isLoading ? (
          <ArticleGridSkeleton count={6} />
        ) : error ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              خطا در بارگذاری مقالات
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              لطفاً اتصال اینترنت خود را بررسی کنید
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              تلاش مجدد
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <div className="text-6xl mb-3">📭</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              مقاله‌ای یافت نشد
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              فیلتر دیگری را امتحان کنید یا عبارت جستجو را تغییر دهید
            </p>
          </div>
        ) : (
          <>
            {/* Featured Article (فقط صفحه اول بدون فیلتر) */}
            {currentPage === 1 && !debouncedSearch && activeCategory === 'all' && articles.length > 1 && (
              <div className="mb-8">
                <ArticleCard article={articles[0]} variant="featured" />
              </div>
            )}

            {/* Articles Grid */}
            <ArticleGrid
              articles={
                currentPage === 1 && !debouncedSearch && activeCategory === 'all' && articles.length > 1
                  ? articles.slice(1)
                  : articles
              }
              columns={3}
            />

            {/* Pagination */}
            {hasPagination && meta && (
              <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    'flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors',
                    currentPage === 1
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-primary-400'
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>قبلی</span>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, meta.last_page) }).map((_, i) => {
                  let pageNum: number;
                  if (meta.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= meta.last_page - 2) {
                    pageNum = meta.last_page - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'w-10 h-10 rounded-lg font-medium transition-colors',
                        pageNum === currentPage
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-primary-400'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={currentPage === meta.last_page}
                  className={cn(
                    'flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors',
                    currentPage === meta.last_page
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-primary-400'
                  )}
                >
                  <span>بعدی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}