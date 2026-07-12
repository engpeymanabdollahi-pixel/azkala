<?php

namespace App\Repositories;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

class OrderRepository extends BaseRepository
{
    /**
     * Specify Model class name
     */
    protected function model(): string
    {
        return Order::class;
    }

    /**
     * Get user orders with pagination
     */
    public function getUserOrders(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->query()
            ->with(['items.product', 'items.product.images', 'address'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Get order by ID with all relations
     */
    public function getOrderWithDetails(int $orderId, ?int $userId = null): ?Model
    {
        $query = $this->query()
            ->with([
                'items.product',
                'items.product.images',
                'items.product.seller',
                'address',
                'user',
            ]);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->find($orderId);
    }

    /**
     * Get order by order number
     */
    public function findByOrderNumber(string $orderNumber, ?int $userId = null): ?Model
    {
        $query = $this->query()
            ->with([
                'items.product',
                'items.product.images',
                'address',
            ]);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->where('order_number', $orderNumber)->first();
    }

    /**
     * Create order with items in transaction
     */
    public function createOrderWithItems(array $orderData, array $items): Model
    {
        return \DB::transaction(function () use ($orderData, $items) {
            // Create order
            $order = $this->create($orderData);

            // Create order items
            foreach ($items as $item) {
                $order->items()->create($item);
            }

            return $order->load(['items.product', 'address']);
        });
    }

    /**
     * Update order status
     */
    public function updateStatus(int $orderId, string $status): bool
    {
        $order = $this->findOrFail($orderId);
        return $order->update(['status' => $status]);
    }

    /**
     * Get order statistics for user
     */
    public function getUserStats(int $userId): array
    {
        $orders = $this->query()->where('user_id', $userId);

        return [
            'total_orders' => (clone $orders)->count(),
            'pending_orders' => (clone $orders)->where('status', 'pending')->count(),
            'processing_orders' => (clone $orders)->where('status', 'processing')->count(),
            'completed_orders' => (clone $orders)->where('status', 'delivered')->count(),
            'cancelled_orders' => (clone $orders)->where('status', 'cancelled')->count(),
            'total_spent' => (clone $orders)
                ->where('status', '!=', 'cancelled')
                ->sum('total'),
        ];
    }
}