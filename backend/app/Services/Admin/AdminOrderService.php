<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\SellerTransaction;
use App\Models\User;
use App\Repositories\AdminOrderRepository;
use App\Services\Commission\CommissionService;
use App\Services\Permission\PermissionService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AdminOrderService
{
    protected AdminOrderRepository $repository;

    public function __construct(
        AdminOrderRepository $repository,
        protected CommissionService $commissionService,
        protected PermissionService $permissionService
    ) {
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
     *
     * ✅ Finance Isolation (Audit سیستم Role/Permission، بخش ۹/۲۷ درخواست
     * Multi-Admin): این متد وقتی وضعیت به delivered/completed می‌رود،
     * واقعاً processSellerPayouts را trigger می‌کند — یعنی پول واقعی
     * جابه‌جا می‌شود. middleware مسیر HTTP فقط orders.manage را چک
     * می‌کند (چون همین endpoint برای بقیه‌ی انتقال‌های بی‌ضرر هم استفاده
     * می‌شود)؛ اینجا، در Service layer، برای دقیقاً همین انتقال خاص
     * finance.payout هم اضافه چک می‌شود — طبق دستور صریح «کسی که فقط
     * Orders را مدیریت می‌کند نباید بتواند wallet/payout را کنترل کند».
     *
     * $actor عمداً nullable و پیش‌فرض null است: اگر ارائه نشود (مثلاً
     * فراخوانی مستقیم داخلی/تست بدون context کاربر) این چک اضافه به‌طور
     * کامل نادیده گرفته می‌شود — رفتار قبلی این متد برای چنین
     * فراخوانی‌هایی دست‌نخورده می‌ماند.
     */
    public function updateStatus(int $id, array $data, ?User $actor = null): Order
    {
        $order = Order::findOrFail($id);
        $oldStatus = $order->status;
        $willTriggerPayout = in_array($data['status'], ['completed', 'delivered'])
            && ! in_array($oldStatus, ['completed', 'delivered']);

        if ($willTriggerPayout && $actor !== null && ! $this->permissionService->userHasPermission($actor, 'finance.payout')) {
            throw new \Exception(
                'تغییر وضعیت به «تحویل‌شده/تکمیل‌شده» تسویه‌حساب فروشنده را trigger می‌کند و به Permission finance.payout نیاز دارد.',
                403
            );
        }

        try {
            $updateData = ['status' => $data['status']];

            if (isset($data['tracking_number'])) {
                $updateData['tracking_number'] = $data['tracking_number'];
            }
            if (isset($data['notes'])) {
                $updateData['notes'] = $data['notes'];
            }

            // اگر لغو شد، موجودی انبار را برگردان
            if ($data['status'] === 'cancelled' && $order->status !== 'cancelled') {
                $this->repository->restoreStock($order);
            }

            $updatedOrder = $this->repository->updateStatus($order, $updateData);

            // ✨ منطق جدید: پردازش تسویه حساب و کسر کمیسیون هنگام تکمیل یا تحویل سفارش
            if (in_array($data['status'], ['completed', 'delivered']) && !in_array($oldStatus, ['completed', 'delivered'])) {
                $this->processSellerPayouts($updatedOrder);
            }

            return $updatedOrder;
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
        $shippingAddress = $order->shipping_address;
        if (is_string($shippingAddress)) {
            $shippingAddress = json_decode($shippingAddress, true);
        }

        // وقتی items از قبل بارگذاری شده (مسیر لیست)، هر دو مقدار از همان
        // collection درمی‌آیند؛ در غیر این صورت به کوئری‌های تکی برمی‌گردیم.
        if ($order->relationLoaded('items')) {
            $sellers = $order->items
                ->pluck('seller')
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn ($seller) => [
                    'id' => $seller->id,
                    'name' => $seller->name,
                    'shop_name' => $seller->shop_name ?? $seller->name,
                ]);
            $itemsCount = (int) $order->items->sum('quantity');
        } else {
            $sellers = $this->repository->getOrderSellers($order->id);
            $itemsCount = $this->repository->getOrderItemsCount($order->id);
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

    // ==========================================================
    // ✨ پردازش تسویه حساب و کسر کمیسیون پلتفرم — سیستم کمیسیون هوشمند
    // ==========================================================
    /**
     * نرخ کمیسیون دیگر هاردکد ۵٪ نیست: از CommissionService خوانده می‌شود
     * که خودش اول override واقعی فروشنده را چک می‌کند، وگرنه بر اساس
     * Seller Score و Commission Rule فعلی تصمیم می‌گیرد (معماری کامل در
     * App\Services\Commission\CommissionService و
     * App\Services\Seller\SellerPerformanceService).
     *
     * نرخ/منبع/سطحِ واقعاً اعمال‌شده روی خودِ seller_transactions ثبت
     * می‌شود (ستون‌های commission_rate/commission_source/seller_level) تا
     * این تسویه‌ی خاص، حتی اگر بعداً Rule یا Score عوض شود، قابل توضیح
     * بماند — تسویه‌های قبلی هرگز دوباره محاسبه نمی‌شوند.
     *
     * ✅ رفع باگ واقعی: قبلاً type ثبت‌شده 'order_payout' بود که در
     * CHECK constraint واقعی ستون type (enum) وجود نداشت — یعنی هر بار این
     * متد اجرا می‌شد، INSERT با Integrity constraint violation شکست
     * می‌خورد، کل تراکنش rollback می‌شد، wallet_balance هرگز واقعاً افزایش
     * نمی‌یافت و seller_transactions هرگز واقعاً ثبت نمی‌شد — فقط چون
     * catch بیرونی خطا را بی‌صدا لاگ می‌کرد (و به عمد throw نمی‌کرد تا
     * تغییر وضعیت سفارش مختل نشود)، این هیچ‌وقت به سطح کاربر/ادمین به شکل
     * خطای قابل‌مشاهده نمی‌رسید. الان از مقدار معتبر enum ('payout')
     * استفاده می‌شود.
     *
     * ✅ Race condition: قفل ردیف سفارش (lockForUpdate) + بررسی
     * idempotency (آیا برای همین سفارش/فروشنده قبلاً payout ثبت شده) با
     * هم تضمین می‌کنند که دو درخواست هم‌زمان (مثلاً دوبار کلیک سریع روی
     * «تحویل شد») هرگز باعث دو بار افزایش wallet_balance یا دو ردیف
     * seller_transactions تکراری نشوند.
     */
    protected function processSellerPayouts(Order $order): void
    {
        DB::beginTransaction();
        try {
            // قفل ردیف سفارش تا پایان تراکنش — درخواست هم‌زمان دوم تا
            // commit همین تراکنش صبر می‌کند، بعد idempotency check زیر آن
            // را متوقف می‌کند.
            $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->first();
            if (! $lockedOrder) {
                DB::rollBack();
                return;
            }

            $sellerItems = $order->items->groupBy('seller_id');

            foreach ($sellerItems as $sellerId => $items) {
                // اگر آیتم متعلق به خود پلتفرم است (seller_id ندارد)، از محاسبات رد می‌شود
                if (! $sellerId) {
                    continue;
                }

                $alreadyPaid = SellerTransaction::where('order_id', $order->id)
                    ->where('seller_id', $sellerId)
                    ->where('type', 'payout')
                    ->exists();
                if ($alreadyPaid) {
                    continue;
                }

                $seller = \App\Models\User::find($sellerId);
                if (! $seller) {
                    continue;
                }

                // ۱. تعیین نرخ کمیسیون واقعی این فروشنده (override → Score/Rule → پیش‌فرض)
                $resolved = $this->commissionService->resolveCommissionRate($seller);
                $commissionRate = $resolved['rate'];

                // ۲. محاسبه مبلغ کل این فروشنده در این سفارش
                $sellerOrderTotal = (float) $items->sum('total');

                // ۳. محاسبه کمیسیون و مبلغ خالص (rounding سازگار با بقیه‌ی کدبیس: round به ۲ رقم اعشار)
                $commissionAmount = round(($sellerOrderTotal * $commissionRate) / 100, 2);
                $netAmount = round($sellerOrderTotal - $commissionAmount, 2);

                // ۴. افزایش موجودی کیف پول فروشنده — increment() خودش atomic است
                \App\Models\User::where('id', $sellerId)->increment('wallet_balance', $netAmount);

                // ۵. ثبت تراکنش شفاف و قابل‌ممیزی برای فروشنده
                SellerTransaction::create([
                    'seller_id' => $sellerId,
                    'order_id' => $order->id,
                    'type' => 'payout',
                    'amount' => $netAmount,
                    'commission_deducted' => (int) round($commissionAmount), // ستون فعلی unsignedBigInteger است
                    'commission_rate' => $commissionRate,
                    'commission_source' => $resolved['source'],
                    'seller_level' => $resolved['level'],
                    'status' => 'completed',
                    'description' => "واریز سهم فروش سفارش شماره {$order->order_number} (کسر کمیسیون {$commissionRate}%)",
                ]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('خطا در پردازش تسویه حساب فروشندگان: '.$e->getMessage());
            // توجه: اینجا Exception را پرتاب نمی‌کنیم تا فرآیند تغییر وضعیت سفارش مختل نشود،
            // اما در لاگ ثبت می‌شود تا ادمین بتواند آن را بررسی کند.
        }
    }
}