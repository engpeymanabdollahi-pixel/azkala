<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDashboardService;

class AdminDashboardController extends Controller
{
    public function __construct(protected AdminDashboardService $dashboardService) {}

    /**
     * آمار کلی داشبورد
     */
    public function stats()
    {
        $data = $this->dashboardService->getDashboardStats();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * آمار چت برای داشبورد
     */
    public function chatStats()
    {
        $data = $this->dashboardService->getChatStats();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * آمار احساسات برای داشبورد
     */
    public function sentimentStats()
    {
        $data = $this->dashboardService->getSentimentStats();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * فعالیت‌های اخیر چت
     */
    public function recentChatActivity()
    {
        $data = $this->dashboardService->getRecentChatActivity();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}