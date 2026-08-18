<?php

namespace App\Services\Seller;

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SellerRating;
use App\Models\SellerQuickReply;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
        // ۱. آمار محصولات
        $totalProducts = \App\Models\Product::where('seller_id', $sellerId)->count();
        $activeProducts = \App\Models\Product::where('seller_id', $sellerId)->where('is_active', true)->count();

        // کوئری پایه: تمام سفارشاتی که حداقل یک آیتم متعلق به این فروشنده دارد و لغو نشده‌اند
        $baseQuery = \App\Models\Order::whereHas('items', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        })->whereNotIn('status', ['cancelled']);

        // ۲. آمار سفارشات
        $totalSales = (clone $baseQuery)->count();
        // سفارشات در انتظار: شامل pending و processing
        $pendingOrders = (clone $baseQuery)->whereIn('status', ['pending', 'processing'])->count();

        // ۳. آمار مالی (بدون محدودیت payment_status تا فروشنده درآمد در انتظار را هم ببیند)
        // ✅ در تمام کوئری‌های زیر whereNull('orders.deleted_at') لازم است چون
        // global scope مربوط به SoftDeletes فقط روی مدل اصلی (OrderItem) اعمال
        // می‌شود، نه روی جدول join‌شده (orders).
        $totalRevenue = \App\Models\OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('order_items.seller_id', $sellerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereNull('orders.deleted_at')
            ->sum(\Illuminate\Support\Facades\DB::raw('order_items.quantity * order_items.price'));

        // در انتظار تسویه (سفارشات پردازش شده، ارسال شده یا تحویل داده شده)
        $pendingSettlements = \App\Models\OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('order_items.seller_id', $sellerId)
            ->whereIn('orders.status', ['processing', 'shipped', 'delivered'])
            ->whereNull('orders.deleted_at')
            ->sum(\Illuminate\Support\Facades\DB::raw('order_items.quantity * order_items.price'));

               // ۴. فروش ماهانه (۶ ماه اخیر) - سازگار با MySQL و SQLite
        $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
        
        // تشخیص دیتابیس و انتخاب تابع صحیح استخراج ماه
        $monthFormat = $driver === 'sqlite' 
            ? "strftime('%Y-%m', orders.created_at)" 
            : "DATE_FORMAT(orders.created_at, '%Y-%m')";

        $monthlySales = \App\Models\OrderItem::select(
                \Illuminate\Support\Facades\DB::raw("{$monthFormat} as month"),
                \Illuminate\Support\Facades\DB::raw('SUM(order_items.quantity) as sales'),
                \Illuminate\Support\Facades\DB::raw('SUM(order_items.quantity * order_items.price) as revenue')
            )
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('order_items.seller_id', $sellerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereNull('orders.deleted_at')
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(6)
            ->get()
            ->reverse()
            ->map(fn($item) => [
                'month' => $item->month,
                'sales' => (int) $item->sales,
                'revenue' => (float) $item->revenue,
            ]);
            
        // ۵. محصولات پرفروش
        $topProducts = \App\Models\OrderItem::select(
                'order_items.product_id',
                'products.name',
                'products.main_image as image',
                \Illuminate\Support\Facades\DB::raw('SUM(order_items.quantity) as sales'),
                \Illuminate\Support\Facades\DB::raw('SUM(order_items.quantity * order_items.price) as revenue')
            )
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('order_items.seller_id', $sellerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereNull('orders.deleted_at')
            ->groupBy('order_items.product_id', 'products.name', 'products.main_image')
            ->orderByDesc('sales')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'id' => $item->product_id,
                'name' => $item->name,
                'image' => $item->image,
                'sales' => (int) $item->sales,
                'revenue' => (float) $item->revenue,
            ]);

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'total_orders' => $totalSales,
            'total_sales' => $totalSales,
            'total_revenue' => (float) $totalRevenue,
            'pending_orders' => $pendingOrders,
            'pending_settlements' => (float) $pendingSettlements,
            'monthly_sales' => $monthlySales,
            'top_products' => $topProducts,
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

    /**
     * کلیدهایی که از فرم می‌آیند ولی ستون جدول محصولات نیستند.
     *
     * device_model_ids ورودی جدول واسط است. تا حالا مستقیم به create/update
     * می‌رفت و Eloquent بی‌صدا دورش می‌ریخت؛ یعنی درست کار می‌کرد ولی فقط
     * تصادفی — با فعال شدن preventSilentlyDiscardingAttributes خطا می‌شود.
     */
    // ✅ Variant/Color System فاز ۲.۱: variants هم مثل device_model_ids یک
    // کلید غیرستونی است (رابطه‌ی جدا، نه ستون products) — باید قبل از
    // Product::create/update حذف شود، وگرنه با preventSilentlyDiscarding
    // Attributes همان کرش قدیمیِ device_model_ids را برای variants هم
    // تکرار می‌کرد.
    private const NON_COLUMN_KEYS = ['device_model_ids', 'variants'];

    // ✅ فقط ستون‌های واقعیِ product_variants که فروشنده مجاز به تعیین آن‌ها
    // است — عمداً id/product_id/created_at/... اینجا نیستند. price/stock
    // هرگز محاسبه‌شده (final_price/is_in_stock) از کلاینت پذیرفته نمی‌شوند؛
    // این‌ها فقط accessor های سمت پاسخ‌اند (ProductVariantResource)، نه
    // فیلد ورودی.
    private const VARIANT_FILLABLE_KEYS = [
        'color_name', 'color_code', 'sku', 'price', 'compare_price',
        'discount_price', 'stock', 'image', 'attributes',
    ];

    public function createProduct(int $sellerId, array $data): Product
    {
        $data['seller_id'] = $sellerId;

        return DB::transaction(function () use ($data) {
            $product = Product::create(Arr::except($data, self::NON_COLUMN_KEYS));

            // ✅ محصول تازه‌ساخته‌شده هرگز variant قبلی ندارد — پس اینجا
            // فقط create لازم است، نه sync/delete کامل که updateProduct
            // پایین‌تر انجام می‌دهد.
            if (! empty($data['variants'])) {
                $this->createProductVariants($product, $data['variants']);
            }

            return $product;
        });
    }

    public function updateProduct(int $productId, int $sellerId, array $data): Product
    {
        $product = Product::where('id', $productId)
            ->where('seller_id', $sellerId)
            ->firstOrFail();

        if (isset($data['name']) && $data['name'] !== $product->name) {
            $baseSlug = Str::slug($data['name']);
            $slug = $baseSlug;
            $count = 1;
            while (Product::where('slug', $slug)->where('id', '!=', $productId)->exists()) {
                $slug = $baseSlug . '-' . $count;
                $count++;
            }
            $data['slug'] = $slug;
        }

        DB::transaction(function () use ($product, $data) {
            $product->update(Arr::except($data, self::NON_COLUMN_KEYS));

            if (isset($data['device_model_ids'])) {
                $product->deviceModels()->sync($data['device_model_ids']);
            } else {
                $product->deviceModels()->sync([]);
            }

            // ✅ فقط وقتی کلید variants واقعاً در payload حاضر است sync
            // انجام می‌شود — طبق قانون صریح: عدم ارسال variants نباید
            // variantهای موجود را پاک کند (برخلاف device_model_ids که
            // نبودش یعنی «همه را پاک کن»، اینجا عمداً رفتار متفاوت است
            // چون device_model_ids از اول یک many-to-many کامل-جایگزین
            // بوده، ولی variants یک قابلیت تازه است که اکثر فراخوان‌های
            // فعلی update اصلاً از آن خبر ندارند).
            if (array_key_exists('variants', $data)) {
                $this->syncProductVariants($product, $data['variants'] ?? []);
            }
        });

        return $product->fresh()->load(['category', 'brand', 'deviceModels', 'variants']);
    }

    /**
     * ✅ Variant/Color System فاز ۲.۱: ایجاد گروهی variant برای یک محصول
     * تازه‌ساخته‌شده. مالکیت این‌جا خودکار تضمین است چون $product همین
     * الان با seller_id درخواست‌کننده ساخته شده.
     */
    private function createProductVariants(Product $product, array $variantsData): void
    {
        $this->assertNoDuplicateSkusOrColors($variantsData);

        foreach ($variantsData as $variantData) {
            $payload = Arr::only($variantData, self::VARIANT_FILLABLE_KEYS);
            $this->assertSkuIsGloballyUnique($payload['sku'] ?? null, null);
            $product->variants()->create($payload);
        }
    }

    /**
     * ✅ Variant/Color System فاز ۲.۱: sync کامل — طبق تصمیم صریحِ گزارش
     * فاز قبل (Option A: variants[] به‌عنوان کل مجموعه‌ی جایگزین).
     *
     * - آیتم با 'id': فقط اگر واقعاً از طریق رابطه‌ی همین محصول
     *   ($product->variants()) پیدا شود آپدیت می‌شود — این دقیقاً همان
     *   کنترل IDOR است (نه یک مقایسه‌ی دستی seller_id، بلکه scope خودِ
     *   کوئری روی محصولی که مالکیتش از قبل در updateProduct احراز شده).
     *   id ای که به این محصول تعلق ندارد => خطای واضح، نه نادیده‌گرفتن
     *   خاموش (که می‌توانست یک تلاش IDOR را بی‌صدا قورت بدهد).
     * - آیتم بدون 'id': variant جدید.
     * - variant موجودی که در payload جدید نیامده: soft-delete صریح.
     */
    private function syncProductVariants(Product $product, array $variantsData): void
    {
        $this->assertNoDuplicateSkusOrColors($variantsData);

        $keptIds = [];

        foreach ($variantsData as $variantData) {
            $payload = Arr::only($variantData, self::VARIANT_FILLABLE_KEYS);
            $variantId = $variantData['id'] ?? null;

            if ($variantId) {
                // ✅ IDOR guard: کوئری از طریق رابطه‌ی محصول، نه
                // ProductVariant::find($id) خام.
                $variant = $product->variants()->find($variantId);
                if (! $variant) {
                    $this->throwVariantValidationError("variant با شناسه {$variantId} متعلق به این محصول نیست.");
                }

                $this->assertSkuIsGloballyUnique($payload['sku'] ?? null, $variant->id);
                $variant->update($payload);
                $keptIds[] = $variant->id;
            } else {
                $this->assertSkuIsGloballyUnique($payload['sku'] ?? null, null);
                $newVariant = $product->variants()->create($payload);
                $keptIds[] = $newVariant->id;
            }
        }

        // ✅ هر variant موجودِ این محصول که در payload جدید نبود، عمداً
        // حذف شده تلقی می‌شود (soft-delete — طبق SoftDeletes مدل).
        $product->variants()->whereNotIn('id', $keptIds)->delete();
    }

    /**
     * ✅ جلوگیری از تعریف دو variant با SKU یکسان یا رنگ یکسان در همان
     * payload (پیش از رسیدن به DB) — طبق دستور صریح «prevent duplicate
     * variant definitions».
     */
    private function assertNoDuplicateSkusOrColors(array $variantsData): void
    {
        $skus = [];
        $colors = [];

        foreach ($variantsData as $variantData) {
            $sku = isset($variantData['sku']) ? trim((string) $variantData['sku']) : null;
            if ($sku !== null && $sku !== '') {
                if (in_array($sku, $skus, true)) {
                    $this->throwVariantValidationError("SKU تکراری در همین درخواست: {$sku}");
                }
                $skus[] = $sku;
            }

            $color = isset($variantData['color_name']) ? trim((string) $variantData['color_name']) : null;
            if ($color !== null && $color !== '') {
                if (in_array($color, $colors, true)) {
                    $this->throwVariantValidationError("رنگ تکراری در همین درخواست: {$color}");
                }
                $colors[] = $color;
            }
        }
    }

    /**
     * ✅ همان قرارداد یکتاییِ سراسری products.sku (نه فقط در محدوده‌ی یک
     * محصول) — تأیید شده با خواندن مستقیم migration جدول products.
     */
    private function assertSkuIsGloballyUnique(?string $sku, ?int $ignoreVariantId): void
    {
        if ($sku === null || $sku === '') {
            return;
        }

        $query = \App\Models\ProductVariant::where('sku', $sku);
        if ($ignoreVariantId) {
            $query->where('id', '!=', $ignoreVariantId);
        }

        if ($query->exists()) {
            $this->throwVariantValidationError("SKU «{$sku}» قبلاً برای رنگ دیگری استفاده شده است.");
        }
    }

    private function throwVariantValidationError(string $message): void
    {
        throw \Illuminate\Validation\ValidationException::withMessages(['variants' => $message]);
    }

    public function deleteProduct(int $productId, int $sellerId): bool
    {
        $product = Product::where('id', $productId)
            ->where('seller_id', $sellerId)
            ->firstOrFail();

        return $product->delete();
    }

    public function getSellerProductHistory(int $productId, int $sellerId)
    {
        $product = Product::where('id', $productId)
            ->where('seller_id', $sellerId)
            ->first();

        if (!$product) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('محصول یافت نشد یا متعلق به شما نیست.');
        }

        return \App\Models\ProductHistory::where('product_id', $productId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($history) {
                return [
                    'id' => $history->id,
                    'field' => $history->field === 'price' ? 'قیمت' : 'موجودی',
                    'old_value' => $history->old_value,
                    'new_value' => $history->new_value,
                    'created_at' => $history->created_at->diffForHumans(),
                ];
            });
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
            // ✅ Variant/Color System فاز ۲.۲: فرم ویرایش فروشنده باید
            // بتواند رنگ‌های موجود محصول را از همین یک درخواست پر کند.
            ->with(['category', 'brand', 'variants'])
            ->first();

        if (!$product) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('محصول یافت نشد یا متعلق به شما نیست.');
        }

        return $product;
    }
        /**
     * دریافت جزئیات یک سفارش متعلق به فروشنده
     */
    public function getSellerOrderDetail(int $orderId, int $sellerId)
    {
        // پیدا کردن سفارشی که حداقل یکی از آیتم‌های آن متعلق به این فروشنده باشد
        $order = \App\Models\Order::whereHas('items', function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId);
            })
            ->where('id', $orderId)
            ->with(['items.product', 'user']) // لود کردن محصولات و اطلاعات کاربر
            ->first();

        if (!$order) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('سفارش یافت نشد یا متعلق به شما نیست.');
        }

        return $order;
    }
        /**
     * بروزرسانی وضعیت سفارش و ثبت اطلاعات ارسال (کد رهگیری و نام پست)
     */
    public function updateOrderStatusWithTracking(int $orderId, int $sellerId, array $data)
    {
        // ۱. اطمینان از اینکه سفارش وجود دارد و متعلق به همین فروشنده است
        $order = \App\Models\Order::where('id', $orderId)
            ->whereHas('items', function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId);
            })
            ->first();

        if (!$order) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('سفارش یافت نشد یا متعلق به شما نیست.');
        }

        // ۲. آماده‌سازی داده‌ها برای به‌روزرسانی
        $updateData = [];
        
        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
            
            // اگر وضعیت به "ارسال شده" تغییر کرد، تاریخ ارسال را هم ثبت کن
            if ($data['status'] === 'shipped') {
                $updateData['shipped_at'] = now();
            }
        }
        
        if (isset($data['tracking_number'])) {
            $updateData['tracking_number'] = $data['tracking_number'];
        }
        
        if (isset($data['courier_name'])) {
            $updateData['courier_name'] = $data['courier_name'];
        }

        // ۳. به‌روزرسانی و بازگرداندن سفارش جدید
        $order->update($updateData);
        
        return $order->fresh();
    }
        /**
     * ثبت نظر و امتیاز جدید برای فروشنده
     */
   public function createRating(int $userId, array $data)
{
    // ✅ بررسی اینکه آیا کاربر قبلاً به این سفارش نظر داده یا خیر
    $existingRating = \App\Models\SellerRating::where('order_id', $data['order_id'])->first();
    if ($existingRating) {
        throw new \Exception('شما قبلاً برای این سفارش نظر ثبت کرده‌اید.', 400);
    }

    // ✅ بررسی مالکیت سفارش و وضعیت delivered
    $order = \App\Models\Order::where('id', $data['order_id'])
        ->where('user_id', $userId)
        ->first();

    if (!$order) {
        throw new \Exception('سفارش یافت نشد یا متعلق به شما نیست.', 404);
    }

    if ($order->status !== 'delivered') {
        throw new \Exception('فقط برای سفارش‌های تحویل‌داده‌شده می‌توانید نظر ثبت کنید.', 400);
    }

    // ✅ محاسبه overall_rating از میانگین سه معیار
    $data['overall_rating'] = round(
        ($data['product_quality'] + $data['shipping_speed'] + $data['communication']) / 3,
        1
    );
    $data['user_id'] = $userId;

    // ✅ ثبت امتیاز در seller_ratings
    $rating = \App\Models\SellerRating::create($data);

    // 🔥 **Fix کلیدی**: محاسبه و آپدیت میانگین seller_rating در users table
    $this->updateSellerRating((int) $data['seller_id']);

    // ✅ پاک کردن cache پروفایل فروشنده
    try {
        $seller = \App\Models\User::find($data['seller_id']);
        if ($seller && $seller->slug) {
            \Illuminate\Support\Facades\Cache::forget("public_seller_profile_{$seller->slug}");
        }
    } catch (\Exception $e) {
        // cache clear نباید مانع ثبت امتیاز شود
        Log::warning('Failed to clear seller cache: ' . $e->getMessage());
    }

    return $rating;
}

/**
 * محاسبه و آپدیت میانگین امتیاز فروشنده در users.seller_rating
 *
 * این متد بعد از هر ثبت/حذف امتیاز صدا زده می‌شود تا
 * ستون denormalized users.seller_rating همیشه به‌روز باشد.
 * این باعث می‌شود SellerCard، ProductDetail، SellerPage و TopSellersSection
 * همه بدون محاسبه مجدد، امتیاز دقیق را نمایش دهند.
 */
public function updateSellerRating(int $sellerId): void
{
    $avg = \App\Models\SellerRating::where('seller_id', $sellerId)->avg('overall_rating');

    \App\Models\User::where('id', $sellerId)->update([
        'seller_rating' => $avg ? round($avg, 2) : 0,
    ]);
}
    }
