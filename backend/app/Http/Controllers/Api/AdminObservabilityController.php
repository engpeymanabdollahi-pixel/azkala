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
}