<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminReportService;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function __construct(protected AdminReportService $reportService) {}

    /**
     * آمار کلی
     */
    public function overview()
    {
        $data = $this->reportService->getOverview();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * داشبورد با KPIs
     */
    public function dashboard(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $data = $this->reportService->getDashboardKPIs($period);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * نمودار فروش
     */
    public function salesChart(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $data = $this->reportService->getSalesChart($period);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * محصولات برتر
     */
    public function topProducts(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $limit = (int) $request->get('limit', 10);
        $data = $this->reportService->getTopProducts($period, $limit);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * دسته‌بندی‌های برتر
     */
    public function topCategories(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $data = $this->reportService->getTopCategories($period);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * وضعیت سفارشات
     */
    public function orderStatus(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $data = $this->reportService->getOrderStatus($period);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * فروشندگان برتر
     */
    public function topSellers(Request $request)
    {
        $period = (int) $request->get('period', 30);
        $data = $this->reportService->getTopSellers($period);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}