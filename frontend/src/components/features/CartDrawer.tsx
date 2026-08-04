import { ShoppingCart, X, Trash2, Plus, Minus, ArrowLeft, Package } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { FreeShippingProgress } from '@/components/features/FreeShippingProgress';
import { useCartApi } from '@/hooks/api/useCartApi';
import toast from 'react-hot-toast';

interface CartDrawerProps {
  onCheckout?: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  // removeItem/updateQuantity از store دیگر مستقیم صدا زده نمی‌شوند؛ useCartApi
  // آن‌ها را با Optimistic UI و rollback پوشش می‌دهد.
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    getSubtotal,
    getItemCount,
    getTotal, // ✅ اضافه شد برای محاسبه نوار پیشرفت
  } = useCartStore();
  
  // استفاده از هوک TanStack Query برای Optimistic UI
  const { removeFromCart, updateQuantity } = useCartApi();

  if (!isDrawerOpen) return null;

  const subtotal = getSubtotal();
  const total = getTotal(); // ✅ مقدار کل برای نوار پیشرفت
  const itemCount = getItemCount();

  // Handlerهای بهینه‌شده با Optimistic UI
  const handleRemoveItem = (itemId: number) => {
    removeFromCart(itemId, {
      onSuccess: () => {
        // Zustand به صورت خودکار sync می‌شود
      },
      onError: () => {
        toast.error('خطا در حذف محصول');
      },
    });
  };

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    updateQuantity({ itemId, quantity: newQuantity });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={closeDrawer}
      />

      <div className="fixed left-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-left">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">سبد خرید</h2>
              {itemCount > 0 && (
                <p className="text-xs text-gray-500">{itemCount} محصول</p>
              )}
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:rotate-90 text-gray-500 hover:text-gray-700"
            aria-label="بستن سبد خرید"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12" />}
              title="سبد خرید خالی است"
              description="محصولات مورد نظر خود را به سبد اضافه کنید و از خرید لذت ببرید"
              action={
                <Button variant="primary" onClick={closeDrawer}>
                  مشاهده محصولات
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {/* ✅ اضافه شدن نوار پیشرفت ارسال رایگان */}
              <FreeShippingProgress currentTotal={total} />

              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="flex gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:border-primary-300 hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center border border-gray-100 dark:border-slate-600">
                    <SafeImage
                      src={item.product.main_image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      fallbackEmoji="📦"
                      showEmojiOnError
                      aspectRatio="square"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-relaxed">
                      {item.product.name}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-md bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center hover:bg-primary-50 dark:hover:bg-slate-500 hover:text-primary-600 transition-all active:scale-95 text-gray-700 dark:text-gray-200"
                          aria-label="کاهش تعداد"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-md bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center hover:bg-primary-50 dark:hover:bg-slate-500 hover:text-primary-600 transition-all active:scale-95 text-gray-700 dark:text-gray-200"
                          aria-label="افزایش تعداد"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg transition-all active:scale-95 text-gray-400 hover:text-error-500 dark:hover:text-error-400"
                          aria-label="حذف محصول"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-gradient-to-t from-gray-50 to-white dark:from-slate-800 dark:to-slate-900">
            {/* خلاصه قیمت */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">جمع کل محصولات:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">هزینه ارسال:</span>
                <Badge variant="success" size="sm">رایگان</Badge>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-700">
                <span className="font-bold text-gray-900 dark:text-gray-100">مبلغ قابل پرداخت:</span>
                {/* total نه subtotal: getTotal مالیات و ارسال و تخفیف را هم لحاظ می‌کند */}
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full active:scale-[0.98] transition-transform"
              rightIcon={<ArrowLeft className="w-5 h-5" />}
              onClick={() => {
                closeDrawer();
                onCheckout?.();
              }}
            >
              تکمیل خرید
            </Button>

            <button
              onClick={closeDrawer}
              className="w-full mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              ادامه خرید
            </button>
          </div>
        )}
      </div>
    </>
  );
}