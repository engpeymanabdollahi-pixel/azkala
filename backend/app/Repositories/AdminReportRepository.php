<?php

namespace App\Repositories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminReportRepository
{
    /**
     * Get overview statistics
     */
    public function getOverview(): array
    {
        return [
            'total_users' => User::count(),
            'total_products' => Product::count(),
            'total_orders' => Order::count(),
            'total_revenue' => (float) Order::where('payment_status', 'paid')
                ->whereNotIn('status', ['cancelled'])->sum('total'),
            'total_reviews' => Review::count(),
            'active_products' => Product::where('is_active', true)->count(),
            'low_stock_products' => Product::where('stock', '<', 10)->where('stock', '>', 0)->count(),
            'out_of_stock' => Product::where('stock', 0)->count(),
        ];
    }

    /**
     * Get KPIs for current period
     */
    public function getCurrentPeriodKPIs(int $period): array
    {
        $startDate = now()->subDays($period);

        $orders = Order::where('created_at', '>=', $startDate)
            ->whereNotIn('status', ['cancelled']);

        $ordersCount = (clone $orders)->count();
        $revenue = (clone $orders)
            ->where('payment_status', 'paid')
            ->sum('total');

        return [
            'orders' => $ordersCount,
            'revenue' => (float) $revenue,
            'avg_order' => $ordersCount > 0 ? (float) ($revenue / $ordersCount) : 0,
            'users' => User::where('created_at', '>=', $startDate)->count(),
        ];
    }

    /**
     * Get KPIs for previous period
     */
    public function getPreviousPeriodKPIs(int $period): array
    {
        $startDate = now()->subDays($period);
        $prevStartDate = now()->subDays($period * 2);

        $orders = Order::whereBetween('created_at', [$prevStartDate, $startDate])
            ->whereNotIn('status', ['cancelled']);

        $ordersCount = (clone $orders)->count();
        $revenue = (clone $orders)
            ->where('payment_status', 'paid')
            ->sum('total');

        return [
            'orders' => $ordersCount,
            'revenue' => (float) $revenue,
            'avg_order' => $ordersCount > 0 ? (float) ($revenue / $ordersCount) : 0,
            'users' => User::whereBetween('created_at', [$prevStartDate, $startDate])->count(),
        ];
    }

    /**
     * Get sales data for chart
     */
    public function getSalesData(int $period): Collection
    {
        $startDate = now()->subDays($period);

        return Order::where('created_at', '>=', $startDate)
            ->where('payment_status', 'paid')
            ->whereNotIn('status', ['cancelled'])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as orders_count'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('AVG(total) as avg_order')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    /**
     * Get top products by sales
     */
    public function getTopProducts(int $period, int $limit = 10): Collection
    {
        $startDate = now()->subDays($period);

        return OrderItem::where('order_items.created_at', '>=', $startDate)
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.payment_status', 'paid')
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereNull('orders.deleted_at') // ✅ join: SoftDeletes روی جدول join‌شده اعمال نمی‌شود
            ->select(
                'products.id', 'products.name', 'products.slug', 'products.main_image',
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue'),
                DB::raw('COUNT(DISTINCT orders.id) as orders_count')
            )
            ->groupBy('products.id', 'products.name', 'products.slug', 'products.main_image')
            ->orderByDesc('total_sold')
            ->limit($limit)
            ->get();
    }

    /**
     * Get top categories by revenue
     */
    public function getTopCategories(int $period): Collection
    {
        $startDate = now()->subDays($period);

        return OrderItem::where('order_items.created_at', '>=', $startDate)
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->where('orders.payment_status', 'paid')
            ->whereNotIn('orders.status', ['cancelled'])
            // ✅ join: SoftDeletes روی جداول join‌شده اعمال نمی‌شود
            ->whereNull('orders.deleted_at')
            ->whereNull('categories.deleted_at')
            ->select(
                'categories.id', 'categories.name', 'categories.slug',
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue')
            )
            ->groupBy('categories.id', 'categories.name', 'categories.slug')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();
    }

    /**
     * Get orders by status
     */
    public function getOrdersByStatus(int $period): Collection
    {
        $startDate = now()->subDays($period);

        return Order::where('created_at', '>=', $startDate)
            ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as total'))
            ->groupBy('status')
            ->get();
    }

    /**
     * Get all sellers
     */
    public function getSellers(): Collection
    {
        return User::where('role', 'seller')->get();
    }

    /**
     * Get seller sales data
     */
    public function getSellerSalesData(int $sellerId, $startDate): ?object
    {
        return OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('products.seller_id', $sellerId)
            ->where('orders.created_at', '>=', $startDate)
            ->where('orders.payment_status', 'paid')
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereNull('orders.deleted_at') // ✅ join: SoftDeletes روی جدول join‌شده اعمال نمی‌شود
            ->select(
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue')
            )
            ->first();
    }
}