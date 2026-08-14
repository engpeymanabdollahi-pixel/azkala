import { useNavigate } from 'react-router-dom';
import { Store, Star, Package, ShoppingBag, BadgeCheck, ChevronLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/utils/cn';

/**
 * داده‌های فروشنده برای SellerInfoCard
 * مطابق ساختار product.seller از API
 */
export interface SellerInfoCardData {
  id: number;
  shop_name: string;
  slug?: string;
  avatar?: string | null;
  is_verified?: boolean;
  rating?: number | null;
  products_count?: number | null;
  total_sales?: number | null;
}

/**
 * Props برای SellerInfoCard
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 */
export interface SellerInfoCardProps {
  /** اطلاعات فروشنده */
  seller: SellerInfoCardData;
  /** ID محصول فعلی (برای chat context) */
  productId?: number;
  /** کلاس اضافی */
  className?: string;
  /** Callback برای کلیک روی Chat */
  onChat?: () => void;
  /** Callback برای کلیک روی View Store */
  onViewStore?: () => void;
  /** Callback برای کلیک روی Avatar/Name (default: navigate to store) */
  onAvatarClick?: () => void;
}

/**
 * SellerInfoCard - Marketplace Component
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * کامپوننت اختصاصی برای نمایش اطلاعات فروشنده در ProductDetailPage
 * 
 * قابلیت‌ها:
 * - آواتار قابل کلیک (با fallback icon)
 * - نام فروشگاه + Verified badge
 * - ۳ آمار در grid (Rating, Products, Sales)
 * - ۲ دکمه (Chat + View Store)
 * - Presentation-only (business logic در parent)
 * - RTL + Dark mode + Vazirmatn
 * 
 * مثال:
 * ```tsx
 * <SellerInfoCard
 *   seller={product.seller}
 *   productId={product.id}
 *   onChat={handleChat}
 *   onViewStore={() => navigate(`/seller/${seller.slug}`)}
 * />
 * ```
 */
export function SellerInfoCard({
  seller,
  productId,
  className,
  onChat,
  onViewStore,
  onAvatarClick,
}: SellerInfoCardProps) {
  const navigate = useNavigate();

  // Default handlers (اگر callback پاس داده نشده باشد، به store page می‌رویم)
  const handleAvatarClick = onAvatarClick || (() => {
    if (seller.slug) {
      navigate(`/seller/${seller.slug}`);
    }
  });

  const handleViewStore = onViewStore || (() => {
    if (seller.slug) {
      navigate(`/seller/${seller.slug}`);
    }
  });

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900',
        'border-2 border-primary-200 dark:border-primary-800',
        'rounded-xl p-4 shadow-md hover:shadow-lg transition-all',
        'font-sans',
        className
      )}
    >
      {/* Header: Avatar + Name + Verified */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar (clickable) */}
        <button
          type="button"
          onClick={handleAvatarClick}
          className="w-14 h-14 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden hover:scale-105 transition-transform group"
          aria-label={`مشاهده فروشگاه ${seller.shop_name}`}
        >
          {seller.avatar ? (
            <SafeImage
              src={seller.avatar}
              alt={seller.shop_name}
              className="w-full h-full object-cover"
              fallbackEmoji="🏪"
            />
          ) : (
            <Store className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Name + Verified */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="font-black text-gray-900 dark:text-gray-100 text-base truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1 group text-right font-sans"
            >
              {seller.shop_name}
              <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary-600 dark:text-primary-400" />
            </button>

            {seller.is_verified && (
              <Badge variant="success" size="sm" className="text-[10px] font-sans">
                <BadgeCheck className="w-3 h-3 ml-0.5" />
                تأیید شده
              </Badge>
            )}
          </div>

          {/* Stats Grid (3 columns) */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {/* Rating */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Star className="w-3.5 h-3.5 text-warning-400 fill-warning-400" />
                <span className="font-black text-gray-900 dark:text-gray-100 text-sm font-sans">
                  {(seller.rating ?? 0).toFixed(1)}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-sans">امتیاز</p>
            </div>

            {/* Products Count */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Package className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
                <span className="font-black text-gray-900 dark:text-gray-100 text-sm font-sans">
                  {seller.products_count ?? 0}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-sans">محصول</p>
            </div>

            {/* Total Sales */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <ShoppingBag className="w-3.5 h-3.5 text-success-500 dark:text-success-400" />
                <span className="font-black text-gray-900 dark:text-gray-100 text-sm font-sans">
                  {seller.total_sales ?? 0}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-sans">فروش</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (2 columns) */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onChat}
          className="font-bold gap-1.5 font-sans"
          aria-label="چت با فروشنده"
        >
          <MessageCircle className="w-4 h-4" />
          چت با فروشنده
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleViewStore}
          className="font-bold gap-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-700 transition-all font-sans"
          aria-label="مشاهده شعبه"
        >
          <Store className="w-4 h-4" />
          مشاهده شعبه
        </Button>
      </div>
    </div>
  );
}