<?php

namespace App\Repositories;

use App\Models\Order;
use App\Models\OrderItem;  // ✅ این خط اضافه شود
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class AdminRepository
{
    /**
     * Get users analysis data
     */
    public function getUsersAnalysis(?string $startDate, ?string $endDate): array
    {
        $query = User::query();

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $totalUsers = (clone $query)->count();
        $activeUsers = (clone $query)->where('is_active', true)->count();
        $buyers = (clone $query)->where('role', 'buyer')->count();
        $sellers = (clone $query)->where('role', 'seller')->count();
        $admins = (clone $query)->where('role', 'admin')->count();

        // Users by month
        $usersByMonth = (clone $query)
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return [
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'inactive_users' => $totalUsers - $activeUsers,
            'buyers' => $buyers,
            'sellers' => $sellers,
            'admins' => $admins,
            'users_by_month' => $usersByMonth,
        ];
    }

            /**
     * Get seller performance data
     */
    public function getSellerPerformance(?string $startDate, ?string $endDate, ?int $sellerId): array
    {
        $query = User::where('role', 'seller');

        if ($sellerId) {
            $query->where('id', $sellerId);
        }

        $sellers = $query->withCount('products')->get();

        $performance = $sellers->map(function ($seller) use ($startDate, $endDate) {
            // ✅ استفاده از OrderItem با seller_id
            $itemsQuery = \App\Models\OrderItem::where('seller_id', $seller->id);

            // فیلتر بر اساس تاریخ سفارش
            if ($startDate) {
                $itemsQuery->whereHas('order', function ($q) use ($startDate) {
                    $q->where('created_at', '>=', $startDate);
                });
            }

            if ($endDate) {
                $itemsQuery->whereHas('order', function ($q) use ($endDate) {
                    $q->where('created_at', '<=', $endDate);
                });
            }

            // فیلتر بر اساس وضعیت سفارش
            $itemsQuery->whereHas('order', function ($q) {
                $q->where('status', '!=', 'cancelled')
                  ->where('payment_status', 'paid');
            });

            $totalItems = (clone $itemsQuery)->sum('quantity');
            $totalRevenue = (clone $itemsQuery)->sum(DB::raw('price * quantity'));
            
            // تعداد سفارشات منحصر به فرد
            $totalOrders = (clone $itemsQuery)->distinct('order_id')->count('order_id');
            
            // سفارشات تکمیل شده
            $completedOrders = (clone $itemsQuery)
                ->whereHas('order', function ($q) {
                    $q->where('status', 'delivered');
                })
                ->distinct('order_id')
                ->count('order_id');

            return [
                'seller_id' => $seller->id,
                'shop_name' => $seller->shop_name ?? $seller->name,
                'products_count' => $seller->products_count,
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'total_revenue' => (float) $totalRevenue,
                'total_sold' => $totalItems,
                'average_order_value' => $totalOrders > 0 ? (float) ($totalRevenue / $totalOrders) : 0,
                'completion_rate' => $totalOrders > 0 ? round(($completedOrders / $totalOrders) * 100, 2) : 0,
            ];
        });

        // مرتب‌سازی بر اساس درآمد
        $sorted = $performance->sortByDesc('total_revenue')->values();

        // محاسبه میانگین‌ها
        $averages = [
            'revenue' => $sorted->avg('total_revenue') ?? 0,
            'sold' => $sorted->avg('total_sold') ?? 0,
            'rating' => $sorted->avg('rating') ?? 0,
        ];

        return [
            'sellers' => $sorted->map(function ($seller, $index) {
                $seller['rank'] = $index + 1;
                return $seller;
            }),
            'averages' => $averages,
            'total_sellers' => $sorted->count(),
        ];
    }

        /**
     * Get period comparison data
     */
    public function getPeriodComparison(string $period1Start, string $period1End, string $period2Start, string $period2End): array
    {
        // ✅ دوره جاری
        $period1Orders = Order::whereBetween('created_at', [$period1Start, $period1End])
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->count();

        $period1Revenue = Order::whereBetween('created_at', [$period1Start, $period1End])
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->sum('total');

        $period1Users = User::whereBetween('created_at', [$period1Start, $period1End])->count();
        
        $period1Products = Product::whereBetween('created_at', [$period1Start, $period1End])->count();

        // ✅ دوره قبلی
        $period2Orders = Order::whereBetween('created_at', [$period2Start, $period2End])
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->count();

        $period2Revenue = Order::whereBetween('created_at', [$period2Start, $period2End])
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->sum('total');

        $period2Users = User::whereBetween('created_at', [$period2Start, $period2End])->count();
        
        $period2Products = Product::whereBetween('created_at', [$period2Start, $period2End])->count();

        // ✅ محاسبه تغییرات
        $calcChange = function($current, $previous) {
            if ($previous == 0) return $current > 0 ? 100 : 0;
            return round((($current - $previous) / $previous) * 100, 2);
        };

        return [
            'current' => [
                'orders' => $period1Orders,
                'revenue' => (float) $period1Revenue,
                'users' => $period1Users,
                'products' => $period1Products,
            ],
            'previous' => [
                'orders' => $period2Orders,
                'revenue' => (float) $period2Revenue,
                'users' => $period2Users,
                'products' => $period2Products,
            ],
            'changes' => [
                'orders' => $calcChange($period1Orders, $period2Orders),
                'revenue' => $calcChange($period1Revenue, $period2Revenue),
                'users' => $calcChange($period1Users, $period2Users),
                'products' => $calcChange($period1Products, $period2Products),
            ],
        ];
    }

    /**
     * Get device analytics data
     */
    public function getDeviceAnalytics(?string $startDate, ?string $endDate): array
    {
        $query = DB::table('user_devices')
            ->join('phone_models', 'user_devices.phone_model_id', '=', 'phone_models.id')
            ->join('phone_series', 'phone_models.series_id', '=', 'phone_series.id')
            ->join('brands', function ($join) {
                $join->on('phone_models.brand_id', '=', 'brands.id')
                    ->whereNull('brands.deleted_at'); // ✅ کوئری خام: SoftDeletes اعمال نمی‌شود
            });

        if ($startDate) {
            $query->where('user_devices.created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('user_devices.created_at', '<=', $endDate);
        }

        $devices = $query
            ->select(
                'brands.name as brand_name',
                'phone_series.name as series_name',
                'phone_models.name as model_name',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('brands.name', 'phone_series.name', 'phone_models.name')
            ->orderByDesc('count')
            ->limit(20)
            ->get();

        // Devices by brand
        $devicesByBrand = DB::table('user_devices')
            ->join('phone_models', 'user_devices.phone_model_id', '=', 'phone_models.id')
            ->join('brands', function ($join) {
                $join->on('phone_models.brand_id', '=', 'brands.id')
                    ->whereNull('brands.deleted_at'); // ✅ کوئری خام: SoftDeletes اعمال نمی‌شود
            });

        if ($startDate) {
            $devicesByBrand->where('user_devices.created_at', '>=', $startDate);
        }

        if ($endDate) {
            $devicesByBrand->where('user_devices.created_at', '<=', $endDate);
        }

        $byBrand = $devicesByBrand
            ->select('brands.name as brand_name', DB::raw('COUNT(*) as count'))
            ->groupBy('brands.name')
            ->orderByDesc('count')
            ->get();

        return [
            'top_devices' => $devices,
            'devices_by_brand' => $byBrand,
            'total_devices' => DB::table('user_devices')->count(),
        ];
    }

        /**
     * Get basket analysis data
     */
    public function getBasketAnalysis(?string $startDate, ?string $endDate): array
    {
        // ✅ بررسی سفارشات با آیتم‌ها
        $query = Order::where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->with('items');

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $orders = $query->get();

        // ✅ محاسبه اندازه سبد خرید
        $basketSizes = $orders->map(function ($order) {
            return $order->items->count();
        });

        $avgBasketSize = $basketSizes->avg() ?? 0;
        $maxBasketSize = $basketSizes->max() ?? 0;
        $minBasketSize = $basketSizes->min() ?? 0;

        // ✅ توزیع اندازه سبد خرید
        $distribution = [
            '1_item' => $basketSizes->filter(fn($size) => $size === 1)->count(),
            '2_3_items' => $basketSizes->filter(fn($size) => $size >= 2 && $size <= 3)->count(),
            '4_5_items' => $basketSizes->filter(fn($size) => $size >= 4 && $size <= 5)->count(),
            '6_plus_items' => $basketSizes->filter(fn($size) => $size >= 6)->count(),
        ];

        // ✅ محاسبه میانگین ارزش سفارش
        $avgOrderValue = $orders->avg('total') ?? 0;

        // ✅ محصولات پرتکرار
        $frequentlyBought = OrderItem::select('product_id', DB::raw('COUNT(*) as frequency'))
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->where('status', '!=', 'cancelled')
                  ->where('payment_status', 'paid');
                
                if ($startDate) {
                    $q->where('created_at', '>=', $startDate);
                }
                if ($endDate) {
                    $q->where('created_at', '<=', $endDate);
                }
            })
            ->groupBy('product_id')
            ->orderByDesc('frequency')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $product = Product::find($item->product_id);
                return [
                    'product_id' => $item->product_id,
                    'product_name' => $product ? $product->name : 'محصول حذف شده',
                    'frequency' => $item->frequency,
                ];
            });

        return [
            'total_orders' => $orders->count(),
            'average_basket_size' => round($avgBasketSize, 2),
            'max_basket_size' => $maxBasketSize,
            'min_basket_size' => $minBasketSize,
            'avg_order_value' => round($avgOrderValue, 2),
            'distribution' => $distribution,
            'frequently_bought' => $frequentlyBought,
        ];
    }

       /**
     * Get product analytics data
     */
    public function getProductAnalytics(?string $startDate, ?string $endDate): array
    {
        $query = Product::query();

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $totalProducts = (clone $query)->count();
        $activeProducts = (clone $query)->where('is_active', true)->count();

        // ✅ Top products by sales (بدون فیلتر تاریخ)
        $topBySales = Product::where('is_active', true)
            ->orderByDesc('sales_count')
            ->limit(10)
            ->get(['id', 'name', 'sales_count', 'price', 'main_image']);

        // ✅ Top products by views
        $topByViews = Product::where('is_active', true)
            ->orderByDesc('views_count')
            ->limit(10)
            ->get(['id', 'name', 'views_count', 'price', 'main_image']);

        // ✅ Low stock products
        $lowStock = Product::where('stock', '<', 10)
            ->where('stock', '>', 0)
            ->where('is_active', true)
            ->limit(10)
            ->get(['id', 'name', 'stock', 'price', 'main_image']);

        // ✅ Out of stock products
        $outOfStock = Product::where('stock', 0)
            ->where('is_active', true)
            ->limit(10)
            ->get(['id', 'name', 'price', 'main_image']);

        // ✅ High conversion products (sales/views ratio)
        $highConversion = Product::where('is_active', true)
            ->where('views_count', '>', 0)
            ->where('sales_count', '>', 0)
            ->get()
            ->map(function ($product) {
                $product->conversion_rate = round(($product->sales_count / $product->views_count) * 100, 2);
                return $product;
            })
            ->sortByDesc('conversion_rate')
            ->take(10)
            ->values();

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'inactive_products' => $totalProducts - $activeProducts,
            'most_viewed' => $topByViews,
            'best_selling' => $topBySales,
            'low_stock' => $lowStock,
            'high_conversion' => $highConversion,
            'out_of_stock' => $outOfStock,
            'average_price' => round(Product::where('is_active', true)->avg('price'), 2),
        ];
    }

        /**
     * Get predictions data
     */
    public function getPredictions(): array
    {
        // ✅ محاسبه بر اساس داده‌های واقعی
        $last30Days = Order::where('created_at', '>=', now()->subDays(30))
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->count();

        $previous30Days = Order::whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->count();

        $growthRate = $previous30Days > 0
            ? round((($last30Days - $previous30Days) / $previous30Days) * 100, 2)
            : ($last30Days > 0 ? 10 : 0);

        // پیش‌بینی 7 روز آینده
        $predictions = [];
        $currentAvg = $last30Days > 0 ? round($last30Days / 30, 2) : 0;
        
        for ($i = 1; $i <= 7; $i++) {
            $date = now()->addDays($i)->toDateString();
            $predicted = round($currentAvg * (1 + ($growthRate / 100)), 2);
            
            $predictions[] = [
                'date' => $date,
                'predicted_revenue' => $predicted * 500000, // فرض: میانگین هر سفارش 500,000 تومان
                'confidence' => min(95, 70 + ($i * 2)), // اعتماد به نفس کاهش می‌یابد
            ];
        }

        $trend = $growthRate > 5 ? 'up' : ($growthRate < -5 ? 'down' : 'stable');

        return [
            'predictions' => $predictions,
            'current_avg' => $currentAvg,
            'trend' => $trend,
            'trend_percentage' => $growthRate,
            'historical_count' => $last30Days + $previous30Days,
        ];
    }

       /**
     * Get anomalies data
     */
    public function getAnomalies(): array
    {
        $anomalies = [];

        // ✅ بررسی افت شدید در سفارشات
        $last7Days = Order::where('created_at', '>=', now()->subDays(7))
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->count();

        $previous7Days = Order::whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])
            ->where('status', '!=', 'cancelled')
            ->where('payment_status', 'paid')
            ->count();

        if ($previous7Days > 0 && $last7Days < ($previous7Days * 0.5)) {
            $anomalies[] = [
                'type' => 'order_drop',
                'severity' => 'high',
                'message' => 'کاهش شدید سفارشات در 7 روز اخیر',
                'details' => [
                    'last_7_days' => $last7Days,
                    'previous_7_days' => $previous7Days,
                    'drop_percentage' => round((1 - ($last7Days / $previous7Days)) * 100, 2),
                ],
            ];
        }

        // ✅ بررسی محصولات با بازدید بالا اما فروش کم
        $highViewLowSale = Product::where('views_count', '>', 100)
            ->where('sales_count', '<', 5)
            ->where('is_active', true)
            ->limit(10)
            ->get(['id', 'name', 'views_count', 'sales_count']);

        if ($highViewLowSale->isNotEmpty()) {
            $anomalies[] = [
                'type' => 'conversion_issue',
                'severity' => 'medium',
                'message' => 'محصولات با بازدید بالا اما فروش کم',
                'details' => $highViewLowSale,
            ];
        }

        // ✅ بررسی محصولات پرفروش ناموجود
        $outOfStockPopular = Product::where('stock', 0)
            ->where('sales_count', '>', 50)
            ->where('is_active', true)
            ->limit(10)
            ->get(['id', 'name', 'sales_count']);

        if ($outOfStockPopular->isNotEmpty()) {
            $anomalies[] = [
                'type' => 'stock_issue',
                'severity' => 'high',
                'message' => 'محصولات پرفروش ناموجود',
                'details' => $outOfStockPopular,
            ];
        }

        // ✅ اگر هیچ ناهنجاری پیدا نشد، یک ناهنجاری نمونه اضافه کن
        if (empty($anomalies)) {
            $anomalies[] = [
                'type' => 'info',
                'severity' => 'low',
                'message' => 'هیچ ناهنجاری خاصی شناسایی نشد',
                'details' => [
                    'last_7_days_orders' => $last7Days,
                    'previous_7_days_orders' => $previous7Days,
                ],
            ];
        }

        return $anomalies;
    }

              /**
     * Get chat analytics data
     */
    public function getChatAnalytics(?string $startDate, ?string $endDate): array
    {
        try {
            $query = DB::table('conversations');

            if ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }

            if ($endDate) {
                $query->where('created_at', '<=', $endDate);
            }

            $totalConversations = (clone $query)->count();
            $activeConversations = (clone $query)->where('is_active', true)->count();

            $messagesCount = DB::table('messages');
            if ($startDate) {
                $messagesCount->where('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $messagesCount->where('created_at', '<=', $endDate);
            }
            $totalMessages = $messagesCount->count();

            // Average messages per conversation
            $avgMessages = $totalConversations > 0 ? round($totalMessages / $totalConversations, 2) : 0;

            // ✅ Conversations by activity (ساده‌تر بدون CASE)
            $byActivity = [
                ['status' => 'active', 'count' => $activeConversations],
                ['status' => 'inactive', 'count' => $totalConversations - $activeConversations],
            ];

            // ✅ Top sellers by conversations (بدون join پیچیده)
            $topSellers = (clone $query)
                ->select('seller_id', DB::raw('COUNT(*) as conversations_count'))
                ->groupBy('seller_id')
                ->orderByDesc('conversations_count')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    $seller = User::find($item->seller_id);
                    return [
                        'id' => $seller ? $seller->id : null,
                        'name' => $seller ? $seller->name : 'ناشناس',
                        'shop_name' => $seller ? ($seller->shop_name ?? $seller->name) : 'ناشناس',
                        'conversations_count' => $item->conversations_count,
                    ];
                });

            return [
                'total_conversations' => $totalConversations,
                'active_conversations' => $activeConversations,
                'inactive_conversations' => $totalConversations - $activeConversations,
                'total_messages' => $totalMessages,
                'average_messages_per_conversation' => $avgMessages,
                'by_status' => $byActivity,
                'top_sellers' => $topSellers,
            ];
        } catch (\Exception $e) {
            Log::error('AdminRepository@getChatAnalytics: ' . $e->getMessage());
            throw $e;
        }
    }
}