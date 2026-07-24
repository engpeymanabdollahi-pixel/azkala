<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * دریافت لیست نوتیفیکیشن‌های کاربر فعلی
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->limit(20)
            ->get();

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
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update(['read_at' => now()]);

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
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'همه نوتیفیکیشن‌ها خوانده شدند',
        ]);
    }
}