<?php

namespace App\Services\Admin;

use App\Repositories\AdminReportRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class AdminReportService
{
    protected AdminReportRepository $repository;

    public function __construct(AdminReportRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get overview statistics
     */
    public function getOverview(): array
    {
        try {
            return $this->repository->getOverview();
        } catch (\Exception $e) {
            Log::error('AdminReportService@getOverview: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت آمار کلی', 500);
        }
    }

    /**
     * Get dashboard KPIs
     */
    public function getDashboardKPIs(int $period = 30): array
    {
        try {
            $current = $this->repository->getCurrentPeriodKPIs($period);
            $previous = $this->repository->getPreviousPeriodKPIs($period);

            $calcChange = function($current, $prev) {
                if ($prev == 0) return $current > 0 ? 100 : 0;
                return round((($current - $prev) / $prev) * 100, 1);
            };

            return [
                'period' => $period,
                'kpis' => [
                    'orders' => [
                        'current' => $current['orders'],
                        'previous' => $previous['orders'],
                        'change' => $calcChange($current['orders'], $previous['orders']),
                    ],
                    'revenue' => [
                        'current' => $current['revenue'],
                        'previous' => $previous['revenue'],
                        'change' => $calcChange($current['revenue'], $previous['revenue']),
                    ],
                    'avg_order' => [
                        'current' => $current['avg_order'],
                        'previous' => $previous['avg_order'],
                        'change' => $calcChange($current['avg_order'], $previous['avg_order']),
                    ],
                    'users' => [
                        'current' => $current['users'],
                        'previous' => $previous['users'],
                        'change' => $calcChange($current['users'], $previous['users']),
                    ],
                ],
            ];
        } catch (\Exception $e) {
            Log::error('AdminReportService@getDashboardKPIs: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت KPIs', 500);
        }
    }

    /**
     * Get sales chart data
     */
    public function getSalesChart(int $period = 30): array
    {
        try {
            $sales = $this->repository->getSalesData($period);

            $chartData = [];
            for ($i = $period - 1; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $dayData = $sales->firstWhere('date', $date);
                $chartData[] = [
                    'date' => $date,
                    'date_fa' => $date,
                    'orders_count' => $dayData ? (int) $dayData->orders_count : 0,
                    'revenue' => $dayData ? (float) $dayData->revenue : 0,
                    'avg_order' => $dayData ? round((float) $dayData->avg_order, 0) : 0,
                ];
            }

            $collection = collect($chartData);

            return [
                'chart' => $chartData,
                'summary' => [
                    'total_orders' => $collection->sum('orders_count'),
                    'total_revenue' => $collection->sum('revenue'),
                    'avg_daily_orders' => round($collection->avg('orders_count'), 1),
                    'avg_daily_revenue' => round($collection->avg('revenue'), 0),
                    'max_day' => $collection->sortByDesc('revenue')->first(),
                    'min_day' => $collection->sortBy('revenue')->first(),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('AdminReportService@getSalesChart: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت نمودار فروش', 500);
        }
    }

    /**
     * Get top products
     */
    public function getTopProducts(int $period = 30, int $limit = 10): array
    {
        try {
            $products = $this->repository->getTopProducts($period, $limit);

            return [
                'products' => $products->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'slug' => $item->slug,
                        'image' => $item->main_image,
                        'total_sold' => (int) $item->total_sold,
                        'total_revenue' => (float) $item->total_revenue,
                        'orders_count' => (int) $item->orders_count,
                    ];
                }),
            ];
        } catch (\Exception $e) {
            Log::error('AdminReportService@getTopProducts: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت محصولات برتر', 500);
        }
    }

    /**
     * Get top categories
     */
    public function getTopCategories(int $period = 30): array
    {
        try {
            $categories = $this->repository->getTopCategories($period);

            return [
                'categories' => $categories->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'slug' => $item->slug,
                        'total_sold' => (int) $item->total_sold,
                        'total_revenue' => (float) $item->total_revenue,
                    ];
                }),
            ];
        } catch (\Exception $e) {
            Log::error('AdminReportService@getTopCategories: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت دسته‌بندی‌های برتر', 500);
        }
    }

    /**
     * Get order status statistics
     */
    public function getOrderStatus(int $period = 30): array
    {
        try {
            $byStatus = $this->repository->getOrdersByStatus($period);

            return [
                'by_status' => $byStatus->map(fn($s) => [
                    'status' => $s->status,
                    'count' => (int) $s->count,
                    'total' => (float) $s->total,
                ]),
                'by_payment' => collect([]),
            ];
        } catch (\Exception $e) {
            Log::error('AdminReportService@getOrderStatus: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت وضعیت سفارشات', 500);
        }
    }

    /**
     * Get top sellers
     */
    public function getTopSellers(int $period = 30): array
    {
        try {
            $startDate = now()->subDays($period);
            $sellers = $this->repository->getSellers();

            $sellersData = $sellers->map(function ($seller) use ($startDate) {
                $sales = $this->repository->getSellerSalesData($seller->id, $startDate);

                return [
                    'id' => $seller->id,
                    'name' => $seller->name,
                    'shop_name' => $seller->shop_name,
                    'avatar' => $seller->avatar,
                    'products_count' => $seller->products_count ?? 0,
                    'total_sold' => (int) ($sales->total_sold ?? 0),
                    'total_revenue' => (float) ($sales->total_revenue ?? 0),
                    'rating' => (float) ($seller->seller_rating ?? 0),
                ];
            })->sortByDesc('total_revenue')->take(10)->values();

            return [
                'sellers' => $sellersData,
            ];
        } catch (\Exception $e) {
            Log::error('AdminReportService@getTopSellers: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت فروشندگان برتر', 500);
        }
    }
}