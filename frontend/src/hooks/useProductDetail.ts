import { useState, useEffect, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/store/cartStore';
import { useModelStore } from '@/store/modelStore';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { useCompareStore } from '@/store/compareStore';
import { useWishlistApi } from '@/hooks/api/useWishlistApi';
import { productService } from '@/services/api/product.service';
import { reviewService, type Review } from '@/services/api/review.service';
import type { Product, PhoneModel } from '@/types/models';
import { formatDeviceName, getDeviceTypeIcon } from '@/utils/deviceType';
import toast from 'react-hot-toast';

// ✅ 'compatibility' قبلاً اینجا نبود در حالی که ProductDetailPage.tsx واقعاً
// چنین تبی دارد و یک نسخه‌ی محلی و ناهماهنگ از TabType (با as TabType
// دستی) برای دور زدن تایپ درست تعریف کرده بود — یعنی تشخیص typo در آیدی
// تب‌ها عملاً غیرفعال بود.
export type TabType = 'description' | 'specifications' | 'compatibility' | 'reviews';

export interface ReviewForm {
  rating: number;
  title: string;
  comment: string;
}

export interface UseProductDetailReturn {
  // Data
  product: Product | null;
  relatedProducts: Product[];
  reviews: Review[];
  reviewsSummary: any;
  reviewsPagination: any;
  // ✅ قبلاً از این interface و از return واقعی هوک جا مانده بودند —
  // ProductDetailPage و ReviewsTab.tsx به این سه تکیه می‌کردند (ازجمله
  // helpfulMutation.mutate بدون optional chaining) و همیشه undefined
  // می‌گرفتند.
  selectedModel: PhoneModel | null;
  createReviewMutation: any;
  helpfulMutation: any;

  // UI State
  selectedImage: number;
  quantity: number;
  activeTab: TabType;
  isZoomed: boolean;
  zoomPosition: { x: number; y: number };
  isLoading: boolean;
  error: string | null;
  
  // Review State
  showReviewForm: boolean;
  reviewForm: ReviewForm;
  hoverRating: number;
  reviewsPage: number;
  reviewFilter: number | 'all';
  canReview: boolean;
  hasReviewed: boolean;
  hasPurchased: boolean;
  reviewsLoading: boolean;
  
  // Computed
  images: string[];
  rating: number;
  isWishlisted: boolean;
  // ✅ P0 fix — Wishlist Race Condition: هم در حین mutation و هم در پنجره‌ی
  // بارگذاری اولیه‌ی ['wishlist'] true است؛ دکمه‌ی قلب باید در هر دو حالت
  // غیرفعال بماند (رجوع به کامنت useWishlistApi.ts).
  isTogglingWishlist: boolean;
  inCompare: boolean;
  isCompatible: boolean;
  selectedDeviceName: string;
  SelectedDeviceIcon: any;
  discountPercent: number;
  finalPrice: number;
  averageRating: number;
  ratingDistribution: Array<{ rating: number; count: number; percentage: number }>;
  totalReviews: number;
  
  // Handlers
  setSelectedImage: (index: number) => void;
  setQuantity: (qty: number) => void;
  setActiveTab: (tab: TabType) => void;
  setIsZoomed: (zoomed: boolean) => void;
  setShowReviewForm: (show: boolean) => void;
  // ✅ ست‌کننده‌های واقعی زیرین useState هستند (نه توابع ساده) — ReviewsTab.tsx
  // هم واقعاً از فرم updater استفاده می‌کند (مثل setReviewForm(prev => ...))،
  // پس تایپ باید Dispatch<SetStateAction<T>> باشد، نه (value: T) => void.
  setReviewForm: Dispatch<SetStateAction<ReviewForm>>;
  setHoverRating: (rating: number) => void;
  setReviewsPage: Dispatch<SetStateAction<number>>;
  setReviewFilter: (filter: number | 'all') => void;
  handleAddToCart: () => void;
  handleQuickBuy: () => void;
  handleWishlistToggle: () => void;
  handleCompareToggle: () => void;
  handleImageZoom: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSubmitReview: () => void;
}

export function useProductDetail(): UseProductDetailReturn {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const openAuthModal = useAuthModalStore((state) => state.open);
  // ✅ فراخوانی مرده‌ی useChatStore حذف شد — هیچ‌جای این هوک از
  // openChat/startConversation استفاده نمی‌کرد؛ نسخه‌ی واقعی و متصل‌شده‌ی
  // این قابلیت مستقیماً در ProductDetailPage.tsx است.
  const { addItem } = useCartStore();
  const { selectedModel } = useModelStore();
  const { toggleWishlist, isInWishlist, isTogglingWishlist, isProductMutating } = useWishlistApi();
  const { isCompared, toggleProduct } = useCompareStore();

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
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    rating: 0,
    title: '',
    comment: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewFilter, setReviewFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    setReviewsPage(1);
  }, [reviewFilter]);

  // ==================== Data Fetching ====================
  useEffect(() => {
    let isMounted = true;

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

        if (!isMounted) return;

        const rawData = response.data;
        const productData = rawData?.product || rawData;

        if (!productData || !productData.id) {
          throw new Error('داده‌های محصول یافت نشد');
        }

        const safeProduct = {
          ...productData,
          brand: productData.brand || { id: 0, name: 'نامشخص', slug: '' },
          category: productData.category || { id: 0, name: 'نامشخص', slug: '' },
          images: Array.isArray(productData.images) ? productData.images : (productData.main_image ? [productData.main_image] : []),
          price: Number(productData.price) || 0,
          compare_price: Number(productData.compare_price) || 0,
          compatible_models: rawData?.compatible_models || [],
        };

        if (isMounted) {
          setProduct(safeProduct as Product);

          if (rawData.related_products && Array.isArray(rawData.related_products)) {
            setRelatedProducts(rawData.related_products);
          }
        }
      } catch (err) {
        if (!isMounted) return;

        const errorObj = err as { name?: string; code?: string; message?: string; response?: { data?: { message?: string } } };

        if (errorObj.name === 'CanceledError' || errorObj.code === 'ERR_CANCELED' || errorObj.message === 'canceled') {
          console.log('⚠️ درخواست قبلی توسط React کنسل شد (این رفتار طبیعی است و نادیده گرفته می‌شود)');
          return;
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

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews', product?.id, reviewsPage, reviewFilter],
    queryFn: () => reviewService.getReviews(product!.id, reviewsPage, reviewFilter === 'all' ? undefined : reviewFilter),
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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', product?.id] });
      toast.success(
        response.message || 'نظر شما ثبت شد و پس از بررسی منتشر می‌شود',
        { icon: '⭐', duration: 4000 }
      );
      setShowReviewForm(false);
      setReviewForm({ rating: 0, title: '', comment: '' });
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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
      toast.success(response.message, { icon: '👍' });
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
  const inCompare = product ? isCompared(product.id) : false;

  const isCompatible = useMemo(() => {
    if (!selectedModel || !product) return true;
    return product.compatible_models?.some((m) => m.id === selectedModel.id) ?? false;
  }, [selectedModel, product]);

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
    toggleWishlist(product);
  }, [product, toggleWishlist]);

  const handleCompareToggle = useCallback(() => {
    if (!product) return;
    toggleProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_price: product.compare_price,
      main_image: product.main_image,
      rating: product.rating,
      reviews_count: product.reviews_count ?? 0,
      specifications: product.specifications ?? {},
      compatible_models: product.compatible_models ?? [],
      seller: product.seller,
      category: product.category,
      // ✅ P0 fix — Comparison Brand: قبلاً اینجا اصلاً ارسال نمی‌شد،
      // در حالی که ProductController آن را از قبل eager-load می‌کرد
      // (product.brand همین‌جا موجود است) — هیچ درخواست جدیدی لازم نیست.
      brand: product.brand,
    });
  }, [product, toggleProduct]);

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
    if (reviewForm.comment.trim().length < 4) {
      toast.error('متن نظر باید حداقل ۴ کاراکتر باشد');
      return;
    }
    createReviewMutation.mutate({
      product_id: product.id,
      rating: reviewForm.rating,
      title: reviewForm.title || undefined,
      comment: reviewForm.comment,
    });
  };

  return {
    // Data
    product,
    relatedProducts,
    reviews,
    reviewsSummary,
    reviewsPagination,

    // ✅ قبلاً این سه از return خارج مانده بودند در حالی که همین‌جا داخل
    // هوک تعریف/محاسبه می‌شدند (selectedModel از useModelStore،
    // createReviewMutation/helpfulMutation از useMutation) و همه‌جا هم
    // در همین فایل استفاده می‌شدند (isCompatible، selectedDeviceName، و
    // خود handleSubmitReview). یعنی در ProductDetailPage این سه همیشه
    // undefined می‌شدند: ‌بخش «سازگاری با دستگاه انتخابی» بی‌صدا رندر
    // نمی‌شد، و مهم‌تر — ReviewsTab.tsx خط ۳۹۹ بدون optional chaining
    // helpfulMutation.mutate(review.id) صدا می‌زد، یعنی کلیک روی «مفید
    // بود» زیر هر نظر همیشه با TypeError کرش می‌کرد.
    selectedModel,
    createReviewMutation,
    helpfulMutation,


    // UI State
    selectedImage,
    quantity,
    activeTab,
    isZoomed,
    zoomPosition,
    isLoading,
    error,
    
    // Review State
    showReviewForm,
    reviewForm,
    hoverRating,
    reviewsPage,
    reviewFilter,
    canReview,
    hasReviewed,
    hasPurchased,
    reviewsLoading,
    
    // Computed
    images,
    rating,
    isWishlisted,
    // ✅ فاز ۴ تسک P0: علاوه بر pending خودِ این هوک، اگر همین محصول از یک
    // ProductCard دیگر (رندرشده هم‌زمان در جای دیگر صفحه) هم در حال
    // mutate شدن باشد هم true می‌شود — رجوع به کامنت کامل isProductMutating
    // در useWishlistApi.ts.
    isTogglingWishlist: isTogglingWishlist || (product ? isProductMutating(product.id) : false),
    inCompare,
    isCompatible,
    selectedDeviceName,
    SelectedDeviceIcon,
    discountPercent,
    finalPrice,
    averageRating,
    ratingDistribution,
    totalReviews,
    
    // Handlers
    setSelectedImage,
    setQuantity,
    setActiveTab,
    setIsZoomed,
    setShowReviewForm,
    setReviewForm,
    setHoverRating,
    setReviewsPage,
    setReviewFilter,
    handleAddToCart,
    handleQuickBuy,
    handleWishlistToggle,
    handleCompareToggle,
    handleImageZoom,
    handleSubmitReview,
  };
}