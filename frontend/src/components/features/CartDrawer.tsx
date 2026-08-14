import { ShoppingCart, X, Trash2, Plus, Minus, ArrowLeft, Package, Truck, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { FreeShippingProgress } from '@/components/features/FreeShippingProgress';
import { useCartApi } from '@/hooks/api/useCartApi';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

interface CartDrawerProps {
  onCheckout?: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    getSubtotal,
    getItemCount,
    getTotal,
  } = useCartStore();

  const { removeFromCart, updateQuantity } = useCartApi();

  const subtotal = getSubtotal();
  const total = getTotal();
  const itemCount = getItemCount();

  // بستن با ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen, closeDrawer]);

  // قفل کردن اسکرول body
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleRemoveItem = (productId: number) => {
    removeFromCart(productId, {
      onSuccess: () => toast.success('محصول حذف شد', { icon: '🗑️' }),
      onError: () => toast.error('خطا در حذف محصول', { icon: '❌' }),
    });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    updateQuantity({ itemId: productId, quantity: newQuantity });
  };

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Backdrop - هم‌سطح Header (z-40) */}
      <div
className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[65] animate-fade-in"        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel - بالاتر از Header (z-50) و از top-0 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="سبد خرید"
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col animate-slide-in-right border-l border-gray-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-950 dark:to-slate-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                سبد خرید
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {itemCount > 0 ? `${itemCount} محصول` : 'خالی'}
              </p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all hover:rotate-90 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="بستن سبد خرید"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-xs">
                <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    سبد خرید خالی است
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    هنوز محصولی به سبد خرید اضافه نکرده‌اید. محصولات جذاب ما را مشاهده کنید!
                  </p>
                </div>
                <Button variant="default" size="lg" onClick={closeDrawer} className="w-full">
                  مشاهده محصولات
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
  {/* 🚚 Free Shipping Progress */}
  <FreeShippingProgress currentTotal={total} />
              <div className="mt-2" />

              {items.map((item, index) => (
                <article
                  key={item.id}
                  className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  aria-label={`محصول ${item.product.name}`}
                >
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0 border border-gray-200 dark:border-slate-600">
                      <SafeImage
                        src={item.product.main_image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        fallbackEmoji="📦"
                        showEmojiOnError
                        aspectRatio="square"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-relaxed flex-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                          aria-label={`حذف ${item.product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 border border-gray-200 dark:border-slate-600">
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 text-gray-600 dark:text-gray-300"
                            aria-label="کاهش تعداد"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 min-w-[24px] text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 text-gray-600 dark:text-gray-300"
                            aria-label="افزایش تعداد"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-left">
                          <p className="text-sm font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
                              {formatPrice(item.price)} × {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-200 dark:border-slate-700 bg-gradient-to-t from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <div className="space-y-3">
              {/* خلاصه قیمت */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">جمع محصولات:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">هزینه ارسال:</span>
                  {total >= 500000 ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      رایگان
                    </Badge>
                  ) : (
                    <Badge variant="gray" className="gap-1">
                      <Truck className="h-3 w-3" />
                      محاسبه در پرداخت
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    مبلغ قابل پرداخت:
                  </span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* دکمه تکمیل خرید - سبز با Glow */}
              <button
                onClick={() => {
                  closeDrawer();
                  onCheckout?.();
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 animate-glow-pulse focus:outline-none focus:ring-4 focus:ring-green-500/50"
                aria-label="تکمیل خرید و رفتن به صفحه پرداخت"
              >
                تکمیل خرید
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}