<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * دریافت لیست نوتیفیکیشن‌های کاربر فعلی
     */
    public function index(Request $request)
    {
        $notifications = $this->notificationService->getUserNotifications($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * علامت‌گذاری یک نوتیفیکیشن به عنوان خوانده شده
     */
    public function markAsRead(Request $request, $id)
    {
        $this->notificationService->markAsRead((int) $id, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'نوتیفیکیشن خوانده شد',
        ]);
    }

    /**
     * علامت‌گذاری همه نوتیفیکیشن‌ها به عنوان خوانده شده
     */
    public function markAllAsRead(Request $request)
    {
        $this->notificationService->markAllAsRead($request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'همه نوتیفیکیشن‌ها خوانده شدند',
        ]);
    }
}