import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  MessageSquare, Search, Star, CheckCircle, XCircle, Clock,
  Trash2, X, ChevronLeft, ChevronRight, Package,
  RefreshCw, Filter, ThumbsUp, Shield, Send, Reply,
  Image as ImageIcon, Verified, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  adminReviewService,
  type AdminReview,
  type ReviewFilters,
} from '@/services/api/adminReview.service';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;
type BadgeVariant = NonNullable<BadgeProps['variant']>;
type BulkActionType = 'approve' | 'reject' | 'delete';

const getStatusInfo = (status: string) => {
  const map: Record<string, { label: string; color: BadgeVariant; icon: LucideIcon; bg: string }> = {
    pending: { label: 'در انتظار', color: 'warning', icon: Clock, bg: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800' },
    approved: { label: 'تایید شده', color: 'success', icon: CheckCircle, bg: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800' },
    rejected: { label: 'رد شده', color: 'error', icon: XCircle, bg: 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 border-error-200 dark:border-error-800' },
  };
  return map[status] || map.pending;
};

const getRatingStars = (rating: number, size: 'sm' | 'md' = 'md') => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={cn(
          sizeClass,
          i <= rating ? 'fill-warning-400 text-warning-400' : 'text-gray-300 dark:text-gray-600'
        )}
      />
    );
  }
  return stars;
};

export function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ReviewFilters>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  // ✅ قبلاً is_verified در ReviewFilters و در بکند (getReviewsWithFilters)
  // پشتیبانی می‌شد، ولی هیچ دکمه/تاگلی در این صفحه برای فعال‌کردنش وجود
  // نداشت — ادمین هیچ‌وقت نمی‌توانست فقط نظرات «خرید تأیید شده» را ببیند.
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [showReplyModal, setShowReplyModal] = useState<AdminReview | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-reviews', filters],
    queryFn: () => adminReviewService.getReviews(filters),
    placeholderData: keepPreviousData,
  });

  const reviews = data?.data?.reviews || [];
  const pagination = data?.data?.pagination;
  const stats = data?.data?.stats;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminReviewService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('وضعیت نظر تغییر کرد', { icon: '✅' });
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      adminReviewService.reply(id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('پاسخ ثبت شد', { icon: '✅' });
      setShowReplyModal(null);
      setReplyText('');
    },
    onError: () => toast.error('خطا در ثبت پاسخ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminReviewService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('نظر حذف شد', { icon: '🗑️' });
    },
    onError: () => toast.error('خطا در حذف'),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: BulkActionType }) =>
      adminReviewService.bulkAction(ids, action),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success(response.message, { icon: '✅' });
      setSelectedIds([]);
    },
    onError: () => toast.error('خطا در عملیات'),
  });

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 500);
    return () => clearTimeout(timeout);
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status,
      page: 1,
    }));
  };

  const handleRatingFilter = (rating: RatingFilter) => {
    setRatingFilter(rating);
    setFilters(prev => ({
      ...prev,
      rating: rating === 'all' ? undefined : rating,
      page: 1,
    }));
  };

  const handleVerifiedFilter = () => {
    const next = !verifiedOnly;
    setVerifiedOnly(next);
    setFilters(prev => ({
      ...prev,
      is_verified: next ? true : undefined,
      page: 1,
    }));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map(r => r.id));
    }
  };

  const handleSelectReview = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOpenReply = (review: AdminReview) => {
    setSelectedReview(review);
    setShowReplyModal(review);
    setReplyText(review.admin_reply || '');
  };

  const handleSaveReply = () => {
    if (!replyText.trim()) {
      toast.error('لطفاً متن پاسخ را وارد کنید');
      return;
    }
    if (selectedReview) {
      replyMutation.mutate({ id: selectedReview.id, reply: replyText });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            مدیریت نظرات
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت، تایید و پاسخ به نظرات کاربران
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="کل نظرات" value={stats?.total || 0} icon={MessageSquare} color="primary" />
        <StatCard label="تایید شده" value={stats?.approved || 0} icon={CheckCircle} color="success" />
        <StatCard label="در انتظار" value={stats?.pending || 0} icon={Clock} color="warning" />
        <StatCard label="رد شده" value={stats?.rejected || 0} icon={XCircle} color="error" />
        <StatCard
          label="میانگین امتیاز"
          value={stats?.average_rating || 0}
          icon={Star}
          color="accent"
          isRating
        />
        <StatCard label="تأیید خرید" value={stats?.verified || 0} icon={Verified} color="primary" />
        <StatCard label="امروز" value={stats?.today || 0} icon={MessageSquare} color="accent" />
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="جستجو در متن نظر، نام کاربر یا محصول..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all"
            />
          </div>
          <button
            onClick={handleVerifiedFilter}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
              verifiedOnly
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            <Verified className="w-3.5 h-3.5" />
            فقط خرید تأیید شده
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 px-2">
            <Filter className="w-3.5 h-3.5" />
            وضعیت:
          </span>
          {[
            { value: 'all', label: 'همه', icon: MessageSquare },
            { value: 'pending', label: 'در انتظار', icon: Clock },
            { value: 'approved', label: 'تایید شده', icon: CheckCircle },
            { value: 'rejected', label: 'رد شده', icon: XCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => handleStatusFilter(item.value as StatusFilter)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  statusFilter === item.value
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Rating Filter */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 px-2">
            <Star className="w-3.5 h-3.5" />
            امتیاز:
          </span>
          <button
            onClick={() => handleRatingFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              ratingFilter === 'all'
                ? 'bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            همه
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => handleRatingFilter(r as RatingFilter)}
              className={cn(
                'px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                ratingFilter === r
                  ? 'bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <div className="flex">{getRatingStars(r, 'sm')}</div>
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                {selectedIds.length} نظر انتخاب شده
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'approve' })}
                disabled={bulkMutation.isPending}
              >
                <CheckCircle className="w-3.5 h-3.5 ml-1" />
                تایید
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: 'reject' })}
                disabled={bulkMutation.isPending}
              >
                <XCircle className="w-3.5 h-3.5 ml-1" />
                رد
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (window.confirm(`آیا از حذف ${selectedIds.length} نظر مطمئن هستید؟`)) {
                    bulkMutation.mutate({ ids: selectedIds, action: 'delete' });
                  }
                }}
                disabled={bulkMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5 ml-1" />
                حذف
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-12 h-12" />}
            title="نظری یافت نشد"
            description="با فیلترهای فعلی هیچ نظری وجود ندارد"
            action={
              <Button onClick={() => setFilters({ page: 1, per_page: 20 })} variant="outline">
                پاک کردن فیلترها
              </Button>
            }
          />
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
              <input
                type="checkbox"
                checked={selectedIds.length === reviews.length && reviews.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">انتخاب همه</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {reviews.map((review) => {
                const statusInfo = getStatusInfo(review.status);
                const StatusIcon = statusInfo.icon;
                const isSelected = selectedIds.includes(review.id);

                return (
                  <div
                    key={review.id}
                    className={cn(
                      'p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors',
                      isSelected && 'bg-primary-50/30 dark:bg-primary-900/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectReview(review.id)}
                        className="w-4 h-4 text-primary-600 rounded mt-1"
                      />

                      {/* Product Image */}
                      {review.product?.image && (
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                          <SafeImage
                            src={review.product.image}
                            alt={review.product.name}
                            className="w-full h-full object-cover"
                            fallbackEmoji="📦"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* User */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {review.user?.name?.charAt(0) || '?'}
                              </div>
                              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                {review.user?.name || 'کاربر ناشناس'}
                              </span>
                              {review.is_verified && (
                                <Badge variant="success" size="sm" className="text-[9px]">
                                  <Verified className="w-2.5 h-2.5 ml-0.5" />
                                  خرید تأیید شده
                                </Badge>
                              )}
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-1">
                              <div className="flex">{getRatingStars(review.rating, 'sm')}</div>
                            </div>

                            {/* Status */}
                            <span className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold',
                              statusInfo.bg
                            )}>
                              <StatusIcon className="w-2.5 h-2.5" />
                              {statusInfo.label}
                            </span>
                          </div>

                          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {review.created_at}
                          </span>
                        </div>

                        {/* Product Name */}
                        {review.product && (
                          <p className="text-[11px] text-accent-600 dark:text-accent-400 mb-1 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {review.product.name}
                          </p>
                        )}

                        {/* Title */}
                        {review.title && (
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {review.title}
                          </h4>
                        )}

                        {/* Comment */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {review.comment}
                        </p>

                        {/* Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <ImageIcon className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {review.images.length} تصویر
                            </span>
                          </div>
                        )}

                        {/* Helpful Count */}
                        {review.helpful_count > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{review.helpful_count} نفر این نظر را مفید دانسته‌اند</span>
                          </div>
                        )}

                        {/* Admin Reply */}
                        {review.admin_reply && (
                          <div className="mt-2 p-2 bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-500 rounded">
                            <div className="flex items-center gap-1 mb-1">
                              <Shield className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                              <span className="text-[10px] font-bold text-primary-700 dark:text-primary-400">
                                پاسخ ادمین
                              </span>
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 mr-auto">
                                {review.replied_at}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300">{review.admin_reply}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            size="sm"
                            variant={review.status === 'approved' ? 'default' : 'outline'}
                            className="gap-1 text-[11px] px-2 py-1 h-auto"
                            onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'approved' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="w-3 h-3" />
                            تایید
                          </Button>
                          <Button
                            size="sm"
                            variant={review.status === 'rejected' ? 'destructive' : 'outline'}
                            className="gap-1 text-[11px] px-2 py-1 h-auto"
                            onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'rejected' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="w-3 h-3" />
                            رد
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-[11px] px-2 py-1 h-auto"
                            onClick={() => handleOpenReply(review)}
                          >
                            <Reply className="w-3 h-3" />
                            {review.admin_reply ? 'ویرایش پاسخ' : 'پاسخ'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] px-2 py-1 h-auto text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20"
                            onClick={() => {
                              if (window.confirm('آیا از حذف این نظر مطمئن هستید؟')) {
                                deleteMutation.mutate(review.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              نمایش {(pagination.current_page - 1) * pagination.per_page + 1} تا{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} از{' '}
              <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span> نظر
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                disabled={pagination.current_page === 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="px-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.last_page, prev.page! + 1) }))}
                disabled={pagination.current_page === pagination.last_page}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-l from-primary-50/50 dark:from-primary-900/20 to-white dark:to-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Reply className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                پاسخ به نظر
              </h3>
              <button onClick={() => { setShowReplyModal(null); setReplyText(''); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Original Review */}
              <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                    {showReplyModal.user?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{showReplyModal.user?.name}</p>
                    <div className="flex items-center gap-1">
                      <div className="flex">{getRatingStars(showReplyModal.rating, 'sm')}</div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">• {showReplyModal.created_at}</span>
                    </div>
                  </div>
                </div>
                {showReplyModal.title && (
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{showReplyModal.title}</h4>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">{showReplyModal.comment}</p>
              </div>

              {/* Reply Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  پاسخ شما <span className="text-error-500">*</span>
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ خود را به نظر کاربر بنویسید..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 resize-none"
                />
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  💡 با ارسال پاسخ، نظر به صورت خودکار تایید می‌شود
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
              <Button variant="outline" onClick={() => { setShowReplyModal(null); setReplyText(''); }}>
                انصراف
              </Button>
              <Button
                onClick={handleSaveReply}
                disabled={replyMutation.isPending || !replyText.trim()}
                isLoading={replyMutation.isPending}
                className="gap-1.5"
              >
                <Send className="w-4 h-4" />
                ارسال پاسخ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Sub Components ====================

function StatCard({ label, value, icon: Icon, color, isRating }: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'error' | 'warning' | 'accent' | 'gray';
  isRating?: boolean;
}) {
  const colors = {
    primary: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30',
    success: 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30',
    error: 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/30',
    warning: 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/30',
    accent: 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30',
    gray: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-black text-gray-900 dark:text-gray-100">
        {isRating ? value.toFixed(1) : value.toLocaleString('fa-IR')}
      </p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
export default AdminReviewsPage;
