<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Seller\SellerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerRatingController extends Controller
{
    protected SellerService $sellerService;

    public function __construct(SellerService $sellerService)
    {
        $this->sellerService = $sellerService;
    }

    /**
     * ثبت امتیاز به فروشنده
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'seller_id' => 'required|integer|exists:users,id',
            'order_id' => 'required|integer|exists:orders,id',
            'product_quality' => 'required|integer|min:1|max:5',
            'shipping_speed' => 'required|integer|min:1|max:5',
            'communication' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        try {
            $userId = $request->user()->id;
            $rating = $this->sellerService->createRating($userId, $validated);

            return response()->json([
                'success' => true,
                'message' => 'امتیاز شما با موفقیت ثبت شد',
                'data' => [
                    'id' => $rating->id,
                    'overall_rating' => $rating->overall_rating,
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * دریافت امتیازات یک فروشنده
     */
    public function getSellerRatings(Request $request, $sellerId)
    {
        try {
            $perPage = (int) $request->get('per_page', 10);
            $data = $this->sellerService->getSellerRatingsWithStats((int) $sellerId, $perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerRatingController@getSellerRatings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * بررسی امکان امتیازدهی
     */
    public function canRate(Request $request, $orderId)
    {
        try {
            $userId = $request->user()->id;
            $data = $this->sellerService->canUserRateOrder($userId, (int) $orderId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerRatingController@canRate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }
}