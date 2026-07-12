<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminReportController extends Controller
{
    protected AdminReportService $reportService;

    public function __construct(AdminReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * آمار کلی
     */
    public function overview()
    {
        try {
            $data = $this->reportService->getOverview();

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReportController@overview: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * داشبورد با KPIs
     */
    public function dashboard(Request $request)
    {
        try {
            $period = (int) $request->get('period', 30);
            $data = $this->reportService->getDashboardKPIs($period);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReportController@dashboard: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * نمودار فروش
     */
    public function salesChart(Request $request)
    {
        try {
            $period = (int) $request->get('period', 30);
            $data = $this->reportService->getSalesChart($period);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReportController@salesChart: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * محصولات برتر
     */
    public function topProducts(Request $request)
    {
        try {
            $period = (int) $request->get('period', 30);
            $limit = (int) $request->get('limit', 10);
            $data = $this->reportService->getTopProducts($period, $limit);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReportController@topProducts: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * دسته‌بندی‌های برتر
     */
    public function topCategories(Request $request)
    {
        try {
            $period = (int) $request->get('period', 30);
            $data = $this->reportService->getTopCategories($period);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReportController@topCategories: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * وضعیت سفارشات
     */
    public function orderStatus(Request $request)
    {
        try {
            $period = (int) $request->get('period', 30);
            $data = $this->reportService->getOrderStatus($period);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReportController@orderStatus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * فروشندگان برتر
     */
    public function topSellers(Request $request)
    {
        try {
            $period = (int) $request->get('period', 30);
            $data = $this->reportService->getTopSellers($period);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminReportController@topSellers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}