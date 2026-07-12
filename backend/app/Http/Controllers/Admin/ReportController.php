<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatReport;
use App\Models\User;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    /**
     * لیست گزارش‌ها با فیلتر و pagination
     */
    public function index(Request $request)
    {
        try {
            $query = ChatReport::with(['reporter:id,name,avatar', 'reportedUser:id,name,avatar', 'conversation:id,buyer_id,seller_id']);

            // فیلتر بر اساس وضعیت
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // فیلتر بر اساس نوع
            if ($request->has('reason') && $request->reason !== 'all') {
                $query->where('reason', $request->reason);
            }

            // فیلتر بر اساس تاریخ
            if ($request->has('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // جستجو
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->whereHas('reporter', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })->orWhereHas('reportedUser', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })->orWhere('description', 'like', "%{$search}%");
                });
            }

            $reports = $query->orderByDesc('created_at')->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $reports,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin\ReportController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت گزارش‌ها',
            ], 500);
        }
    }

    /**
     * جزئیات یک گزارش
     */
    public function show($id)
    {
        try {
            $report = ChatReport::with([
                'reporter:id,name,email,avatar,phone',
                'reportedUser:id,name,email,avatar,phone',
                'conversation:id,buyer_id,seller_id,product_id,last_message_at',
                'conversation.product:id,name,main_image',
                'conversation.buyer:id,name,avatar',
                'conversation.seller:id,name,avatar',
                'message:id,conversation_id,sender_id,content,type,created_at',
                'message.sender:id,name,avatar',
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $report,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin\ReportController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'گزارش یافت نشد',
            ], 404);
        }
    }

    /**
     * بروزرسانی وضعیت گزارش
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,reviewed,resolved,dismissed',
                'admin_notes' => 'nullable|string|max:1000',
            ]);

            $report = ChatReport::findOrFail($id);
            $report->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'گزارش بروزرسانی شد',
                'data' => $report,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin\ReportController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در بروزرسانی گزارش',
            ], 500);
        }
    }

    /**
     * انجام اقدام روی گزارش
     */
    public function action(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'action' => 'required|in:warn,block,close_conversation,dismiss',
                'reason' => 'nullable|string|max:500',
            ]);

            $report = ChatReport::with('reportedUser')->findOrFail($id);
            $reportedUser = $report->reportedUser;

            switch ($validated['action']) {
                case 'warn':
                    // ارسال هشدار به کاربر (می‌توانیم ایمیل یا نوتیفیکیشن بفرستیم)
                    Log::info("هشدار به کاربر #{$reportedUser->id} ارسال شد");
                    $report->update([
                        'status' => 'reviewed',
                        'admin_notes' => $validated['reason'] ?? 'هشدار ارسال شد',
                    ]);
                    break;

                case 'block':
                    // بلاک کردن کاربر
                    $reportedUser->update(['is_active' => false]);
                    $report->update([
                        'status' => 'resolved',
                        'admin_notes' => $validated['reason'] ?? 'کاربر بلاک شد',
                    ]);
                    break;

                case 'close_conversation':
                    // بستن مکالمه
                    if ($report->conversation_id) {
                        Conversation::where('id', $report->conversation_id)
                            ->update(['is_active' => false]);
                    }
                    $report->update([
                        'status' => 'resolved',
                        'admin_notes' => $validated['reason'] ?? 'مکالمه بسته شد',
                    ]);
                    break;

                case 'dismiss':
                    // رد گزارش
                    $report->update([
                        'status' => 'dismissed',
                        'admin_notes' => $validated['reason'] ?? 'گزارش بی‌اساس تشخیص داده شد',
                    ]);
                    break;
            }

            return response()->json([
                'success' => true,
                'message' => 'اقدام با موفقیت انجام شد',
                'data' => $report->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Admin\ReportController@action: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در انجام اقدام',
            ], 500);
        }
    }

    /**
     * آمار گزارش‌ها
     */
    public function stats(Request $request)
    {
        try {
            $totalReports = ChatReport::count();
            $pendingReports = ChatReport::where('status', 'pending')->count();
            $reviewedReports = ChatReport::where('status', 'reviewed')->count();
            $resolvedReports = ChatReport::where('status', 'resolved')->count();
            $dismissedReports = ChatReport::where('status', 'dismissed')->count();

            // آمار امروز
            $todayReports = ChatReport::whereDate('created_at', today())->count();
            $weekReports = ChatReport::whereDate('created_at', '>=', now()->subDays(7))->count();
            $monthReports = ChatReport::whereDate('created_at', '>=', now()->subDays(30))->count();

            // آمار بر اساس نوع
            $byReason = ChatReport::selectRaw('reason, count(*) as count')
                ->groupBy('reason')
                ->get()
                ->pluck('count', 'reason');

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalReports,
                    'pending' => $pendingReports,
                    'reviewed' => $reviewedReports,
                    'resolved' => $resolvedReports,
                    'dismissed' => $dismissedReports,
                    'today' => $todayReports,
                    'week' => $weekReports,
                    'month' => $monthReports,
                    'by_reason' => $byReason,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Admin\ReportController@stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آمار',
            ], 500);
        }
    }
}