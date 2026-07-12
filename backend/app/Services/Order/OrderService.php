<?php

namespace App\Services\Order;

use App\DTOs\Order\CreateOrderDTO;
use App\Models\Cart;
use App\Models\Product;
use App\Repositories\OrderRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderService
{
    protected OrderRepository $orderRepository;

    public function __construct(OrderRepository $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    /**
     * Get user orders with pagination
     */
    public function getUserOrders(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->orderRepository->getUserOrders($userId, $perPage);
    }

    /**
     * Get order details
     */
    public function getOrderDetails(int $orderId, ?int $userId = null): array
    {
        $order = $this->orderRepository->getOrderWithDetails($orderId, $userId);

        if (!$order) {
            throw new \Exception('سفارش یافت نشد', 404);
        }

        return $this->formatOrderData($order);
    }

    /**
     * Create new order from cart
     */
    public function createOrder(CreateOrderDTO $dto): Model
    {
        // Validate DTO
        $errors = $dto->validate();
        if (!empty($errors)) {
            throw new \Exception(implode(', ', $errors), 422);
        }

        return DB::transaction(function () use ($dto) {
            // 1. Validate and prepare items
            $validatedItems = $this->validateAndPrepareItems($dto->items);

            // 2. Calculate totals
            $totals = $this->calculateTotals($validatedItems);

            // 3. Generate unique order number
            $orderNumber = $this->generateOrderNumber();

            // 4. Prepare order data
            $orderData = [
                'user_id' => $dto->user_id,
                'order_number' => $orderNumber,
                'address_id' => $dto->address_id,
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'shipping_cost' => $totals['shipping_cost'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $dto->payment_method,
                'note' => $dto->note,
            ];

            // 5. Create order with items
            $order = $this->orderRepository->createOrderWithItems(
                $orderData,
                $validatedItems
            );

            // 6. Update product stock and sales count
            $this->updateProductStock($validatedItems);

            // 7. Clear user's cart
            $this->clearUserCart($dto->user_id);

            Log::info("Order created: {$orderNumber} for user {$dto->user_id}");

            return $order;
        });
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(int $orderId, int $userId): bool
    {
        $order = $this->orderRepository->getOrderWithDetails($orderId, $userId);

        if (!$order) {
            throw new \Exception('سفارش یافت نشد', 404);
        }

        // Check if order can be cancelled
        if (!in_array($order->status, ['pending', 'processing'])) {
            throw new \Exception('این سفارش قابل لغو نیست', 400);
        }

        return DB::transaction(function () use ($order) {
            // 1. Restore product stock
            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)
                    ->increment('stock', $item->quantity);
                
                Product::where('id', $item->product_id)
                    ->decrement('sales_count', $item->quantity);
            }

            // 2. Update order status
            return $this->orderRepository->updateStatus($orderId, 'cancelled');
        });
    }

    /**
     * Get user order statistics
     */
    public function getUserStats(int $userId): array
    {
        return $this->orderRepository->getUserStats($userId);
    }

    // ==================== Protected Methods ====================

    /**
     * Validate items and prepare for order
     */
    protected function validateAndPrepareItems(array $items): array
    {
        $validatedItems = [];

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);

            if (!$product) {
                throw new \Exception("محصول با شناسه {$item['product_id']} یافت نشد", 404);
            }

            if (!$product->is_active) {
                throw new \Exception("محصول {$product->name} دیگر فعال نیست", 400);
            }

            if ($product->stock < $item['quantity']) {
                throw new \Exception(
                    "موجودی {$product->name} کافی نیست. موجودی: {$product->stock}",
                    400
                );
            }

            $validatedItems[] = [
                'product_id' => $product->id,
                'quantity' => $item['quantity'],
                'price' => $product->price,
                'seller_id' => $product->seller_id,
            ];
        }

        return $validatedItems;
    }

    /**
     * Calculate order totals
     */
    protected function calculateTotals(array $items): array
    {
        $subtotal = 0;
        $discount = 0;

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            $itemTotal = $product->price * $item['quantity'];
            $subtotal += $itemTotal;

            // Calculate discount if any
            if ($product->discount_percentage > 0) {
                $discount += ($itemTotal * $product->discount_percentage) / 100;
            }
        }

        $afterDiscount = $subtotal - $discount;
        $shippingCost = $afterDiscount > 500000 ? 0 : 50000; // Free shipping over 500k
        $tax = $afterDiscount * 0.09; // 9% tax
        $total = $afterDiscount + $shippingCost + $tax;

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'shipping_cost' => $shippingCost,
            'tax' => $tax,
            'total' => $total,
        ];
    }

    /**
     * Generate unique order number
     */
    protected function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'AZK-' . strtoupper(Str::random(8));
            $exists = $this->orderRepository->findBy('order_number', $orderNumber);
        } while ($exists);

        return $orderNumber;
    }

    /**
     * Update product stock after order
     */
    protected function updateProductStock(array $items): void
    {
        foreach ($items as $item) {
            Product::where('id', $item['product_id'])
                ->decrement('stock', $item['quantity']);
            
            Product::where('id', $item['product_id'])
                ->increment('sales_count', $item['quantity']);
        }
    }

    /**
     * Clear user's cart
     */
    protected function clearUserCart(int $userId): void
    {
        $cart = Cart::where('user_id', $userId)->first();
        if ($cart) {
            $cart->items()->delete();
        }
    }

    /**
     * Format order data for response
     */
    protected function formatOrderData(Model $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_method' => $order->payment_method,
            'subtotal' => (float) $order->subtotal,
            'discount' => (float) $order->discount,
            'shipping_cost' => (float) $order->shipping_cost,
            'tax' => (float) $order->tax,
            'total' => (float) $order->total,
            'note' => $order->note,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price' => (float) $item->price,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'slug' => $item->product->slug,
                        'main_image' => $item->product->main_image,
                        'seller' => $item->product->seller ? [
                            'id' => $item->product->seller->id,
                            'shop_name' => $item->product->seller->shop_name,
                        ] : null,
                    ] : null,
                ];
            }),
            'address' => $order->address,
        ];
    }
}