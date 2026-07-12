<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Repositories\AdminOrderRepository;
use Illuminate\Support\Facades\Log;

class AdminOrderService
{
    protected AdminOrderRepository $repository;

    public function __construct(AdminOrderRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get orders list with filters
     */
    public function getOrders(array $filters = [], int $perPage = 20): array
    {
        try {
            $orders = $this->repository->getOrdersWithFilters($filters, $perPage);
            $stats = $this->repository->getStats();
            $sellers = $this->repository->getSellers();

            return [
                'orders' => $orders->map(function ($order) {
                    return $this->formatOrder($order);
                }),
                'pagination' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                ],
                'stats' => $stats,
                'sellers' => $sellers,
            ];
        } catch (\Exception $e) {
            Log::error('AdminOrderService@getOrders: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت سفارشات: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get order details
     */
    public function getOrderDetails(int $id): array
    {
        try {
            $order = $this->repository->getOrderWithDetails($id);

            return [
                'order' => $this->formatOrderDetail($order),
                'user' => $order->user ? [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                    'phone' => $order->user->phone ?? null,
                ] : null,
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name ?? 'محصول حذف شده',
                        'product_slug' => $item->product->slug ?? null,
                        'product_image' => $item->product->main_image ?? null,
                        'quantity' => $item->quantity,
                        'price' => (float) $item->price,
                        'total' => (float) $item->total,
                    ];
                }),
            ];
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            throw new \Exception('سفارش یافت نشد', 404);
        } catch (\Exception $e) {
            Log::error('AdminOrderService@getOrderDetails: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت جزئیات سفارش', 500);
        }
    }

    /**
     * Update order status
     */
    public function updateStatus(int $id, array $data): Order
    {
        try {
            $order = Order::findOrFail($id);

            $updateData = ['status' => $data['status']];

            if (isset($data['tracking_number'])) {
                $updateData['tracking_number'] = $data['tracking_number'];
            }
            if (isset($data['notes'])) {
                $updateData['notes'] = $data['notes'];
            }

            // اگر لغو شد، موجودی را برگردان
            if ($data['status'] === 'cancelled' && $order->status !== 'cancelled') {
                $this->repository->restoreStock($order);
            }

            return $this->repository->updateStatus($order, $updateData);
        } catch (\Exception $e) {
            Log::error('AdminOrderService@updateStatus: ' . $e->getMessage());
            throw new \Exception('خطا در بروزرسانی وضعیت: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update payment status
     */
    public function updatePaymentStatus(int $id, string $status): Order
    {
        try {
            $order = Order::findOrFail($id);
            return $this->repository->updatePaymentStatus($order, $status);
        } catch (\Exception $e) {
            Log::error('AdminOrderService@updatePaymentStatus: ' . $e->getMessage());
            throw new \Exception('خطا در بروزرسانی وضعیت پرداخت', 500);
        }
    }

    /**
     * Get detailed statistics
     */
    public function getStats(): array
    {
        try {
            $last7Days = $this->repository->getLast7DaysStats();
            $paymentMethods = $this->repository->getPaymentMethodsStats();

            return [
                'last_7_days' => $last7Days,
                'payment_methods' => $paymentMethods,
            ];
        } catch (\Exception $e) {
            Log::error('AdminOrderService@getStats: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت آمار', 500);
        }
    }

    /**
     * Format order for list view
     */
    protected function formatOrder(Order $order): array
    {
        // Decode shipping address
        $shippingAddress = $order->shipping_address;
        if (is_string($shippingAddress)) {
            $shippingAddress = json_decode($shippingAddress, true);
        }

        // Get sellers for this order
        $sellers = $this->repository->getOrderSellers($order->id);

        // Get items count
        $itemsCount = $this->repository->getOrderItemsCount($order->id);

        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_method' => $order->payment_method,
            'subtotal' => (float) $order->subtotal,
            'discount' => (float) ($order->discount ?? 0),
            'shipping' => (float) ($order->shipping ?? 0),
            'tax' => (float) ($order->tax ?? 0),
            'total' => (float) $order->total,
            'tracking_number' => $order->tracking_number,
            'coupon_code' => $order->coupon_code,
            'notes' => $order->notes,
            'shipping_address' => $shippingAddress,
            'user' => $order->user ? [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email' => $order->user->email,
                'phone' => $order->user->phone ?? null,
            ] : null,
            'sellers' => $sellers,
            'items_count' => $itemsCount,
            'created_at' => $order->created_at->format('Y-m-d H:i'),
            'created_at_fa' => $order->created_at->format('Y/m/d H:i'),
        ];
    }

    /**
     * Format order for detail view
     */
    protected function formatOrderDetail(Order $order): array
    {
        // Decode shipping address
        $shippingAddress = $order->shipping_address;
        if (is_string($shippingAddress)) {
            $decoded = json_decode($shippingAddress, true);
            $shippingAddress = is_array($decoded) ? $decoded : null;
        }

        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_method' => $order->payment_method,
            'subtotal' => (float) $order->subtotal,
            'discount' => (float) ($order->discount ?? 0),
            'shipping' => (float) ($order->shipping ?? 0),
            'tax' => (float) ($order->tax ?? 0),
            'total' => (float) $order->total,
            'tracking_number' => $order->tracking_number,
            'coupon_code' => $order->coupon_code,
            'notes' => $order->notes,
            'shipping_address' => $shippingAddress,
            'created_at' => $order->created_at ? $order->created_at->format('Y-m-d H:i') : null,
            'updated_at' => $order->updated_at ? $order->updated_at->format('Y-m-d H:i') : null,
        ];
    }
}