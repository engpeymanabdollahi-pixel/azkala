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
     * نمایش جزئیات یک سفارش (برای فروشنده)
     */
    public function show(Order $order)
    {
        // ✅ بررسی Policy: آیا این فروشنده اجازه دیدن این سفارش را دارد؟
        $this->authorize('view', $order);

        return response()->json([
            'success' => true,
            'data' => $order->load('items.product', 'user'),
        ]);
    }

    /**
     * تغییر وضعیت سفارش (توسط فروشنده)
     */
    public function updateStatus(Order $order, Request $request)
    {
        // ✅ بررسی Policy: آیا این فروشنده اجازه تغییر وضعیت این سفارش را دارد؟
        $this->authorize('updateStatus', $order);

        $request->validate([
            'status' => 'required|in:processing,shipped,delivered',
        ]);

        $order->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'وضعیت سفارش با موفقیت به‌روز شد.',
            'data' => $order
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
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}