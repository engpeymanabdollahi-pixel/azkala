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

    /**
     * ط·آ¯ط·آ±ط؛إ’ط·آ§ط¸ظ¾ط·ع¾ ط¸â€‍ط؛إ’ط·آ³ط·ع¾ ط·آ³ط¸ظ¾ط·آ§ط·آ±ط·آ´ط·آ§ط·ع¾ ط¸â€¦ط·آ±ط·آ¨ط¸ث†ط·آ· ط·آ¨ط¸â€، ط¸ظ¾ط·آ±ط¸ث†ط·آ´ط¸â€ ط·آ¯ط¸â€،
     */
    public function getSellerOrdersList(int $sellerId, int $page = 1, int $perPage = 5): array
    {
        $orders = \App\Models\Order::whereHas('items', function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId);
            })
            ->with('items.product')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return $orders->toArray();
    }
    /**
     * ط¯ط±غŒط§ظپطھ ظ„غŒط³طھ ظ…ط­طµظˆظ„ط§طھ ظ…ط±ط¨ظˆط· ط¨ظ‡ ظپط±ظˆط´ظ†ط¯ظ‡
     */
    public function getSellerProductsList(int $sellerId, int $page = 1, int $perPage = 100): array
    {
        $products = \App\Models\Product::where('seller_id', $sellerId)
            ->with('category', 'brand')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return $products->toArray();
    }
    /**
     * دریافت آمار سفارشات مربوط به فروشنده
     */
    public function getSellerOrdersStats(int $sellerId): array
    {
        // پیدا کردن تمام order_idهایی که شامل آیتم‌های این فروشنده هستند
        $orderIds = \App\Models\OrderItem::where('seller_id', $sellerId)->pluck('order_id')->unique();

        if ($orderIds->isEmpty()) {
            return [
                'total_orders' => 0,
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'cancelled' => 0,
                'total_revenue' => 0,
            ];
        }

        $orders = \App\Models\Order::whereIn('id', $orderIds)->get();

        return [
            'total_orders' => $orders->count(),
            'pending' => $orders->where('status', 'pending')->count(),
            'processing' => $orders->where('status', 'processing')->count(),
            'completed' => $orders->where('status', 'completed')->count(),
            'cancelled' => $orders->where('status', 'cancelled')->count(),
            'total_revenue' => $orders->sum('total'), // یا می‌تواند مجموع قیمت آیتم‌های فروشنده باشد
        ];
    }
        /**
     * دریافت جزئیات یک محصول متعلق به فروشنده (برای ویرایش)
     */
    public function getSellerProductDetail(int $productId, int $sellerId)
    {
        $product = \App\Models\Product::where('id', $productId)
            ->where('seller_id', $sellerId)
            ->with(['category', 'brand'])
            ->first();

        if (!$product) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('محصول یافت نشد یا متعلق به شما نیست.');
        }

        return $product;
    }
    }
