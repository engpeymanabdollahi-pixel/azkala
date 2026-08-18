import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Smartphone,
  Search,
  Sparkles,
  Package,
  ArrowLeft,
  X,
  Store,
  Shield,
  Star,
  BadgeCheck,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  MapPin,
  Boxes,
} from 'lucide-react';
import { brandService, type Brand } from '@/services/api/brand.service';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import Seo from '@/components/Seo';
import { cn } from '@/utils/cn';

interface BrandsPageProps {
  onNavigate?: (page: string) => void;
}

type SortOption = 'default' | 'name' | 'products';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'ترتیب پیش‌فرض' },
  { value: 'name', label: 'الفبایی (آ-ی)' },
  { value: 'products', label: 'بیشترین تعداد محصول' },
];

// حداکثر تعداد برند در بخش «پرمحصول‌ترین برندها» — بخش تزئینیِ کوتاه
// است، نه یک لیست کامل جایگزین.
const MAX_POPULAR_BRANDS = 8;

export function BrandsPage({ onNavigate }: BrandsPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ فاز ۱ Brand Hub: URL منبع حقیقتِ جستجو/مرتب‌سازی/حرف انتخابی است
  // (نه useState داخلی) — دقیقاً همان الگویی که ProductsPage از قبل برای
  // brand_id/search/category دارد. یعنی back/forward مرورگر و کپی‌کردن
  // لینک، بدون هیچ useEffect اضافه‌ای، حالت را کامل بازمی‌گرداند.
  const searchQuery = searchParams.get('q') ?? '';
  const sortBy = ((): SortOption => {
    const raw = searchParams.get('sort');
    return raw === 'name' || raw === 'products' ? raw : 'default';
  })();
  const selectedLetter = searchParams.get('letter') ?? '';

  const updateParam = useCallback(
    (key: 'q' | 'sort' | 'letter', value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // ✅ داده‌ی واقعی برندها از /brands (BrandController::index — با
  // products_count واقعیِ withCount('products'), مرتب بر اساس sort_order
  // سپس name). فیلتر/جستجو/مرتب‌سازی روی همین یک payload، سمت کلاینت
  // انجام می‌شود چون حجم واقعی داده (چند ده برند) هیچ توجیهی برای
  // جستجوی سمت سرور یا debounce ندارد — فیلتر یک آرایه‌ی چند-ده‌تایی روی
  // هر keystroke زیر یک میلی‌ثانیه طول می‌کشد.
  const {
    data: brands = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await brandService.getBrands();
      return res.data || [];
    },
    staleTime: 1000 * 60 * 10, // ۱۰ دقیقه
    gcTime: 1000 * 60 * 30, // ۳۰ دقیقه
  });

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedLetter);

  // ✅ برندهای ویژه: مستقیم از is_featured واقعی (فاز ۱ به BrandResource
  // اضافه شد). اگر هیچ برندی is_featured=true نداشته باشد، این آرایه
  // خالی می‌ماند و کل بخش در JSX رندر نمی‌شود — هیچ داده‌ی جایگزین ساخته
  // نمی‌شود.
  const featuredBrands = useMemo(() => brands.filter((b) => b.is_featured), [brands]);

  // ✅ «پرمحصول‌ترین برندها» — تنها معیار محبوبیتِ واقعی و قابل‌دفاع در
  // دیتابیس فعلی همین products_count است (نه rating/sales که برای Brand
  // اصلاً وجود ندارد). عمداً «محبوب‌ترین» نامیده نشده تا معیار واقعی
  // (تعداد محصول) با ادعای ضمنیِ نادرست (فروش/امتیاز) اشتباه گرفته نشود.
  const popularBrands = useMemo(() => {
    return brands
      .filter((b) => (b.products_count ?? 0) > 0)
      .slice()
      .sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0))
      .slice(0, MAX_POPULAR_BRANDS);
  }, [brands]);

  // ✅ حروف موجود مستقیم از داده‌ی واقعی محاسبه می‌شود (نه یک الفبای
  // ثابت آ-ی یا A-Z هاردکد) — چون نام برندهای واقعی این دیتابیس لاتین‌اند
  // (Samsung, Apple, Anker...)، نمایش فقط حروفی که واقعاً برند دارند هم
  // دقیق‌تر است و هم در موبایل جمع‌وجورتر (به‌جای ۲۶ دکمه که اکثرشان
  // خالی‌اند).
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => {
      const ch = b.name.trim().charAt(0).toLocaleUpperCase();
      if (ch) set.add(ch);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [brands]);

  // ✅ خط‌لوله‌ی فیلتر+مرتب‌سازی برای «همه برندها». حالت 'default' عمداً
  // دوباره sort نمی‌کند — همان ترتیب API (sort_order سپس name، فیکس فاز
  // ۰) حفظ می‌شود.
  const visibleBrands = useMemo(() => {
    let list = brands;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }

    if (selectedLetter) {
      list = list.filter(
        (b) => b.name.trim().charAt(0).toLocaleUpperCase() === selectedLetter
      );
    }

    if (sortBy === 'name') {
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'products') {
      list = list.slice().sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0));
    }

    return list;
  }, [brands, searchQuery, selectedLetter, sortBy]);

  const totalProductsAcrossBrands = useMemo(
    () => brands.reduce((sum, b) => sum + (b.products_count ?? 0), 0),
    [brands]
  );

  // ✅ قبلاً کلیک روی هر برند فقط مدال انتخاب مدل گوشی را باز می‌کرد —
  // بدون ارتباط با آن برند خاص. حالا به لیست محصولات همان برند می‌رود
  // (ProductsPage از قبل brand_id را از URL می‌خواند). طبق دستور فاز ۱،
  // /brands/:slug هنوز ساخته نمی‌شود — همین مسیر موقت حفظ شده.
  const handleBrandClick = (brand: Brand) => {
    handleNavigate(`/products?brand_id=${brand.id}`);
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    next.delete('letter');
    setSearchParams(next, { replace: true });
  };

  const heroBadgeText = isLoading
    ? 'برندهای معتبر'
    : brands.length > 0
      ? `${brands.length} برند معتبر`
      : 'برندهای معتبر';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
      {/* ✅ فاز ۱: قبلاً این صفحه هیچ Seo نداشت — از زیرساخت موجود
          (کامپوننت Seo، همان الگوی AboutPage/ComparePage) استفاده شد، نه
          یک سیستم SEO موازی. عدد ثابتی در description نیست تا هیچ‌وقت
          نادرست/قدیمی نشود. */}
      <Seo
        title="برندها"
        description="خرید لوازم جانبی موبایل و تبلت از معتبرترین برندهای جهانی در ازکالا — با ضمانت اصالت کالا."
        canonical="/brands"
        keywords={['برندهای موبایل', 'لوازم جانبی اصل', 'ازکالا']}
        jsonLd={
          brands.length > 0
            ? {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: brands.map((b, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: b.name,
                  url: `${window.location.origin}/products?brand_id=${b.id}`,
                })),
              }
            : undefined
        }
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* ==================== Hero Section ==================== */}
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-8 md:p-12 text-white mb-10 overflow-hidden shadow-2xl shadow-primary-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right flex-1">
              <Badge variant="warning" className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 ml-1" />
                {heroBadgeText}
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                برندهای مورد اعتماد شما، <br className="hidden md:block" />
                <span className="text-accent-200">در ازکالا</span>
              </h1>
              <p className="text-white/90 text-lg max-w-xl leading-relaxed">
                بهترین و باکیفیت‌ترین لوازم جانبی موبایل را از معتبرترین برندهای جهانی،
                با ضمانت اصالت و بهترین قیمت تهیه کنید.
              </p>
            </div>

            {/* Stats Mini Cards — ✅ فاز ۱: کارت دوم قبلاً «۱۰۰٪ ضمانت
                اصالت» بود که هیچ فیلد واقعی پشتش نبود (آماری ساختگی).
                جایگزین شد با مجموع واقعیِ products_count همه‌ی برندها —
                عددی که مستقیماً از همین payload محاسبه می‌شود. */}
            <div className="flex gap-4 flex-wrap justify-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
                <Store className="w-6 h-6 mx-auto mb-2 text-accent-300" />
                <p className="text-2xl font-black">{brands.length}</p>
                <p className="text-xs text-white/80">برند فعال</p>
              </div>
              {totalProductsAcrossBrands > 0 && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-success-300" />
                  <p className="text-2xl font-black">{totalProductsAcrossBrands}</p>
                  <p className="text-xs text-white/80">محصول از این برندها</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== Search + Sort ==================== */}
        <div className="max-w-2xl mx-auto mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" />
            <input
              type="text"
              aria-label="جستجوی نام برند"
              placeholder="جستجوی نام برند (مثلاً: اپل، سامسونگ، انکر...)"
              value={searchQuery}
              onChange={(e) => updateParam('q', e.target.value)}
              className="w-full pr-12 pl-12 py-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/40 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => updateParam('q', '')}
                aria-label="پاک کردن جستجو"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative sm:w-56">
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => updateParam('sort', e.target.value === 'default' ? '' : e.target.value)}
              aria-label="مرتب‌سازی برندها"
              className="w-full appearance-none pr-9 pl-4 py-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/40 transition-all text-gray-900 dark:text-gray-100 text-sm font-medium shadow-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ==================== Alphabet Navigation ====================
            ✅ فاز ۱: فقط اگر بیش از یک حرف واقعاً در داده وجود داشته
            باشد رندر می‌شود — با یک برند (وضعیت فعلی دیتابیس) این نوار
            هیچ فایده‌ای ندارد و فقط فضا اشغال می‌کند. */}
        {availableLetters.length > 1 && (
          <nav
            aria-label="پیمایش الفبایی برندها"
            className="flex flex-wrap items-center justify-center gap-1.5 mb-8 max-w-3xl mx-auto"
          >
            <button
              type="button"
              onClick={() => updateParam('letter', '')}
              aria-current={selectedLetter === '' ? 'true' : undefined}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                selectedLetter === ''
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              )}
            >
              همه
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => updateParam('letter', selectedLetter === letter ? '' : letter)}
                aria-current={selectedLetter === letter ? 'true' : undefined}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  selectedLetter === letter
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                )}
              >
                {letter}
              </button>
            ))}
          </nav>
        )}

        {/* ==================== Error State ====================
            ✅ فاز ۱: فیکس باگ واقعی — قبلاً وقتی درخواست /brands شکست
            می‌خورد، useQuery روی data=[] پیش‌فرض fallback می‌کرد و صفحه
            دقیقاً همان چیزی را نشان می‌داد که برای «هیچ برندی در دیتابیس
            نیست» نشان می‌دهد: «برندی یافت نشد». حالا خطای واقعی API از
            نبودِ داده یا نتیجه‌ی خالی جستجو تفکیک شده. */}
        {isError ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-error-200 dark:border-error-800">
            <div className="w-20 h-20 bg-error-50 dark:bg-error-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-error-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">
              خطا در دریافت لیست برندها
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              مشکلی در ارتباط با سرور پیش آمد. لطفاً دوباره تلاش کنید.
            </p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('w-4 h-4 ml-2', isFetching && 'animate-spin')} />
              تلاش مجدد
            </Button>
          </div>
        ) : isLoading ? (
          // Skeleton Loading
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 flex flex-col items-center gap-4 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : brands.length === 0 ? (
          // ✅ حالت جدا: اصلاً هیچ برندی در API نیست (نه نتیجه‌ی جستجو)
          <EmptyState
            icon={<Store className="w-10 h-10" />}
            title="در حال حاضر برندی ثبت نشده است"
            description="به‌زودی برندهای معتبر به ازکالا اضافه می‌شوند."
          />
        ) : (
          <>
            {/* ==================== Featured Brands ====================
                ✅ فقط اگر واقعاً is_featured=true برای حداقل یک برند وجود
                داشته باشد رندر می‌شود؛ در غیر این صورت این کل بلوک از
                DOM حذف است — نه یک حالت خالی جعلی. */}
            {!hasActiveFilters && featuredBrands.length > 0 && (
              <section className="mb-10" aria-labelledby="featured-brands-heading">
                <h2 id="featured-brands-heading" className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-gray-100 mb-4">
                  <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
                  برندهای ویژه
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {featuredBrands.map((brand, index) => (
                    <BrandCard key={brand.id} brand={brand} index={index} onClick={handleBrandClick} />
                  ))}
                </div>
              </section>
            )}

            {/* ==================== Popular (Most Products) ====================
                ✅ عنوان صریحاً به معیار واقعی (تعداد محصول) اشاره می‌کند —
                نه ادعای «محبوبیت» که هیچ داده‌ی فروش/امتیازی پشتش نیست. */}
            {!hasActiveFilters && popularBrands.length > 0 && (
              <section className="mb-10" aria-labelledby="popular-brands-heading">
                <h2 id="popular-brands-heading" className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-gray-100 mb-4">
                  <Boxes className="w-5 h-5 text-primary-500" />
                  پرمحصول‌ترین برندها
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {popularBrands.map((brand, index) => (
                    <BrandCard key={brand.id} brand={brand} index={index} onClick={handleBrandClick} />
                  ))}
                </div>
              </section>
            )}

            {/* ==================== All Brands / Search Results ==================== */}
            <section aria-labelledby="all-brands-heading">
              <div className="flex items-center justify-between mb-4">
                <h2 id="all-brands-heading" className="text-lg font-black text-gray-900 dark:text-gray-100">
                  {hasActiveFilters ? `نتایج (${visibleBrands.length})` : 'همه برندها'}
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    پاک کردن فیلترها
                  </button>
                )}
              </div>

              {visibleBrands.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {visibleBrands.map((brand, index) => (
                    <BrandCard key={brand.id} brand={brand} index={index} onClick={handleBrandClick} />
                  ))}
                </div>
              ) : (
                // ✅ حالت جدا: نتیجه‌ی صفرِ جستجو/فیلتر (نه نبودِ داده در API)
                <EmptyState
                  icon={<Search className="w-10 h-10" />}
                  title="برندی یافت نشد"
                  description={
                    searchQuery
                      ? `متأسفانه برندی با نام «${searchQuery}» در لیست برندهای ما وجود ندارد.`
                      : 'برندی با این فیلتر یافت نشد.'
                  }
                  action={
                    <Button variant="outline" onClick={clearAllFilters}>
                      پاک کردن فیلترها
                    </Button>
                  }
                />
              )}
            </section>
          </>
        )}

        {/* ==================== Bottom CTA Section ==================== */}
        <div className="mt-16 bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0xMHY2aC02VjI0aDZ6bTAgMTB2NmgtNlYzNGg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Smartphone className="w-8 h-8 text-accent-300" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4">برند مورد نظر خود را پیدا نکردید؟</h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              ما به‌صورت مداوم برندهای جدید و پرطرفدار را به ازکالا اضافه می‌کنیم.
              همچنین می‌توانید مستقیماً نام محصول مورد نظر خود را در نوار جستجوی اصلی سایت جستجو کنید.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 font-bold"
                onClick={() => handleNavigate('/products')}
              >
                <Search className="w-5 h-5 mr-2" />
                جستجوی مستقیم محصولات
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => handleNavigate('/contact')}
              >
                <Store className="w-5 h-5 mr-2" />
                درخواست افزودن برند
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==================== Brand Card ====================
// ✅ فاز ۱: کارت قبلی به کامپوننت جدا استخراج شد چون حالا در ۳ بخش
// مختلف (ویژه/پرمحصول/همه) استفاده می‌شود — بدون این استخراج باید JSX
// کارت سه بار تکرار می‌شد. منطق/ظاهر پایه‌ی کارت اصلی دست‌نخورده ماند،
// فقط دو نشان (verified/featured) و کشور اضافه شدند.
interface BrandCardProps {
  brand: Brand;
  index: number;
  onClick: (brand: Brand) => void;
}

function BrandCard({ brand, index, onClick }: BrandCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(brand)}
      aria-label={`مشاهده محصولات برند ${brand.name}`}
      className={cn(
        'group relative bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-100 dark:border-slate-700 p-6 flex flex-col items-center gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-700 overflow-hidden',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Hover Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Featured/Verified Badges */}
      {(brand.is_featured || brand.is_verified) && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {brand.is_featured && (
            <span title="برند ویژه" className="w-5 h-5 flex items-center justify-center rounded-full bg-accent-500 text-white">
              <Star className="w-3 h-3 fill-white" />
            </span>
          )}
          {brand.is_verified && (
            <span title="برند تأیید‌شده" className="w-5 h-5 flex items-center justify-center rounded-full bg-success-500 text-white">
              <BadgeCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}

      {/* Logo Container */}
      <div className="relative z-10 w-20 h-20 flex items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-2xl group-hover:bg-white dark:group-hover:bg-slate-950 group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md overflow-hidden">
        <SafeImage
          src={brand.logo}
          alt={brand.name}
          className="w-full h-full object-contain p-2"
          showEmojiOnError
          fallbackEmoji="📱"
        />
      </div>

      {/* Brand Info */}
      <div className="relative z-10 text-center w-full">
        <h3 className="font-black text-gray-900 dark:text-gray-100 text-base group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2 truncate">
          {brand.name}
        </h3>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
            <Package className="w-3 h-3" />
            {brand.products_count ?? 0} محصول
          </span>
          {brand.country && (
            <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
              <MapPin className="w-3 h-3" />
              {brand.country}
            </span>
          )}
        </div>
      </div>

      {/* Action Badge (Shows on Hover) */}
      <div className="relative z-10 mt-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
        <Badge variant="primary" className="gap-1.5 shadow-md">
          مشاهده محصولات
          <ArrowLeft className="w-3 h-3" />
        </Badge>
      </div>
    </button>
  );
}

export default BrandsPage;
