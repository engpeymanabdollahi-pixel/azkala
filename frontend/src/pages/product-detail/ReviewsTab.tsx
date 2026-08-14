/**
 * ReviewsTab - تب نظرات محصولات
 * مطابق Design System ازکالا (بخش ۸: Marketplace Components)
 * 
 * این کامپوننت به صورت Presentation-Only طراحی شده:
 * - همه داده‌ها و handlers از parent (useProductDetail hook) می‌آیند
 * - هیچ useQuery/useMutation داخلی ندارد
 * - Lazy load می‌شود تا initial bundle کوچک‌تر شود
 * 
 * طراحی:
 * - Vazirmatn (font-sans)
 * - RTL-first
 * - Dark mode support
 * - Design Tokens (primary-500, success-500, etc.)
 */

import {
  Star, CheckCircle, MessageCircle, Clock, BadgeCheck,
  ThumbsUp, Reply, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RatingSummary } from '@/components/marketplace';
import type { Review } from '@/services/api/review.service';
import { cn } from '@/utils/cn';

export interface ReviewForm {
  rating: number;
  title: string;
  comment: string;
}

export interface ReviewsTabProps {
  // Data
  reviews: Review[];
  reviewsPagination: any;
  reviewsLoading: boolean;
  averageRating: number;
  ratingDistribution: Array<{ rating: number; count: number; percentage: number }>;
  totalReviews: number;

  // Auth
  isAuthenticated: boolean;
  hasReviewed: boolean;
  hasPurchased: boolean;

  // Form State
  showReviewForm: boolean;
  reviewForm: ReviewForm;
  hoverRating: number;
  reviewsPage: number;
  reviewFilter: number | 'all';

  // Mutations
  createReviewMutation: any;
  helpfulMutation: any;

  // Handlers
  setShowReviewForm: (show: boolean) => void;
  setReviewForm: React.Dispatch<React.SetStateAction<ReviewForm>>;
  setHoverRating: (rating: number) => void;
  setReviewsPage: React.Dispatch<React.SetStateAction<number>>;
  setReviewFilter: (filter: number | 'all') => void;
  handleSubmitReview: () => void;

  // Auth Modal
  onOpenAuthModal: (options: { reason: string }) => void;
}

export default function ReviewsTab({
  reviews,
  reviewsPagination,
  reviewsLoading,
  averageRating,
  ratingDistribution,
  totalReviews,
  isAuthenticated,
  hasReviewed,
  hasPurchased,
  showReviewForm,
  reviewForm,
  hoverRating,
  reviewsPage,
  reviewFilter,
  createReviewMutation,
  helpfulMutation,
  setShowReviewForm,
  setReviewForm,
  setHoverRating,
  setReviewsPage,
  setReviewFilter,
  handleSubmitReview,
  onOpenAuthModal,
}: ReviewsTabProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* Rating Summary */}
      <RatingSummary
        averageRating={averageRating}
        totalReviews={totalReviews}
        distribution={ratingDistribution}
      />

      {/* حالت ۱: کاربر لاگین نکرده */}
      {!isAuthenticated && (
        <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-1.5" />
          <p className="text-gray-700 dark:text-gray-300 font-bold text-sm mb-0.5 font-sans">برای ثبت نظر وارد شوید</p>
          <Button
            onClick={() => onOpenAuthModal({ reason: 'برای ثبت نظر درباره این محصول وارد شوید.' })}
            size="sm"
            className="mt-2 font-sans"
          >
            ورود به حساب
          </Button>
        </div>
      )}

      {/* حالت ۲: کاربر لاگین کرده و قبلاً نظر نداده */}
      {isAuthenticated && !hasReviewed && (
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl p-3 text-white">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="font-black text-sm mb-0.5 font-sans">نظر خود را ثبت کنید</h4>
              <p className="text-white/90 text-xs font-sans">
                {hasPurchased
                  ? 'تجربه خرید خود را با دیگران به اشتراک بگذارید'
                  : 'نظر شما به دیگر کاربران کمک می‌کند'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="font-sans"
            >
              <MessageCircle className="w-3.5 h-3.5 ml-1" />
              {showReviewForm ? 'بستن' : 'ثبت نظر'}
            </Button>
          </div>
        </div>
      )}

      {/* حالت ۳: کاربر قبلاً نظر داده */}
      {isAuthenticated && hasReviewed && (
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-xs flex items-center justify-center gap-1.5 font-sans">
            <CheckCircle className="w-4 h-4 text-success-500" />
            شما قبلاً برای این محصول نظر ثبت کرده‌اید
          </p>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && isAuthenticated && !hasReviewed && (
        <div className="bg-white dark:bg-gray-800 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-4 animate-fade-in">
          <h4 className="font-black text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5 text-sm font-sans">
            <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            ثبت نظر جدید
          </h4>

          {/* Rating Stars */}
          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-sans">امتیاز شما</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    className="transition-all duration-200 hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={cn(
                        'w-8 h-8 transition-all duration-200 stroke-2',
                        star <= (hoverRating || reviewForm.rating)
                          ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_2px_6px_rgba(250,204,21,0.6)]'
                          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300 dark:hover:text-yellow-700'
                      )}
                    />
                  </button>
                ))}
              </div>
              {reviewForm.rating > 0 && (
                <span className="text-xs font-bold text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 px-2 py-1 rounded-md font-sans">
                  {['', 'ضعیف', 'متوسط', 'خوب', 'عالی', 'فوق‌العاده'][reviewForm.rating]}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-2.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 font-sans">عنوان نظر (اختیاری)</label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="مثلاً: کیفیت عالی، پیشنهاد می‌کنم"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500 font-sans"
              maxLength={255}
            />
          </div>

          {/* Comment */}
          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 font-sans">
              متن نظر <span className="text-error-500">*</span>
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="تجربه خود از استفاده این محصول را بنویسید..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500 resize-none font-sans"
              minLength={4}
              maxLength={2000}
            />
            <p className={cn(
              'text-[10px] mt-1 font-sans',
              reviewForm.comment.trim().length < 4
                ? 'text-error-500'
                : 'text-gray-500 dark:text-gray-400'
            )}>
              {reviewForm.comment.trim().length < 4
                ? `حداقل ۴ کاراکتر • ${reviewForm.comment.length}/2000`
                : `${reviewForm.comment.length}/2000`
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-sans"
              size="sm"
              onClick={() => {
                setShowReviewForm(false);
                setReviewForm({ rating: 0, title: '', comment: '' });
              }}
              disabled={createReviewMutation?.isPending}
            >
              انصراف
            </Button>
            <Button
              className="flex-1 font-sans"
              size="sm"
              onClick={handleSubmitReview}
              disabled={
                createReviewMutation?.isPending ||
                reviewForm.rating === 0 ||
                reviewForm.comment.trim().length < 4
              }
              isLoading={createReviewMutation?.isPending}
            >
              <MessageCircle className="w-3.5 h-3.5 ml-1" />
              ثبت نظر
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-black text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5 font-sans">
            <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            نظرات کاربران ({totalReviews})
          </h4>

          {/* Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setReviewFilter('all')}
              className={cn(
                'px-2 py-1 rounded-md text-[10px] font-bold transition-all font-sans',
                reviewFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              همه
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setReviewFilter(r)}
                className={cn(
                  'px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-0.5 font-sans',
                  reviewFilter === r
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <Star className="w-2.5 h-2.5 fill-current" />
                {r}
              </button>
            ))}
          </div>
        </div>

        {reviewsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1.5" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-sans">
              {reviewFilter === 'all'
                ? 'هنوز نظری ثبت نشده است'
                : `نظری با امتیاز ${reviewFilter} ستاره یافت نشد`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md font-sans">
                        {review.user.initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-xs font-sans">{review.user.name}</p>
                          {review.is_verified && (
                            <Badge variant="success" size="sm" className="text-[9px] font-sans">
                              <BadgeCheck className="w-2.5 h-2.5 ml-0.5" />
                              خریدار
                            </Badge>
                          )}
                          {review.is_pending && (
                            <Badge variant="warning" size="sm" className="text-[9px] font-sans">
                              <Clock className="w-2.5 h-2.5 ml-0.5" />
                              در انتظار تأیید
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'w-3 h-3',
                                  i < review.rating ? 'text-warning-400 fill-warning-400' : 'text-gray-200 dark:text-gray-600'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5 font-sans">
                            <Clock className="w-2.5 h-2.5" />
                            {review.created_at_fa}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {review.title && (
                    <h5 className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-1 font-sans">{review.title}</h5>
                  )}

                  <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed mb-2 font-sans">{review.comment}</p>

                  {review.admin_reply && (
                    <div className="mb-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg p-2.5">
                      <p className="flex items-center gap-1 text-[10px] font-bold text-primary-700 dark:text-primary-400 mb-1 font-sans">
                        <Reply className="w-3 h-3" />
                        پاسخ فروشگاه ازکالا
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed font-sans">{review.admin_reply}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => helpfulMutation.mutate(review.id)}
                      disabled={helpfulMutation?.isPending}
                      className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400 hover:text-success-600 dark:hover:text-success-400 transition-colors disabled:opacity-50 font-sans"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      مفید ({review.helpful_count})
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {reviewsPagination && reviewsPagination.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewsPage(p => Math.max(1, p - 1))}
                  disabled={reviewsPage === 1}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-sans">
                  صفحه {reviewsPagination.current_page} از {reviewsPagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewsPage(p => Math.min(reviewsPagination.last_page, p + 1))}
                  disabled={reviewsPage === reviewsPagination.last_page}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}