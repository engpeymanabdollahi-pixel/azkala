import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Star, Package, Heart, MessageCircle, CheckCircle, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import toast from 'react-hot-toast';

/**
 * SellerCard - Marketplace Component
 *
 * بر اساس Design System ازکالا (سند مرجع بخش ۸)
 * هویت واقعی Design System ازکالا برای نمایش فروشندگان
 *
 * Features:
 * - ۴ Variant: default, compact, horizontal, featured
 * - States: Default, Hover, Loading, Verified, Featured, Suspended
 * - Actions: Follow/Unfollow, Visit Shop, Chat
 * - RTL-first + Dark mode
 * - Design Tokens ازکالا (نه hardcode)
 * - Mobile-first responsive
 */

// ==================== Types ====================

export type SellerCardVariant = 'default' | 'compact' | 'horizontal' | 'featured';

/**
 * SellerData - هماهنگ با PublicSellerResource در backend
 *
 * فیلدهای واقعی که از `/api/v1/sellers/top` و `/api/v1/sellers/{slug}` برمی‌گردد:
 * id, user_id, shop_name, slug, display_title, logo, banner, description,
 * status, rating, reviews_count, products_count, orders_count, followers_count,
 * is_followed_by_current_user, verified_at, created_at, updated_at
 */
export interface SellerData {
  id: number;
  user_id: number;
  shop_name: string;
  slug: string;
  display_title?: string;
  logo?: string | null;
  banner?: string | null;
  description?: string | null;
  status: 'active' | 'pending' | 'suspended';
  rating?: number;
  reviews_count?: number;
  products_count?: number;
  orders_count?: number;
  followers_count?: number;
  is_followed_by_current_user?: boolean;
  verified_at?: string | null;
}

export interface SellerCardProps {
  seller: SellerData;
  variant?: SellerCardVariant;
  onFollow?: (sellerId: number) => Promise<void> | void;
  onUnfollow?: (sellerId: number) => Promise<void> | void;
  onChat?: (sellerId: number) => void;
  showActions?: boolean;
  showStats?: boolean;
  showDescription?: boolean;
  className?: string;
  index?: number;
}

// ==================== Sub-components ====================

/**
 * VerifiedBadge - نشان تأیید فروشنده
 * هماهنگ با Badge موفق در ProductCard
 */
function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <Badge
      variant="success"
      size={compact ? 'sm' : 'md'}
      className={cn(
        'flex items-center gap-1 shadow-sm',
        compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px]'
      )}
    >
      <CheckCircle className={cn(compact ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      تأیید شده
    </Badge>
  );
}

/**
 * TopSellerBadge - نشان فروشنده برتر
 * برای seller های با followers > 1000
 */
function TopSellerBadge({ compact = false }: { compact?: boolean }) {
  return (
    <Badge
      variant="accent"
      size={compact ? 'sm' : 'md'}
      className={cn(
        'flex items-center gap-1 shadow-sm',
        compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px]'
      )}
    >
      <Award className={cn(compact ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      برتر
    </Badge>
  );
}

/**
 * SellerStats - آمار فروشنده
 * طراحی Material Design 3 inspired
 */
function SellerStats({ seller, compact = false }: { seller: SellerData; compact?: boolean }) {
  const stats = [
    seller.rating !== undefined && seller.rating > 0 && {
      icon: Star,
      value: seller.rating.toFixed(1),
      iconColor: 'text-warning-400 fill-warning-400',
      valueColor: 'text-gray-900 dark:text-gray-100 font-bold',
    },
    seller.products_count !== undefined && {
      icon: Package,
      value: formatNumber(seller.products_count),
      iconColor: 'text-primary-500 dark:text-primary-400',
      valueColor: 'text-gray-700 dark:text-gray-300',
    },
    seller.followers_count !== undefined && seller.followers_count > 0 && {
      icon: Heart,
      value: formatNumber(seller.followers_count),
      iconColor: 'text-error-500',
      valueColor: 'text-gray-700 dark:text-gray-300',
    },
  ].filter(Boolean);

  if (stats.length === 0) return null;

  return (
    <div className={cn(
      'flex items-center justify-center gap-3',
      compact ? 'text-[10px]' : 'text-xs'
    )}>
      {stats.map((stat, i) => {
        if (!stat) return null;
        const Icon = stat.icon;
        return (
          <div key={i} className="flex items-center gap-1">
            <Icon className={cn(
              stat.iconColor,
              compact ? 'w-3 h-3' : 'w-3.5 h-3.5'
            )} />
            <span className={stat.valueColor}>{stat.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Main Component ====================

export const SellerCard = memo(function SellerCard({
  seller,
  variant = 'default',
  onFollow,
  onUnfollow,
  onChat,
  showActions = true,
  showStats = true,
  showDescription = false,
  className,
  index = 0,
}: SellerCardProps) {
  const navigate = useNavigate();
  const [isFollowed, setIsFollowed] = useState(seller.is_followed_by_current_user || false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // ==================== Computed Values ====================
  const isVerified = !!seller.verified_at;
  const isSuspended = seller.status === 'suspended';
  const isTopSeller = (seller.followers_count || 0) > 1000;

  // ==================== Handlers ====================
  const handleVisitShop = () => {
    if (isSuspended) return;
    navigate(`/seller/${seller.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isSuspended) {
      e.preventDefault();
      handleVisitShop();
    }
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSuspended || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowed) {
        await onUnfollow?.(seller.id);
        setIsFollowed(false);
        toast.success(`دنبال کردن ${seller.shop_name} متوقف شد`, { icon: '💔' });
      } else {
        await onFollow?.(seller.id);
        setIsFollowed(true);
        toast.success(`${seller.shop_name} را دنبال کردید`, { icon: '❤️' });
      }
    } catch (error) {
      toast.error('خطا در عملیات');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChat?.(seller.id);
  };

  // ==================== Styles ====================

  // Border radius مطابق Design Token ازکالا (section 6 سند مرجع)
  // Cards → 12px, Featured → 16px
  const baseCardClasses = cn(
    'group relative bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300',
    'border border-gray-200 dark:border-slate-700',
    'hover:border-primary-300 dark:hover:border-primary-700',
    'hover:shadow-xl dark:hover:shadow-black/40',
    'hover:-translate-y-1',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
    'animate-in fade-in slide-in-from-bottom-2',
    // Variant-specific radius (از Design Tokens ازکالا)
    variant === 'default' && 'rounded-xl p-5 text-center',
    variant === 'compact' && 'rounded-lg p-3 text-center',
    variant === 'horizontal' && 'rounded-xl p-4 flex flex-row text-right',
    variant === 'featured' && 'rounded-2xl p-6 text-center border-2 border-primary-200 dark:border-primary-800 shadow-lg',
    // Suspended state
    isSuspended && 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-none',
    className
  );

  // Stagger animation delay برای لیست‌ها
  const staggerStyle = index > 0 ? { animationDelay: `${index * 50}ms` } : undefined;

  // ==================== Render Helpers ====================

  const renderLogo = () => {
    const sizeClasses = {
      compact: 'w-12 h-12',
      default: 'w-16 h-16',
      horizontal: 'w-16 h-16 flex-shrink-0 ml-4',
      featured: 'w-20 h-20',
    };

    return (
      <div className={cn(
        'relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30',
        'flex items-center justify-center group-hover:scale-110 transition-transform duration-300',
        'shadow-md',
        sizeClasses[variant],
        variant === 'horizontal' ? 'mb-0 mx-0' : 'mx-auto mb-3'
      )}>
        {seller.logo ? (
          <SafeImage
            src={seller.logo}
            alt={seller.shop_name}
            className="w-full h-full object-cover"
            fallbackEmoji="🏪"
            showEmojiOnError
          />
        ) : (
          <Store className={cn(
            'text-primary-500 dark:text-primary-400',
            variant === 'compact' ? 'w-6 h-6' : variant === 'featured' ? 'w-10 h-10' : 'w-8 h-8'
          )} />
        )}

        {/* Verified Badge Overlay (مطابق Material Design 3 - elevation) */}
        {isVerified && (
          <div className="absolute -bottom-1 -right-1 bg-success-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-slate-800">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  const renderBadges = () => {
    if (!isVerified && !isTopSeller) return null;

    return (
      <div className={cn(
        'flex items-center justify-center gap-1 mb-2 flex-wrap',
        variant === 'horizontal' && 'justify-start'
      )}>
        {isVerified && <VerifiedBadge compact={variant === 'compact'} />}
        {isTopSeller && <TopSellerBadge compact={variant === 'compact'} />}
      </div>
    );
  };

  const renderContent = () => {
    return (
      <div className={cn(
        'flex flex-col',
        variant === 'horizontal' && 'flex-1 min-w-0'
      )}>
        {/* Shop Name */}
        <h3 className={cn(
          'font-bold text-gray-900 dark:text-white truncate transition-colors',
          'group-hover:text-primary-600 dark:group-hover:text-primary-400',
          variant === 'compact' ? 'text-xs mb-1' : variant === 'featured' ? 'text-lg mb-2' : 'text-sm mb-2',
          variant === 'horizontal' && 'text-right'
        )} title={seller.shop_name}>
          {seller.shop_name}
        </h3>

        {/* Description (only featured) */}
        {showDescription && variant === 'featured' && seller.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {seller.description}
          </p>
        )}

        {/* Badges */}
        {renderBadges()}

        {/* Stats */}
        {showStats && (
          <div className={cn(
            variant === 'compact' ? 'mb-2' : 'mb-3'
          )}>
            <SellerStats seller={seller} compact={variant === 'compact'} />
          </div>
        )}

        {/* Spacer for pushing actions to bottom */}
        {variant !== 'compact' && <div className="flex-1" />}

        {/* Actions */}
        {showActions && !isSuspended && (
          <div className={cn(
            variant === 'compact' && 'mt-2',
            variant === 'horizontal' && 'flex items-center gap-2',
            variant === 'default' && 'flex items-center justify-center gap-2 mt-3',
            variant === 'featured' && 'flex items-center justify-center gap-2 mt-4'
          )}>
            {variant !== 'compact' && (
              <>
                <Button
                  size="sm"
                  variant={isFollowed ? 'outline' : 'default'}
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={cn(
                    'flex-1',
                    variant === 'horizontal' && 'flex-initial'
                  )}
                >
                  <Heart className={cn('w-3.5 h-3.5 ml-1', isFollowed && 'fill-current')} />
                  {isFollowed ? 'دنبال شده' : 'دنبال کردن'}
                </Button>

                {onChat && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleChat}
                    aria-label="چت با فروشنده"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
              </>
            )}

            {variant === 'compact' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={handleVisitShop}
              >
                <ExternalLink className="w-3 h-3 ml-1" />
                مشاهده فروشگاه
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== Main Render ====================

  return (
    <div
      className={baseCardClasses}
      style={staggerStyle}
      onClick={handleVisitShop}
      role="button"
      aria-label={`فروشگاه ${seller.shop_name}`}
      tabIndex={isSuspended ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* Banner (only for featured variant) */}
      {variant === 'featured' && seller.banner && (
        <div className="absolute inset-x-0 top-0 h-24 overflow-hidden pointer-events-none">
          <SafeImage
            src={seller.banner}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-slate-800" />
        </div>
      )}

      {renderLogo()}
      {renderContent()}

      {/* Suspended Overlay */}
      {isSuspended && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-900 dark:text-white shadow-xl">
            غیرفعال
          </div>
        </div>
      )}
    </div>
  );
});

SellerCard.displayName = 'SellerCard';

export default SellerCard;