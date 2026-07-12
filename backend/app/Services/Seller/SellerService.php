<?php

namespace App\Services\Seller;

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SellerRating;
use App\Models\SellerQuickReply;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SellerService
{
    public function getSellerProducts(int $sellerId, array $filters = [], int $perPage = 20)
    {
        $query = Product::where('seller_id', $sellerId);

        if (!empty($filters['search'])) {
            $query->where('name', 'LIKE', "%{$filters['search']}%");
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function getSellerDashboardStats(int $sellerId): array
    {
        $totalProducts = Product::where('seller_id', $sellerId)->count();
        $activeProducts = Product::where('seller_id', $sellerId)->where('is_active', true)->count();

        $totalOrders = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('products.seller_id', $sellerId)
            ->where('orders.payment_status', 'paid')
            ->whereNotIn('orders.status', ['cancelled'])
            ->count();

        $totalRevenue = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('products.seller_id', $sellerId)
            ->where('orders.payment_status', 'paid')
            ->whereNotIn('orders.status', ['cancelled'])
            ->sum(DB::raw('order_items.quantity * order_items.price'));

        $pendingOrders = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('products.seller_id', $sellerId)
            ->where('orders.status', 'pending')
            ->count();

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'total_orders' => $totalOrders,
            'total_revenue' => (float) $totalRevenue,
            'pending_orders' => $pendingOrders,
        ];
    }

    public function getSellerRatings(int $sellerId): array
    {
        $ratings = SellerRating::where('seller_id', $sellerId)
            ->with('user')
            ->orderByDesc('created_at')
            ->get();

        $averageRating = $ratings->avg('overall_rating') ?? 0;

        return [
            'ratings' => $ratings,
            'average_rating' => (float) $averageRating,
            'total' => $ratings->count(),
        ];
    }

    public function createProduct(int $sellerId, array $data): Product
    {
        $data['seller_id'] = $sellerId;
        return Product::create($data);
    }

    public function updateProduct(int $sellerId, int $productId, array $data): Product
    {
        $product = Product::where('id', $productId)
            ->where('seller_id', $sellerId)
            ->firstOrFail();

        $product->update($data);
        return $product->fresh();
    }

    public function deleteProduct(int $sellerId, int $productId): bool
    {
        $product = Product::where('id', $productId)
            ->where('seller_id', $sellerId)
            ->firstOrFail();

        return $product->delete();
    }

    public function createQuickReply(int $sellerId, string $title, string $content): SellerQuickReply
    {
        return SellerQuickReply::create([
            'seller_id' => $sellerId,
            'title' => $title,
            'content' => $content,
        ]);
    }
}