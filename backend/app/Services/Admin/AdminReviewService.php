<?php

namespace App\Services\Admin;

use App\Models\Review;
use App\Repositories\AdminReviewRepository;
use Illuminate\Support\Facades\Log;

class AdminReviewService
{
    protected AdminReviewRepository $repository;

    public function __construct(AdminReviewRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get reviews list with filters
     */
    public function getReviews(array $filters = [], int $perPage = 20): array
    {
        try {
            $reviews = $this->repository->getReviewsWithFilters($filters, $perPage);
            $stats = $this->repository->getStats();

            return [
                'reviews' => $reviews->map(function ($review) {
                    return $this->formatReview($review);
                }),
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'last_page' => $reviews->lastPage(),
                    'per_page' => $reviews->perPage(),
                    'total' => $reviews->total(),
                ],
                'stats' => $stats,
            ];
        } catch (\Exception $e) {
            Log::error('AdminReviewService@getReviews: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت نظرات', 500);
        }
    }

    /**
     * Update review status
     */
    public function updateStatus(int $id, string $status): bool
    {
        try {
            $review = $this->repository->findOrFail($id);
            
            $validStatuses = ['pending', 'approved', 'rejected'];
            if (!in_array($status, $validStatuses)) {
                throw new \Exception('وضعیت نامعتبر است', 422);
            }

            $this->repository->update($review, ['status' => $status]);
            return true;
        } catch (\Exception $e) {
            Log::error('AdminReviewService@updateStatus: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Reply to review
     */
    public function replyToReview(int $id, string $reply, int $adminId): bool
    {
        try {
            $review = $this->repository->findOrFail($id);

            $this->repository->update($review, [
                'admin_reply' => $reply,
                'replied_by' => $adminId,
                'replied_at' => now(),
                'status' => 'approved', // تایید خودکار هنگام پاسخ
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('AdminReviewService@replyToReview: ' . $e->getMessage());
            throw new \Exception('خطا در ثبت پاسخ', 500);
        }
    }

    /**
     * Bulk action on reviews
     */
    public function bulkAction(array $ids, string $action): array
    {
        try {
            $count = $this->repository->bulkAction($ids, $action);

            $messages = [
                'approve' => "{$count} نظر تأیید شد",
                'reject' => "{$count} نظر رد شد",
                'delete' => "{$count} نظر حذف شد",
            ];

            return [
                'count' => $count,
                'message' => $messages[$action] ?? 'عملیات انجام شد',
            ];
        } catch (\Exception $e) {
            Log::error('AdminReviewService@bulkAction: ' . $e->getMessage());
            throw new \Exception('خطا در عملیات', 500);
        }
    }

    /**
     * Delete review
     */
    public function deleteReview(int $id): bool
    {
        try {
            $review = $this->repository->findOrFail($id);
            return $this->repository->delete($review);
        } catch (\Exception $e) {
            Log::error('AdminReviewService@deleteReview: ' . $e->getMessage());
            throw new \Exception('خطا در حذف', 500);
        }
    }

    /**
     * Format review data
     */
    protected function formatReview(Review $review): array
    {
        return [
            'id' => $review->id,
            'title' => $review->title,
            'comment' => $review->comment,
            'rating' => (int) $review->rating,
            'status' => $review->status,
            'is_verified' => (bool) $review->is_verified,
            'helpful_count' => $review->helpful_count ?? 0,
            'images' => $review->images,
            'admin_reply' => $review->admin_reply,
            'replied_at' => $review->replied_at ? $review->replied_at->format('Y-m-d H:i') : null,
            'user' => $review->user ? [
                'id' => $review->user->id,
                'name' => $review->user->name,
                'email' => $review->user->email,
                'avatar' => $review->user->avatar,
            ] : null,
            'product' => $review->product ? [
                'id' => $review->product->id,
                'name' => $review->product->name,
                'slug' => $review->product->slug,
                'image' => $review->product->main_image,
            ] : null,
            'created_at' => $review->created_at ? $review->created_at->format('Y-m-d H:i') : null,
        ];
    }
}