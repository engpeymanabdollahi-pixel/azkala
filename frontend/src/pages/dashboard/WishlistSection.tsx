import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Flame, Loader2, Store, UserX } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import toast from 'react-hot-toast';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export function WishlistSection() {
  const navigate = useNavigate();
  const { items, removeItem, clearWishlist, syncFromApi, isSyncing } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  
  // State برای فروشگاه‌های دنبال‌شده
  const [followedSellers, setFollowedSellers] = useState<any[]>([]);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);

  // 🆕 Sync از API هنگام لود
  useEffect(() => {
    if (isAuthenticated && items.length === 0) {
      syncFromApi();
    }
    if (isAuthenticated) {
      fetchFollowedSellers();
    }
  }, [isAuthenticated]);

  const fetchFollowedSellers = async () => {
    setIsLoadingSellers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/user/followed-sellers`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const result = await res.json();
        setFollowedSellers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching followed sellers:', error);
    } finally {
      setIsLoadingSellers(false);
    }
  };

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

  if (items.length === 0 && followedSellers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState
          icon={<Heart className="w-12 h-12" />}
          title="علاقه‌مندی‌های شما خالی است"
          description="محصولات یا فروشگاه‌های مورد علاقه خود را اضافه کنید"
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
    <div className="space-y-6">
      {/* بخش محصولات مورد علاقه */}
      {items.length > 0 && (
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
            <Button variant="outline" onClick={() => navigate('/wishlist')} className="w-full">
              مشاهده همه محصولات ({items.length})
            </Button>
          )}
        </div>
      )}

      {/* بخش فروشگاه‌های دنبال‌شده */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary-500 fill-primary-500" />
            <h3 className="font-black text-gray-900">
              فروشگاه‌های دنبال‌شده
            </h3>
          </div>
        </div>

        {isLoadingSellers ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : followedSellers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {followedSellers.slice(0, 4).map((seller: any) => (
              <div
                key={seller.id}
                onClick={() => navigate(`/seller/${seller.slug}`)}
                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 overflow-hidden flex-shrink-0">
                  {seller.logo ? (
                    <img src={seller.logo} alt={seller.shop_name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{seller.shop_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Store className="w-3 h-3" /> {seller.products_count} محصول
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {seller.followers_count.toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <UserX className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">هنوز فروشگاهی را دنبال نکرده‌اید.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="mt-3">
              کشف فروشگاه‌ها
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
export default WishlistSection;
