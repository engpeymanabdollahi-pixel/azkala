<?php

namespace App\Services\Admin;

use App\Repositories\AdminRepository;
use Illuminate\Support\Facades\Log;

class ReportService
{
    protected AdminRepository $adminRepository;

    public function __construct(AdminRepository $adminRepository)
    {
        $this->adminRepository = $adminRepository;
    }

    /**
     * Get users analysis report
     */
    public function getUsersAnalysis(?string $startDate, ?string $endDate): array
    {
        try {
            $data = $this->adminRepository->getUsersAnalysis($startDate, $endDate);

            return [
                'success' => true,
                'data' => $data,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getUsersAnalysis: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت گزارش کاربران', 500);
        }
    }

    /**
     * Get seller performance report
     */
    public function getSellerPerformance(?string $startDate, ?string $endDate, ?int $sellerId): array
    {
        try {
            $data = $this->adminRepository->getSellerPerformance($startDate, $endDate, $sellerId);

            return [
                'success' => true,
                'data' => $data,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'total_sellers' => count($data),
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getSellerPerformance: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت گزارش عملکرد فروشندگان', 500);
        }
    }

    /**
     * Get period comparison report
     */
    public function getPeriodComparison(string $period1Start, string $period1End, string $period2Start, string $period2End): array
    {
        try {
            // Validate dates
            if (strtotime($period1Start) === false || strtotime($period1End) === false) {
                throw new \Exception('تاریخ‌های دوره اول نامعتبر هستند', 400);
            }

            if (strtotime($period2Start) === false || strtotime($period2End) === false) {
                throw new \Exception('تاریخ‌های دوره دوم نامعتبر هستند', 400);
            }

            $data = $this->adminRepository->getPeriodComparison(
                $period1Start,
                $period1End,
                $period2Start,
                $period2End
            );

            return [
                'success' => true,
                'data' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getPeriodComparison: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get device analytics report
     */
    public function getDeviceAnalytics(?string $startDate, ?string $endDate): array
    {
        try {
            $data = $this->adminRepository->getDeviceAnalytics($startDate, $endDate);

            return [
                'success' => true,
                'data' => $data,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getDeviceAnalytics: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت گزارش تحلیل دستگاه‌ها', 500);
        }
    }

    /**
     * Get basket analysis report
     */
    public function getBasketAnalysis(?string $startDate, ?string $endDate): array
    {
        try {
            $data = $this->adminRepository->getBasketAnalysis($startDate, $endDate);

            return [
                'success' => true,
                'data' => $data,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getBasketAnalysis: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت گزارش تحلیل سبد خرید', 500);
        }
    }

    /**
     * Get search analytics report
     */
    public function getSearchAnalytics(): array
    {
        try {
            $data = $this->adminRepository->getSearchAnalytics();

            return [
                'success' => true,
                'data' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getSearchAnalytics: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت گزارش تحلیل جستجو', 500);
        }
    }

    /**
     * Get product analytics report
     */
    public function getProductAnalytics(?string $startDate, ?string $endDate): array
    {
        try {
            $data = $this->adminRepository->getProductAnalytics($startDate, $endDate);

            return [
                'success' => true,
                'data' => $data,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getProductAnalytics: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت گزارش تحلیل محصولات', 500);
        }
    }

    /**
     * Get predictions report
     */
    public function getPredictions(): array
    {
        try {
            $data = $this->adminRepository->getPredictions();

            return [
                'success' => true,
                'data' => $data,
                'generated_at' => now()->toDateTimeString(),
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getPredictions: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت پیش‌بینی‌ها', 500);
        }
    }

    /**
     * Get anomalies report
     */
    public function getAnomalies(): array
    {
        try {
            $data = $this->adminRepository->getAnomalies();

            return [
                'success' => true,
                'data' => $data,
                'total_anomalies' => count($data),
                'generated_at' => now()->toDateTimeString(),
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getAnomalies: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت ناهنجاری‌ها', 500);
        }
    }

    /**
     * Get chat analytics report
     */
    public function getChatAnalytics(?string $startDate, ?string $endDate): array
    {
        try {
            $data = $this->adminRepository->getChatAnalytics($startDate, $endDate);

            return [
                'success' => true,
                'data' => $data,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('ReportService@getChatAnalytics: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت گزارش تحلیل چت', 500);
        }
    }
}