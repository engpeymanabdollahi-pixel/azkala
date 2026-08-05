import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
ShoppingBag,
  Star,
  CheckCircle,
  Shield,
  Truck,
  Heart,
  ChevronLeft,
  ChevronRight,
  Store,
  Package,
  Plus,
  Minus,
  Zap,
  Award,
  BadgeCheck,
  Smartphone,
  MessageCircle,
  Clock,
  Gift,
  X,
  Maximize2,
  AlertCircle,
  ThumbsUp,
  Sparkles,
  Flame,
  Crown,
  Home,
  Search,
  RefreshCw,
  Filter,
} from 'lucide-react';

import { useCartStore } from '@/store/cartStore';
import { useModelStore } from '@/store/modelStore';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { useWishlistApi } from '@/hooks/api/useWishlistApi'; // ✅ تغییر به useWishlistApi
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/features/ProductCard';
import { SafeImage } from '@/components/ui/SafeImage';
import { DynamicMeta } from '@/components/seo/DynamicMeta';
import { formatPrice } from '@/utils/format';
import { productService } from '@/services/api/product.service';
import { reviewService, type Review } from '@/services/api/review.service';
import type { Product } from '@/types/models';
import { cn } from '@/utils/cn';
import { formatDeviceName, getDeviceTypeIcon } from '@/utils/deviceType';
import toast from 'react-hot-toast';
import { useChatStore } from '@/store/chatStore';

type TabType = 'description' | 'specifications' | 'compatibility' | 'reviews';

// 🆕 دسته‌بندی‌های نظر
const REVIEW_CATEGORIES = [
  { value: 'general', label: 'نظر کلی', icon: '💬' },
  { value: 'quality', label: 'کیفیت محصول', icon: '⭐' },
  { value: 'price', label: 'قیمت و ارزش', icon: '💰' },
  { value: 'shipping', label: 'ارسال و بسته‌بندی', icon: '📦' },
  { value: 'support', label: 'پشتیبانی فروشنده', icon: '🎧' },
];

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();  
  const openAuthModal = useAuthModalStore((state) => state.open);
     const { openChat, startConversation } = useChatStore();


  const { addItem } = useCartStore();
  const { selectedModel } = useModelStore();
  const { toggleWishlist, isInWishlist } = useWishlistApi(); // ✅ تغییر به useWishlistApi

  // ==================== State ====================
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // نظرات
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
  });
  const [reviewCategory, setReviewCategory] = useState('general');
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewFilter, setReviewFilter] = useState<number | 'all'>('all');

   // ==================== Data Fetching ====================
  useEffect(() => {
    let isMounted = true; // 🛡️ جلوگیری از آپدیت state در صورت آن‌مونت شدن کامپوننت

    const loadProduct = async () => {
      if (!slug) {
        if (isMounted) {
          setError('شناسه محصول نامعتبر است');
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const response = await productService.getProductBySlug(slug);
        
        if (!isMounted) return; // 🛡️ اگر کامپوننت حین درخواست بسته شد، ادامه نده

        // ساختار جدید API: داده‌ها در response.data قرار دارند و product یکی از کلیدهای آن است
        const rawData = response.data;
        const productData = rawData?.product || rawData; // پشتیبانی از هر دو ساختار قدیم و جدید

        if (!productData || !productData.id) {
          throw new Error('داده‌های محصول یافت نشد');
        }

                // 🛡️ نرمال‌سازی داده‌ها برای جلوگیری از خطاهای undefined در UI
        const safeProduct = {
          ...productData,
          // اطمینان از وجود آبجکت brand و category
          brand: productData.brand || { id: 0, name: 'نامشخص', slug: '' },
          category: productData.category || { id: 0, name: 'نامشخص', slug: '' },
          // اطمینان از آرایه بودن images
          images: Array.isArray(productData.images) ? productData.images : (productData.main_image ? [productData.main_image] : []),
          // تبدیل قیمت به عدد
          price: Number(productData.price) || 0,
          compare_price: Number(productData.compare_price) || 0,
          
          // ✅ اصلاح حیاتی: نگاشت صریح compatible_models از ریشه پاسخ به داخل آبجکت محصول
          // (این فیلد واقعاً در ریشه‌ی پاسخ ProductService::getProductBySlug است،
          // نه داخل خودِ product — به همین دلیل باید صریح map شود)
          compatible_models: rawData?.compatible_models || [],
        };

        if (isMounted) {
          setProduct(safeProduct as Product);

          // لود محصولات مرتبط (اگر در پاسخ API وجود داشته باشد)
          if (rawData.related_products && Array.isArray(rawData.related_products)) {
            setRelatedProducts(rawData.related_products);
          }
        }

      } catch (err) {
        if (!isMounted) return;

        const errorObj = err as { name?: string; code?: string; message?: string; response?: { data?: { message?: string } } };

        // 🛡️ نادیده گرفتن خطای CanceledError ناشی از React 18 Strict Mode
        if (errorObj.name === 'CanceledError' || errorObj.code === 'ERR_CANCELED' || errorObj.message === 'canceled') {
          console.log('⚠️ درخواست قبلی توسط React کنسل شد (این رفتار طبیعی است و نادیده گرفته می‌شود)');
          return; // خارج شدن از تابع بدون تنظیم state خطا
        }

        console.error('❌ خطا واقعی در دریافت محصول:', err);
        if (isMounted) {
          setError(errorObj.response?.data?.message || errorObj.message || 'خطا در بارگذاری محصول');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews', product?.id, reviewsPage],
    queryFn: () => reviewService.getReviews(product!.id, reviewsPage),
    enabled: !!product,
  });

  const reviews = reviewsData?.data?.reviews || [];
  const reviewsSummary = reviewsData?.data?.summary;
  const reviewsPagination = reviewsData?.data?.pagination;

  const { data: canReviewData } = useQuery({
    queryKey: ['can-review', product?.id],
    queryFn: () => reviewService.canReview(product!.id),
    enabled: !!product && isAuthenticated,
  });

  const canReview = canReviewData?.data?.can_review ?? false;
  const hasReviewed = canReviewData?.data?.has_reviewed ?? false;
  const hasPurchased = canReviewData?.data?.has_purchased ?? false;

  const createReviewMutation = useMutation({
    mutationFn: reviewService.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', product?.id] });
      toast.success('نظر شما با موفقیت ثبت شد', { icon: '⭐' });
      setShowReviewForm(false);
      setReviewForm({ rating: 0, title: '', comment: '' });
      setReviewCategory('general');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(message || 'خطا در ثبت نظر');
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: reviewService.markHelpful,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
    },
  });

  // ==================== Computed Values ====================
  const images = useMemo(() => {
    if (!product) return [];
    return product.images?.length > 0 ? product.images : [product.main_image];
  }, [product]);

  const rating = useMemo(() => {
    if (!product?.rating) return 0;
    return parseFloat(String(product.rating));
  }, [product]);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  const isCompatible = useMemo(() => {
    if (!selectedModel || !product) return true;
    return product.compatible_models?.some((m) => m.id === selectedModel.id) ?? false;
  }, [selectedModel, product]);

  // نام کامل دستگاه انتخابی برای پیام سازگاری — «لپ‌تاپ ایسوس ZenBook 14»،
  // نه فرضِ همیشگیِ «گوشی». اگر کاربر برای تبلت یا لپ‌تاپش دستگاه انتخاب کرده
  // باشد، پیام قبلی («سازگار با گوشی شما») گمراه‌کننده بود.
  const selectedDeviceName = useMemo(() => {
    if (!selectedModel) return '';
    return formatDeviceName(selectedModel.name, selectedModel.brand?.name, selectedModel.brand?.type);
  }, [selectedModel]);

  const SelectedDeviceIcon = getDeviceTypeIcon(selectedModel?.brand?.type);

  const discountPercent = useMemo(() => {
    if (!product) return 0;
    if (product.compare_price && product.compare_price > product.price) {
      return Math.round(((product.compare_price - product.price) / product.compare_price) * 100);
    }
    return 0;
  }, [product]);

  const finalPrice = useMemo(() => {
    if (!product) return 0;
    return product.price * (1 - discountPercent / 100);
  }, [product, discountPercent]);

  const averageRating = reviewsSummary?.average_rating ?? rating;

  const ratingDistribution = useMemo(() => {
    const distribution = reviewsSummary?.distribution || [];
    const total = reviewsSummary?.total_reviews || 0;
    return [5, 4, 3, 2, 1].map((r) => {
      const item = distribution.find(d => d.rating === r);
      const count = item?.count || 0;
      return { rating: r, count, percentage: total > 0 ? (count / total) * 100 : 0 };
    });
  }, [reviewsSummary]);

  const totalReviews = reviewsSummary?.total_reviews || 0;

  // 🆕 فیلتر نظرات
  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') return reviews;
    return reviews.filter((r: Review) => r.rating === reviewFilter);
  }, [reviews, reviewFilter]);

  // ==================== Handlers ====================
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem(product, quantity);
    toast.success(`${product.name} به سبد خرید اضافه شد`, { icon: '🛒' });
  }, [product, quantity, addItem]);

  const handleQuickBuy = useCallback(() => {
    if (!product) return;
    addItem(product, quantity);
    navigate('/checkout');
  }, [product, quantity, addItem, navigate]);

  const handleWishlistToggle = useCallback(() => {
    if (!product) return;
    toggleWishlist(product); // ✅ Optimistic UI با react-query
  }, [product, toggleWishlist]);

  const handleImageZoom = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleSubmitReview = () => {
    if (!product) return;
    if (reviewForm.rating === 0) {
      toast.error('لطفاً امتیاز خود را انتخاب کنید');
      return;
    }
    if (reviewForm.comment.length < 10) {
      toast.error('متن نظر باید حداقل ۱۰ کاراکتر باشد');
      return;
    }
    createReviewMutation.mutate({
      product_id: product.id,
      rating: reviewForm.rating,
      title: reviewForm.title 
        ? `[${REVIEW_CATEGORIES.find(c => c.value === reviewCategory)?.label}] ${reviewForm.title}`
        : `[${REVIEW_CATEGORIES.find(c => c.value === reviewCategory)?.label}]`,
      comment: reviewForm.comment,
    });
  };

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
      {/* ✅ فیکس واقعی: قبلاً این تگ به‌عنوان یک عبارت JSX سرگردان داخل
          useEffect (بعد از fetch) نوشته می‌شد — نه return می‌شد و نه هیچ‌جا
          رندر — پس هیچ‌وقت اجرا نمی‌شد و تگ‌های متای هر محصول (title،
          description، og:image واقعی) هیچ‌وقت روی صفحه اعمال نمی‌شدند. */}
      <DynamicMeta
        title={product.name}
        description={product.short_description || product.description?.substring(0, 150) || `خرید ${product.name} با بهترین قیمت از ازکالا`}
        image={product.main_image || '/images/placeholder.png'}
        url={`https://azkala.com/products/${product.slug}`}
        type="product"
      />

      <div className="container mx-auto px-3 md:px-4 py-4 max-w-7xl">

        {/* 🔧 Breadcrumb - Compact */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
          <Link to="/" className="hover:text-primary-600 flex items-center gap-0.5">
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خانه</span>
          </Link>
          <ChevronLeft className="w-3 h-3 text-gray-300 rotate-180" />
          <Link to="/products" className="hover:text-primary-600">فروشگاه</Link>
          {product.category && (
            <>
              <ChevronLeft className="w-3 h-3 text-gray-300 rotate-180" />
              <Link to={`/products?category=${product.category.id}`} className="hover:text-primary-600">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronLeft className="w-3 h-3 text-gray-300 rotate-180" />
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* 🔧 Grid اصلی - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          
          {/* ============ Image Gallery - Compact ============ */}
          <div className="space-y-2.5">
            <div
              className={cn(
                'relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md group',
                isZoomed && 'cursor-zoom-out'
              )}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleImageZoom}
            >
              <div className="aspect-square relative overflow-hidden">
                <SafeImage
                  src={images[selectedImage]}
                  alt={product.name}
                  className={cn(
                    'w-full h-full object-contain p-4 transition-transform duration-300',
                    isZoomed && 'scale-150'
                  )}
                  style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : {}}
                  fallbackEmoji="📦"
                  showEmojiOnError={true}
                />

                {discountPercent > 0 && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="error" className="shadow-lg">
                      <Flame className="w-3.5 h-3.5 ml-1" />
                      {discountPercent}٪
                    </Badge>
                  </div>
                )}

                <div className="absolute top-3 left-3 z-10">
                  {product.stock > 0 ? (
                    <Badge variant="success" className="shadow-md">
                      <CheckCircle className="w-3 h-3 ml-0.5" />
                      موجود
                    </Badge>
                  ) : (
                    <Badge variant="error" className="shadow-md">
                      <X className="w-3 h-3 ml-0.5" />
                      ناموجود
                    </Badge>
                  )}
                </div>

                {!isZoomed && images[selectedImage] && (
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    زوم
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white',
                      selectedImage === idx
                        ? 'border-primary-500 shadow-md scale-105'
                        : 'border-gray-200 hover:border-primary-300'
                    )}
                  >
                    <SafeImage src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

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
              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-2">
                {product.name}
              </h1>
              {rating > 0 && (
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < Math.floor(rating) ? 'text-warning-400 fill-warning-400' : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {totalReviews} نظر
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-success-600 flex items-center gap-1">
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
                  ? 'bg-gradient-to-r from-success-50 to-primary-50 border-success-300'
                  : 'bg-gradient-to-r from-error-50 to-warning-50 border-error-300'
              )}>
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  isCompatible ? 'bg-gradient-to-br from-success-500 to-success-600' : 'bg-gradient-to-br from-error-500 to-error-600'
                )}>
                  {isCompatible ? <CheckCircle className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-black text-sm mb-0.5', isCompatible ? 'text-success-700' : 'text-error-700')}>
                    {isCompatible
                      ? `✓ کاملاً سازگار با ${selectedDeviceName}`
                      : `✗ با ${selectedDeviceName} سازگار نیست`}
                  </p>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <SelectedDeviceIcon className="w-3 h-3" />
                    مدل: <strong>{selectedModel.name}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* 🔧 Price Box - Compact */}
            <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 border-2 border-primary-200 rounded-xl p-3 shadow-md">
              {discountPercent > 0 && product.compare_price && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                  <Badge variant="error" className="text-[10px]">{discountPercent}٪ تخفیف</Badge>
                </div>
              )}
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl md:text-3xl font-black text-primary-700">{formatPrice(finalPrice)}</span>
                <span className="text-xs text-gray-500">تومان</span>
              </div>
              {discountPercent > 0 && product.compare_price && (
                <div className="flex items-center gap-1.5 text-xs text-success-600 font-semibold bg-success-50 px-2 py-1 rounded-lg border border-success-200">
                  <Gift className="w-3 h-3" />
                  صرفه‌جویی: {formatPrice(product.compare_price - finalPrice)}
                </div>
              )}
            </div>

                  {/* 🔧 Seller Info - Enhanced */}
          {/* ✅ product.seller قبلاً مستقیم داخل چند closure (onClick) دوباره
              خوانده می‌شد؛ چون TypeScript نمی‌تواند narrowing یک ملک روی یک
              متغیر captured را در مرزهای closure تضمین کند، این چند خط با
              (product as any) کست دور زده می‌شدند. اینجا با یک const محلی
              seller، هم تایپ درست است و هم نیازی به هیچ any/! نیست. */}
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
                    {/* ✅ نام فروشنده حالا قابل کلیک است و به صفحه شعبه هدایت می‌شود */}
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
        // مودال همین‌جا باز می‌شود و پس از ورود، خودِ گفتگو شروع می‌شود —
        // کاربر از صفحه‌ی محصول بیرون نمی‌رود و دکمه را دوباره نمی‌زند.
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

  {/* ✅ دکمه مشاهده شعبه با بررسی امنیتی */}
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
            <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">تعداد:</span>
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity === 1}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-black text-base text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors disabled:opacity-50"
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
                >
                  <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
                </Button>
              </div>

              <div className="flex items-center gap-2 p-2 bg-primary-50 rounded-lg border border-primary-100">
                <Truck className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">ارسال سریع</p>
                  <p className="text-[10px] text-gray-600">۲ تا ۳ روز کاری</p>
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
                  <div key={i} className="bg-white border border-gray-100 rounded-lg p-2 text-center hover:border-primary-200 hover:shadow-md transition-all">
                    <div className={cn(
                      'w-8 h-8 bg-gradient-to-br rounded-md flex items-center justify-center mx-auto mb-1 shadow-sm',
                      item.color
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[9px] font-bold text-gray-700 leading-tight">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 🔧 Tabs Section - Compact */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
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
                      ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
              <div className="text-gray-700 text-sm leading-relaxed">
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 mb-3 border border-primary-100">
                  <h3 className="font-black text-gray-900 text-sm mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    معرفی محصول
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value], idx) => (
                      <tr key={key} className={cn('border-b border-gray-100 last:border-0', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                        <td className="py-2 px-3 text-gray-500 font-semibold w-1/3">{key}</td>
                        <td className="py-2 px-3 text-gray-900 font-medium">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'compatibility' && (
              <div>
                {product.compatible_models && product.compatible_models.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {product.compatible_models.map((model) => (
                      <div key={model.id} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-success-300 hover:shadow-sm transition-all">
                        <div className="w-9 h-9 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-xs">{model.name}</p>
                          <p className="text-[10px] text-gray-500">{model.brand?.name}</p>
                        </div>
                        <Badge variant="success" size="sm">سازگار</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">این محصول سازگاری با مدل خاصی ندارد</p>
                  </div>
                )}
              </div>
            )}

            {/* 🆕 Reviews Tab - بهبود یافته */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                
                {/* Rating Summary - Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4 text-center border border-primary-100">
                    <div className="text-4xl font-black text-primary-700 mb-1">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 mb-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < Math.floor(averageRating) ? 'text-warning-400 fill-warning-400' : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      بر اساس <strong>{totalReviews}</strong> نظر
                    </p>
                  </div>

                  <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-2 text-xs">توزیع امتیازات</h4>
                    <div className="space-y-1.5">
                      {ratingDistribution.map((item) => (
                        <div key={item.rating} className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5 w-10">
                            <span className="text-[10px] font-bold text-gray-700">{item.rating}</span>
                            <Star className="w-2.5 h-2.5 text-warning-400 fill-warning-400" />
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-warning-400 to-warning-500 rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-700 w-8 text-left">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Write Review Button */}
                {isAuthenticated && canReview && !hasReviewed && (
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl p-3 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-black text-sm mb-0.5">نظر خود را ثبت کنید</h4>
                        <p className="text-white/90 text-xs">
                          {hasPurchased ? 'تجربه خود را به اشتراک بگذارید' : 'به دیگر کاربران کمک کنید'}
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

                {!isAuthenticated && (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                    <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
                    <p className="text-gray-700 font-bold text-sm mb-0.5">برای ثبت نظر وارد شوید</p>
                    <Button
                      onClick={() => openAuthModal({ reason: 'برای ثبت نظر درباره این محصول وارد شوید.' })}
                      size="sm"
                      className="mt-2"
                    >
                      ورود به حساب
                    </Button>
                  </div>
                )}

                {/* 🆕 Review Form - بهبود یافته با دسته‌بندی */}
                {showReviewForm && canReview && (
                  <div className="bg-white border-2 border-primary-200 rounded-xl p-4 animate-fade-in">
                    <h4 className="font-black text-gray-900 mb-3 flex items-center gap-1.5 text-sm">
                      <MessageCircle className="w-4 h-4 text-primary-600" />
                      ثبت نظر جدید
                    </h4>

                    {/* 🆕 دسته‌بندی نظر */}
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        <Filter className="w-3 h-3 inline ml-1" />
                        دسته‌بندی نظر
                      </label>
                      <select
                        value={reviewCategory}
                        onChange={(e) => setReviewCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
                      >
                        {REVIEW_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 🆕 ستاره‌های رنگی بهبود یافته */}
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">امتیاز شما</label>
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
                                  'w-8 h-8 transition-all duration-200',
                                  star <= (hoverRating || reviewForm.rating)
                                    ? 'text-warning-400 fill-warning-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.5)]'
                                    : 'text-gray-300 hover:text-warning-200'
                                )}
                              />
                            </button>
                          ))}
                        </div>
                        {reviewForm.rating > 0 && (
                          <span className="text-xs font-bold text-warning-600 bg-warning-50 px-2 py-1 rounded-md">
                            {['', 'ضعیف', 'متوسط', 'خوب', 'عالی', 'فوق‌العاده'][reviewForm.rating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mb-2.5">
                      <label className="block text-xs font-bold text-gray-700 mb-1">عنوان نظر (اختیاری)</label>
                      <input
                        type="text"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="مثلاً: کیفیت عالی، پیشنهاد می‌کنم"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                        maxLength={255}
                      />
                    </div>

                    {/* Comment */}
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        متن نظر <span className="text-error-500">*</span>
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="تجربه خود از استفاده این محصول را بنویسید..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 resize-none"
                        minLength={10}
                        maxLength={2000}
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        حداقل ۱۰ کاراکتر • {reviewForm.comment.length}/2000
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewForm({ rating: 0, title: '', comment: '' });
                          setReviewCategory('general');
                        }}
                        disabled={createReviewMutation.isPending}
                      >
                        انصراف
                      </Button>
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={handleSubmitReview}
                        disabled={
                          createReviewMutation.isPending ||
                          reviewForm.rating === 0 ||
                          reviewForm.comment.length < 10
                        }
                        isLoading={createReviewMutation.isPending}
                      >
                        <MessageCircle className="w-3.5 h-3.5 ml-1" />
                        ثبت نظر
                      </Button>
                    </div>
                  </div>
                )}

                {/* 🆕 Reviews List با فیلتر */}
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-primary-600" />
                      نظرات کاربران ({totalReviews})
                    </h4>
                    
                    {/* 🆕 فیلتر بر اساس امتیاز */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setReviewFilter('all')}
                        className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-bold transition-all',
                          reviewFilter === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-9 h-9 bg-gray-200 rounded-full" />
                            <div className="flex-1">
                              <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
                              <div className="h-2 bg-gray-200 rounded w-16" />
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded w-full mb-1.5" />
                          <div className="h-2 bg-gray-200 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : filteredReviews.length === 0 ? (
                    <div className="text-center py-8 bg-white border border-gray-100 rounded-xl">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        {reviewFilter === 'all' 
                          ? 'هنوز نظری ثبت نشده است'
                          : `نظری با امتیاز ${reviewFilter} ستاره یافت نشد`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {filteredReviews.map((review: Review) => (
                          <div
                            key={review.id}
                            className="bg-white border border-gray-100 rounded-xl p-3 hover:border-primary-200 hover:shadow-sm transition-all"
                          >
                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md">
                                  {review.user.initial}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-900 text-xs">{review.user.name}</p>
                                    {review.is_verified && (
                                      <Badge variant="success" size="sm" className="text-[9px]">
                                        <BadgeCheck className="w-2.5 h-2.5 ml-0.5" />
                                        خریدار
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
                                            i < review.rating ? 'text-warning-400 fill-warning-400' : 'text-gray-200'
                                          )}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      {review.created_at_fa}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {review.title && (
                              <h5 className="font-bold text-gray-900 text-xs mb-1">{review.title}</h5>
                            )}

                            <p className="text-gray-700 text-xs leading-relaxed mb-2">{review.comment}</p>

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => helpfulMutation.mutate(review.id)}
                                disabled={helpfulMutation.isPending}
                                className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-success-600 transition-colors disabled:opacity-50"
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
                          <span className="text-xs text-gray-600">
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
              {relatedProducts.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onClick={() => navigate(`/products/${p.slug}`)} 
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
