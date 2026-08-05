<?php

namespace App\Services\Order;

use App\DTOs\Order\CreateOrderDTO;
use App\Events\Order\OrderCreated;
use App\Exceptions\OutOfStockException;
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

    public function getUserOrders(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->orderRepository->getUserOrders($userId, $perPage);
    }

    public function getOrderDetails(int $orderId, ?int $userId = null): array
    {
        $order = $this->orderRepository->getOrderWithDetails($orderId, $userId);

        if (!$order) {
            throw new \Exception('سفارش یافت نشد', 404);
        }

        return $this->formatOrderData($order);
    }

                public function createOrder(CreateOrderDTO $dto): Model
    {
        $errors = $dto->validate();
        if (!empty($errors)) {
            throw new \Exception(implode(', ', $errors), 422);
        }

        return DB::transaction(function () use ($dto) {
            $validatedItems = $this->validateAndPrepareItems($dto->items);
            $totals = $this->calculateTotals($validatedItems);
            $orderNumber = $this->generateOrderNumber();

            // ✅ دریافت اطلاعات آدرس برای ذخیره در shipping_address (JSON)
            $addressData = [];
            if ($dto->address_id) {
                $address = \App\Models\Address::find($dto->address_id);
                if ($address) {
                    $addressData = [
                        'id' => $address->id,
                        'full_name' => $address->full_name,
                        'phone' => $address->phone,
                        'province' => $address->province,
                        'city' => $address->city,
                        'address' => $address->address,
                        'postal_code' => $address->postal_code,
                    ];
                }
            }

            $orderData = [
                'user_id' => $dto->user_id,
                'order_number' => $orderNumber,
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'shipping' => $totals['shipping_cost'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $dto->payment_method,
                'notes' => $dto->note,
                // Order::$casts['shipping_address'] = 'array' خودش انکود می‌کند؛
                // انکود دستی دیگر اینجا لازم نیست (قبلاً باعث دو-بار-انکود می‌شد).
                'shipping_address' => $addressData,
            ];

            $order = $this->orderRepository->createOrderWithItems($orderData, $validatedItems);
            $this->updateProductStock($validatedItems);
            $this->clearUserCart($dto->user_id);

            Log::info("Order created: {$orderNumber} for user {$dto->user_id}");
            
            OrderCreated::dispatch($order);

            return $order;
        });
    }

    /**
     * ✅ ساخت سفارش از سبد خرید فعلی کاربر — مسیر واقعیِ چک‌اوت.
     *
     * OrderController::store() از قبل دقیقاً به همین امضا (کاربر، سبد،
     * آرایه‌ی خام shipping_address، روش پرداخت) وابسته بود و این متد را
     * صدا می‌زد، ولی این متد اصلاً وجود نداشت — یعنی هر تلاش واقعی برای
     * ثبت سفارش با یک خطای PHP «Call to undefined method» (که چون
     * \Error است نه \Exception، حتی توسط catch (\Exception $e) هم در
     * کنترلر گرفته نمی‌شد) کرش می‌کرد. متد createOrder()/CreateOrderDTO
     * که در همین فایل بود، یک مسیر جداگانه و کاملاً بلااستفاده بود
     * (بر پایه‌ی address_id، نه آرایه‌ی خام آدرس که فرم چک‌اوت واقعاً
     * می‌فرستد) — هیچ کنترلری صداش نمی‌زد.
     */
    public function createOrderFromCart(User $user, Cart $cart, array $shippingAddress, string $paymentMethod): Model
    {
        $cart->loadMissing('items');

        if ($cart->items->isEmpty()) {
            throw new OutOfStockException('سبد خرید شما خالی است.');
        }

        $items = $cart->items->map(fn ($item) => [
            'product_id' => $item->product_id,
            'quantity' => $item->quantity,
        ])->all();

        return DB::transaction(function () use ($user, $cart, $items, $shippingAddress, $paymentMethod) {
            $validatedItems = $this->validateAndPrepareItems($items);
            $totals = $this->calculateTotals($validatedItems);
            $orderNumber = $this->generateOrderNumber();

            $orderData = [
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'shipping' => $totals['shipping_cost'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $paymentMethod,
                // Order::$casts['shipping_address'] = 'array' خودش انکود می‌کند.
                'shipping_address' => $shippingAddress,
            ];

            $order = $this->orderRepository->createOrderWithItems($orderData, $validatedItems);
            $this->updateProductStock($validatedItems);

            // ✅ فقط آیتم‌های همین سبد پاک شوند، نه clearUserCart() که یک
            // کوئری جدای Cart::where('user_id', ...) می‌زند — ما همین الان
            // خودِ سبد را در دست داریم.
            $cart->items()->delete();

            Log::info("Order created: {$orderNumber} for user {$user->id}");

            OrderCreated::dispatch($order);

            return $order;
        });
    }

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
            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                Product::where('id', $item->product_id)->decrement('sales_count', $item->quantity);
            }

            return $this->orderRepository->updateStatus($orderId, 'cancelled');
        });
    }

    public function getUserStats(int $userId): array
    {
        return $this->orderRepository->getUserStats($userId);
    }

       protected function validateAndPrepareItems(array $items): array
    {
        $validatedItems = [];
        $productIds = array_column($items, 'product_id');
        
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        foreach ($items as $item) {
            $product = $products->get($item['product_id']);

            if (!$product) {
                throw new \Exception("محصول با شناسه {$item['product_id']} یافت نشد", 404);
            }
            if (!$product->is_active) {
                throw new \Exception("محصول {$product->name} دیگر فعال نیست", 400);
            }
            if ($product->stock < $item['quantity']) {
                // ✅ قبلاً \Exception عمومی بود، پس در OrderController::store()
                // به catch (OutOfStockException) نمی‌رسید و کاربر به‌جای پیام
                // دقیق «موجودی کافی نیست»، خطای عمومی ۵۰۰ می‌دید.
                throw new OutOfStockException(
                    "موجودی {$product->name} کافی نیست. موجودی فعلی: {$product->stock}"
                );
            }

            // ✅ محاسبه total با در نظر گرفتن تخفیف
            $subtotal = $product->price * $item['quantity'];
            $discount = $product->discount_percentage ?? 0;
            $total = $subtotal * (1 - ($discount / 100));

            $validatedItems[] = [
                'product_id' => $product->id,
                'quantity' => $item['quantity'],
                'price' => $product->price,
                'discount_percentage' => $discount,
                'seller_id' => $product->seller_id,
                'total' => $total, // ✅ اضافه شد
            ];
        }

        return $validatedItems;
    }

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
        
        // ✅ اصلاح تایپو: azkla -> azkala
        $freeShippingThreshold = (float) config('azkala.free_shipping_threshold', 500000);
        $defaultShippingCost = (float) config('azkala.default_shipping_cost', 50000);
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

    protected function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'AZK-' . strtoupper(Str::random(8));
            $exists = $this->orderRepository->findBy('order_number', $orderNumber);
        } while ($exists);

        return $orderNumber;
    }

       protected function updateProductStock(array $items): void
    {
        foreach ($items as $item) {
            // ✅ اصلاح: استفاده مستقیم از کلاس Product به جای getModel()
            Product::where('id', $item['product_id'])
                ->decrement('stock', $item['quantity']);
            
            Product::where('id', $item['product_id'])
                ->increment('sales_count', $item['quantity']);
        }
    }

    protected function clearUserCart(int $userId): void
    {
        $cart = Cart::where('user_id', $userId)->first();
        if ($cart) {
            $cart->items()->delete();
        }
    }

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

    public function processCommission(Model $order): void
    {
        $sellerItems = $order->items->groupBy('seller_id');
        // ✅ اصلاح تایپو: azkla -> azkala
        $defaultCommissionRate = (float) config('azkala.default_commission_rate', 5.00);

        DB::beginTransaction();
        try {
            foreach ($sellerItems as $sellerId => $items) {
                if (!$sellerId) continue;

                $seller = User::find($sellerId);
                if (!$seller || $seller->role !== 'seller') continue;

                $commissionRate = (float) ($seller->seller_commission_rate ?? $defaultCommissionRate);
                $sellerOrderTotal = $items->sum(fn($item) => $item->price * $item->quantity);
                $commissionAmount = round(($sellerOrderTotal * $commissionRate) / 100, 2);
                $netAmount = $sellerOrderTotal - $commissionAmount;

                \App\Models\SellerTransaction::create([
                    'seller_id' => $sellerId,
                    'order_id' => $order->id,
                    'type' => 'commission_deduction',
                    'amount' => $commissionAmount,
                    'description' => "کسر کمیسیون {$commissionRate}% از سفارش {$order->order_number}",
                    'status' => 'completed',
                ]);

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

    public function processSellerPayouts(Model $order): void
    {
        if ($order->status === 'settled') {
            return;
        }

        $sellerItems = $order->items->groupBy('seller_id');
        $defaultCommissionRate = (float) config('azkala.default_commission_rate', 5.00);

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