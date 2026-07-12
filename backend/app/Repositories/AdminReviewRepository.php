<?php

namespace App\Repositories;

use App\Models\Review;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminReviewRepository
{
    /**
     * Get reviews with advanced filters
     */
    public function getReviewsWithFilters(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Review::with([
            'user:id,name,email,avatar',
            'product:id,name,slug,main_image'
        ]);

        // Search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('comment', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function($uq) use ($search) {
                      $uq->where('name', 'LIKE', "%{$search}%");
                  })
                  ->orWhereHas('product', function($pq) use ($search) {
                      $pq->where('name', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Status filter
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Rating filter
        if (!empty($filters['rating'])) {
            $query->where('rating', $filters['rating']);
        }

        // Product filter
        if (!empty($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        // Verified filter
        if (isset($filters['is_verified'])) {
            $query->where('is_verified', $filters['is_verified']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $allowedSorts = ['created_at', 'rating', 'helpful_count'];
        
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Find review by ID
     */
    public function find(int $id): ?Review
    {
        return Review::find($id);
    }

    /**
     * Find review by ID or fail
     */
    public function findOrFail(int $id): Review
    {
        return Review::findOrFail($id);
    }

    /**
     * Update review
     */
    public function update(Review $review, array $data): Review
    {
        $review->update($data);
        return $review;
    }

    /**
     * Delete review
     */
    public function delete(Review $review): bool
    {
        return $review->delete();
    }

    /**
     * Get reviews statistics
     */
    public function getStats(): array
    {
        return [
            'total' => Review::count(),
            'approved' => Review::where('status', 'approved')->count(),
            'pending' => Review::where('status', 'pending')->count(),
            'rejected' => Review::where('status', 'rejected')->count(),
            'average_rating' => (float) round(Review::avg('rating'), 2),
            'verified' => Review::where('is_verified', true)->count(),
            'today' => Review::whereDate('created_at', today())->count(),
        ];
    }

    /**
     * Bulk action on reviews
     */
    public function bulkAction(array $ids, string $action): int
    {
        switch ($action) {
            case 'approve':
                Review::whereIn('id', $ids)->update(['status' => 'approved']);
                return count($ids);
                
            case 'reject':
                Review::whereIn('id', $ids)->update(['status' => 'rejected']);
                return count($ids);
                
            case 'delete':
                Review::whereIn('id', $ids)->delete();
                return count($ids);
                
            default:
                return 0;
        }
    }
}