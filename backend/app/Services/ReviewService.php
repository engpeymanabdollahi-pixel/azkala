<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReviewService
{
    public function getApprovedReviewsPaginated(int $productId): LengthAwarePaginator
    {
        return Review::with('user:id,name')
            ->where('product_id', $productId)
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->paginate(10);
    }

    public function getRatingDistribution(int $productId): array
    {
        return Review::where('product_id', $productId)
            ->where('status', 'approved')
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();
    }

    public function getAverageRating(int $productId): ?float
    {
        return Review::where('product_id', $productId)
            ->where('status', 'approved')
            ->avg('rating');
    }

    public function createReview(int $userId, array $data): Review
    {
        return DB::transaction(function () use ($userId, $data) {
            $existingReview = Review::where('user_id', $userId)
                ->where('product_id', $data['product_id'])
                ->first();

            if ($existingReview) {
                throw new \Exception('شما قبلاً برای این محصول نظر ثبت کرده‌اید', 400);
            }

            $isVerified = $this->checkUserPurchased($userId, $data['product_id']);

            $review = Review::create([
                'user_id' => $userId,
                'product_id' => $data['product_id'],
                'title' => $data['title'] ?? null,
                'comment' => $data['comment'],
                'rating' => $data['rating'],
                'is_verified' => $isVerified,
                'status' => 'pending',
            ]);

            $this->updateProductRating($data['product_id']);

            return $review->load('user:id,name');
        });
    }

    public function deleteReview(int $reviewId, int $userId): void
    {
        $review = Review::where('id', $reviewId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $productId = $review->product_id;
        $review->delete();

        $this->updateProductRating($productId);
    }

    public function incrementHelpful(int $reviewId): Review
    {
        $review = Review::findOrFail($reviewId);
        $review->increment('helpful_count');

        return $review;
    }

    public function checkUserPurchased(int $userId, int $productId): bool
    {
        try {
            return OrderItem::whereHas('order', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->where('payment_status', 'paid')
                  ->whereIn('status', ['delivered', 'completed']);
            })->where('product_id', $productId)->exists();
        } catch (\Exception $e) {
            Log::error('checkUserPurchased error: ' . $e->getMessage());
            return false;
        }
    }

    private function updateProductRating(int $productId): void
    {
        try {
            $product = Product::find($productId);
            if (!$product) {
                return;
            }

            $stats = Review::where('product_id', $productId)
                ->where('status', 'approved')
                ->selectRaw('COUNT(*) as count, AVG(rating) as avg_rating')
                ->first();

            $product->reviews_count = $stats->count ?? 0;
            $product->rating = round($stats->avg_rating ?? 0, 2);
            $product->save();
        } catch (\Exception $e) {
            Log::error('updateProductRating error: ' . $e->getMessage());
        }
    }
}
