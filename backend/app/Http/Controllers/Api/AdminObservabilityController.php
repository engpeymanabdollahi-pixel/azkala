<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminAccessLog;
use App\Services\LogReaderService;
use Illuminate\Http\Request;

/**
 * Controller برای Observability Center در پنل ادمین.
 *
 * این controller همه منابع log را یکجا ارائه می‌دهد:
 *   - AdminAccessLog از DB (تغییرات نقش/دسترسی)
 *   - security.log (رویدادهای auth/security)
 *   - payment.log (رویدادهای order/payment/commission)
 *   - api.log و queue.log
 *   - جستجو بر اساس request_id
 *
 * Authorization: permission:admin.access.view
 *   (همان permission صفحه AdminAccessLogsPage فعلی)
 */
class AdminObservabilityController extends Controller
{
    public function __construct(
        protected LogReaderService $logReader
    ) {}

    /**
     * آمار خلاصه برای stats cards.
     *
     * GET /admin/observability/stats
     */
    public function stats()
    {
        $stats = $this->logReader->getStats();

        // اضافه کردن AdminAccessLog count
        $stats['admin_access_total'] = AdminAccessLog::count();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * لیست رویدادهای امنیتی (security.log).
     *
     * GET /admin/observability/security
     */
    public function security(Request $request)
    {
        $validated = $request->validate([
            'limit'     => 'nullable|integer|min:1|max:500',
            'event'     => 'nullable|string|max:100',
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date',
        ]);

        $entries = $this->logReader->readChannel(
            'security',
            $validated['limit'] ?? 100,
            $validated['event'] ?? null,
            $validated['date_from'] ?? null,
            $validated['date_to'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => $entries,
            'meta' => [
                'total' => count($entries),
                'channel' => 'security',
            ],
        ]);
    }

    /**
     * لیست رویدادهای سفارش/پرداخت (payment.log).
     *
     * GET /admin/observability/payment
     */
    public function payment(Request $request)
    {
        $validated = $request->validate([
            'limit'     => 'nullable|integer|min:1|max:500',
            'event'     => 'nullable|string|max:100',
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date',
        ]);

        $entries = $this->logReader->readChannel(
            'payment',
            $validated['limit'] ?? 100,
            $validated['event'] ?? null,
            $validated['date_from'] ?? null,
            $validated['date_to'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => $entries,
            'meta' => [
                'total' => count($entries),
                'channel' => 'payment',
            ],
        ]);
    }

    /**
     * لیست رویدادهای API (api.log).
     *
     * GET /admin/observability/api
     */
    public function api(Request $request)
    {
        $validated = $request->validate([
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $entries = $this->logReader->readChannel(
            'api',
            $validated['limit'] ?? 100
        );

        return response()->json([
            'success' => true,
            'data' => $entries,
            'meta' => [
                'total' => count($entries),
                'channel' => 'api',
            ],
        ]);
    }

    /**
     * لیست رویدادهای Queue (queue.log).
     *
     * GET /admin/observability/queue
     */
    public function queue(Request $request)
    {
        $validated = $request->validate([
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $entries = $this->logReader->readChannel(
            'queue',
            $validated['limit'] ?? 100
        );

        return response()->json([
            'success' => true,
            'data' => $entries,
            'meta' => [
                'total' => count($entries),
                'channel' => 'queue',
            ],
        ]);
    }

    /**
     * جستجو بر اساس Request ID در همه کانال‌ها.
     *
     * GET /admin/observability/search?request_id=xxx
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'request_id' => 'required|string|max:36',
        ]);

        $results = $this->logReader->searchByRequestId($validated['request_id']);

        return response()->json([
            'success' => true,
            'data' => $results,
            'meta' => [
                'total' => count($results),
                'request_id' => $validated['request_id'],
            ],
        ]);
    }

    /**
     * لیست event های موجود در یک کانال (برای dropdown فیلتر).
     *
     * GET /admin/observability/events?channel=security
     */
    public function events(Request $request)
    {
        $validated = $request->validate([
            'channel' => 'required|string|in:security,payment,api,queue',
        ]);

        $events = $this->logReader->getAvailableEvents($validated['channel']);

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }
           /**
     * جستجوی لاگ‌های یک کاربر بر اساس شماره تلفن.
     *
     * GET /admin/observability/user?phone=09123456789&date_from=2026-08-01&date_to=2026-08-21&channel=security&event=auth.login.success
     *
     * ✅ FIX: استفاده مستقیم از $request->input() برای اطمینان از خواندن
     * همه پارامترها (نه فقط آن‌هایی که از validation عبور می‌کنند).
     */
    public function user(Request $request)
    {
        // ✅ خواندن مستقیم همه پارامترها از request
        $phone = $request->input('phone');
        $userId = $request->input('user_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $channel = $request->input('channel');
        $event = $request->input('event');

        // Validation دستی (چون query parameters ممکن است از validation عبور نکنند)
        if (!empty($dateFrom) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            return response()->json([
                'success' => false,
                'message' => 'فرمت date_from نامعتبر است. باید Y-m-d باشد.',
            ], 422);
        }

        if (!empty($dateTo) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            return response()->json([
                'success' => false,
                'message' => 'فرمت date_to نامعتبر است. باید Y-m-d باشد.',
            ], 422);
        }

        if (!empty($channel) && !in_array($channel, ['security', 'payment'])) {
            return response()->json([
                'success' => false,
                'message' => 'channel باید security یا payment باشد.',
            ], 422);
        }

        if (empty($phone) && empty($userId)) {
            return response()->json([
                'success' => false,
                'message' => 'phone یا user_id الزامی است.',
            ], 422);
        }

        // جستجو
        if (!empty($userId)) {
            $results = $this->logReader->searchByUserId((int) $userId);
        } else {
            $results = $this->logReader->searchByUser(
                $phone,
                $dateFrom ?: null,
                $dateTo ?: null,
                $event ?: null,
                $channel ?: null
            );
        }

        return response()->json([
            'success' => true,
            'data' => $results['entries'],
            'meta' => [
                'total' => count($results['entries']),
                'user_id' => $results['user_id'] ?? null,
                'phone_mask' => $results['phone_mask'] ?? null,
                // ✅ اضافه کردن filters_applied برای debug و transparency
                'filters_applied' => [
                    'date_from' => $dateFrom ?: null,
                    'date_to' => $dateTo ?: null,
                    'channel' => $channel ?: null,
                    'event' => $event ?: null,
                ],
            ],
        ]);
    }
}