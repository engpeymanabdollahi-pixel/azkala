import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, ShoppingBag, Star, CheckCircle, Shield, Truck, Heart,
  ChevronLeft, ChevronRight, Store, Package, Plus, Minus, Zap, Award,
  BadgeCheck, Smartphone, MessageCircle, Clock, X,
  AlertCircle, ThumbsUp, Sparkles, Flame, Crown, Home, Search,
  RefreshCw, Reply, Scale,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { useChatStore } from '@/store/chatStore';
import { useProductDetail } from '@/hooks/useProductDetail';
import { ProductAlertButton } from '@/components/features/ProductAlertButton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductCard, ProductGallery, ProductPrice } from '@/components/marketplace';
import { SafeImage } from '@/components/ui/SafeImage';
import { DeviceCompatibility } from '@/components/marketplace';
import Seo from '@/components/Seo';
import {
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo-schemas';
import { formatPrice } from '@/utils/format';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

type TabType = 'description' | 'specifications' | 'compatibility' | 'reviews';

export function ProductDetailPage() {
  const { isAuthenticated } = useAuthStore();
  const openAuthModal = useAuthModalStore((state) => state.open);
  const { openChat, startConversation } = useChatStore();
  const navigate = useNavigate();

  // ✅ همه state، fetching، computed و handlers از hook
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
    inCompare,
    isCompatible,
    selectedDeviceName,
    SelectedDeviceIcon,
    discountPercent,
    finalPrice,
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
              <div className="h-7 w-3/4 bg-white dark:bg-gray-800 rounded-xl animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="h-5 w-1/2 bg-white dark:bg-gray-800 rounded-xl animate-pulse" style={{ animationDelay: '50ms' }} />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-white dark:bg-gray-800 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                <div className="h-6 w-20 bg-white dark:bg-gray-800 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              </div>
              <div className="h-20 bg-white dark:bg-gray-800 rounded-2xl animate-pulse shadow-sm" style={{ animationDelay: '200ms' }} />
              <div className="h-16 bg-white dark:bg-gray-800 rounded-xl animate-pulse" style={{ animationDelay: '250ms' }} />
              <div className="flex gap-3">
                <div className="h-12 flex-1 bg-white dark:bg-gray-800 rounded-xl animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="h-12 flex-1 bg-white dark:bg-gray-800 rounded-xl animate-pulse" style={{ animationDelay: '350ms' }} />
              </div>
              <div className="h-32 bg-white dark:bg-gray-800 rounded-xl animate-pulse shadow-sm" style={{ animationDelay: '400ms' }} />
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
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">
            {isNotFound ? 'محصول یافت نشد' : 'خطا در بارگذاری'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">{error || 'مشکلی رخ داد'}</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/products')} 
              className="flex-1 focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              مشاهده محصولات
            </Button>
            {!isNotFound && (
              <Button 
                onClick={() => window.location.reload()} 
                className="flex-1 focus-visible:ring-2 focus-visible:ring-primary-500"
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
      {/* ✅ SEO: Product Schema و BreadcrumbList Schema */}
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

        {/* 🔧 Breadcrumb - Compact */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-sm border border-gray-100 dark:border-gray-700">
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

        {/* 🔧 Grid اصلی - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          
          {/* ============ Image Gallery - Compact ============ */}
<ProductGallery
  images={images}
  productName={product.name}
  discountPercent={discountPercent}
  inStock={product.stock > 0}
/>

          {/* ============ Product Info - Compact ============ */}
          <div className="space-y-3">
            
            {/* Title & Rating */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                {discountPercent > 0 && (
                  <Badge variant="error" className="text-[10px]">
                    <Flame className="w-3 h-3 ml-0.5" />
                    پیشنهاد ویژه
                  </Badge>
                )}
                {product.is_bestseller && (
                  <Badge variant="accent" className="text-[10px]">
                    <Crown className="w-3 h-3 ml-0.5" />
                    پرفروش
                  </Badge>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-2">
                {product.name}
              </h1>

              {/* ✅ Inline Compatibility Badge */}
              {selectedModel && product.compatible_models && product.compatible_models.length > 0 && (
                <DeviceCompatibility
                  devices={product.compatible_models}
                  selectedDevice={selectedModel}
                  variant="inline"
                  className="mb-2"
                />
              )}

              {rating > 0 && (
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < Math.floor(rating) ? 'text-warning-400 fill-warning-400' : 'text-gray-300 dark:text-gray-600'
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{rating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-400 dark:text-gray-600">|</span>
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {totalReviews} نظر
                  </span>
                  <span className="text-gray-400 dark:text-gray-600">|</span>
                  <span className="text-success-600 dark:text-success-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {product.sales_count || 0} فروش
                  </span>
                </div>
              )}
            </div>

            {/* Compatibility Alert */}
            {selectedModel && (
              <div className={cn(
                'p-3 rounded-xl flex items-start gap-2.5 border-2',
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
                  <p className={cn('font-black text-sm mb-0.5', isCompatible ? 'text-success-700 dark:text-success-400' : 'text-error-700 dark:text-error-400')}>
                    {isCompatible
                      ? `✓ کاملاً سازگار با ${selectedDeviceName}`
                      : `✗ با ${selectedDeviceName} سازگار نیست`}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <SelectedDeviceIcon className="w-3 h-3" />
                    مدل: <strong>{selectedModel.name}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* 🔧 Price Box - Compact */}
<ProductPrice
  price={finalPrice}
  comparePrice={product.compare_price}
  discountPercent={discountPercent}
/>

            {/* 🔧 Seller Info - Enhanced */}
            {product.seller && (() => {
              const seller = product.seller;
              return (
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    {/* آواتار فروشنده (قابل کلیک) */}
                    <button
                      onClick={() => navigate(`/seller/${seller.slug}`)}
                      className="w-14 h-14 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden hover:scale-105 transition-transform group"
                    >
                      {seller.avatar ? (
                        <img
                          src={seller.avatar}
                          alt={seller.shop_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <button
                          onClick={() => navigate(`/seller/${seller.slug}`)}
                          className="font-black text-gray-900 dark:text-gray-100 text-base truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1 group text-right"
                        >
                          {seller.shop_name}
                          <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary-600 dark:text-primary-400" />
                        </button>

                        {seller.is_verified && (
                          <Badge variant="success" size="sm" className="text-[10px]">
                            <BadgeCheck className="w-3 h-3 ml-0.5" />
                            تأیید شده
                          </Badge>
                        )}
                      </div>

                      {/* آمار فروشنده */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700 text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Star className="w-3.5 h-3.5 text-warning-400 fill-warning-400" />
                            <span className="font-black text-gray-900 dark:text-gray-100 text-sm">
                              {(seller.rating ?? 0).toFixed(1)}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">امتیاز</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700 text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Package className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
                            <span className="font-black text-gray-900 dark:text-gray-100 text-sm">
                              {seller.products_count ?? 0}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">محصول</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700 text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-success-500 dark:text-success-400" />
                            <span className="font-black text-gray-900 dark:text-gray-100 text-sm">
                              {seller.total_sales ?? 0}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">فروش</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* دکمه‌های Action */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!isAuthenticated) {
                          openAuthModal({
                            reason: 'برای گفتگو با فروشنده وارد شوید.',
                            onSuccess: () => void startConversation(seller.id, product.id),
                          });
                          return;
                        }
                        try {
                          await startConversation(seller.id, product.id);
                          openChat();
                          toast.success('چت با فروشنده باز شد', { icon: '💬' });
                        } catch {
                          toast.error('خطا در شروع چت');
                        }
                      }}
                      className="font-bold gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      چت با فروشنده
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (seller.slug) {
                          navigate(`/seller/${seller.slug}`);
                        } else {
                          toast.error('صفحه فروشگاه این فروشنده هنوز راه‌اندازی نشده است');
                        }
                      }}
                      className="font-bold gap-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-700 transition-all"
                    >
                      <Store className="w-4 h-4" />
                      مشاهده شعبه
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* 🔧 Quantity & Actions - Compact */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">تعداد:</span>
                <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity === 1}
                    className="w-8 h-8 flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-black text-base text-gray-900 dark:text-gray-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="w-8 h-8 flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="md"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 font-bold"
                >
                  <ShoppingCart className="w-4 h-4 ml-1.5" />
                  افزودن به سبد
                </Button>
                <Button
                  size="md"
                  variant="accent"
                  onClick={handleQuickBuy}
                  disabled={product.stock === 0}
                  className="font-bold"
                >
                  <Zap className="w-4 h-4 ml-1" />
                  خرید فوری
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleWishlistToggle}
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
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">ارسال سریع</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">۲ تا ۳ روز کاری</p>
                </div>
              </div>
            </div>

            {/* 🔧 Trust Signals - Compact */}
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
                    <p className="text-[9px] font-bold text-gray-700 dark:text-gray-300 leading-tight">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 🔧 Tabs Section - Compact */}
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
                    'px-3 md:px-5 py-3 font-bold text-xs transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0',
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
            {activeTab === 'description' && (
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 mb-3 border border-primary-100 dark:border-primary-800">
                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    معرفی محصول
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{product.description}</p>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value], idx) => (
                      <tr key={key} className={cn('border-b border-gray-100 dark:border-gray-700 last:border-0', idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50')}>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-semibold w-1/3">{key}</td>
                        <td className="py-2 px-3 text-gray-900 dark:text-gray-100 font-medium">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'compatibility' && (
              <DeviceCompatibility
                devices={product.compatible_models}
                selectedDevice={selectedModel}
                variant="list"
              />
            )}

            {/* 🆕 Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Rating Summary - Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 text-center border border-primary-100 dark:border-primary-800">
                    <div className="text-4xl font-black text-primary-700 dark:text-primary-400 mb-1">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 mb-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < Math.floor(averageRating) ? 'text-warning-400 fill-warning-400' : 'text-gray-300 dark:text-gray-600'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      بر اساس <strong>{totalReviews}</strong> نظر
                    </p>
                  </div>

                  <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-xs">توزیع امتیازات</h4>
                    <div className="space-y-1.5">
                      {ratingDistribution.map((item) => (
                        <div key={item.rating} className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5 w-10">
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{item.rating}</span>
                            <Star className="w-2.5 h-2.5 text-warning-400 fill-warning-400" />
                          </div>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-warning-400 to-warning-500 rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 w-8 text-left">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* حالت ۱: کاربر لاگین نکرده */}
                {!isAuthenticated && (
                  <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                    <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-1.5" />
                    <p className="text-gray-700 dark:text-gray-300 font-bold text-sm mb-0.5">برای ثبت نظر وارد شوید</p>
                    <Button
                      onClick={() => openAuthModal({ reason: 'برای ثبت نظر درباره این محصول وارد شوید.' })}
                      size="sm"
                      className="mt-2"
                    >
                      ورود به حساب
                    </Button>
                  </div>
                )}

                {/* حالت ۲: کاربر لاگین کرده و قبلاً نظر نداده */}
                {isAuthenticated && !hasReviewed && (
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl p-3 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-black text-sm mb-0.5">نظر خود را ثبت کنید</h4>
                        <p className="text-white/90 text-xs">
                          {hasPurchased
                            ? 'تجربه خرید خود را با دیگران به اشتراک بگذارید'
                            : 'نظر شما به دیگر کاربران کمک می‌کند'}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                      >
                        <MessageCircle className="w-3.5 h-3.5 ml-1" />
                        {showReviewForm ? 'بستن' : 'ثبت نظر'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* حالت ۳: کاربر قبلاً نظر داده */}
                {isAuthenticated && hasReviewed && (
                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-xs flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-success-500" />
                      شما قبلاً برای این محصول نظر ثبت کرده‌اید
                    </p>
                  </div>
                )}

                {/* 🆕 Review Form */}
                {showReviewForm && isAuthenticated && !hasReviewed && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-4 animate-fade-in">
                    <h4 className="font-black text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5 text-sm">
                      <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      ثبت نظر جدید
                    </h4>

                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">امتیاز شما</label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                              className="transition-all duration-200 hover:scale-125 active:scale-95"
                            >
                              <Star
                                className={cn(
                                  'w-8 h-8 transition-all duration-200 stroke-2',
                                  star <= (hoverRating || reviewForm.rating)
                                    ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_2px_6px_rgba(250,204,21,0.6)]'
                                    : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300 dark:hover:text-yellow-700'
                                )}
                              />
                            </button>
                          ))}
                        </div>
                        {reviewForm.rating > 0 && (
                          <span className="text-xs font-bold text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 px-2 py-1 rounded-md">
                            {['', 'ضعیف', 'متوسط', 'خوب', 'عالی', 'فوق‌العاده'][reviewForm.rating]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-2.5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">عنوان نظر (اختیاری)</label>
                      <input
                        type="text"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="مثلاً: کیفیت عالی، پیشنهاد می‌کنم"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
                        maxLength={255}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        متن نظر <span className="text-error-500">*</span>
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="تجربه خود از استفاده این محصول را بنویسید..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                        minLength={4}
                        maxLength={2000}
                      />
                      <p className={cn(
                        'text-[10px] mt-1',
                        reviewForm.comment.trim().length < 4
                          ? 'text-error-500'
                          : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {reviewForm.comment.trim().length < 4
                          ? `حداقل ۴ کاراکتر • ${reviewForm.comment.length}/2000`
                          : `${reviewForm.comment.length}/2000`
                        }
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewForm({ rating: 0, title: '', comment: '' });
                        }}
                        disabled={createReviewMutation?.isPending}
                      >
                        انصراف
                      </Button>
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={handleSubmitReview}
                        disabled={
                          createReviewMutation?.isPending ||
                          reviewForm.rating === 0 ||
                          reviewForm.comment.trim().length < 4
                        }
                        isLoading={createReviewMutation?.isPending}
                      >
                        <MessageCircle className="w-3.5 h-3.5 ml-1" />
                        ثبت نظر
                      </Button>
                    </div>
                  </div>
                )}

                {/* 🆕 Reviews List */}
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-black text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      نظرات کاربران ({totalReviews})
                    </h4>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setReviewFilter('all')}
                        className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-bold transition-all',
                          reviewFilter === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                      >
                        همه
                      </button>
                      {[5, 4, 3, 2, 1].map((r) => (
                        <button
                          key={r}
                          onClick={() => setReviewFilter(r)}
                          className={cn(
                            'px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-0.5',
                            reviewFilter === r
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          )}
                        >
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {reviewsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 animate-pulse">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            <div className="flex-1">
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1.5" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                      <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {reviewFilter === 'all'
                          ? 'هنوز نظری ثبت نشده است'
                          : `نظری با امتیاز ${reviewFilter} ستاره یافت نشد`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm transition-all"
                          >
                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md">
                                  {review.user.initial}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">{review.user.name}</p>
                                    {review.is_verified && (
                                      <Badge variant="success" size="sm" className="text-[9px]">
                                        <BadgeCheck className="w-2.5 h-2.5 ml-0.5" />
                                        خریدار
                                      </Badge>
                                    )}
                                    {review.is_pending && (
                                      <Badge variant="warning" size="sm" className="text-[9px]">
                                        <Clock className="w-2.5 h-2.5 ml-0.5" />
                                        در انتظار تأیید
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex items-center gap-0.5">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={cn(
                                            'w-3 h-3',
                                            i < review.rating ? 'text-warning-400 fill-warning-400' : 'text-gray-200 dark:text-gray-600'
                                          )}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[9px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      {review.created_at_fa}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {review.title && (
                              <h5 className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-1">{review.title}</h5>
                            )}

                            <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed mb-2">{review.comment}</p>

                            {review.admin_reply && (
                              <div className="mb-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg p-2.5">
                                <p className="flex items-center gap-1 text-[10px] font-bold text-primary-700 dark:text-primary-400 mb-1">
                                  <Reply className="w-3 h-3" />
                                  پاسخ فروشگاه ازکالا
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed">{review.admin_reply}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                              <button
                                onClick={() => helpfulMutation.mutate(review.id)}
                                disabled={helpfulMutation?.isPending}
                                className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400 hover:text-success-600 dark:hover:text-success-400 transition-colors disabled:opacity-50"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                مفید ({review.helpful_count})
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {reviewsPagination && reviewsPagination.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReviewsPage(p => Math.max(1, p - 1))}
                            disabled={reviewsPage === 1}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            صفحه {reviewsPagination.current_page} از {reviewsPagination.last_page}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReviewsPage(p => Math.min(reviewsPagination.last_page, p + 1))}
                            disabled={reviewsPage === reviewsPagination.last_page}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">محصولات مشابه</h2>
              <Link to="/products" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-xs flex items-center gap-1">
                مشاهده همه
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {relatedProducts.map((p, index) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  variant="grid"
                  showCompatibility={false}
                  showSeller={false}
                  showRating={true}
                  onClick={() => navigate(`/products/${p.slug}`)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;