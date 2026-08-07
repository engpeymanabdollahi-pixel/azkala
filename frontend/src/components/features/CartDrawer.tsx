import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Package } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/utils/format';
import { FreeShippingProgress } from '@/components/features/FreeShippingProgress';
import { useCartApi } from '@/hooks/api/useCartApi';
import toast from 'react-hot-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/Sheet';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/Separator';

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
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="left" className="w-full max-w-md p-0 gap-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border bg-gradient-to-r from-primary-50 to-white dark:from-primary-950 dark:to-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <SheetTitle className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                سبد خرید
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {itemCount > 0 ? `${itemCount} محصول` : 'خالی'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {items.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12 text-muted-foreground" />}
              title="سبد خرید خالی است"
              description="محصولات مورد نظر خود را به سبد اضافه کنید و از خرید لذت ببرید"
              action={
                <Button variant="default" onClick={closeDrawer}>
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
                  className="flex gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted dark:bg-muted/50 flex-shrink-0 flex items-center justify-center border border-border">
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
                    <p className="text-sm font-semibold text-foreground line-clamp-2 leading-relaxed">
                      {item.product.name}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-muted dark:bg-muted/50 rounded-lg p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-md bg-background dark:bg-muted shadow-sm flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 text-muted-foreground"
                          aria-label="کاهش تعداد"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-foreground min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-md bg-background dark:bg-muted shadow-sm flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 text-muted-foreground"
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
                          className="p-1.5 hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-lg transition-all active:scale-95 text-muted-foreground hover:text-destructive dark:hover:text-destructive/80"
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
        </ScrollArea>

        {/* Footer */}
        {items.length > 0 && (
          <SheetFooter className="p-5 border-t border-border bg-gradient-to-t from-muted/50 to-background dark:from-muted dark:to-background flex-shrink-0">
            <div className="w-full space-y-3">
              {/* خلاصه قیمت */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">جمع کل محصولات:</span>
                  <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">هزینه ارسال:</span>
                  <Badge variant="success" size="sm">رایگان</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">مبلغ قابل پرداخت:</span>
                  {/* total نه subtotal: getTotal مالیات و ارسال و تخفیف را هم لحاظ می‌کند */}
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                variant="default"
                size="lg"
                className="w-full active:scale-[0.98] transition-transform"
                onClick={() => {
                  closeDrawer();
                  onCheckout?.();
                }}
              >
                تکمیل خرید
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>

              <button
                onClick={closeDrawer}
                className="w-full text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
              >
                ادامه خرید
              </button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}