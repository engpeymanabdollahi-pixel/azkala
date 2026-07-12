import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Flame, Loader2 } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import toast from 'react-hot-toast';

export function WishlistSection() {
  const navigate = useNavigate();
  const { items, removeItem, clearWishlist, syncFromApi, isSyncing } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // 🆕 Sync از API هنگام لود
  useEffect(() => {
    if (isAuthenticated && items.length === 0) {
      syncFromApi();
    }
  }, [isAuthenticated]);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (product.stock === 0) { 
      toast.error('محصول موجود نیست'); 
      return; 
    }
    addItem(product, 1);
    toast.success('به سبد اضافه شد', { icon: '🛒' });
  };

  const handleRemove = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    removeItem(product.id);
    toast.success('حذف شد', { icon: '🗑️' });
  };

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="mr-2 text-sm text-gray-600">در حال بارگذاری...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState
          icon={<Heart className="w-12 h-12" />}
          title="علاقه‌مندی‌های شما خالی است"
          description="محصولات مورد علاقه خود را اضافه کنید"
          action={
            <Button onClick={() => navigate('/products')} size="md">
              مشاهده محصولات
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-error-500 fill-error-500" />
          <h3 className="font-black text-gray-900">
            {items.length} محصول مورد علاقه
          </h3>
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            if (window.confirm('همه محصولات از علاقه‌مندی‌ها حذف شوند؟')) {
              clearWishlist();
              toast.success('همه حذف شدند');
            }
          }}
          className="text-error-600"
        >
          <Trash2 className="w-3 h-3" />
          <span className="text-[10px]">حذف همه</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.slice(0, 4).map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/products/${product.slug}`)}
            className="bg-white rounded-xl border border-gray-100 p-3 hover:border-primary-200 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex gap-2">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.main_image ? (
                  <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Heart className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-xs line-clamp-2 mb-1">
                  {product.name}
                </p>
                <div className="flex items-center gap-1 mb-1">
                  {product.stock === 0 ? (
                    <Badge variant="error" size="sm">ناموجود</Badge>
                  ) : (
                    <Badge variant="success" size="sm">موجود</Badge>
                  )}
                  {product.discount > 0 && (
                    <Badge variant="error" size="sm">
                      <Flame className="w-2.5 h-2.5" />
                      {product.discount}٪
                    </Badge>
                  )}
                </div>
                <p className="font-black text-primary-700 text-sm">
                  {formatPrice(product.price)}
                  <span className="text-[10px] text-gray-500 mr-1">تومان</span>
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100">
              <Button
                size="xs"
                variant="outline"
                onClick={(e) => handleAddToCart(e, product)}
                disabled={product.stock === 0}
                className="flex-1 gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                <span className="text-[10px]">افزودن به سبد</span>
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => handleRemove(e, product)}
                className="text-error-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 4 && (
        <Button
          variant="outline"
          onClick={() => navigate('/wishlist')}
          className="w-full"
        >
          مشاهده همه ({items.length} محصول)
        </Button>
      )}
    </div>
  );
}