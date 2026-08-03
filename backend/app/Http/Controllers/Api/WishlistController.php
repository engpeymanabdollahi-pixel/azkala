<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WishlistController extends Controller
{
    /**
     * لیست علاقه‌مندی‌های کاربر
     */
    public function index(Request $request)
    {
        try {
            $wishlists = Wishlist::with('product')
                ->where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->paginate(20);

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

            $userId = $request->user()->id;
            $productId = $validated['product_id'];

            // بررسی تکراری نبودن
            $exists = Wishlist::where('user_id', $userId)
                ->where('product_id', $productId)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'این محصول قبلاً در لیست علاقه‌مندی‌های شما وجود دارد.',
                ], 400);
            }

            $wishlist = Wishlist::create([
                'user_id' => $userId,
                'product_id' => $productId,
            ]);

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
            \Illuminate\Support\Facades\Log::error('WishlistController@store: ' . $e->getMessage());
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
            $deleted = Wishlist::where('user_id', $request->user()->id)
                ->where('product_id', $productId)
                ->delete();

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
            $exists = Wishlist::where('user_id', $request->user()->id)
                ->where('product_id', $productId)
                ->exists();

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