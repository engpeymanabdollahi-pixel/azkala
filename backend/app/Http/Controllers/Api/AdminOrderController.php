<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Admin\AdminOrderService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    use AuthorizesRequests;

    public function __construct(protected AdminOrderService $orderService) {}

    /**
     * لیست سفارشات با فیلترهای پیشرفته
     */
    public function index(Request $request)
    {
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
    }

    /**
     * نمایش جزئیات سفارش
     */
    public function show(Order $order)
    {
        // ✅ حفظ امنیت با Policy
        $this->authorize('view', $order);

        return response()->json([
            'success' => true,
            'data' => $order->load(['items.product:id,name,main_image,sku', 'user:id,name,phone']),
        ]);
    }

    /**
     * به‌روزرسانی وضعیت سفارش
     */
    public function updateStatus(Order $order, Request $request)
    {
        $this->authorize('updateStatus', $order);

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
        ]);

        $updatedOrder = $this->orderService->updateStatus($order->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'وضعیت سفارش با موفقیت به‌روز شد.',
            'data' => $updatedOrder,
        ]);
    }

    /**
     * به‌روزرسانی وضعیت پرداخت
     */
    public function updatePaymentStatus(Order $order, Request $request)
    {
        $this->authorize('updateStatus', $order);

        $validated = $request->validate([
            'payment_status' => 'required|in:pending,paid,failed,refunded',
        ]);

        $updatedOrder = $this->orderService->updatePaymentStatus($order->id, $validated['payment_status']);

        return response()->json([
            'success' => true,
            'message' => 'وضعیت پرداخت به‌روزرسانی شد',
            'data' => $updatedOrder,
        ]);
    }

    /**
     * آمار سفارشات
     */
    public function stats()
    {
        $data = $this->orderService->getStats();
        
        return response()->json(['success' => true, 'data' => $data]);
    }
}