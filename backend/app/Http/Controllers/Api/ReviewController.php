<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReviewController extends Controller
{
    /**
     * لیست نظرات یک محصول
     */
    public function index(Request $request, $productId)
    {
        try {
            $reviews = Review::with('user:id,name')
                ->where('product_id', $productId)
                ->where('status', 'approved')
                ->orderByDesc('created_at')
                ->paginate(10);

            // محاسبه توزیع امتیازات
            $ratingDistribution = Review::where('product_id', $productId)
                ->where('status', 'approved')
                ->selectRaw('rating, COUNT(*) as count')
                ->groupBy('rating')
                ->pluck('count', 'rating')
                ->toArray();

            // تکمیل توزیع با صفرها
            $distribution = [];
            for ($i = 5; $i >= 1; $i--) {
                $distribution[] = [
                    'rating' => $i,
                    'count' => $ratingDistribution[$i] ?? 0,
                ];
            }

            // میانگین امتیاز
            $averageRating = Review::where('product_id', $productId)
                ->where('status', 'approved')
                ->avg('rating');

            return response()->json([
                'success' => true,
                'data' => [
                    'reviews' => $reviews->map(function ($review) {
                        return [
                            'id' => $review->id,
                            'user' => [
                                'id' => $review->user->id,
                                'name' => $review->user->name,
                                'initial' => mb_substr($review->user->name, 0, 1),
                            ],
                            'title' => $review->title,
                            'comment' => $review->comment,
                            'rating' => $review->rating,
                            'is_verified' => $review->is_verified,
                            'helpful_count' => $review->helpful_count,
                            'created_at' => $review->created_at->format('Y-m-d'),
                            'created_at_fa' => $review->created_at->format('Y/m/d'),
                        ];
                    }),
                    'pagination' => [
                        'current_page' => $reviews->currentPage(),
                        'last_page' => $reviews->lastPage(),
                        'per_page' => $reviews->perPage(),
                        'total' => $reviews->total(),
                    ],
                    'summary' => [
                        'average_rating' => round($averageRating ?? 0, 1),
                        'total_reviews' => $reviews->total(),
                        'distribution' => $distribution,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ReviewController@index: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت نظرات.',
            ], 500);
        }
    }

    /**
     * ثبت نظر جدید
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|integer|exists:products,id',
                'rating' => 'required|integer|min:1|max:5',
                'title' => 'nullable|string|max:255',
                'comment' => 'required|string|min:10|max:2000',
            ]);

            return DB::transaction(function () use ($request, $validated) {
                $userId = $request->user()->id;
                $productId = $validated['product_id'];

                // بررسی عدم تکرار نظر
                $existingReview = Review::where('user_id', $userId)
                    ->where('product_id', $productId)
                    ->first();

                if ($existingReview) {
                    return response()->json([
                        'success' => false,
                        'message' => 'شما قبلاً برای این محصول نظر ثبت کرده‌اید',
                    ], 400);
                }

                // بررسی اینکه آیا کاربر این محصول را خریده است
                $isVerified = $this->checkUserPurchased($userId, $productId);

                // ثبت نظر
                $review = Review::create([
                    'user_id' => $userId,
                    'product_id' => $productId,
                    'title' => $validated['title'] ?? null,
                    'comment' => $validated['comment'],
                    'rating' => $validated['rating'],
                    'is_verified' => $isVerified,
                    'status' => 'pending', // بهتر است نظرات جدید در انتظار تأیید باشند
                ]);

                // به‌روزرسانی rating محصول
                $this->updateProductRating($productId);

                $review->load('user:id,name');

                return response()->json([
                    'success' => true,
                    'message' => 'نظر شما با موفقیت ثبت شد و پس از تأیید نمایش داده می‌شود',
                    'data' => [
                        'id' => $review->id,
                        'user' => [
                            'id' => $review->user->id,
                            'name' => $review->user->name,
                            'initial' => mb_substr($review->user->name, 0, 1),
                        ],
                        'title' => $review->title,
                        'comment' => $review->comment,
                        'rating' => $review->rating,
                        'is_verified' => $review->is_verified,
                        'helpful_count' => $review->helpful_count,
                        'created_at' => $review->created_at->format('Y-m-d'),
                        'created_at_fa' => $review->created_at->format('Y/m/d'),
                    ],
                ], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطای اعتبارسنجی',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('ReviewController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ثبت نظر',
            ], 500);
        }
    }

    /**
     * حذف نظر
     */
    public function destroy(Request $request, $reviewId)
    {
        try {
            $review = Review::where('id', $reviewId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            $productId = $review->product_id;
            $review->delete();

            $this->updateProductRating($productId);

            return response()->json([
                'success' => true,
                'message' => 'نظر حذف شد',
            ]);
        } catch (\Exception $e) {
            Log::error('ReviewController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف نظر',
            ], 500);
        }
    }

    /**
     * ثبت "مفید بود"
     */
    public function helpful(Request $request, $reviewId)
    {
        try {
            $review = Review::findOrFail($reviewId);
            $review->increment('helpful_count');

            return response()->json([
                'success' => true,
                'data' => ['helpful_count' => $review->helpful_count],
            ]);
        } catch (\Exception $e) {
            Log::error('ReviewController@helpful: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا',
            ], 500);
        }
    }

    /**
     * ✅ اصلاح شده: بررسی اینکه آیا کاربر می‌تواند نظر ثبت کند
     */
    public function canReview(Request $request, $productId)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'can_review' => false,
                'message' => 'برای ثبت نظر باید وارد حساب کاربری خود شوید.'
            ], 401);
        }

        $product = Product::find($productId);
        if (!$product) {
            return response()->json([
                'can_review' => false,
                'message' => 'محصول مورد نظر یافت نشد.'
            ], 404);
        }

        // بررسی خرید محصول
        $hasPurchased = $this->checkUserPurchased($user->id, $productId);

        return response()->json([
            'can_review' => true, // اجازه ثبت نظر (حتی اگر نخریده باشد، بسته به سیاست سایت)
            'has_purchased' => $hasPurchased,
            'message' => $hasPurchased 
                ? 'شما این محصول را خریداری کرده‌اید و نشان "خریدار تأییدشده" دریافت می‌کنید.' 
                : 'شما می‌توانید نظر ثبت کنید (اما نشان خریدار تأییدشده نخواهید داشت).'
        ]);
    }

    /**
     * بررسی اینکه آیا کاربر محصول را خریده است
     */
    private function checkUserPurchased(int $userId, int $productId): bool
    {
        try {
            return OrderItem::whereHas('order', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->where('payment_status', 'paid')
                  ->whereIn('status', ['delivered', 'completed']);
            })->where('product_id', $productId)->exists();
        } catch (\Exception $e) {
            Log::error('checkUserPurchased error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * به‌روزرسانی rating محصول
     */
    private function updateProductRating(int $productId): void
    {
        try {
            $product = Product::find($productId);
            if (!$product) return;

            $stats = Review::where('product_id', $productId)
                ->where('status', 'approved')
                ->selectRaw('COUNT(*) as count, AVG(rating) as avg_rating')
                ->first();

            $product->reviews_count = $stats->count ?? 0;
            $product->rating = round($stats->avg_rating ?? 0, 2);
            $product->save();
        } catch (\Exception $e) {
            Log::error('updateProductRating error: ' . $e->getMessage());
        }
    }
}