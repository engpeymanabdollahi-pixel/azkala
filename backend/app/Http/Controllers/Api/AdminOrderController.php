<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminOrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminOrderController extends Controller
{
    protected AdminOrderService $orderService;

    public function __construct(AdminOrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * لیست سفارشات با فیلترهای پیشرفته
     */
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

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminOrderController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * جزئیات کامل یک سفارش
     */
    public function show($id)
    {
        try {
            $data = $this->orderService->getOrderDetails((int) $id);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * تغییر وضعیت سفارش
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled,returned',
            'tracking_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $order = $this->orderService->updateStatus((int) $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'وضعیت سفارش به‌روزرسانی شد',
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminOrderController@updateStatus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * تغییر وضعیت پرداخت
     */
    public function updatePaymentStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'payment_status' => 'required|in:pending,paid,failed,refunded',
        ]);

        try {
            $order = $this->orderService->updatePaymentStatus((int) $id, $validated['payment_status']);

            return response()->json([
                'success' => true,
                'message' => 'وضعیت پرداخت به‌روزرسانی شد',
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminOrderController@updatePaymentStatus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * آمار تفصیلی
     */
    public function stats()
    {
        try {
            $data = $this->orderService->getStats();

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('AdminOrderController@stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}