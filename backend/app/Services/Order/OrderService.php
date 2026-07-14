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
            throw new \Exception('ط³ظپط§ط±ط´ غŒط§ظپطھ ظ†ط´ط¯', 404);
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
            throw new \Exception('ط³ظپط§ط±ط´ غŒط§ظپطھ ظ†ط´ط¯', 404);
        }

        // Check if order can be cancelled
        if (!in_array($order->status, ['pending', 'processing'])) {
            throw new \Exception('ط§غŒظ† ط³ظپط§ط±ط´ ظ‚ط§ط¨ظ„ ظ„ط؛ظˆ ظ†غŒط³طھ', 400);
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
                throw new \Exception("ظ…ط­طµظˆظ„ ط¨ط§ ط´ظ†ط§ط³ظ‡ {$item['product_id']} غŒط§ظپطھ ظ†ط´ط¯", 404);
            }

            if (!$product->is_active) {
                throw new \Exception("ظ…ط­طµظˆظ„ {$product->name} ط¯غŒع¯ط± ظپط¹ط§ظ„ ظ†غŒط³طھ", 400);
            }

            if ($product->stock < $item['quantity']) {
                throw new \Exception(
                    "ظ…ظˆط¬ظˆط¯غŒ {$product->name} ع©ط§ظپغŒ ظ†غŒط³طھ. ظ…ظˆط¬ظˆط¯غŒ: {$product->stock}",
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


    /**
     * محاسبه و ثبت کمیسیون پلتفرم و واریز به کیف پول فروشنده
     */
    public function processCommission(Order $order): void
    {
        // فرض: تمام آیتم‌های این سفارش متعلق به یک فروشنده است (یا فروشنده اصلی سفارش)
        // اگر چند فروشنده دارید، این حلقه باید روی $order->items بچرخد
        $firstItem = $order->items->first();
        if (!$firstItem || !$firstItem->product) {
            return;
        }

        // پیدا کردن فروشنده (فرض بر این است که product متعلق به user با نقش seller است)
        $seller = $firstItem->product->user; // یا $firstItem->product->seller بسته به مدل شما
        
        if (!$seller || $seller->role !== 'seller') {
            return; // اگر فروشنده مشخص نبود، کمیسیونی کسر نمی‌شود
        }

        // ۱. محاسبه مبالغ
        $orderTotal = (float) $order->total;
        $commissionRate = (float) ($seller->seller_commission_rate ?? 5.00); // پیش‌فرض ۵ درصد
        $commissionAmount = $orderTotal * ($commissionRate / 100);
        $sellerPayout = $orderTotal - $commissionAmount;

        // ۲. ثبت تراکنش کمیسیون (کسر از سهم فروشنده)
        \App\Models\SellerTransaction::create([
            'seller_id' => $seller->id,
            'order_id' => $order->id,
            'type' => 'commission_deduction',
            'amount' => $commissionAmount,
            'description' => "کسر کمیسیون {}% از سفارش {->order_number}",
            'status' => 'completed',
        ]);

        // ۳. ثبت تراکنش واریز به کیف پول
        \App\Models\SellerTransaction::create([
            'seller_id' => $seller->id,
            'order_id' => $order->id,
            'type' => 'payout',
            'amount' => $sellerPayout,
            'description' => "واریز سهم فروشنده از سفارش {->order_number}",
            'status' => 'completed',
        ]);

        // ۴. افزایش موجودی کیف پول فروشنده
        $seller->increment('wallet_balance', $sellerPayout);

        \Illuminate\Support\Facades\Log::info("Commission processed for order {->order_number}. Total: {}, Commission: {}, Payout: {}");
    }
        /**
     * پردازش تسویه حساب فروشندگان پس از تکمیل سفارش
     * این متد باید زمانی فراخوانی شود که وضعیت سفارش به 'completed' یا 'delivered' تغییر می‌کند.
     */
    public function processSellerPayouts(Order $order): void
    {
        // دریافت نرخ کمیسیون از تنظیمات (اگر تنظیمات ندارید، عدد 5 را به عنوان پیش‌فرض 5 درصد در نظر بگیرید)
        $commissionRate = \App\Models\Setting::get('platform_commission_rate', 5); 

        // گروه‌بندی آیتم‌های سفارش بر اساس فروشنده
        $sellerItems = $order->items->groupBy('seller_id');

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($sellerItems as $sellerId => $items) {
                // اگر آیتم متعلق به خود پلتفرم است (seller_id ندارد)، از محاسبات رد می‌شود
                if (!$sellerId) continue;

                // ۱. محاسبه مبلغ کل این فروشنده در این سفارش
                $sellerOrderTotal = $items->sum('total'); // یا $items->sum(fn($i) => $i->price * $i->quantity)

                // ۲. محاسبه کمیسیون و مبلغ خالص
                $commissionAmount = round(($sellerOrderTotal * $commissionRate) / 100);
                $netAmount = $sellerOrderTotal - $commissionAmount;

                // ۳. افزایش موجودی کیف پول فروشنده
                \App\Models\User::where('id', $sellerId)->increment('wallet_balance', $netAmount);

                // ۴. ثبت تراکنش شفاف برای فروشنده
                \App\Models\SellerTransaction::create([
                    'seller_id' => $sellerId,
                    'order_id' => $order->id,
                    'type' => 'order_payout',
                    'amount' => $netAmount,
                    'commission_deducted' => $commissionAmount, // این فیلد برای شفافیت عالی است
                    'status' => 'completed',
                    'description' => "واریز سهم فروش سفارش شماره {$order->id} (کسر کمیسیون {$commissionRate}%)"
                ]);

                // ۵. (اختیاری اما توصیه‌شده) ثبت درآمد پلتفرم در جدول جداگانه
                // اگر مدل PlatformRevenue یا Commission دارید، این خط را فعال کنید:
                // \App\Models\PlatformRevenue::create([
                //     'order_id' => $order->id,
                //     'seller_id' => $sellerId,
                //     'amount' => $commissionAmount,
                //     'description' => "کمیسیون {$commissionRate}% از سفارش {$order->id}"
                // ]);
            }

            \Illuminate\Support\Facades\DB::commit();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('خطا در پردازش تسویه حساب فروشندگان: ' . $e->getMessage());
            throw $e;
        }
    }
}
