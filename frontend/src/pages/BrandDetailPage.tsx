/**
 * BrandDetailPage — صفحه‌ی جزئیات برند (فاز ۲ Brand Detail)
 *
 * ✅ طبق تصمیم معماری فاز ۲ (مستند در گزارش نهایی):
 * - اطلاعات برند: از همان GET /brands/slug/{slug} موجود (فاز ۰/۱) —
 *   هیچ endpoint جدیدی برای برند لازم نشد.
 * - محصولات برند: productService.getProducts() موجود مستقیم صدا زده
 *   می‌شود (brand_id قفل‌شده + page/sort_by/sort_order/category_id/
 *   min_price/max_price/search واقعی سمت سرور) — نه ProductsPage/
 *   useProducts.ts، چون آن هوک صفحه‌بندی واقعی ندارد (فقط تا ۱۰۰ محصول
 *   می‌گیرد و باقی فیلترها را کاملاً سمت کلاینت روی همان یک صفحه اعمال
 *   می‌کند — برای این صفحه که فاز ۲ صراحتاً pagination واقعی سمت سرور
 *   می‌خواهد کافی نبود).
 * - کارت محصول/wishlist/compare/cart: مستقیم از ProductCard موجود
 *   (@/components/marketplace) — این کامپوننت کاملاً خودکفاست و این سه
 *   عمل را داخلی مدیریت می‌کند، پس اینجا هیچ سیم‌کشی اضافه‌ای لازم نیست.
 * - فیلترها فقط شامل مواردی هستند که ProductFilterDTO/ProductRepository
 *   واقعاً سمت سرور پشتیبانی می‌کنند: category_id, min_price/max_price,
 *   search, sort_by/sort_order. rating/discount/in-stock/seller/device
 *   در DTO عمومی وجود ندارند — عمداً در این فاز اضافه نشدند (مستندسازی
 *   در گزارش نهایی، بخش Deferred).
 */

import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home, ChevronLeft, AlertTriangle, RefreshCw, Search, Store,
  BadgeCheck, Star, Globe, Package, ArrowUpDown, X,
  ChevronRight,
} from 'lucide-react';

import { brandService } from '@/services/api/brand.service';
import { productService } from '@/services/api/product.service';
import { categoryService } from '@/services/api/category.service';
import { ProductCard } from '@/components/marketplace';
import { ProductCardSkeleton } from '@/components/features/ProductCardSkeleton';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import Seo from '@/components/Seo';
import { generateBreadcrumbSchema, generateCollectionPageSchema } from '@/lib/seo-schemas';
import { PRICE_RANGES, SORT_OPTIONS } from '@/pages/ProductsPage/constants';
import type { SortOption } from '@/pages/ProductsPage/types';
import type { Product, Category } from '@/types/models';
import { cn } from '@/utils/cn';

const PRODUCTS_PER_PAGE = 24;

// ✅ نگاشت مقدار ترکیبی SortOption فرانت (که ProductsPage از قبل تعریف
// کرده و اینجا دوباره استفاده می‌شود) به دو پارامتر واقعی بک‌اند
// (sort_by ستون + sort_order جهت) — دو شکل متفاوت‌اند، این تابع پل بین
// آن‌هاست.
function mapSortOption(sort: SortOption): { sort_by: string; sort_order: 'asc' | 'desc' } {
  switch (sort) {
    case 'newest':
      return { sort_by: 'created_at', sort_order: 'desc' };
    case 'price_asc':
      return { sort_by: 'price', sort_order: 'asc' };
    case 'price_desc':
      return { sort_by: 'price', sort_order: 'desc' };
    case 'rating':
      return { sort_by: 'rating', sort_order: 'desc' };
    case 'popular':
    default:
      return { sort_by: 'sales_count', sort_order: 'desc' };
  }
}

export function BrandDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const sort = ((): SortOption => {
    const raw = searchParams.get('sort');
    return (SORT_OPTIONS.some((o) => o.value === raw) ? raw : 'popular') as SortOption;
  })();
  const priceRangeIndex = ((): number => {
    const raw = Number(searchParams.get('price'));
    return Number.isInteger(raw) && raw >= 0 && raw < PRICE_RANGES.length ? raw : 0;
  })();
  const page = ((): number => {
    const raw = Number(searchParams.get('page'));
    return Number.isInteger(raw) && raw > 0 ? raw : 1;
  })();

  const updateParam = (key: string, value: string, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (resetPage) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  // ==================== Brand ====================

  const {
    data: brandResponse,
    isLoading: isBrandLoading,
    isError: isBrandError,
    error: brandError,
    refetch: refetchBrand,
  } = useQuery({
    queryKey: ['brand', slug],
    queryFn: () => brandService.getBrandBySlug(slug as string),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: (failureCount, err: any) => err?.response?.status !== 404 && failureCount < 2,
  });
  const brand = brandResponse?.data;
  const isBrandNotFound = isBrandError && (brandError as any)?.response?.status === 404;

  // ==================== Categories (برای فیلتر) ====================
  // ✅ همان queryKey دقیق ProductsPage (['all-categories']) — تا کش بین
  // این صفحه و ProductsPage به اشتراک برود و درخواست تکراری نزند.
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['all-categories'],
    queryFn: async () => {
      try {
        const res = await categoryService.getAll();
        return res.data || [];
      } catch {
        return [];
      }
    },
  });

  // ==================== Products (صفحه‌بندی واقعی سمت سرور) ====================

  const priceRange = PRICE_RANGES[priceRangeIndex];
  const { sort_by, sort_order } = mapSortOption(sort);
  const selectedCategory = categories.find((c) => c.slug === categorySlug);

  const {
    data: productsResult,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', 'brand', brand?.id, page, sort_by, sort_order, selectedCategory?.id, priceRangeIndex, search],
    queryFn: async () => {
      const res = await productService.getProducts({
        brand_id: brand!.id,
        page,
        per_page: PRODUCTS_PER_PAGE,
        sort_by,
        sort_order,
        category_id: selectedCategory?.id,
        min_price: priceRange.min || undefined,
        max_price: priceRange.max < 10000000 ? priceRange.max : undefined,
        search: search || undefined,
      });
      // ✅ GET /products واقعاً {success, data: Product[], meta: {...}}
      // برمی‌گرداند (تأیید مستقیم با tinker/toSql) — نه شکل تودرتوی
      // {data:{data:[...],...}} که تایپ مشترک ProductsResponse (که چند
      // endpoint دیگر مثل compatible/compatible-multi را هم پوشش می‌دهد و
      // آنجا واقعاً همان شکل تودرتو درست است) ادعا می‌کند. همان الگوی
      // دفاعی خودِ ProductsPage/hooks/useProducts.ts دوباره استفاده شد تا
      // این کد به فرض غلط تایپ مشترک وابسته نباشد.
      const raw = res as unknown as { data: Product[] | { data: Product[] }; meta?: { current_page: number; last_page: number; total: number } };
      const items = Array.isArray(raw.data) ? raw.data : (raw.data as any)?.data ?? [];
      const meta = raw.meta ?? (raw.data as any) ?? { current_page: 1, last_page: 1, total: items.length };
      return { items: items as Product[], meta };
    },
    enabled: !!brand?.id,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const products = productsResult?.items ?? [];
  const meta = productsResult?.meta;
  const hasActiveFilters = Boolean(search || categorySlug || priceRangeIndex > 0);

  const handleViewProduct = (product: Product) => navigate(`/products/${product.slug}`);

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('category');
    next.delete('price');
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  // ==================== Error/Not-Found States ====================

  if (isBrandNotFound) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">برند یافت نشد</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          این برند وجود ندارد یا دیگر فعال نیست.
        </p>
        <Button onClick={() => navigate('/brands')}>بازگشت به لیست برندها</Button>
      </div>
    );
  }

  if (isBrandError) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl text-center">
        <div className="w-20 h-20 bg-error-50 dark:bg-error-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-10 h-10 text-error-500" />
        </div>
        <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">خطا در دریافت اطلاعات برند</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">مشکلی در ارتباط با سرور پیش آمد.</p>
        <Button variant="outline" onClick={() => refetchBrand()}>
          <RefreshCw className="w-4 h-4 ml-2" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  if (isBrandLoading || !brand) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-xl w-64 mb-4 animate-pulse" />
        <div className="h-40 bg-gray-100 dark:bg-slate-800 rounded-3xl mb-6 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
      <Seo
        title={brand.name}
        description={
          brand.description
            ? brand.description.slice(0, 155)
            : `خرید محصولات ${brand.name} در ازکالا — ${brand.products_count ?? 0} محصول با ضمانت اصالت.`
        }
        canonical={`/brands/${brand.slug}`}
        image={brand.logo || undefined}
        jsonLd={[
          generateBreadcrumbSchema([
            { name: 'خانه', url: '/' },
            { name: 'برندها', url: '/brands' },
            { name: brand.name, url: `/brands/${brand.slug}` },
          ]),
          generateCollectionPageSchema(
            `محصولات ${brand.name}`,
            `لیست محصولات برند ${brand.name} در ازکالا`,
            `/brands/${brand.slug}`
          ),
        ]}
      />

      <div className="container mx-auto px-3 md:px-4 py-4 max-w-7xl">

        {/* ✅ Breadcrumb — دقیقاً همان الگوی بصری ProductDetailPage.tsx
            (تنها breadcrumb موجود در کدبیس، به‌صورت inline nav در هر
            صفحه‌ی جزئیات؛ هیچ کامپوننت breadcrumb مشترکی در کل frontend
            وجود ندارد). */}
        <nav
          aria-label="مسیر ناوبری"
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 shadow-sm border border-gray-100 dark:border-slate-700"
        >
          <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-0.5">
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خانه</span>
          </Link>
          <ChevronLeft className="w-3 h-3 text-gray-300 dark:text-gray-600 rotate-180" />
          <Link to="/brands" className="hover:text-primary-600 dark:hover:text-primary-400">برندها</Link>
          <ChevronLeft className="w-3 h-3 text-gray-300 dark:text-gray-600 rotate-180" />
          <span className="text-gray-900 dark:text-gray-100 font-medium line-clamp-1">{brand.name}</span>
        </nav>

        {/* ==================== Hero ==================== */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-2xl overflow-hidden">
              <SafeImage
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-contain p-3"
                showEmojiOnError
                fallbackEmoji="📱"
                priority
              />
            </div>

            <div className="flex-1 text-center sm:text-right w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100">
                  {brand.name}
                </h1>
                {brand.is_verified && (
                  <Badge variant="success" className="gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    تأیید‌شده
                  </Badge>
                )}
                {brand.is_featured && (
                  <Badge variant="warning" className="gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    ویژه
                  </Badge>
                )}
              </div>

              {/* ✅ فقط فیلدهایی که واقعاً مقدار دارند رندر می‌شوند — طبق
                  دستور صریح فاز ۲: «If data is missing: hide the field
                  gracefully.» هیچ متن جایگزین/placeholder برای فیلد خالی
                  نمایش داده نمی‌شود. */}
              {brand.description && (
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3 max-w-2xl">
                  {brand.description}
                </p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg font-medium">
                  <Package className="w-3.5 h-3.5" />
                  {brand.products_count ?? 0} محصول
                </span>
                {brand.country && (
                  <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg font-medium">
                    <Globe className="w-3.5 h-3.5" />
                    {brand.country}
                  </span>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2.5 py-1 rounded-lg font-medium hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                  >
                    وب‌سایت رسمی
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== Filters/Sort Toolbar ====================
            ✅ فقط سه فیلتری که واقعاً سمت سرور اعمال می‌شوند (category،
            بازه‌ی قیمت، جستجو) + مرتب‌سازی — طبق دستور صریح فاز ۲:
            «Never display a sorting/filtering option that backend
            ignores.» rating/discount/in-stock/seller/device عمداً حذف
            شدند (شرح در گزارش نهایی). */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-3 mb-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                aria-label={`جستجو در محصولات ${brand.name}`}
                placeholder={`جستجو در محصولات ${brand.name}...`}
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                className="w-full pr-9 pl-9 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => updateParam('search', '')}
                  aria-label="پاک کردن جستجو"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <select
                value={categorySlug}
                onChange={(e) => updateParam('category', e.target.value)}
                aria-label="فیلتر دسته‌بندی"
                className="px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px]"
              >
                <option value="">همه دسته‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            )}

            <select
              value={priceRangeIndex}
              onChange={(e) => updateParam('price', e.target.value)}
              aria-label="فیلتر بازه‌ی قیمت"
              className="px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px]"
            >
              {PRICE_RANGES.map((range, i) => (
                <option key={range.label} value={i}>{range.label}</option>
              ))}
            </select>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value === 'popular' ? '' : e.target.value)}
                aria-label="مرتب‌سازی محصولات"
                className="appearance-none pr-8 pl-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[150px]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-slate-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">فیلتر فعال</span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                پاک کردن همه
              </button>
            </div>
          )}
        </div>

        {/* ==================== Products ==================== */}
        {isProductsError ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-error-200 dark:border-error-800">
            <AlertTriangle className="w-10 h-10 text-error-500 mx-auto mb-3" />
            <h2 className="font-black text-gray-900 dark:text-gray-100 mb-2">خطا در دریافت محصولات</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">مشکلی در ارتباط با سرور پیش آمد.</p>
            <Button variant="outline" onClick={() => refetchProducts()}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تلاش مجدد
            </Button>
          </div>
        ) : isProductsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={<Search className="w-10 h-10" />}
              title="محصولی با این فیلتر یافت نشد"
              description="فیلترها را تغییر دهید یا آن‌ها را پاک کنید."
              action={<Button variant="outline" onClick={clearFilters}>پاک کردن فیلترها</Button>}
            />
          ) : (
            <EmptyState
              icon={<Package className="w-10 h-10" />}
              title={`فعلاً محصولی از ${brand.name} ثبت نشده`}
              description="به‌زودی محصولات این برند اضافه می‌شوند."
            />
          )
        ) : (
          <>
            <div
              className={cn(
                'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4',
                isProductsFetching && 'opacity-60 transition-opacity'
              )}
            >
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onViewDetails={handleViewProduct}
                />
              ))}
            </div>

            {/* ==================== Pagination — واقعی، سمت سرور ==================== */}
            {meta && meta.last_page > 1 && (
              <nav aria-label="صفحه‌بندی محصولات" className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParam('page', String(page - 1), false)}
                >
                  <ChevronRight className="w-4 h-4" />
                  قبلی
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                  صفحه {page} از {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page}
                  onClick={() => updateParam('page', String(page + 1), false)}
                >
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BrandDetailPage;
