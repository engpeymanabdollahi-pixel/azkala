<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WishlistService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WishlistController extends Controller
{
    protected WishlistService $wishlistService;

    public function __construct(WishlistService $wishlistService)
    {
        $this->wishlistService = $wishlistService;
    }

    /**
     * لیست علاقه‌مندی‌های کاربر
     */
    public function index(Request $request)
    {
        try {
            $wishlists = $this->wishlistService->getUserWishlist($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $wishlists,
            ]);
        } catch (\Exception $e) {
            Log::error('WishlistController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت علاقه‌مندی‌ها',
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|integer|exists:products,id',
            ]);

            $wishlist = $this->wishlistService->addToWishlist($request->user()->id, $validated['product_id']);

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت به لیست علاقه‌مندی‌ها اضافه شد.',
                'data' => $wishlist,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطای اعتبارسنجی',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            if ($e->getCode() === 400) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 400);
            }

            Log::error('WishlistController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطای داخلی سرور در افزودن به علاقه‌مندی‌ها.',
            ], 500);
        }
    }

    /**
     * حذف از علاقه‌مندی‌ها
     */
    public function destroy(Request $request, $productId)
    {
        try {
            $deleted = $this->wishlistService->removeFromWishlist($request->user()->id, (int) $productId);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'این محصول در علاقه‌مندی‌های شما نیست',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'از علاقه‌مندی‌ها حذف شد',
            ]);

        } catch (\Exception $e) {
            Log::error('WishlistController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف از علاقه‌مندی‌ها',
            ], 500);
        }
    }

    /**
     * بررسی آیا محصول در علاقه‌مندی‌ها هست
     */
    public function check(Request $request, $productId)
    {
        try {
            $exists = $this->wishlistService->isWishlisted($request->user()->id, (int) $productId);

            return response()->json([
                'success' => true,
                'data' => [
                    'is_wishlisted' => $exists,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('WishlistController@check: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }
}