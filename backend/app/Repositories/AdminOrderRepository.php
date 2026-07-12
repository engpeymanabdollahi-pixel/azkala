<?php

namespace App\Repositories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminOrderRepository
{
    /**
     * Get orders with advanced filters
     */
    public function getOrdersWithFilters(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Order::with(['user:id,name,email,phone']);

        // Search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('order_number', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function($uq) use ($search) {
                      $uq->where('name', 'LIKE', "%{$search}%")
                         ->orWhere('email', 'LIKE', "%{$search}%")
                         ->orWhere('phone', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Status filter
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Payment status filter
        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        // Payment method filter
        if (!empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        // Seller filter
        if (!empty($filters['seller_id'])) {
            $query->whereHas('items', function($q) use ($filters) {
                $q->where('seller_id', $filters['seller_id']);
            });
        }

        // Date filters
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Amount filters
        if (!empty($filters['min_total'])) {
            $query->where('total', '>=', $filters['min_total']);
        }
        if (!empty($filters['max_total'])) {
            $query->where('total', '<=', $filters['max_total']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $allowedSorts = ['created_at', 'total', 'status', 'order_number'];
        
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Get order with full details
     */
    public function getOrderWithDetails(int $id): Order
    {
        return Order::with([
            'user:id,name,email,phone',
            'items.product:id,name,main_image,slug'
        ])->findOrFail($id);
    }

    /**
     * Update order status
     */
    public function updateStatus(Order $order, array $data): Order
    {
        $order->update($data);
        return $order;
    }

    /**
     * Update payment status
     */
    public function updatePaymentStatus(Order $order, string $status): Order
    {
        $order->update(['payment_status' => $status]);
        return $order;
    }

    /**
     * Restore product stock when order is cancelled
     */
    public function restoreStock(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->product) {
                $item->product->increment('stock', $item->quantity);
            }
        }
    }

    /**
     * Get orders statistics
     */
    public function getStats(): array
    {
        return [
            'total' => Order::count(),
            'pending' => Order::where('status', 'pending')->count(),
            'processing' => Order::where('status', 'processing')->count(),
            'shipped' => Order::where('status', 'shipped')->count(),
            'delivered' => Order::where('status', 'delivered')->count(),
            'cancelled' => Order::where('status', 'cancelled')->count(),
            'returned' => Order::where('status', 'returned')->count(),
            'total_revenue' => (float) Order::where('status', '!=', 'cancelled')->sum('total'),
            'today_orders' => Order::whereDate('created_at', today())->count(),
            'today_revenue' => (float) Order::whereDate('created_at', today())
                ->where('status', '!=', 'cancelled')
                ->sum('total'),
            'pending_payment' => Order::where('payment_status', 'pending')->count(),
        ];
    }

    /**
     * Get last 7 days statistics
     */
    public function getLast7DaysStats(): array
    {
        $stats = [];
        
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateStr = $date->toDateString();
            
            $orders = Order::whereDate('created_at', $dateStr)->count();
            $revenue = Order::whereDate('created_at', $dateStr)
                ->where('status', '!=', 'cancelled')
                ->sum('total');

            $stats[] = [
                'date' => $dateStr,
                'day_name' => $date->locale('fa')->dayName,
                'orders' => $orders,
                'revenue' => (float) $revenue,
            ];
        }

        return $stats;
    }

    /**
     * Get payment methods statistics
     */
    public function getPaymentMethodsStats(): Collection
    {
        return Order::select('payment_method', DB::raw('count(*) as count'))
            ->groupBy('payment_method')
            ->pluck('count', 'payment_method');
    }

    /**
     * Get all sellers
     */
    public function getSellers(): Collection
    {
        return User::where('role', 'seller')
            ->get()
            ->map(function ($seller) {
                return [
                    'id' => $seller->id,
                    'name' => $seller->name,
                    'shop_name' => $seller->shop_name ?? $seller->name,
                ];
            });
    }

    /**
     * Get sellers for a specific order
     */
    public function getOrderSellers(int $orderId): Collection
    {
        return OrderItem::where('order_id', $orderId)
            ->whereNotNull('seller_id')
            ->with('seller:id,name,shop_name')
            ->get()
            ->pluck('seller')
            ->filter()
            ->unique('id')
            ->values()
            ->map(function ($seller) {
                return [
                    'id' => $seller->id,
                    'name' => $seller->name,
                    'shop_name' => $seller->shop_name ?? $seller->name,
                ];
            });
    }

    /**
     * Get items count for an order
     */
    public function getOrderItemsCount(int $orderId): int
    {
        return OrderItem::where('order_id', $orderId)->sum('quantity');
    }
}