<?php

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminProductRepository
{
    /**
     * Get products with advanced filters
     */
    public function getProductsWithFilters(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Product::with(['category:id,name', 'brand:id,name']);

        // Search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('sku', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        // Category filter
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Brand filter
        if (!empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        // Seller filter
        if (!empty($filters['seller_id'])) {
            $query->where('seller_id', $filters['seller_id']);
        }

        // Status filter
        if (!empty($filters['status'])) {
            switch ($filters['status']) {
                case 'active':
                    $query->where('is_active', true);
                    break;
                case 'inactive':
                    $query->where('is_active', false);
                    break;
                case 'featured':
                    $query->where('is_featured', true);
                    break;
                case 'special':
                    $query->where('is_special_offer', true);
                    break;
                case 'low_stock':
                    $query->where('stock', '<', 10)->where('stock', '>', 0);
                    break;
                case 'out_of_stock':
                    $query->where('stock', 0);
                    break;
            }
        }

        // Price filters
        if (!empty($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }
        if (!empty($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $allowedSorts = ['created_at', 'price', 'sales_count', 'rating', 'stock', 'views_count', 'name'];
        
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Find product by ID
     */
    public function find(int $id): ?Product
    {
        return Product::find($id);
    }

    /**
     * Find product by ID or fail
     */
    public function findOrFail(int $id): Product
    {
        return Product::findOrFail($id);
    }

    /**
     * Quick update product
     */
    public function quickUpdate(Product $product, array $data): Product
    {
        $product->update($data);
        return $product;
    }

    /**
     * Delete product
     */
    public function delete(Product $product): bool
    {
        return $product->delete();
    }

    /**
     * Get products statistics
     */
    public function getStats(): array
    {
        return [
            'total' => Product::count(),
            'active' => Product::where('is_active', true)->count(),
            'inactive' => Product::where('is_active', false)->count(),
            'featured' => Product::where('is_featured', true)->count(),
            'special_offers' => Product::where('is_special_offer', true)->count(),
            'low_stock' => Product::where('stock', '<', 10)->where('stock', '>', 0)->count(),
            'out_of_stock' => Product::where('stock', 0)->count(),
            'total_value' => (float) Product::sum(DB::raw('price * stock')),
        ];
    }

    /**
     * Get seller info for a product
     */
    public function getSellerInfo(?int $sellerId): ?array
    {
        if (!$sellerId) {
            return null;
        }

        $sellerData = DB::table('users')->where('id', $sellerId)->first();
        
        if (!$sellerData) {
            return null;
        }

        return [
            'id' => $sellerData->id,
            'name' => $sellerData->name,
            'shop_name' => $sellerData->shop_name ?? $sellerData->name,
        ];
    }

    /**
     * Get product stats for last 30 days
     */
    public function getProductStats(int $productId): array
    {
        $last30DaysSales = DB::table('order_items')
            ->where('product_id', $productId)
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('quantity');

        $last30DaysRevenue = DB::table('order_items')
            ->where('product_id', $productId)
            ->where('created_at', '>=', now()->subDays(30))
            ->sum(DB::raw('price * quantity'));

        return [
            'sales' => (int) $last30DaysSales,
            'revenue' => (float) $last30DaysRevenue,
        ];
    }

    /**
     * Bulk action on products
     */
    public function bulkAction(array $ids, string $action): int
    {
        switch ($action) {
            case 'activate':
                Product::whereIn('id', $ids)->update(['is_active' => true]);
                return count($ids);
                
            case 'deactivate':
                Product::whereIn('id', $ids)->update(['is_active' => false]);
                return count($ids);
                
            case 'feature':
                Product::whereIn('id', $ids)->update(['is_featured' => true]);
                return count($ids);
                
            case 'unfeature':
                Product::whereIn('id', $ids)->update(['is_featured' => false]);
                return count($ids);
                
            case 'delete':
                Product::whereIn('id', $ids)->delete();
                return count($ids);
                
            default:
                return 0;
        }
    }
}