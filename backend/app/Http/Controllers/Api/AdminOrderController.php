<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Admin\AdminOrderService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests; // ✅ این خط حیاتی است
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminOrderController extends Controller
{
    use AuthorizesRequests; // ✅ فعال‌سازی قابلیت‌های Policy در این کنترلر

    protected AdminOrderService $orderService;

    public function __construct(AdminOrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index(Request $request)
    {
        try {
            $filters = [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'payment_status' => $request->get('payment_status'),
                'payment_method' => $request->get('payment_method'),
                'seller_id' => $request->get('seller_id'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'min_total' => $request->get('min_total'),
                'max_total' => $request->get('max_total'),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_order' => $request->get('sort_order', 'desc'),
            ];

            $data = $this->orderService->getOrders($filters, (int) $request->get('per_page', 20));

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('AdminOrderController@index: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت لیست سفارشات.'], 500);
        }
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);

        return response()->json([
            'success' => true,
            'data' => $order->load(['items.product:id,name,main_image,sku', 'user:id,name,phone']),
        ]);
    }

    public function updateStatus(Order $order, Request $request)
    {
        $this->authorize('updateStatus', $order);

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
        ]);

        $order->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'وضعیت سفارش با موفقیت به‌روز شد.',
            'data' => $order->fresh(),
        ]);
    }

    public function updatePaymentStatus(Order $order, Request $request)
    {
        $this->authorize('updateStatus', $order);

        $validated = $request->validate([
            'payment_status' => 'required|in:pending,paid,failed,refunded',
        ]);

        $order->update(['payment_status' => $validated['payment_status']]);

        return response()->json([
            'success' => true,
            'message' => 'وضعیت پرداخت به‌روزرسانی شد',
            'data' => $order->fresh(),
        ]);
    }

    public function stats()
    {
        try {
            $data = $this->orderService->getStats();
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('AdminOrderController@stats: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت آمار.'], 500);
        }
    }
}