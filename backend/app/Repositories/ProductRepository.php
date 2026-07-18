<?php

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductRepository extends BaseRepository
{
    /**
     * Specify Model class name
     */
    protected function model(): string
    {
        return Product::class;
    }

    /**
     * Get active products with filters
     */
    public function getActiveProducts(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = $this->query()
            ->with(['category', 'brand', 'images'])
            ->where('is_active', true);

        // Apply filters
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        if (!empty($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }

        if (!empty($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Get product by slug with all relations
     */
    public function findBySlug(string $slug): ?Model
    {
        return $this->query()
            ->with(['category', 'brand', 'seller', 'images'])
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Get featured products
     */
    public function getFeatured(int $limit = 10): Collection
    {
        return $this->query()
            ->with(['category', 'brand', 'images'])
            ->where('is_active', true)
            ->where('is_featured', true)
            ->limit($limit)
            ->get();
    }

    /**
     * Get special offers
     */
    public function getSpecialOffers(int $limit = 10): Collection
    {
        return $this->query()
            ->with(['category', 'brand', 'images'])
            ->where('is_active', true)
            ->where('is_special_offer', true)
            ->limit($limit)
            ->get();
    }

       /**
     * دریافت محصولات سازگار با یک مدل دستگاه
     */
    public function getCompatibleProducts(int $modelId)
    {
        return \App\Models\Product::active()
            ->whereHas('deviceModels', function ($query) use ($modelId) { // ✅ تغییر یافته
                $query->where('device_model_id', $modelId); // ✅ تغییر یافته
            })
            ->with(['brand', 'category', 'deviceModels.series.brand']) // ✅ تغییر یافته
            ->get();
    }

    /**
     * دریافت محصولات سازگار با چندین مدل دستگاه
     */
    public function getCompatibleProductsMulti(array $modelIds, int $perPage = 50)
    {
        return \App\Models\Product::active()
            ->whereHas('deviceModels', function ($query) use ($modelIds) { // ✅ تغییر یافته
                $query->whereIn('device_model_id', $modelIds); // ✅ تغییر یافته
            })
            ->with(['brand', 'category'])
            ->paginate($perPage);
    }
    /**
     * Get related products
     */
    public function getRelatedProducts(int $categoryId, int $excludeId, int $limit = 8): Collection
    {
        return $this->query()
            ->with(['brand', 'category', 'images'])
            ->where('category_id', $categoryId)
            ->where('id', '!=', $excludeId)
            ->where('is_active', true)
            ->limit($limit)
            ->get();
    }

    /**
     * Get user's purchased products
     */
    public function getUserPurchasedProducts(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        $purchasedProductIds = \App\Models\OrderItem::whereHas('order', function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->where('status', '!=', 'cancelled');
        })->pluck('product_id')->unique();

        return $this->query()
            ->with(['category', 'brand', 'images'])
            ->whereIn('id', $purchasedProductIds)
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->paginate($perPage);
    }

    /**
     * Increment views count
     */
    public function incrementViews(int $productId): void
    {
        $this->query()->where('id', $productId)->increment('views_count');
    }
}