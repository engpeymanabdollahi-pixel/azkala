import { memo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, X, Mic, MicOff, Clock, TrendingUp, ArrowLeft, ChevronDown,
  Trash2, Package, Smartphone, Tag, Store, ChevronLeft, Star, BadgeCheck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSearch, POPULAR_SUGGESTIONS } from './hooks/useSearch';
import { useVoiceSearch } from './hooks/useVoiceSearch';
import { useCategories } from '@/hooks/useCategories';
import { searchService } from '@/services/api/search.service';
import { useModelStore } from '@/store/modelStore';
import type { ModelData } from './types';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';

interface SearchBarProps {
  isScrolled: boolean;
  selectedModel: ModelData | null;
  isMobile?: boolean;
}

/**
 * SearchBar - ارتقا یافته با Live Multi-entity Results
 *
 * مطابق سند مرجع ازکالا (بخش ۱۰ Search System):
 * نتایج باید شامل:
 * - Products
 * - Devices (منحصر به ازکالا)
 * - Categories
 * - Sellers
 *
 * Features:
 * - Live search با debounce (300ms)
 * - Device-aware (اگر دستگاه انتخاب شده، نتایج فیلتر می‌شوند)
 * - Inline results در dropdown (بدون نیاز به navigate)
 * - Fallback به جستجوی قبلی (history + popular)
 */
export const SearchBar = memo(({ isScrolled, selectedModel, isMobile = false }: SearchBarProps) => {
  const navigate = useNavigate();
  const { selectedModel: deviceModel } = useModelStore();

  const {
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    selectedCategory,
    setSelectedCategory,
    searchHistory,
    smartSuggestions,
    isSearching,
    performSearch,
    handleSearchKeyDown,
    handleSuggestionClick,
    clearSearch,
    clearSearchHistory
  } = useSearch();

  const { isListening, isSupported, toggleVoiceSearch } = useVoiceSearch(setSearchQuery);
  const { data: categories } = useCategories();
  const searchRef = useRef<HTMLDivElement>(null);

  // ==================== Live Search State ====================
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 🔧 Debounce 300ms برای جلوگیری از request های زیاد
  useEffect(() => {
    console.log('🔍 [SearchBar] searchQuery changed:', searchQuery);
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      console.log('🔍 [SearchBar] Setting debouncedQuery to:', trimmed);
      setDebouncedQuery(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ==================== Live Search Query ====================
  const {
    data: liveResults,
    isLoading: isLiveSearching,
    isFetching,
    error: liveSearchError,
  } = useQuery({
    queryKey: ['search-live', debouncedQuery, deviceModel?.id],
    queryFn: async () => {
      console.log('🔍 [SearchBar] queryFn executing for:', debouncedQuery);
      const result = await searchService.globalSearch(debouncedQuery, {
        device_model_id: deviceModel?.id,
        limit: 5,
      });
      console.log('🔍 [SearchBar] queryFn result:', result);
      return result;
    },
    enabled: debouncedQuery.length >= 2 && isSearchFocused,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // 🔍 Debug: نمایش وضعیت live search
  useEffect(() => {
    console.log('🔍 [SearchBar] State snapshot:', {
      searchQuery,
      debouncedQuery,
      isSearchFocused,
      isLiveSearching,
      isFetching,
      hasResults: !!liveResults,
      productsCount: liveResults?.products?.count,
      error: liveSearchError,
    });
  }, [searchQuery, debouncedQuery, isSearchFocused, liveResults, isLiveSearching, isFetching, liveSearchError]);

  // ==================== Computed Values ====================
  const searchCategories = [
    { id: 'all', name: 'همه دسته‌ها', slug: '' },
    ...(categories || []).map(c => ({ id: c.slug, name: c.name, slug: c.slug }))
  ];

  const placeholder = selectedModel
    ? `جستجو در لوازم جانبی ${selectedModel.name}...`
    : deviceModel
    ? `جستجو برای ${deviceModel.name}...`
    : 'جستجو در هزاران محصول...';

  const hasLiveResults = liveResults && (
    liveResults.products.count > 0 ||
    liveResults.devices.brands_count > 0 ||
    liveResults.devices.models_count > 0 ||
    liveResults.categories.count > 0 ||
    liveResults.sellers.count > 0
  );

  const shouldShowLiveResults = debouncedQuery.length >= 2 && isSearchFocused;
  const shouldShowFallback = searchQuery.length === 0 && isSearchFocused;

  // ==================== Handlers ====================
  const handleProductClick = (slug: string) => {
    setIsSearchFocused(false);
    navigate(`/products/${slug}`);
  };

  const handleDeviceClick = (slug: string) => {
    setIsSearchFocused(false);
    navigate(`/products?device=${slug}`);
  };

  const handleCategoryClick = (slug: string) => {
    setIsSearchFocused(false);
    navigate(`/products?category=${slug}`);
  };

  const handleSellerClick = (slug: string) => {
    setIsSearchFocused(false);
    navigate(`/seller/${slug}`);
  };

  const handleViewAllProducts = () => {
    setIsSearchFocused(false);
    navigate(`/products?q=${encodeURIComponent(debouncedQuery)}`);
  };

  // ==================== Render Helpers ====================

  const renderProductsSection = () => {
    if (!liveResults || liveResults.products.count === 0) return null;

    return (
      <div className="border-b border-gray-100 dark:border-slate-700 last:border-0">
        <div className="px-4 py-2 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary-500" />
            محصولات
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
              ({liveResults.products.count})
            </span>
          </p>
          {liveResults.products.count > 3 && (
            <button
              onClick={handleViewAllProducts}
              className="text-[10px] text-primary-600 dark:text-primary-400 font-bold hover:underline flex items-center gap-0.5"
            >
              مشاهده همه
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {liveResults.products.items.slice(0, 3).map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product.slug)}
              className="w-full px-3 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-3 text-right focus:outline-none focus:bg-primary-50 dark:focus:bg-primary-900/20"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                <SafeImage
                  src={product.main_image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  fallbackEmoji="📦"
                  showEmojiOnError
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {product.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {product.rating && product.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <Star className="w-3 h-3 fill-warning-400 text-warning-400" />
                      {product.rating.toFixed(1)}
                    </span>
                  )}
                  {product.seller && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {product.seller.shop_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-black text-primary-600 dark:text-primary-400">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">تومان</span>
                  {product.discount_percentage && product.discount_percentage > 0 && (
                    <span className="text-[9px] bg-error-500 text-white px-1.5 py-0.5 rounded font-bold">
                      {product.discount_percentage}٪
                    </span>
                  )}
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderDevicesSection = () => {
    if (!liveResults) return null;
    const { brands, models } = liveResults.devices;
    if (brands.length === 0 && models.length === 0) return null;

    return (
      <div className="border-b border-gray-100 dark:border-slate-700 last:border-0">
        <div className="px-4 py-2 bg-gradient-to-r from-accent-50 to-white dark:from-accent-900/20 dark:to-slate-800">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-accent-500" />
            دستگاه‌ها
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
              ({brands.length + models.length})
            </span>
          </p>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {brands.slice(0, 2).map((brand) => (
            <button
              key={`brand-${brand.id}`}
              onClick={() => handleDeviceClick(brand.slug)}
              className="w-full px-4 py-2.5 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors flex items-center gap-3 text-right focus:outline-none"
            >
              <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {brand.name}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">برند</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}
          {models.slice(0, 3).map((model) => (
            <button
              key={`model-${model.id}`}
              onClick={() => handleDeviceClick(model.slug)}
              className="w-full px-4 py-2.5 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors flex items-center gap-3 text-right focus:outline-none"
            >
              <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {model.name}
                </p>
                {model.series?.brand && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {model.series.brand.name}
                  </p>
                )}
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCategoriesSection = () => {
    if (!liveResults || liveResults.categories.count === 0) return null;

    return (
      <div className="border-b border-gray-100 dark:border-slate-700 last:border-0">
        <div className="px-4 py-2 bg-gradient-to-r from-success-50 to-white dark:from-success-900/20 dark:to-slate-800">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-success-500" />
            دسته‌بندی‌ها
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
              ({liveResults.categories.count})
            </span>
          </p>
        </div>
        <div className="max-h-40 overflow-y-auto">
          {liveResults.categories.items.slice(0, 3).map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className="w-full px-4 py-2.5 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors flex items-center gap-3 text-right focus:outline-none"
            >
              <div className="w-8 h-8 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-success-600 dark:text-success-400" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {category.name}
                </p>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSellersSection = () => {
    if (!liveResults || liveResults.sellers.count === 0) return null;

    return (
      <div className="border-b border-gray-100 dark:border-slate-700 last:border-0">
        <div className="px-4 py-2 bg-gradient-to-r from-warning-50 to-white dark:from-warning-900/20 dark:to-slate-800">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-warning-500" />
            فروشندگان
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
              ({liveResults.sellers.count})
            </span>
          </p>
        </div>
        <div className="max-h-40 overflow-y-auto">
          {liveResults.sellers.items.slice(0, 2).map((seller) => (
            <button
              key={seller.id}
              onClick={() => handleSellerClick(seller.slug)}
              className="w-full px-4 py-2.5 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors flex items-center gap-3 text-right focus:outline-none"
            >
              <div className="w-8 h-8 bg-warning-100 dark:bg-warning-900/30 rounded-lg overflow-hidden flex-shrink-0">
                {seller.logo ? (
                  <SafeImage
                    src={seller.logo}
                    alt={seller.shop_name}
                    className="w-full h-full object-cover"
                    fallbackEmoji="🏪"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  {seller.shop_name}
                  {seller.verified_at && (
                    <BadgeCheck className="w-3.5 h-3.5 text-success-500" />
                  )}
                </p>
                {seller.rating !== undefined && seller.rating > 0 && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-warning-400 text-warning-400" />
                    {seller.rating.toFixed(1)}
                  </p>
                )}
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLiveResultsSkeleton = () => (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderNoResults = () => (
    <div className="p-6 text-center">
      <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
        نتیجه‌ای یافت نشد
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        عبارت دیگری را امتحان کنید
      </p>
      <button
        onClick={handleViewAllProducts}
        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
      >
        جستجو در همه محصولات
      </button>
    </div>
  );

  // ==================== Main Render ====================

  return (
    <div ref={searchRef} className={cn('relative', isMobile ? 'w-full' : 'hidden md:flex flex-1 max-w-3xl mx-4')}>
      <div
        className={cn(
          'relative w-full flex items-stretch transition-all duration-300 rounded-2xl overflow-hidden',
          'border-2 bg-gray-50 dark:bg-slate-800',
          isSearchFocused
            ? 'border-primary-500 ring-4 ring-primary-100 dark:ring-primary-900 scale-[1.01]'
            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
        )}
      >
        {/* Category Select - Desktop Only */}
        {!isScrolled && !isMobile && (
          <div className="relative flex-shrink-0 hidden lg:block">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={cn(
                'h-full bg-transparent dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:outline-none appearance-none cursor-pointer border-l-2 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white',
                isScrolled ? 'px-3 text-xs min-w-[100px]' : 'px-4 text-sm min-w-[140px]'
              )}
              aria-label="انتخاب دسته‌بندی جستجو"
            >
              {searchCategories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Search Input */}
               <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            className={cn(
              'w-full bg-transparent focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
              isScrolled || isMobile ? 'pr-12 pl-20 py-2 text-sm' : 'pr-12 pl-12 py-3 text-sm'
            )}
            aria-label="جستجوی محصول"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={isSearchFocused}
            autoComplete="off"
          />

          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute left-16 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Button */}
          {isSupported && (
            <button
              onClick={toggleVoiceSearch}
              className={cn(
                'absolute left-10 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500',
                isListening
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
              aria-label={isListening ? 'توقف جستجوی صوتی' : 'شروع جستجوی صوتی'}
              aria-pressed={isListening}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={performSearch}
          className="px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
          aria-label="انجام جستجو"
          disabled={isSearching}
        >
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status">
              <span className="sr-only">در حال جستجو...</span>
            </div>
          ) : (
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* ✅ Search Suggestions Dropdown - OUTSIDE overflow-hidden container */}
      {isSearchFocused && (
        <div
          id="search-suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-[9999] max-h-[80vh] overflow-y-auto"
          role="listbox"
          aria-label="نتایج جستجو"
          style={{ minWidth: '100%' }}
        >
          {/* 🔍 Live Results Section */}
          {shouldShowLiveResults && (
            <>
              {isLiveSearching ? (
                renderLiveResultsSkeleton()
              ) : hasLiveResults ? (
                <div className="py-2">
                  {renderProductsSection()}
                  {renderDevicesSection()}
                  {renderCategoriesSection()}
                  {renderSellersSection()}

                  {deviceModel && liveResults && liveResults.products.count > 0 && (
                    <div className="px-4 py-2 bg-primary-50/50 dark:bg-primary-900/10 border-t border-primary-100 dark:border-primary-900/30">
                      <p className="text-[10px] text-primary-700 dark:text-primary-300 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        نتایج فیلتر شده برای: <strong>{deviceModel.name}</strong>
                      </p>
                    </div>
                  )}
                </div>
              ) : debouncedQuery.length >= 2 ? (
                renderNoResults()
              ) : null}
            </>
          )}

          {/* 🕒 Fallback: History + Popular */}
          {shouldShowFallback && (
            <>
              {smartSuggestions.length > 0 && (
                <>
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-500" />
                      جستجوهای قبلی شما
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {smartSuggestions.map((suggestion, index) => (
                      <button
                        key={`history-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2.5 text-right text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-3 group focus:outline-none"
                      >
                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span className="flex-1 text-right">{suggestion}</span>
                        <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {searchHistory.length > 0 && (
                <>
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-500" />
                      جستجوهای اخیر شما
                    </p>
                    <button
                      onClick={clearSearchHistory}
                      className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 hover:text-error-600 dark:hover:text-error-400 transition-colors focus:outline-none"
                    >
                      <Trash2 className="w-3 h-3" />
                      پاک کردن
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {searchHistory.slice(0, 5).map((item) => (
                      <button
                        key={item.query}
                        onClick={() => handleSuggestionClick(item.query)}
                        className="w-full px-4 py-2.5 text-right text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-3 group focus:outline-none"
                      >
                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span className="flex-1 text-right">{item.query}</span>
                        <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                  جستجوهای پرطرفدار
                </p>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">این هفته</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {POPULAR_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={`popular-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2.5 text-right text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-3 group focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                      <span className="text-xs font-black text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </span>
                    </div>
                    <span className="flex-1 text-right">{suggestion}</span>
                    <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';