import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingCart, Trash2, ArrowLeft, Sparkles, Flame,
  Star, Package, ShoppingBag, Eye, CheckCircle, X, Gift,
} from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function WishlistPage() {
  const navigate = useNavigate();
  const { items, removeItem, clearWishlist, syncFromApi, isSyncing } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      syncFromApi();
    }
  }, [isAuthenticated]);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (product.stock === 0) {
      toast.error('این محصول موجود نیست', { icon: '❌' });
      return;
    }
    addItem(product, 1);
    toast.success(`${product.name} به سبد خرید اضافه شد`, { icon: '🛒' });
  };

  const handleAddAllToCart = () => {
    const availableItems = items.filter(p => p.stock > 0);
    if (availableItems.length === 0) {
      toast.error('هیچ محصولی موجود نیست', { icon: '❌' });
      return;
    }
    availableItems.forEach(product => addItem(product, 1));
    toast.success(`${availableItems.length} محصول به سبد خرید اضافه شد`, { icon: '🛒' });
  };

  const handleRemove = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    removeItem(product.id);
    toast.success('از علاقه‌مندی‌ها حذف شد', { icon: '🗑️' });
  };

  const handleClearAll = () => {
    clearWishlist();
    setShowClearConfirm(false);
    toast.success('همه محصولات از علاقه‌مندی‌ها حذف شدند', { icon: '🗑️' });
  };

  const stats = {
    total: items.length,
    available: items.filter(p => p.stock > 0).length,
    outOfStock: items.filter(p => p.stock === 0).length,
    totalValue: items.reduce((sum, p) => sum + p.price, 0),
    totalDiscount: items.reduce((sum, p) => {
      if (p.compare_price && p.compare_price > p.price) {
        return sum + (p.compare_price - p.price);
      }
      return sum;
    }, 0),
  };

  // 🆕 Skeleton Loading State - آینه چیدمان واقعی
  if (isSyncing && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                  <div className="h-3 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                <div className="aspect-square bg-gray-200 dark:bg-slate-700 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded line-clamp-2" />
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="w-3 h-3 bg-gray-200 dark:bg-slate-700 rounded" />
                    ))}
                  </div>
                  <div className="flex items-end justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                    <div className="h-5 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
                    <div className="h-8 w-16 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ✨ Empty State - Empathy over Error
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <EmptyState
            icon={<Heart className="w-12 h-12 text-gray-400 dark:text-slate-500" />}
            title="علاقه‌مندی‌های شما خالی است"
            description="محصولاتی که دوست دارید را با کلیک روی آیکون قلب به اینجا اضافه کنید و بعداً با تخفیف بخرید!"
            action={
              <div className="flex flex-col gap-2 w-full">
                <Button 
                  onClick={() => navigate('/products')} 
                  size="md" 
                  className="w-full hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  مشاهده محصولات
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')} 
                  size="md" 
                  className="w-full hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  بازگشت به صفحه اصلی
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-3 md:px-4 py-6 max-w-7xl">
        {/* Header - با انیمیشن ورود */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-error-500 to-error-600 dark:from-error-600 dark:to-error-700 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100">علاقه‌مندی‌های من</h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{stats.total} محصول در لیست</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/profile')} 
              className="gap-1 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">پروفایل</span>
            </Button>
            {stats.available > 1 && (
              <Button 
                size="sm" 
                onClick={handleAddAllToCart} 
                className="gap-1 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="text-xs">افزودن همه ({stats.available})</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20 gap-1 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-error-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">پاک کردن</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - با تاخیرهای Staggered */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 hover:border-error-200 dark:hover:border-error-800 hover:shadow-lg dark:shadow-black/30 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-error-500 to-error-600 dark:from-error-600 dark:to-error-700 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">کل</span>
            </div>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{stats.total}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 hover:border-success-200 dark:hover:border-success-800 hover:shadow-lg dark:shadow-black/30 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 dark:from-success-600 dark:to-success-700 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">موجود</span>
            </div>
            <p className="text-lg font-black text-success-600 dark:text-success-400">{stats.available}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg dark:shadow-black/30 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">ارزش کل</span>
            </div>
            <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{formatPrice(stats.totalValue)}</p>
          </div>

          {stats.totalDiscount > 0 && (
            <div className="bg-gradient-to-br from-error-500 to-accent-500 dark:from-error-600 dark:to-accent-600 rounded-xl p-3 text-white shadow-md hover:shadow-xl dark:shadow-black/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] text-white/90 font-medium">صرفه‌جویی</span>
              </div>
              <p className="text-sm font-black truncate">{formatPrice(stats.totalDiscount)}</p>
            </div>
          )}
        </div>

        {/* Products Grid - با SafeImage و میکرواینترکشن‌های کامل */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((product, idx) => {
            const discountPercent = product.compare_price && product.compare_price > product.price
              ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl dark:shadow-black/30 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-2 hover:scale-[1.02]"
                onClick={() => navigate(`/products/${product.slug}`)}
                style={{ animationDelay: `${idx * 50}ms` }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${product.slug}`)}
              >
                {/* Image Container با SafeImage */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                  <SafeImage
                    src={product.main_image}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 ease-out"
                    fallbackEmoji="📦"
                    showEmojiOnError
                  />

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {discountPercent > 0 && (
                      <Badge variant="error" size="sm" className="shadow-md animate-in slide-in-from-top-1">
                        <Flame className="w-2.5 h-2.5" />
                        {discountPercent}٪
                      </Badge>
                    )}
                    {product.stock === 0 && (
                      <Badge variant="gray" size="sm" className="shadow-md animate-in slide-in-from-top-1">
                        <X className="w-2.5 h-2.5" />
                      </Badge>
                    )}
                  </div>

                  {/* Remove Button - با منطقه ضربه بزرگ‌تر برای موبایل */}
                  <button
                    onClick={(e) => handleRemove(e, product)}
                    className="absolute top-2 left-2 w-9 h-9 bg-white dark:bg-slate-700 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-error-500 hover:text-white hover:scale-110 active:scale-95 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-error-500 z-10"
                    aria-label="حذف از علاقه‌مندی‌ها"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Hover Overlay - با انیمیشن ورود */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-3">
                    <div className="flex gap-1.5 animate-in slide-in-from-bottom-2 duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${product.slug}`);
                        }}
                        className="w-9 h-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-300 shadow-lg hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary-500"
                        aria-label="مشاهده سریع"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {product.stock > 0 && (
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="w-9 h-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-success-600 hover:text-white transition-all duration-300 shadow-lg hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-success-500"
                          aria-label="افزودن به سبد"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-2.5">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs line-clamp-2 mb-1.5 min-h-[2rem] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    {product.name}
                  </h3>

                  {/* Rating - با انیمیشن hover */}
                  {product.rating && product.rating > 0 && (
                    <div className="flex items-center gap-0.5 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-3 h-3 transition-all duration-200',
                              star <= Math.round(product.rating!)
                                ? 'text-warning-400 fill-warning-400 hover:scale-110'
                                : 'text-gray-300 dark:text-slate-600'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">({product.reviews_count})</span>
                    </div>
                  )}

                  {/* Price Section */}
                  <div className="flex items-end justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col">
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through decoration-error-500/50">
                          {formatPrice(product.compare_price)}
                        </span>
                      )}
                      <span className="text-sm font-black text-primary-700 dark:text-primary-400">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    {product.stock > 0 ? (
                      <Button
                        size="xs"
                        onClick={(e) => handleAddToCart(e, product)}
                        className="gap-0.5 hover:scale-[1.05] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span className="text-[10px]">خرید</span>
                      </Button>
                    ) : (
                      <Badge variant="gray" size="sm" className="animate-in fade-in">ناموجود</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA - با گرادینت جذاب */}
        <div className="mt-8 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/20 dark:via-slate-800 dark:to-accent-900/20 border-2 border-primary-100 dark:border-primary-800 rounded-2xl p-6 text-center hover:shadow-lg dark:shadow-black/30 transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 dark:from-primary-600 dark:to-accent-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg animate-float">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-1.5">هنوز محصولات بیشتری کشف نکرده‌اید!</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-lg mx-auto">هزاران محصول دیگر با تخفیف‌های ویژه در انتظار شماست.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button 
              size="md" 
              onClick={() => navigate('/products')}
              className="hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              مشاهده همه محصولات
              <ArrowLeft className="w-4 h-4 mr-1.5" />
            </Button>
            <Button 
              variant="outline" 
              size="md" 
              onClick={() => navigate('/')}
              className="hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              بازگشت به صفحه اصلی
            </Button>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal - با backdrop blur */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-black/50 max-w-sm w-full p-6 animate-in scale-in duration-200" role="dialog" aria-modal="true">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-error-500 dark:bg-error-600 rounded-full blur-2xl opacity-20 animate-pulse-soft" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-error-500 to-error-600 dark:from-error-600 dark:to-error-700 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100 text-center mb-1.5">پاک کردن همه علاقه‌مندی‌ها</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-4 leading-relaxed">
              آیا مطمئن هستید که می‌خواهید تمام {stats.total} محصول را حذف کنید؟ این عملیات قابل بازگشت نیست.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" 
                size="md" 
                onClick={() => setShowClearConfirm(false)}
              >
                انصراف
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-error-500" 
                size="md" 
                onClick={handleClearAll}
              >
                <Trash2 className="w-4 h-4 ml-1.5" />
                پاک کردن
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WishlistPage;