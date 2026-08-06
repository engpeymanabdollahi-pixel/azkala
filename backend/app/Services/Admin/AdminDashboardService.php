<?php

namespace App\Services\Admin;

use App\Repositories\AdminDashboardRepository;
use Illuminate\Support\Facades\Log;

class AdminDashboardService
{
    protected AdminDashboardRepository $repository;

    public function __construct(AdminDashboardRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats(): array
    {
        try {
            $totalStats = $this->repository->getTotalStats();
            $recentOrders = $this->repository->getRecentOrders(10);
            $recentUsers = $this->repository->getRecentUsers(10);
            $topProducts = $this->repository->getTopProducts(10);
            $monthlyStats = $this->repository->getMonthlyStats();

            return array_merge($totalStats, [
                'recent_orders' => $recentOrders,
                'recent_users' => $recentUsers,
                'top_products' => $topProducts,
                'monthly_stats' => $monthlyStats,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminDashboardService@getDashboardStats: '.$e->getMessage());
            throw new \Exception('خطا در دریافت آمار', 500);
        }
    }

    /**
     * Get chat statistics
     */
    public function getChatStats(): array
    {
        try {
            $stats = $this->repository->getChatStats();

            // ✅ قبلاً avg_response_minutes همیشه ۵ هاردکد بود؛ حالا میانگین
            // واقعی از AdminDashboardRepository::getAverageResponseMinutes() می‌آید.
            $avgResponseMinutes = $this->repository->getAverageResponseMinutes();
            $conversionRate = $stats['total_conversations'] > 0
                ? round(($stats['total_conversations'] / max(1, $stats['total_messages'])) * 100, 1)
                : 0;

            return array_merge($stats, [
                'avg_response_minutes' => $avgResponseMinutes,
                'conversion_rate' => $conversionRate,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminDashboardService@getChatStats: '.$e->getMessage());
            throw new \Exception('خطا در دریافت آمار چت', 500);
        }
    }

    /**
     * Get sentiment statistics
     */
    public function getSentimentStats(): array
    {
        try {
            $sentiments = $this->repository->getSentimentStats();

            $total = $sentiments->sum();
            $positive = $sentiments->get('positive', 0);
            $negative = $sentiments->get('negative', 0);
            $neutral = $sentiments->get('neutral', 0);

            return [
                'total' => $total,
                'positive' => $positive,
                'negative' => $negative,
                'neutral' => $neutral,
                'positive_percent' => $total > 0 ? round(($positive / $total) * 100, 1) : 0,
                'negative_percent' => $total > 0 ? round(($negative / $total) * 100, 1) : 0,
                'neutral_percent' => $total > 0 ? round(($neutral / $total) * 100, 1) : 0,
            ];
        } catch (\Exception $e) {
            Log::error('AdminDashboardService@getSentimentStats: '.$e->getMessage());
            throw new \Exception('خطا در دریافت آمار احساسات', 500);
        }
    }

    /**
     * Get recent chat activity
     */
    public function getRecentChatActivity(): array
    {
        try {
            $recentMessages = $this->repository->getRecentChatMessages(10);
            $activeSellers = $this->repository->getActiveSellersCount();
            // ✅ قبلاً busiest_hour همیشه رشته‌ی ثابت «۱۴:۰۰ - ۱۶:۰۰» بود؛
            // حالا از توزیع واقعی ساعت پیام‌ها محاسبه می‌شود.
            $busiestHour = $this->repository->getBusiestHour();

            return [
                'recent_messages' => $recentMessages,
                'active_sellers' => $activeSellers,
                'busiest_hour' => $busiestHour ?? 'داده‌ای موجود نیست',
            ];
        } catch (\Exception $e) {
            Log::error('AdminDashboardService@getRecentChatActivity: '.$e->getMessage());
            throw new \Exception('خطا در دریافت فعالیت‌های اخیر', 500);
        }
    }
}
