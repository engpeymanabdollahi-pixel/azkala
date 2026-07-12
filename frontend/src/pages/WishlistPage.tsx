import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingCart, Trash2, ArrowLeft, Sparkles, Flame,
  Star, Package, ShoppingBag, Eye, CheckCircle, X, Gift, Loader2,
} from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function WishlistPage() {
  const navigate = useNavigate();
  const { items, removeItem, clearWishlist, syncFromApi, isSyncing } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 🆕 Sync از API هنگام لود
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

  // 🆕 Loading State
  if (isSyncing && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">در حال بارگذاری علاقه‌مندی‌ها...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <EmptyState
            icon={<Heart className="w-12 h-12" />}
            title="علاقه‌مندی‌های شما خالی است"
            description="محصولاتی که دوست دارید را با کلیک روی آیکون قلب به اینجا اضافه کنید"
            action={
              <div className="flex flex-col gap-2 w-full">
                <Button onClick={() => navigate('/products')} size="md" className="w-full">
                  مشاهده محصولات
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} size="md" className="w-full">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-3 md:px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-error-500 to-error-600 rounded-xl flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900">علاقه‌مندی‌های من</h1>
              <p className="text-gray-600 text-xs mt-0.5">{stats.total} محصول در لیست</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">پروفایل</span>
            </Button>
            {stats.available > 1 && (
              <Button size="sm" onClick={handleAddAllToCart} className="gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="text-xs">افزودن همه ({stats.available})</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-error-600 hover:bg-error-50 gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">پاک کردن</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          <div className="bg-white rounded-xl p-3 border border-gray-100 hover:border-error-200 hover:shadow-md transition-all group animate-fade-in">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-error-500 to-error-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-[10px] text-gray-600 font-medium">کل</span>
            </div>
            <p className="text-lg font-black text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-100 hover:border-success-200 hover:shadow-md transition-all group animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-gray-600 font-medium">موجود</span>
            </div>
            <p className="text-lg font-black text-success-600">{stats.available}</p>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-gray-600 font-medium">ارزش کل</span>
            </div>
            <p className="text-sm font-black text-gray-900 truncate">{formatPrice(stats.totalValue)}</p>
          </div>

          {stats.totalDiscount > 0 && (
            <div className="bg-gradient-to-br from-error-500 to-accent-500 rounded-xl p-3 text-white shadow-md animate-fade-in" style={{ animationDelay: '150ms' }}>
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

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((product, idx) => {
            const discountPercent = product.compare_price && product.compare_price > product.price
              ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
                onClick={() => navigate(`/products/${product.slug}`)}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <img
                    src={product.main_image}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<div class="w-full h-full flex items-center justify-center text-5xl">📦</div>';
                    }}
                  />

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {discountPercent > 0 && (
                      <Badge variant="error" size="sm" className="shadow-md">
                        <Flame className="w-2.5 h-2.5" />
                        {discountPercent}٪
                      </Badge>
                    )}
                    {product.stock === 0 && (
                      <Badge variant="gray" size="sm" className="shadow-md">
                        <X className="w-2.5 h-2.5" />
                      </Badge>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(e, product)}
                    className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-error-500 hover:text-white hover:scale-110"
                    aria-label="حذف از علاقه‌مندی‌ها"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${product.slug}`);
                        }}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-lg hover:scale-110"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {product.stock > 0 && (
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-success-600 hover:text-white transition-all shadow-lg hover:scale-110"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <h3 className="font-bold text-gray-900 text-xs line-clamp-2 mb-1.5 min-h-[2rem] group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  {product.rating && product.rating > 0 && (
                    <div className="flex items-center gap-0.5 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-3 h-3',
                              star <= Math.round(product.rating!)
                                ? 'text-warning-400 fill-warning-400'
                                : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500">({product.reviews_count})</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-end justify-between pt-2 border-t border-gray-100">
                    <div className="flex flex-col">
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-[10px] text-gray-400 line-through">
                          {formatPrice(product.compare_price)}
                        </span>
                      )}
                      <span className="text-sm font-black text-primary-700">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    {product.stock > 0 ? (
                      <Button
                        size="xs"
                        onClick={(e) => handleAddToCart(e, product)}
                        className="gap-0.5"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span className="text-[10px]">خرید</span>
                      </Button>
                    ) : (
                      <Badge variant="gray" size="sm">ناموجود</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 bg-gradient-to-br from-primary-50 via-white to-accent-50 border-2 border-primary-100 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1.5">هنوز محصولات بیشتری کشف نکرده‌اید!</h3>
          <p className="text-gray-600 text-sm mb-4 max-w-lg mx-auto">هزاران محصول دیگر در انتظار شماست.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button size="md" onClick={() => navigate('/products')}>
              مشاهده همه محصولات
              <ArrowLeft className="w-4 h-4 mr-1.5" />
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate('/')}>
              بازگشت به صفحه اصلی
            </Button>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-error-500 rounded-full blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-error-500 to-error-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-base font-black text-gray-900 text-center mb-1.5">پاک کردن همه علاقه‌مندی‌ها</h3>
            <p className="text-gray-600 text-center text-sm mb-4 leading-relaxed">
              آیا مطمئن هستید که می‌خواهید تمام {stats.total} محصول را حذف کنید؟
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" size="md" onClick={() => setShowClearConfirm(false)}>
                انصراف
              </Button>
              <Button variant="danger" className="flex-1" size="md" onClick={handleClearAll}>
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