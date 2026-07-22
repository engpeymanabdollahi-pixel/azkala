<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Seller\SellerService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests; // ✅ خط حیاتی ۱
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerOrderController extends Controller
{
    use AuthorizesRequests; // ✅ خط حیاتی ۲: فعال‌سازی متد authorize()

    protected SellerService $sellerService;

    public function __construct(SellerService $sellerService)
    {
        $this->sellerService = $sellerService;
    }

    /**
     * لیست سفارشات فروشنده
     */
    public function index(Request $request)
    {
        try {
            $sellerId = $request->user()->id;
            $page = (int) $request->get('page', 1);
            $perPage = (int) $request->get('per_page', 20);

            $data = $this->sellerService->getSellerOrdersList($sellerId, $page, $perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerOrderController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت لیست سفارشات.',
            ], 500);
        }
    }

    /**
     * نمایش جزئیات یک سفارش (برای فروشنده)
     */
    public function show(Order $order)
    {
        // ✅ حالا این خط بدون خطا کار می‌کند
        $this->authorize('view', $order);

        return response()->json([
            'success' => true,
            'data' => $order->load(['items.product:id,name,main_image,sku', 'user:id,name,phone']),
        ]);
    }

    /**
     * تغییر وضعیت سفارش (توسط فروشنده)
     */
    public function updateStatus(Order $order, Request $request)
    {
        // ✅ حالا این خط هم بدون خطا کار می‌کند
        $this->authorize('updateStatus', $order);

        $validated = $request->validate([
            'status' => 'required|string|in:processing,ready_for_shipment,shipped,delivered',
            'tracking_code' => 'nullable|string|max:255',
        ]);

        $updateData = ['status' => $validated['status']];
        if (isset($validated['tracking_code'])) {
            $updateData['tracking_code'] = $validated['tracking_code'];
        }

        $order->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'وضعیت سفارش با موفقیت به‌روز شد.',
            'data' => $order->fresh(),
        ]);
    }
    
    /**
     * آمار سفارشات فروشنده
     */
    public function stats(Request $request)
    {
        try {
            $sellerId = $request->user()->id;
            $stats = $this->sellerService->getSellerOrdersStats($sellerId);

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerOrderController@stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آمار سفارشات.',
            ], 500);
        }
    }
}