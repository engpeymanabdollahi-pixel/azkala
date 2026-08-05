import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone, ArrowLeft, Package, Clock, Gift, Home, Heart, User,
  ArrowUp, Play, Pause, ChevronLeft, ChevronRight, Truck,
  BadgeCheck, Headphones, Sparkles, Zap, Flame, TrendingUp,
  Star, ThumbsUp, CreditCard, Mail, CheckCircle, ShieldCheck, RefreshCcw
} from 'lucide-react';
import { useModelStore } from '@/store/modelStore';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { ProductCardSkeleton } from '@/components/features/ProductCardSkeleton';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Product } from '@/types/models';
import toast from 'react-hot-toast';
import { useHomeData } from '@/hooks/useHomeData';

// Import separated components
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { CountdownTimer } from './components/CountdownTimer';
import { AnimatedCounter } from './components/AnimatedCounter';
import { ProductCardWithQuickView } from './components/ProductCardWithQuickView';
import { TopSellersSection } from './components/TopSellersSection';

// Import separated hooks
import { useCountdown } from './hooks/useCountdown';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';
import { useEmailValidation } from './hooks/useEmailValidation';

// Import constants
import {
  HERO_SLIDES, REVIEWS, PLATFORM_STATS, FEATURES, TRUST_BADGES,
  PAYMENT_METHODS, SHIPPING_PARTNERS,
  HERO_AUTOPLAY_INTERVAL, REVIEW_AUTOPLAY_INTERVAL
} from './constants';

export function HomePage() {
  const navigate = useNavigate();
  
  // نام واقعیِ اکشن store، clearSelection است. اینجا با نام clearModel
  // خوانده می‌شد که در store اصلاً وجود نداشت — یعنی دکمه‌ی «تغییر دستگاه»
  // در هیرویِ device-aware با کلیک، «clearModel is not a function» می‌داد.
  const { selectedModel, openModal, clearSelection, setCurrentCategory } = useModelStore();
  const { addItem } = useCartStore();
  
  const { 
    products: allProducts, 
    categories: apiCategories, 
    featuredProducts: apiFeaturedProducts,
    specialOffers: apiSpecialOffers,
    isLoading: isDataLoading,
    isUsingMock,
  } = useHomeData();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [currentReview, setCurrentReview] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const { progress: scrollProgress, showBackToTop } = useScrollProgress();
  const { recentlyViewed, addToRecentlyViewed } = useRecentlyViewed(allProducts);
  const { email, emailError, setEmail, handleEmailChange, validateEmail } = useEmailValidation();
  
  const endOfDay = useMemo(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);
  
  const timeLeft = useCountdown(endOfDay);

  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, HERO_AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % REVIEWS.length);
    }, REVIEW_AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // 🎯 Device-First Logic: Filter products based on selected model
  const compatibleProducts = useMemo(() => {
    if (!selectedModel) return [];
    return allProducts.filter((p) => p.compatible_models?.some((m) => m.id === selectedModel.id)).slice(0, 12);
  }, [selectedModel?.id, allProducts]);

  const featuredProducts = useMemo(() => {
    if (compatibleProducts.length > 0) return compatibleProducts;
    return apiFeaturedProducts.length > 0 ? apiFeaturedProducts.slice(0, 12) : allProducts.slice(0, 12);
  }, [compatibleProducts, apiFeaturedProducts, allProducts]);

  const discountedProducts = useMemo(() => {
    const baseProducts = compatibleProducts.length > 0 ? compatibleProducts : allProducts;
    return baseProducts
      .filter((p) => p.discount_percentage && p.discount_percentage > 0)
      .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
      .slice(0, 8);
  }, [compatibleProducts, allProducts]);

  const activeCategories = useMemo(() => {
    return apiCategories
      .filter((cat) => cat.parent_id === null && cat.is_active)
      .slice(0, 8);
  }, [apiCategories]);

  const handleCategoryClick = useCallback((categoryId: number) => {
    const category = apiCategories.find((c) => c.id === categoryId);
    if (category) {
      setCurrentCategory(category);
      navigate('/products');
    }
  }, [apiCategories, setCurrentCategory, navigate]);

  const handleProductClick = useCallback((product: Product) => {
    addToRecentlyViewed(product.id);
    navigate(`/products/${product.slug}`);
  }, [navigate, addToRecentlyViewed]);

  const handleQuickAdd = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`${product.name} به سبد خرید اضافه شد`, { icon: '🛒', duration: 3000 });
  }, [addItem]);

  const handleNewsletterSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error(emailError || 'لطفاً ایمیل معتبر وارد کنید');
      return;
    }
    setIsSubscribed(true);
    toast.success('با موفقیت در خبرنامه عضو شدید! 🎉', { duration: 4000 });
    setTimeout(() => { setIsSubscribed(false); setEmail(''); }, 3000);
  }, [email, emailError, validateEmail, setEmail]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isTimerExpired = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-20 md:pb-0 transition-colors duration-300">
      {/* Dev Indicator */}
      {import.meta.env.DEV && (
        <div className={cn(
          "fixed bottom-20 left-4 z-[200] px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-md border border-white/20",
          isUsingMock ? "bg-warning-500 text-white" : "bg-success-500 text-white"
        )}>
          {isUsingMock ? '📋 داده‌های آزمایشی' : '✅ اتصال به سرور'}
        </div>
      )}

      {/* Scroll Progress */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-200 dark:bg-slate-800" role="progressbar">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 1. Announcement Bar */}
      <SectionErrorBoundary sectionName="Announcement Bar">
        <section className="bg-gradient-to-r from-primary-900 via-primary-800 to-accent-900 text-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-10 text-xs md:text-sm">
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-accent-400" /><span className="font-medium">ارسال رایگان بالای ۵۰۰ هزار تومان</span></div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-success-400" /><span className="font-medium">ضمانت اصالت و سلامت کالا</span></div>
                <div className="flex items-center gap-2"><Headphones className="w-3.5 h-3.5 text-primary-400" /><span className="font-medium">پشتیبانی ۷ روز هفته</span></div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
                <span className="font-semibold text-xs"><AnimatedCounter value={150} /> کاربر در حال مشاهده</span>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* 2. Hero Section (Device-Aware) */}
      <SectionErrorBoundary sectionName="Hero Section">
        <section className="relative overflow-hidden" aria-label="اسلایدر اصلی">
          {selectedModel ? (
            // 🎯 Device-First Hero
            <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 flex items-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0xMHY2aC02VjI0aDZ6bTAgMTB2NmgtNlYzNGg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
              <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-right text-white animate-fade-in">
                  <Badge className="mb-4 bg-accent-500/20 text-accent-300 border-accent-500/30 backdrop-blur-sm">
                    <Smartphone className="w-3 h-3 ml-1" /> دستگاه انتخاب‌شده شما
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
                    لوازم جانبی اختصاصی <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-primary-400">
                      {selectedModel.name}
                    </span>
                  </h1>
                  <p className="text-lg text-gray-300 mb-8 max-w-lg">
                    فقط محصولاتی را می‌بینید که ۱۰۰٪ با دستگاه شما سازگار هستند. بدون نگرانی از خرید اشتباه.
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <Button size="lg" onClick={() => navigate('/products')} className="btn-primary-enhanced">
                      مشاهده محصولات سازگار
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={clearSelection} className="border-white/30 text-white hover:bg-white/10">
                      تغییر دستگاه
                      <RefreshCcw className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </div>
                <div className="hidden md:block w-1/3 animate-float">
                  <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-full backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
                    <Smartphone className="w-32 h-32 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Standard Promotional Hero
            <div className="relative h-[500px] md:h-[600px] lg:h-[650px]">
              {HERO_SLIDES.map((slide, index) => (
                <div
                  key={slide.id}
                  className={cn('absolute inset-0 transition-all duration-1000', currentSlide === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none')}
                >
                  <div className={cn('absolute inset-0 bg-gradient-to-br', slide.gradient)} />
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -left-40 -bottom-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                  </div>
                  <div className="container mx-auto px-4 h-full relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between h-full gap-8 pt-16 lg:pt-0">
                      <div className="flex-1 text-right text-white animate-fade-in">
                        <Badge variant="warning" className="mb-6 text-sm bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2">
                          <Sparkles className="w-4 h-4 ml-1" /> {slide.badge}
                        </Badge>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-4">{slide.title}</h1>
                        <p className="text-2xl md:text-3xl text-white/95 mb-3 font-semibold">{slide.subtitle}</p>
                        <p className="text-lg text-white/80 mb-8 max-w-lg">{slide.description}</p>
                        <div className="flex gap-3 flex-wrap mb-12">
                          <Button size="lg" onClick={() => navigate('/products')} className="bg-white text-gray-900 hover:bg-gray-100 font-bold shadow-2xl hover:-translate-y-1 transition-all group">
                            {slide.cta.primary.text}
                            <slide.cta.primary.icon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                          </Button>
                          <Button size="lg" variant="outline" onClick={openModal} className="border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm transition-all group">
                            <Smartphone className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                            دستگاه خود را انتخاب کنید
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {PLATFORM_STATS.map((stat) => {
                            const Icon = stat.icon;
                            return (
                              <div key={stat.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all cursor-pointer group">
                                <div className={cn('w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform', stat.color)}>
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <p className="text-xl md:text-2xl font-black text-white"><AnimatedCounter value={stat.value} suffix={stat.suffix} /></p>
                                  <p className="text-white/70 text-xs">{stat.label}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="hidden lg:block relative animate-float">
                        <div className="w-[500px] h-[500px] flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl" />
                          <div className="text-[250px] relative z-10 drop-shadow-2xl hover:scale-110 transition-transform cursor-pointer">{slide.image}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Slider Controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                <button onClick={() => setIsAutoPlay(!isAutoPlay)} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all" aria-label={isAutoPlay ? 'توقف' : 'شروع'}>
                  {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="flex gap-2" role="tablist">
                  {HERO_SLIDES.map((_, index) => (
                    <button key={index} onClick={() => setCurrentSlide(index)} className={cn('h-2 rounded-full transition-all', currentSlide === index ? 'w-12 bg-white shadow-lg' : 'w-4 bg-white/50 hover:bg-white/70')} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </SectionErrorBoundary>

      {/* 3. Trust Bar */}
      <SectionErrorBoundary sectionName="Trust Bar">
        <section className="py-10 bg-white dark:bg-slate-800 border-b dark:border-slate-700">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {TRUST_BADGES.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center group cursor-default">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{badge.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* 4. Categories Grid */}
      <SectionErrorBoundary sectionName="Categories">
        <section className="py-12 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">دسته‌بندی محصولات</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">انتخاب از بین هزاران محصول باکیفیت</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="hidden md:flex btn-outline-enhanced">
                مشاهده همه <ArrowLeft className="w-4 h-4 mr-1" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              {activeCategories.map((cat, index) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="group relative bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl p-6 border-2 border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:shadow-xl hover:-translate-y-2 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="text-4xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">
                      {cat.icon || '📦'}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span>{cat.products_count || 0} محصول</span>
                      <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* 5. Flash Sale (Shaghf-angiz) */}
      {discountedProducts.length > 0 && (
        <SectionErrorBoundary sectionName="Flash Sale">
          <section className="py-16 bg-gradient-to-br from-error-600 via-error-700 to-accent-700 text-white relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-warning-400 rounded-3xl blur-xl opacity-50 animate-pulse" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-warning-400 to-warning-500 rounded-3xl flex items-center justify-center shadow-2xl">
                      <Zap className="w-10 h-10 text-error-700" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-5 h-5 text-warning-400 animate-pulse" />
                      <span className="text-warning-400 font-bold text-sm">فقط امروز</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-1">پیشنهادهای شگفت‌انگیز</h2>
                    <p className="text-error-200">تخفیف‌های باورنکردنی فقط تا پایان امروز!</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shadow-2xl">
                  <Clock className="w-6 h-6 text-warning-400 animate-pulse" />
                  {isTimerExpired ? (
                    <span className="font-bold text-lg">تخفیف‌ها به پایان رسید</span>
                  ) : (
                    <CountdownTimer timeLeft={timeLeft} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {discountedProducts.map((product) => {
                  const finalPrice = product.price * (1 - (product.discount_percentage || 0) / 100);
                  const savings = product.price - finalPrice;
                  const isLowStock = product.stock > 0 && product.stock <= 5;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-white/10"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                        {product.discount_percentage && (
                          <div className="absolute top-3 right-3 z-10 bg-gradient-to-br from-error-500 to-error-600 text-white px-3 py-1.5 rounded-xl text-sm font-black shadow-lg">
                            {product.discount_percentage}٪
                          </div>
                        )}
                        {/* عکس واقعی محصول — قبلاً هر محصولی، بدون توجه به تصویر
                            واقعی‌اش، همین یک ایموجی ثابت را نشان می‌داد. */}
                        <SafeImage
                          src={product.main_image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          showEmojiOnError
                          fallbackEmoji="📦"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleQuickAdd(e, product); }}
                            className="opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-700 text-error-600 dark:text-error-400 px-4 py-2 rounded-xl font-bold shadow-xl hover:bg-error-600 hover:text-white dark:hover:bg-error-600 dark:hover:text-white transition-all translate-y-4 group-hover:translate-y-0"
                          >
                            افزودن به سبد
                          </button>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-error-600 transition-colors h-10">
                          {product.name}
                        </h3>

                        {/* موجودی واقعی — نشانگر پیشرفتِ قبلی یک عدد تصادفیِ
                            جعلی بود (Math.random در هر رندر، حتی برای یک محصول
                            ثابت)، نه داده‌ی واقعی. */}
                        {isLowStock && (
                          <div className="mb-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 px-2 py-1 rounded-lg">
                              <Flame className="w-3 h-3" />
                              تنها {product.stock} عدد باقی مانده
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                            <span className="text-lg font-black text-error-600 dark:text-error-400">{formatPrice(finalPrice)}</span>
                          </div>
                          <span className="text-[10px] text-success-600 dark:text-success-400 font-bold flex items-center gap-1 bg-success-50 dark:bg-success-900/20 px-2 py-1 rounded-lg">
                            <TrendingUp className="w-3 h-3" />
                            {formatPrice(savings)} سود
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center mt-10">
                <Button size="lg" variant="outline" onClick={() => navigate('/products')} className="border-2 border-white text-white hover:bg-white hover:text-error-600 bg-transparent transition-all group btn-outline-enhanced">
                  مشاهده همه تخفیف‌ها <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </section>
        </SectionErrorBoundary>
      )}

      {/* 6. Best Sellers / Featured Products */}
      <SectionErrorBoundary sectionName="Best Sellers">
        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-warning-400 to-accent-500 rounded-2xl blur-xl opacity-50" />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-warning-400 to-accent-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                    {selectedModel ? `محبوب‌ترین‌های ${selectedModel.name}` : 'پرفروش‌ترین محصولات'}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                    <Flame className="w-4 h-4 text-accent-500" />
                    انتخاب هوشمندانه هزاران خریدار
                  </p>
                </div>
              </div>
              <button onClick={() => navigate('/products')} className="group flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 px-5 py-2.5 rounded-xl transition-all">
                <span>مشاهده همه</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>

            {isDataLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <Suspense fallback={<ProductCardSkeleton />}>
                  {featuredProducts.map((product) => (
                    <ProductCardWithQuickView
                      key={product.id}
                      product={product}
                      onClick={() => handleProductClick(product)}
                      onQuickAdd={(e) => handleQuickAdd(e, product)}
                    />
                  ))}
                </Suspense>
              </div>
            )}
          </div>
        </section>
      </SectionErrorBoundary>

      {/* 6.5. Top Sellers */}
      <SectionErrorBoundary sectionName="Top Sellers">
        <TopSellersSection />
      </SectionErrorBoundary>

      {/* 7. Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <SectionErrorBoundary sectionName="Recently Viewed">
          <section className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">اخیراً مشاهده شده</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">محصولاتی که اخیراً دیده‌اید</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Suspense fallback={<ProductCardSkeleton />}>
                  {recentlyViewed.map((product) => (
                    <ProductCardWithQuickView
                      key={product.id}
                      product={product}
                      onClick={() => handleProductClick(product)}
                      onQuickAdd={(e) => handleQuickAdd(e, product)}
                    />
                  ))}
                </Suspense>
              </div>
            </div>
          </section>
        </SectionErrorBoundary>
      )}

      {/* 8. Features (Why Azkala) */}
      <SectionErrorBoundary sectionName="Features">
        <section className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                <Sparkles className="w-4 h-4 ml-1" />
                چرا ازکالا؟
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                مزایای خرید از <span className="text-primary-600">ازکالا</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                تجربه خرید آسان، سریع و مطمئن با بهترین خدمات پس از فروش و تضمین سازگاری
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="card-enhanced group p-8 hover:-translate-y-3">
                    <div className="relative mb-6">
                      <div className={cn('absolute inset-0 bg-gradient-to-br rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity', item.gradient)} />
                      <div className={cn('relative w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500', item.gradient)}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* 9. Testimonials */}
      <SectionErrorBoundary sectionName="Testimonials">
        <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200 dark:bg-primary-900/20 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-200 dark:bg-accent-900/20 rounded-full blur-3xl opacity-30" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-2 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300">
                <Star className="w-4 h-4 ml-1 fill-warning-400 text-warning-400" />
                نظرات مشتریان
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">رضایت مشتریان، افتخار ماست</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">بیش از ۱۰,۰۰۰ نظر مثبت از مشتریان راضی</p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              <div className="overflow-hidden">
                <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentReview * 100}%)` }}>
                  {REVIEWS.map((review) => (
                    <div key={review.id} className="w-full flex-shrink-0 px-4">
                      <div className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 border-2 border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-2xl transition-all duration-500">
                        <div className="absolute -top-5 right-8 w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-2xl font-serif">"</span>
                        </div>
                        <div className="flex items-center gap-1 mb-4 pt-2">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} className={cn('w-5 h-5', s < review.rating ? 'text-warning-400 fill-warning-400' : 'text-gray-300 dark:text-slate-600')} />
                          ))}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-base md:text-lg">"{review.text}"</p>
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg">{review.avatar}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-gray-900 dark:text-white">{review.name}</p>
                              {review.verified && <BadgeCheck className="w-4 h-4 text-primary-600" />}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{review.model}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{review.date}</p>
                          </div>
                          {review.helpful > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <ThumbsUp className="w-3 h-3" />
                              <span>{review.helpful}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-8">
                <button onClick={() => setCurrentReview((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-slate-700 transition-all border border-gray-100 dark:border-slate-700">
                  <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex gap-2">
                  {REVIEWS.map((_, index) => (
                    <button key={index} onClick={() => setCurrentReview(index)} className={cn('h-2 rounded-full transition-all', currentReview === index ? 'w-8 bg-primary-500' : 'w-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400')} />
                  ))}
                </div>
                <button onClick={() => setCurrentReview((prev) => (prev + 1) % REVIEWS.length)} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-slate-700 transition-all border border-gray-100 dark:border-slate-700">
                  <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* 10. Payment & Shipping */}
      <SectionErrorBoundary sectionName="Payment & Shipping">
        <section className="py-16 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-slate-800 rounded-3xl p-8 border-2 border-primary-100 dark:border-primary-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">روش‌های پرداخت امن</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {PAYMENT_METHODS.map((method, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all">
                      <span className="text-3xl">{method.icon}</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{method.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-success-50 to-white dark:from-success-900/10 dark:to-slate-800 rounded-3xl p-8 border-2 border-success-100 dark:border-success-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">شرکای ارسال سریع</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {SHIPPING_PARTNERS.map((partner, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-success-300 dark:hover:border-success-700 hover:shadow-md transition-all">
                      <span className="text-3xl">{partner.icon}</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{partner.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* 11. Newsletter */}
      <SectionErrorBoundary sectionName="Newsletter">
        <section className="py-16 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/20 dark:via-slate-800 dark:to-accent-900/20 rounded-3xl p-10 md:p-14 border-2 border-primary-100 dark:border-primary-900/30 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-200 dark:bg-primary-900/30 rounded-full blur-3xl opacity-30" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-200 dark:bg-accent-900/30 rounded-full blur-3xl opacity-30" />
                
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">عضویت در خبرنامه</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">از جدیدترین تخفیف‌ها و پیشنهادات ویژه باخبر شوید</p>
                  
                  {isSubscribed ? (
                    <div className="bg-success-50 dark:bg-success-900/20 border-2 border-success-200 dark:border-success-800 rounded-2xl p-6 animate-fade-in">
                      <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
                      <p className="text-success-700 dark:text-success-400 font-bold text-lg">با موفقیت عضو شدید!</p>
                      <p className="text-success-600 dark:text-success-500 text-sm mt-2">از اینکه همراه ما هستید متشکریم</p>
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                        <div className="flex-1 relative">
                          <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="ایمیل خود را وارد کنید"
                            className={cn(
                              "w-full pr-12 pl-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all text-right bg-white dark:bg-slate-800 dark:text-white",
                              emailError ? "border-error-500 focus:border-error-500 focus:ring-error-100" : "border-gray-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900/30"
                            )}
                            required
                          />
                        </div>
                        <Button type="submit" size="lg" className="whitespace-nowrap btn-primary-enhanced">
                          <Gift className="w-5 h-5 ml-2" />
                          عضویت
                        </Button>
                      </div>
                      {emailError && <p className="text-error-600 text-sm text-right">{emailError}</p>}
                    </form>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    با عضویت، با <a href="/terms" className="text-primary-600 hover:text-primary-700 font-medium underline">قوانین و مقررات</a> ازکالا موافقت می‌کنید
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Back to Top */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all flex items-center justify-center z-50 animate-fade-in"
          aria-label="بازگشت به بالای صفحه"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-gray-200 dark:border-slate-700 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around py-2 pb-safe">
          <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 px-4 py-2 text-primary-600 dark:text-primary-400">
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold">خانه</span>
          </button>
          <button onClick={() => navigate('/products')} className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors">
            <Package className="w-6 h-6" />
            <span className="text-[10px] font-bold">محصولات</span>
          </button>
          <button onClick={openModal} className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors relative -top-5">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/40 border-4 border-gray-50 dark:border-slate-900">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <span className="text-[10px] font-bold mt-1">انتخاب دستگاه</span>
          </button>
          <button onClick={() => navigate('/dashboard/wishlist')} className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-error-500 transition-colors">
            <Heart className="w-6 h-6" />
            <span className="text-[10px] font-bold">علاقه‌مندی</span>
          </button>
          <button onClick={() => navigate('/dashboard/profile')} className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">پروفایل</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
export default HomePage;