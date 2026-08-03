<?php

namespace App\Services\Seller;

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SellerRating;
use App\Models\SellerQuickReply;
use App\Models\User;
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

    public function createProduct(int $sellerId, array $data): Product
    {
        $data['seller_id'] = $sellerId;
        return Product::create($data);
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

        $product->update($data);

        if (isset($data['device_model_ids'])) {
            $product->deviceModels()->sync($data['device_model_ids']);
        } else {
            $product->deviceModels()->sync([]);
        }

        return $product->fresh()->load(['category', 'brand', 'deviceModels']);
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
            ->with(['category', 'brand'])
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
        // بررسی اینکه آیا کاربر قبلاً به این سفارش نظر داده یا خیر
        $existingRating = \App\Models\SellerRating::where('order_id', $data['order_id'])->first();
        if ($existingRating) {
            throw new \Exception('شما قبلاً برای این سفارش نظر ثبت کرده‌اید.', 400);
        }

        // محاسبه میانگین کلی
        $data['overall_rating'] = round(
            ($data['product_quality'] + $data['shipping_speed'] + $data['communication']) / 3, 
            1
        );
        $data['user_id'] = $userId;

        return \App\Models\SellerRating::create($data);
    }
    }
