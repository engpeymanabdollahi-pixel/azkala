<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Seller\SellerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerOrderController extends Controller
{
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
            
            // ✅ دریافت صحیح page و per_page از درخواست
            $page = (int) $request->get('page', 1);
            $perPage = (int) $request->get('per_page', 20);

            // ✅ اصلاح حیاتی: ارسال آرگومان‌ها به ترتیب صحیح (sellerId, page, perPage)
            $data = $this->sellerService->getSellerOrdersList($sellerId, $page, $perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerOrderController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * جزئیات سفارش
     */
    public function show(Request $request, $orderId)
    {
        try {
            $sellerId = $request->user()->id;
            $data = $this->sellerService->getSellerOrderDetail((int) $orderId, $sellerId);

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
     * بروزرسانی وضعیت سفارش
     */
    public function updateStatus(Request $request, $orderId)
    {
        $request->validate([
            'status' => 'required|in:processing,shipped,delivered,cancelled',
            'tracking_number' => 'nullable|string|max:100',
            'courier_name' => 'nullable|string|max:100',
        ]);

        try {
            $sellerId = $request->user()->id;

            $result = $this->sellerService->updateOrderStatusWithTracking(
                (int) $orderId,
                $sellerId,
                $request->only(['status', 'tracking_number', 'courier_name'])
            );

            return response()->json([
                'success' => true,
                'message' => 'وضعیت سفارش بروزرسانی شد',
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
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}