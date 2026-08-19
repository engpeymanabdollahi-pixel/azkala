<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\ReportService;
use Illuminate\Http\Request;

class AdminAdvancedReportController extends Controller
{
    public function __construct(protected ReportService $reportService) {}

    /**
     * تحلیل کاربران
     */
    public function usersAnalysis(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $startDate = now()->subDays($period)->toDateString();
        $endDate = now()->toDateString();

        $data = $this->reportService->getUsersAnalysis($startDate, $endDate);

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * عملکرد فروشندگان
     */
    public function sellerPerformance(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $startDate = now()->subDays($period)->toDateString();
        $endDate = now()->toDateString();
        $sellerId = $request->get('seller_id');

        $data = $this->reportService->getSellerPerformance($startDate, $endDate, $sellerId ? (int) $sellerId : null);

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * مقایسه دوره‌ای
     */
    public function periodComparison(Request $request)
    {
        $period = (int) $request->get('period', 30);
        
        $currentStart = now()->subDays($period)->toDateString();
        $currentEnd = now()->toDateString();
        $prevStart = now()->subDays($period * 2)->toDateString();
        $prevEnd = now()->subDays($period)->toDateString();

        $data = $this->reportService->getPeriodComparison($currentStart, $currentEnd, $prevStart, $prevEnd);

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * تحلیل دستگاه‌ها
     *
     * ✅ Device-First Architecture فاز ۲: ReportService::getDeviceAnalytics()
     * از قبل خودش پاسخ را در {success, data, period} می‌پیچد؛ اینجا دوباره
     * زیر یک {success, data} دیگر می‌پیچید — یعنی JSON نهایی
     * {success, data: {success, data: {by_brand, by_model, ...}, period}}
     * بود. فرانت‌اند (مثل همه‌ی تب‌های دیگر همین صفحه) فقط یک لایه‌ی data
     * را باز می‌کند (`response.data.data`)، پس همیشه به شیء میانی
     * (`{success, data, period}`) می‌رسید، نه به داده‌ی واقعی — یعنی
     * `analytics.by_brand` همیشه undefined بود، حتی با JOIN درست.
     * تنها راه‌حل: چیزی که سرویس برگردانده را مستقیم پاس بده، دوباره
     * نپیچش. (نکته: این الگوی دوباره‌پیچی در بقیه‌ی متدهای همین کنترلر هم
     * تکرار شده — خارج از scope فاز Device-First است و اینجا دست‌نخورده
     * ماند؛ در گزارش این فاز مستند شده.)
     */
    public function deviceAnalytics(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $startDate = now()->subDays($period)->toDateString();
        $endDate = now()->toDateString();

        $data = $this->reportService->getDeviceAnalytics($startDate, $endDate);

        return response()->json($data);
    }

    /**
     * تحلیل سبد خرید
     */
    public function basketAnalysis(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $startDate = now()->subDays($period)->toDateString();
        $endDate = now()->toDateString();

        $data = $this->reportService->getBasketAnalysis($startDate, $endDate);

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * تحلیل جستجوها
     */
    public function searchAnalytics()
    {
        $data = $this->reportService->getSearchAnalytics();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * تحلیل محصولات
     */
    public function productAnalytics(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $startDate = now()->subDays($period)->toDateString();
        $endDate = now()->toDateString();

        $data = $this->reportService->getProductAnalytics($startDate, $endDate);

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * پیش‌بینی‌ها
     */
    public function predictions()
    {
        $data = $this->reportService->getPredictions();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * ناهنجاری‌ها (Anomalies)
     */
    public function anomalies()
    {
        $data = $this->reportService->getAnomalies();

        return response()->json(['success' => true, 'data' => $data]);
    }
}