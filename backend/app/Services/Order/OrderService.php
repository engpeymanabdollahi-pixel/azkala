<?php

namespace App\Services\Order;

use App\DTOs\Order\CreateOrderDTO;
use App\Models\Cart;
use App\Models\Product;
use App\Models\User;
use App\Repositories\OrderRepository;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderService
{
    protected OrderRepository $orderRepository;
    protected ProductRepository $productRepository;

    public function __construct(
        OrderRepository $orderRepository,
        ProductRepository $productRepository
    ) {
        $this->orderRepository = $orderRepository;
        $this->productRepository = $productRepository;
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
        $errors = $dto->validate();
        if (!empty($errors)) {
            throw new \Exception(implode(', ', $errors), 422);
        }

        return DB::transaction(function () use ($dto) {
            // 1. اعتبارسنجی و آماده‌سازی آیتم‌ها (فقط ۱ کوئری برای تمام محصولات)
            $validatedItems = $this->validateAndPrepareItems($dto->items);

            // 2. محاسبه مجموع‌ها (بدون هیچ کوئری اضافی)
            $totals = $this->calculateTotals($validatedItems);

            // 3. تولید شماره سفارش یکتا
            $orderNumber = $this->generateOrderNumber();

            // 4. آماده‌سازی داده‌های سفارش
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

            // 5. ثبت سفارش و آیتم‌ها
            $order = $this->orderRepository->createOrderWithItems($orderData, $validatedItems);

            // 6. به‌روزرسانی موجودی و آمار فروش
            $this->updateProductStock($validatedItems);

            // 7. پاکسازی سبد خرید کاربر
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

        if (!in_array($order->status, ['pending', 'processing'])) {
            throw new \Exception('این سفارش قابل لغو نیست', 400);
        }

        return DB::transaction(function () use ($order) {
            // بازگرداندن موجودی محصولات
            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                Product::where('id', $item->product_id)->decrement('sales_count', $item->quantity);
            }

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
     * Validate items and prepare for order (بهینه‌شده با WhereIn)
     */
    protected function validateAndPrepareItems(array $items): array
    {
        $validatedItems = [];
        $productIds = array_column($items, 'product_id');
        
        // دریافت تمام محصولات در یک کوئری برای جلوگیری از N+1
        $products = $this->productRepository->getModel()::whereIn('id', $productIds)->get()->keyBy('id');

        foreach ($items as $item) {
            $product = $products->get($item['product_id']);

            if (!$product) {
                throw new \Exception("محصول با شناسه {$item['product_id']} یافت نشد", 404);
            }

            if (!$product->is_active) {
                throw new \Exception("محصول {$product->name} دیگر فعال نیست", 400);
            }

            if ($product->stock < $item['quantity']) {
                throw new \Exception("موجودی {$product->name} کافی نیست. موجودی فعلی: {$product->stock}", 400);
            }

            $validatedItems[] = [
                'product_id' => $product->id,
                'quantity' => $item['quantity'],
                'price' => $product->price,
                'discount_percentage' => $product->discount_percentage ?? 0,
                'seller_id' => $product->seller_id,
            ];
        }

        return $validatedItems;
    }

    /**
     * Calculate order totals (بدون کوئری دیتابیس)
     */
    protected function calculateTotals(array $items): array
    {
        $subtotal = 0;
        $discount = 0;

        foreach ($items as $item) {
            $itemTotal = $item['price'] * $item['quantity'];
            $subtotal += $itemTotal;

            if (!empty($item['discount_percentage'])) {
                $discount += ($itemTotal * $item['discount_percentage']) / 100;
            }
        }

        $afterDiscount = $subtotal - $discount;
        
        // حذف اعداد جادویی: استفاده از config (قابل هماهنگی با جدول settings)
        $freeShippingThreshold = (float) config('azkala.free_shipping_threshold', 500000);
        $defaultShippingCost = (float) config('azkla.default_shipping_cost', 50000);
        $taxRate = (float) config('azkala.tax_rate', 9);

        $shippingCost = $afterDiscount >= $freeShippingThreshold ? 0 : $defaultShippingCost;
        $tax = $afterDiscount * ($taxRate / 100);
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
            $this->productRepository->getModel()::where('id', $item['product_id'])
                ->decrement('stock', $item['quantity']);
            
            $this->productRepository->getModel()::where('id', $item['product_id'])
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
     * محاسبه و ثبت کمیسیون پلتفرم و واریز به کیف پول فروشنده (اصلاح‌شده برای چندفروشندگی)
     */
    public function processCommission(Model $order): void
    {
        // گروه‌بندی آیتم‌ها بر اساس فروشنده برای پشتیبانی از Multi-Vendor
        $sellerItems = $order->items->groupBy('seller_id');
        $defaultCommissionRate = (float) config('azkla.default_commission_rate', 5.00);

        DB::beginTransaction();
        try {
            foreach ($sellerItems as $sellerId => $items) {
                if (!$sellerId) continue; // رد شدن از آیتم‌های متعلق به خود پلتفرم

                $seller = User::find($sellerId);
                if (!$seller || $seller->role !== 'seller') continue;

                $commissionRate = (float) ($seller->seller_commission_rate ?? $defaultCommissionRate);
                
                $sellerOrderTotal = $items->sum(function($item) {
                    return $item->price * $item->quantity;
                });

                $commissionAmount = round(($sellerOrderTotal * $commissionRate) / 100, 2);
                $netAmount = $sellerOrderTotal - $commissionAmount;

                // ثبت تراکنش کسر کمیسیون
                \App\Models\SellerTransaction::create([
                    'seller_id' => $sellerId,
                    'order_id' => $order->id,
                    'type' => 'commission_deduction',
                    'amount' => $commissionAmount,
                    'description' => "کسر کمیسیون {$commissionRate}% از سفارش {$order->order_number}",
                    'status' => 'completed',
                ]);

                // ثبت تراکنش واریز به کیف پول
                \App\Models\SellerTransaction::create([
                    'seller_id' => $sellerId,
                    'order_id' => $order->id,
                    'type' => 'payout',
                    'amount' => $netAmount,
                    'description' => "واریز سهم فروشنده از سفارش {$order->order_number}",
                    'status' => 'completed',
                ]);

                $seller->increment('wallet_balance', $netAmount);
            }

            DB::commit();
            Log::info("Commission processed for order {$order->order_number}");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('خطا در پردازش کمیسیون: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * پردازش تسویه حساب فروشندگان پس از تکمیل/تحویل سفارش
     */
    public function processSellerPayouts(Model $order): void
    {
        if ($order->status === 'settled') {
            return; // جلوگیری از تسویه تکراری
        }

        $sellerItems = $order->items->groupBy('seller_id');
        $defaultCommissionRate = (float) config('azkla.default_commission_rate', 5.00);

        DB::beginTransaction();
        try {
            foreach ($sellerItems as $sellerId => $items) {
                if (!$sellerId) continue;

                $seller = User::find($sellerId);
                if (!$seller) continue;

                $commissionRate = (float) ($seller->seller_commission_rate ?? $defaultCommissionRate);
                $sellerOrderTotal = $items->sum(fn($item) => $item->price * $item->quantity);
                $commissionAmount = round(($sellerOrderTotal * $commissionRate) / 100, 2);
                $netAmount = $sellerOrderTotal - $commissionAmount;

                $seller->increment('wallet_balance', $netAmount);

                \App\Models\SellerTransaction::create([
                    'seller_id' => $sellerId,
                    'order_id' => $order->id,
                    'type' => 'final_payout',
                    'amount' => $netAmount,
                    'description' => "تسویه نهایی سفارش {$order->order_number} (مبلغ کل: {$sellerOrderTotal} | کسر کمیسیون {$commissionRate}%: {$commissionAmount})",
                    'status' => 'completed',
                ]);
            }

            $order->update(['status' => 'settled']);
            DB::commit();
            Log::info("تسویه حساب نهایی سفارش {$order->order_number} با موفقیت انجام شد.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('خطا در پردازش تسویه حساب نهایی: ' . $e->getMessage());
            throw $e;
        }
    }
}