<?php

namespace App\Repositories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SellerRating;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SellerRepository
{
    /**
     * Get seller's products with filters
     */
    public function getSellerProducts(int $sellerId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Product::where('seller_id', $sellerId)
            ->with(['category', 'brand', 'images']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Get seller products paginated (simple)
     */
    public function getSellerProductsPaginated(int $sellerId, int $perPage = 10)
    {
        return Product::where('seller_id', $sellerId)
            ->with(['category', 'brand'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Find product by ID for seller
     */
    public function findSellerProduct(int $productId, int $sellerId): ?Product
    {
        return Product::where('seller_id', $sellerId)
            ->where('id', $productId)
            ->with(['category', 'brand'])
            ->first();
    }

    /**
     * Create product with auto-generated slug
     */
    public function createProduct(array $data): Product
    {
        $slug = \Str::slug($data['name']) . '-' . \Str::random(5);
        $data['slug'] = $slug;

        return Product::create($data);
    }

    /**
     * Update product
     */
    public function updateProduct(Product $product, array $data): Product
    {
        $product->update($data);
        return $product->fresh(['category', 'brand']);
    }

    /**
     * Delete product with image cleanup
     */
    public function deleteProduct(Product $product): bool
    {
        if ($product->main_image) {
            $path = str_replace(url('/storage') . '/', '', $product->main_image);
            \Storage::disk('public')->delete($path);
        }

        if (!empty($product->gallery) && is_array($product->gallery)) {
            foreach ($product->gallery as $image) {
                $path = str_replace(url('/storage') . '/', '', $image);
                \Storage::disk('public')->delete($path);
            }
        }

        return $product->delete();
    }

    /**
     * Get seller's orders with filters
     */
    public function getSellerOrders(int $sellerId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Order::where('seller_id', $sellerId)
            ->with(['user', 'items.product', 'address']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * Get seller orders with items (for index)
     */
    public function getSellerOrdersWithItems(int $sellerId, int $perPage = 10)
    {
        $orders = Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })
        ->with([
            'items' => function ($q) use ($sellerId) {
                $q->where('seller_id', $sellerId)
                  ->with('product:id,name,main_image,price');
            },
            'user:id,name,email,phone'
        ])
        ->latest()
        ->paginate($perPage);

        $orders->getCollection()->transform(function ($order) use ($sellerId) {
            $sellerItems = $order->items->filter(fn($item) => $item->seller_id === $sellerId);
            $order->items_count = $sellerItems->sum('quantity');
            $order->seller_total = $sellerItems->sum(fn($item) => $item->price * $item->quantity);
            $order->customer_name = $order->user->name ?? 'ظ…ط´طھط±غŒ';
            return $order;
        });

        return $orders;
    }

    /**
     * Get seller order detail
     */
    public function getSellerOrderDetail(int $orderId, int $sellerId): ?Model
    {
        return Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })
        ->with([
            'items' => function ($q) use ($sellerId) {
                $q->where('seller_id', $sellerId)
                  ->with('product:id,name,main_image,price');
            },
            'user:id,name,email,phone',
            'address'
        ])
        ->find($orderId);
    }

    /**
     * Update order status with tracking info
     */
    public function updateOrderStatusWithTracking(int $orderId, int $sellerId, array $data): bool
    {
        $order = Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })->find($orderId);

        if (!$order) {
            throw new \Exception('ط³ظپط§ط±ط´ غŒط§ظپطھ ظ†ط´ط¯', 404);
        }

        $updateData = ['status' => $data['status']];

        if (isset($data['tracking_number'])) {
            $updateData['tracking_number'] = $data['tracking_number'];
        }
        if (isset($data['courier_name'])) {
            $updateData['courier_name'] = $data['courier_name'];
        }

        return $order->update($updateData);
    }

    /**
     * Get seller dashboard stats
     */
    public function getSellerDashboardStats(int $sellerId): array
    {
        $totalProducts = Product::where('seller_id', $sellerId)->count();
        $activeProducts = Product::where('seller_id', $sellerId)
            ->where('is_active', true)
            ->count();

        $pendingOrders = Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })->whereIn('status', ['pending', 'processing'])->count();

        $totalRevenue = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', function ($q) {
                $q->where('status', 'delivered');
            })
            ->sum(DB::raw('price * quantity'));

        $pendingSettlements = OrderItem::where('seller_id', $sellerId)
            ->whereHas('order', function ($q) {
                $q->whereIn('status', ['delivered', 'shipped']);
            })
            ->sum(DB::raw('price * quantity'));

        $totalSales = OrderItem::where('seller_id', $sellerId)->sum('quantity');

        $monthlySales = [];
        $persianMonths = ['ظپط±ظˆط±ط¯غŒظ†', 'ط§ط±ط¯غŒط¨ظ‡ط´طھ', 'ط®ط±ط¯ط§ط¯', 'طھغŒط±', 'ظ…ط±ط¯ط§ط¯', 'ط´ظ‡ط±غŒظˆط±',
                         'ظ…ظ‡ط±', 'ط¢ط¨ط§ظ†', 'ط¢ط°ط±', 'ط¯غŒ', 'ط¨ظ‡ظ…ظ†', 'ط§ط³ظپظ†ط¯'];

        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();

            $sales = OrderItem::where('seller_id', $sellerId)
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('quantity');

            $revenue = OrderItem::where('seller_id', $sellerId)
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum(DB::raw('price * quantity'));

            $monthIndex = $monthStart->month - 1;

            $monthlySales[] = [
                'month' => $persianMonths[$monthIndex] ?? $monthStart->format('M'),
                'sales' => (int) $sales,
                'revenue' => (float) $revenue,
            ];
        }

        $topProducts = OrderItem::where('seller_id', $sellerId)
            ->select('product_id', DB::raw('SUM(quantity) as total_sales'), DB::raw('SUM(price * quantity) as total_revenue'))
            ->groupBy('product_id')
            ->orderByDesc('total_sales')
            ->limit(5)
            ->with('product:id,name,main_image')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'name' => $item->product->name ?? 'ظ…ط­طµظˆظ„ ط­ط°ظپ ط´ط¯ظ‡',
                    'sales' => (int) $item->total_sales,
                    'revenue' => (float) $item->total_revenue,
                    'image' => $item->product->main_image ?? null,
                ];
            });

        return [
            'total_revenue' => (float) $totalRevenue,
            'pending_orders' => (int) $pendingOrders,
            'active_products' => (int) $activeProducts,
            'total_products' => (int) $totalProducts,
            'pending_settlements' => (float) $pendingSettlements,
            'total_sales' => (int) $totalSales,
            'monthly_sales' => $monthlySales,
            'top_products' => $topProducts,
            'recent_activity' => [],
        ];
    }

    /**
     * Get seller orders stats
     */
    public function getSellerOrdersStats(int $sellerId): array
    {
        $orders = Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        });

        return [
            'total' => (clone $orders)->count(),
            'pending' => (clone $orders)->where('status', 'pending')->count(),
            'processing' => (clone $orders)->where('status', 'processing')->count(),
            'shipped' => (clone $orders)->where('status', 'shipped')->count(),
            'delivered' => (clone $orders)->where('status', 'delivered')->count(),
            'cancelled' => (clone $orders)->where('status', 'cancelled')->count(),
            'total_revenue' => (float) (clone $orders)
                ->where('status', 'delivered')
                ->sum('total'),
            'average_order_value' => (float) (clone $orders)
                ->where('status', 'delivered')
                ->avg('total'),
        ];
    }

    /**
     * Find order for rating
     */
    public function findOrderForRating(int $orderId, int $userId): ?Order
    {
        return Order::where('id', $orderId)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Check if user already rated this order
     */
    public function checkExistingRating(int $userId, int $orderId): ?SellerRating
    {
        return SellerRating::where('user_id', $userId)
            ->where('order_id', $orderId)
            ->first();
    }

    /**
     * Create seller rating
     */
    public function createRating(array $data): SellerRating
    {
        return SellerRating::create($data);
    }

    /**
     * Get seller ratings with pagination
     */
    public function getSellerRatings(int $sellerId, int $perPage = 10)
    {
        return SellerRating::with('user:id,name,avatar')
            ->where('seller_id', $sellerId)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Get seller ratings statistics
     */
    public function getSellerRatingsStats(int $sellerId): object
    {
        return SellerRating::where('seller_id', $sellerId)
            ->selectRaw('
                COUNT(*) as total_ratings,
                AVG(product_quality) as avg_product_quality,
                AVG(shipping_speed) as avg_shipping_speed,
                AVG(communication) as avg_communication,
                AVG(overall_rating) as avg_overall
            ')
            ->first();
    }

    /**
     * Update seller average rating
     */
    /**
     * Get seller average rating
     */
    public function getSellerAverageRating(int $sellerId): float
    {
        $stats = $this->getSellerRatingsStats($sellerId);
        return $stats->average_rating ?? 0.0;
    }

    public function updateSellerAverageRating(int $sellerId): void
    {
        $avgRating = SellerRating::where('seller_id', $sellerId)
            ->avg('overall_rating');

        User::where('id', $sellerId)->update([
            'seller_rating' => round($avgRating ?? 0, 1),
        ]);
    }

    /**
     * Check if user can rate order
     */
    public function canUserRateOrder(int $userId, int $orderId): array
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', $userId)
            ->where('status', 'delivered')
            ->where('payment_status', 'paid')
            ->first();

        if (!$order) {
            return [
                'can_rate' => false,
                'reason' => 'ط³ظپط§ط±ط´ غŒط§ظپطھ ظ†ط´ط¯',
            ];
        }

        $hasRated = SellerRating::where('user_id', $userId)
            ->where('order_id', $orderId)
            ->exists();

        $sellerId = $order->items()->first()->seller_id ?? null;

        return [
            'can_rate' => !$hasRated,
            'has_rated' => $hasRated,
            'order' => [
                'id' => $order->id,
                'seller_id' => $sellerId,
            ],
        ];
    }
    /**
     * Get seller quick replies
     */
    public function getQuickReplies(int $sellerId): Collection
    {
        return \App\Models\SellerQuickReply::where('seller_id', $sellerId)
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Create quick reply
     */
    public function createQuickReply(array $data): \App\Models\SellerQuickReply
    {
        return \App\Models\SellerQuickReply::create($data);
    }

    /**
     * Count quick replies
     */
    public function countQuickReplies(int $sellerId): int
    {
        return \App\Models\SellerQuickReply::where('seller_id', $sellerId)->count();
    }

    /**
     * Find quick reply by ID
     */
    public function findQuickReply(int $id, int $sellerId): ?\App\Models\SellerQuickReply
    {
        return \App\Models\SellerQuickReply::where('seller_id', $sellerId)->find($id);
    }

    /**
     * Delete quick reply
     */
    public function deleteQuickReply(\App\Models\SellerQuickReply $reply): bool
    {
        return $reply->delete();
    }
}