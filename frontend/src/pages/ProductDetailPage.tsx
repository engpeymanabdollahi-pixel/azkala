/**
 * ProductDetailPage - صفحه جزئیات محصول
 * 
 * مطابق Design System ازکالا (Knowledge Base):
 * - shadcn/ui (Base Components)
 * - Tailwind CSS v4 (Styling)
 * - Vazirmatn (Typography - font-sans)
 * - RTL-first (Direction)
 * - Mobile-first (Responsive)
 * 
 * Marketplace Components استفاده شده:
 * - ProductGallery (گالری تصاویر با Zoom)
 * - ProductPrice (قیمت + تخفیف + صرفه‌جویی)
 * - ProductRating (ستاره‌ها + تعداد نظرات + فروش)
 * - RatingSummary (میانگین + توزیع 5 ستاره)
 * - QuantitySelector (انتخاب تعداد)
 * - ProductStock (وضعیت موجودی + Low Stock Warning)
 * - RelatedProducts (محصولات مشابه)
 * - SellerInfoCard (اطلاعات فروشنده)
 * 
 * Business Logic: در useProductDetail Hook
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Star, CheckCircle, Shield, Truck, Heart,
  ChevronLeft, ChevronRight, Store, Package, Zap, Award,
  BadgeCheck, Smartphone, MessageCircle, Clock, X,
  AlertCircle, Sparkles, Flame, Crown, Home, Search,
  RefreshCw, Scale,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { useChatStore } from '@/store/chatStore';
import { useProductDetail, type TabType } from '@/hooks/useProductDetail';
import { ProductAlertButton } from '@/components/features/ProductAlertButton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
// ✅ Suspense قبلاً ایمپورت نشده بود ولی پایین‌تر مستقیم استفاده می‌شد —
// یعنی با هر کلیک روی تب «نظرات» صفحه با ReferenceError کرش می‌کرد.
import { lazy, Suspense } from 'react';
import { 
  ProductCard, 
  ProductGallery, 
  ProductPrice,
  ProductRating,
  RatingSummary,
  QuantitySelector,
  ProductStock,
  RelatedProducts,
  SellerInfoCard,
  DeviceCompatibility,
  NearbyStores,
} from '@/components/marketplace';
import Seo from '@/components/Seo';
import {
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo-schemas';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
// Lazy load کردن ReviewsTab برای کاهش initial bundle
// ReviewsTab فقط وقتی کاربر روی تب "نظرات" کلیک کند بارگذاری می‌شود
const ReviewsTab = lazy(() => import('./product-detail/ReviewsTab'));
const ReviewsSkeleton = lazy(() => import('./product-detail/ReviewsSkeleton'));

export function ProductDetailPage() {
  const { isAuthenticated } = useAuthStore();
  const openAuthModal = useAuthModalStore((state) => state.open);
  const { openChat, startConversation } = useChatStore();
  const navigate = useNavigate();

  // ==================== Business Logic (از Hook) ====================
  const {
    product,
    relatedProducts,
    reviews,
    reviewsSummary,
    reviewsPagination,
    quantity,
    activeTab,
    isLoading,
    error,
    showReviewForm,
    reviewForm,
    hoverRating,
    reviewsPage,
    reviewFilter,
    hasReviewed,
    hasPurchased,
    reviewsLoading,
    images,
    rating,
    isWishlisted,
    isTogglingWishlist,
    inCompare,
    isCompatible,
    selectedDeviceName,
    SelectedDeviceIcon,
    selectedVariantId,
    selectedVariant,
    setSelectedVariantId,
    effectivePrice,
    effectiveComparePrice,
    effectiveDiscountPercent,
    effectiveStock,
    effectiveImage,
    averageRating,
    ratingDistribution,
    totalReviews,
    selectedModel,
    createReviewMutation,
    helpfulMutation,
    setQuantity,
    setActiveTab,
    setShowReviewForm,
    setReviewForm,
    setHoverRating,
    setReviewsPage,
    setReviewFilter,
    handleAddToCart,
    handleQuickBuy,
    handleWishlistToggle,
    handleCompareToggle,
    handleSubmitReview,
  } = useProductDetail();

  // ==================== Loading State ====================
  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-3 md:px-4 py-4 max-w-7xl">
          {/* Breadcrumb Skeleton */}
          <div className="h-8 bg-white dark:bg-gray-800 rounded-xl mb-4 animate-pulse" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Image Gallery Skeleton */}
            <div className="space-y-3">
              <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl animate-pulse shadow-lg" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className="aspect-square bg-white dark:bg-gray-800 rounded-xl animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            </div>
            
            {/* Product Info Skeleton */}
            <div className="space-y-4">
              <div className="h-7 w-3/4 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
              <div className="h-5 w-1/2 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-white dark:bg-gray-800 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-white dark:bg-gray-800 rounded-full animate-pulse" />
              </div>
              <div className="h-20 bg-white dark:bg-gray-800 rounded-2xl animate-pulse shadow-sm" />
              <div className="h-16 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
              <div className="flex gap-3">
                <div className="h-12 flex-1 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
                <div className="h-12 flex-1 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
              </div>
              <div className="h-32 bg-white dark:bg-gray-800 rounded-xl animate-pulse shadow-sm" />
            </div>
          </div>
          
          {/* Tabs & Reviews Skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="h-10 w-24 bg-white dark:bg-gray-800 rounded-xl animate-pulse"
                  style={{ animationDelay: `${450 + i * 50}ms` }}
                />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="h-24 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"
                  style={{ animationDelay: `${600 + i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Error State ====================
  if (error || !product) {
    const isNotFound = error?.includes('یافت نشد');
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transition-transform duration-300 hover:scale-110',
            isNotFound ? 'bg-gradient-to-br from-warning-500 to-warning-600' : 'bg-gradient-to-br from-error-500 to-error-600'
          )}>
            {isNotFound ? <Search className="w-8 h-8 text-white" /> : <AlertCircle className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 font-sans">
            {isNotFound ? 'محصول یافت نشد' : 'خطا در بارگذاری'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-5 font-sans">{error || 'مشکلی رخ داد'}</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/products')} 
              className="flex-1 focus-visible:ring-2 focus-visible:ring-primary-500 font-sans"
            >
              مشاهده محصولات
            </Button>
            {!isNotFound && (
              <Button 
                onClick={() => window.location.reload()} 
                className="flex-1 focus-visible:ring-2 focus-visible:ring-primary-500 font-sans"
              >
                تلاش مجدد
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== Main Render ====================
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-10">
      {/* SEO */}
      <Seo
        title={product.name}
        description={product.short_description || product.meta_description || `${product.name} - ${product.brand?.name || ''} - خرید با بهترین قیمت از ازکالا`}
        canonical={`/products/${product.slug}`}
        image={product.main_image || product.images?.[0]}
        type="product"
        keywords={[
          product.name,
          product.brand?.name,
          product.category?.name,
          'خرید',
          'قیمت',
          'ازکالا',
        ].filter(Boolean) as string[]}
        jsonLd={[
          generateProductSchema(product),
          generateBreadcrumbSchema([
            { name: 'خانه', url: '/' },
            { name: 'محصولات', url: '/products' },
            ...(product.category?.name
              ? [{ name: product.category.name, url: `/products?category=${product.category.slug || product.category.id}` }]
              : []),
            { name: product.name, url: `/products/${product.slug}` },
          ]),
        ]}
      />

      <div className="container mx-auto px-3 md:px-4 py-4 max-w-7xl">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm border border-gray-100 dark:border-gray-700 font-sans">
          <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-0.5">
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خانه</span>
          </Link>
          <ChevronLeft className="w-3 h-3 text-gray-300 dark:text-gray-600 rotate-180" />
          <Link to="/products" className="hover:text-primary-600 dark:hover:text-primary-400">فروشگاه</Link>
          {product.category && (
            <>
              <ChevronLeft className="w-3 h-3 text-gray-300 dark:text-gray-600 rotate-180" />
              <Link to={`/products?category=${product.category.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronLeft className="w-3 h-3 text-gray-300 dark:text-gray-600 rotate-180" />
          <span className="text-gray-900 dark:text-gray-100 font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Grid اصلی */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          
          {/* Image Gallery */}
          {/* ✅ Variant/Color System فاز ۳: اگر رنگ انتخاب‌شده تصویر مخصوص
              خودش را دارد، اول همان نمایش داده می‌شود؛ گالری اصلی محصول
              دست‌نخورده و بعد از آن باقی می‌ماند (بدون سیستم رسانه‌ی جدید،
              فقط ترتیب آرایه). اگر رنگی تصویر ندارد، دقیقاً همان گالری
              قبلی. */}
          <ProductGallery
  images={effectiveImage ? [effectiveImage, ...images.filter((img) => img !== effectiveImage)] : images}
  productName={product.name}
  discountPercent={effectiveDiscountPercent}
  inStock={effectiveStock > 0}
  priority={true}
/>

          {/* Product Info */}
          <div className="space-y-3">
            
            {/* Title & Badges */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                {effectiveDiscountPercent > 0 && (
                  <Badge variant="error" className="text-[10px] font-sans">
                    <Flame className="w-3 h-3 ml-0.5" />
                    پیشنهاد ویژه
                  </Badge>
                )}
                {product.is_bestseller && (
                  <Badge variant="accent" className="text-[10px] font-sans">
                    <Crown className="w-3 h-3 ml-0.5" />
                    پرفروش
                  </Badge>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-2 font-sans">
                {product.name}
              </h1>

              {/* Inline Compatibility Badge */}
              {selectedModel && product.compatible_models && product.compatible_models.length > 0 && (
                <DeviceCompatibility
                  devices={product.compatible_models}
                  selectedDevice={selectedModel}
                  variant="inline"
                  className="mb-2"
                />
              )}

              {/* Rating */}
              {rating > 0 && (
                <ProductRating
                  rating={rating}
                  totalReviews={totalReviews}
                  salesCount={product.sales_count || 0}
                />
              )}
            </div>

            {/* ✅ Variant/Color System فاز ۳: انتخابگر رنگ — فقط وقتی محصول
                واقعاً رنگ دارد رندر می‌شود؛ برای محصول بدون رنگ این بخش
                کاملاً غایب است (نه پنهان با CSS، رندر هم نمی‌شود) تا
                صفحه‌ی محصول قدیمی دقیقاً همان قبل بماند. */}
            {product.has_variants && product.variants && product.variants.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm font-sans block mb-2">
                  رنگ{selectedVariant?.color_name ? `: ${selectedVariant.color_name}` : ''}
                </span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="انتخاب رنگ">
                  {product.variants.map((variant) => {
                    const isSelected = variant.id === selectedVariantId;
                    const isOutOfStock = !variant.is_in_stock;
                    // ✅ امنیت: color_code مستقیم به‌عنوان HTML/CSS تزریق
                    // نمی‌شود — فقط اگر دقیقاً با الگوی #RRGGBB مطابقت
                    // داشته باشد به‌عنوان backgroundColor پاس داده می‌شود،
                    // وگرنه صرفاً نادیده گرفته می‌شود (بدون swatch رنگی).
                    const safeColor = variant.color_code && /^#[0-9a-fA-F]{6}$/.test(variant.color_code)
                      ? variant.color_code
                      : undefined;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={variant.color_name || `رنگ ${variant.id}`}
                        disabled={isOutOfStock}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={cn(
                          'relative flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-bold font-sans transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700',
                          isOutOfStock && 'opacity-40 cursor-not-allowed line-through'
                        )}
                      >
                        {safeColor && (
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                            style={{ backgroundColor: safeColor }}
                            aria-hidden="true"
                          />
                        )}
                        {variant.color_name || `رنگ ${variant.id}`}
                        {isOutOfStock && <span className="text-[10px]">(ناموجود)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compatibility Alert */}
            {selectedModel && (
              <div className={cn(
                'p-3 rounded-xl flex items-start gap-2.5 border-2 font-sans',
                isCompatible
                  ? 'bg-gradient-to-r from-success-50 to-primary-50 dark:from-success-950/30 dark:to-primary-950/30 border-success-300 dark:border-success-800'
                  : 'bg-gradient-to-r from-error-50 to-warning-50 dark:from-error-950/30 dark:to-warning-950/30 border-error-300 dark:border-error-800'
              )}>
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  isCompatible ? 'bg-gradient-to-br from-success-500 to-success-600' : 'bg-gradient-to-br from-error-500 to-error-600'
                )}>
                  {isCompatible ? <CheckCircle className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-black text-sm mb-0.5 font-sans', isCompatible ? 'text-success-700 dark:text-success-400' : 'text-error-700 dark:text-error-400')}>
                    {isCompatible
                      ? `✓ کاملاً سازگار با ${selectedDeviceName}`
                      : `✗ با ${selectedDeviceName} سازگار نیست`}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 font-sans">
                    <SelectedDeviceIcon className="w-3 h-3" />
                    مدل: <strong>{selectedModel.name}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Price Box */}
            {/* ✅ Variant/Color System فاز ۳: effectivePrice/effectiveComparePrice
                از selectedVariant می‌آیند (اگر رنگی انتخاب شده)، وگرنه
                دقیقاً همان finalPrice/product.compare_price قبلی —
                هرگز از ورودی کاربر، همیشه از داده‌ی سرور. */}
            <ProductPrice
              price={effectivePrice}
              comparePrice={effectiveComparePrice}
              discountPercent={effectiveDiscountPercent}
            />

            {/* Seller Info */}
            {product.seller && (
              <SellerInfoCard
                seller={product.seller}
                productId={product.id}
                onChat={async () => {
                  if (!isAuthenticated) {
                    openAuthModal({
                      reason: 'برای گفتگو با فروشنده وارد شوید.',
                      onSuccess: () => void startConversation(product.seller!.id, product.id),
                    });
                    return;
                  }
                  try {
                    await startConversation(product.seller!.id, product.id);
                    openChat();
                    toast.success('چت با فروشنده باز شد', { icon: '💬' });
                  } catch {
                    toast.error('خطا در شروع چت');
                  }
                }}
                onViewStore={() => {
                  if (product.seller!.slug) {
                    navigate(`/seller/${product.seller!.slug}`);
                  } else {
                    toast.error('صفحه فروشگاه این فروشنده هنوز راه‌اندازی نشده است');
                  }
                }}
              />
            )}

            {/* فروشگاه‌های نزدیک شما — بدون نقشه (Phase 17/20)؛ خودش تمام
                حالت‌های خالی/خطا/لودینگ را مدیریت می‌کند. */}
            <NearbyStores productId={product.id} />

            {/* Stock Status */}
            {/* ✅ فاز ۳: effectiveStock — موجودی رنگ انتخاب‌شده اگر محصول
                رنگ دارد، وگرنه دقیقاً همان product.stock قبلی. */}
            <ProductStock stock={effectiveStock} variant="warning" />

            {/* Quantity & Actions */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm font-sans">تعداد:</span>
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  maxStock={effectiveStock}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="md"
                  onClick={handleAddToCart}
                  disabled={effectiveStock <= 0}
                  className="flex-1 font-bold font-sans"
                >
                  <ShoppingCart className="w-4 h-4 ml-1.5" />
                  افزودن به سبد
                </Button>
                <Button
                  size="md"
                  variant="accent"
                  onClick={handleQuickBuy}
                  disabled={effectiveStock <= 0}
                  className="font-bold font-sans"
                >
                  <Zap className="w-4 h-4 ml-1" />
                  خرید فوری
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleWishlistToggle}
                  disabled={isTogglingWishlist}
                  className={cn('transition-all', isWishlisted && 'text-error-500 border-error-300 bg-error-50')}
                  aria-label={isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                >
                  <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCompareToggle}
                  className={cn(
                    'transition-all',
                    inCompare && 'text-primary-500 border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700'
                  )}
                  aria-label={inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
                  title={inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
                >
                  <Scale className={cn('w-4 h-4', inCompare && 'fill-current')} />
                </Button>

                {product && (
                  <ProductAlertButton
                    product={product}
                    size="md"
                    variant="icon"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                <Truck className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 font-sans">ارسال سریع</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 font-sans">۲ تا ۳ روز کاری</p>
                </div>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Shield, text: 'ضمانت', color: 'from-primary-500 to-primary-600' },
                { icon: Truck, text: 'ارسال سریع', color: 'from-accent-500 to-accent-600' },
                { icon: RefreshCw, text: '۷ روز بازگشت', color: 'from-success-500 to-success-600' },
                { icon: Award, text: 'بهترین قیمت', color: 'from-warning-500 to-warning-600' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-2 text-center hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all">
                    <div className={cn(
                      'w-8 h-8 bg-gradient-to-br rounded-md flex items-center justify-center mx-auto mb-1 shadow-sm',
                      item.color
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[9px] font-bold text-gray-700 dark:text-gray-300 leading-tight font-sans">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-hide">
            {[
              { id: 'description' as TabType, label: 'توضیحات', icon: Package },
              { id: 'specifications' as TabType, label: 'مشخصات', icon: Shield },
              { id: 'compatibility' as TabType, label: `سازگاری (${product.compatible_models?.length || 0})`, icon: Smartphone },
              { id: 'reviews' as TabType, label: `نظرات (${totalReviews})`, icon: MessageCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3 md:px-5 py-3 font-bold text-xs transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 font-sans',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 md:p-5">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-sans">
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 mb-3 border border-primary-100 dark:border-primary-800">
                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm mb-2 flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    معرفی محصول
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-sans">{product.description}</p>
                </div>
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specifications' && product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <table className="w-full text-xs font-sans">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value], idx) => (
                      <tr key={key} className={cn('border-b border-gray-100 dark:border-gray-700 last:border-0', idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50')}>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-semibold w-1/3 font-sans">{key}</td>
                        {/* ✅ specifications یک ستون JSON آزاد است (Record<string, unknown>)؛
                            String(...) هم خطای تایپ ReactNode را رفع می‌کند و هم واقعاً
                            جلوی کرش «Objects are not valid as a React child» را می‌گیرد
                            اگر مقداری آبجکت/آرایه باشد. */}
                        <td className="py-2 px-3 text-gray-900 dark:text-gray-100 font-medium font-sans">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Compatibility Tab */}
            {activeTab === 'compatibility' && (
              <DeviceCompatibility
                devices={product.compatible_models}
                selectedDevice={selectedModel}
                variant="list"
              />
            )}

                        {/* 🆕 Reviews Tab - Lazy Loaded
                - ReviewsTab فقط وقتی کاربر روی تب "نظرات" کلیک کند بارگذاری می‌شود
                - کاهش ~25 KB از initial bundle ProductDetailPage */}
            {activeTab === 'reviews' && (
              <Suspense fallback={<ReviewsSkeleton />}>
                <ReviewsTab
                  reviews={reviews}
                  reviewsPagination={reviewsPagination}
                  reviewsLoading={reviewsLoading}
                  averageRating={averageRating}
                  ratingDistribution={ratingDistribution}
                  totalReviews={totalReviews}
                  isAuthenticated={isAuthenticated}
                  hasReviewed={hasReviewed}
                  hasPurchased={hasPurchased}
                  showReviewForm={showReviewForm}
                  reviewForm={reviewForm}
                  hoverRating={hoverRating}
                  reviewsPage={reviewsPage}
                  reviewFilter={reviewFilter}
                  createReviewMutation={createReviewMutation}
                  helpfulMutation={helpfulMutation}
                  setShowReviewForm={setShowReviewForm}
                  setReviewForm={setReviewForm}
                  setHoverRating={setHoverRating}
                  setReviewsPage={setReviewsPage}
                  setReviewFilter={setReviewFilter}
                  handleSubmitReview={handleSubmitReview}
                  onOpenAuthModal={openAuthModal}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}

export default ProductDetailPage;