<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ReviewService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    protected ReviewService $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    /**
     * لیست نظرات یک محصول
     */
    public function index(Request $request, $productId)
    {
        try {
            // ✅ قبلاً پارامتر rating اصلاً به سرویس پاس داده نمی‌شد — دکمه‌های
            // فیلتر ستاره در فرانت فقط همان یک صفحهٔ بارگذاری‌شده را در سمت
            // کلاینت فیلتر می‌کردند، نه کل نظرات محصول.
            $rating = $request->filled('rating') ? (int) $request->input('rating') : null;
            $reviews = $this->reviewService->getApprovedReviewsPaginated((int) $productId, $rating);

            // محاسبه توزیع امتیازات
            $ratingDistribution = $this->reviewService->getRatingDistribution((int) $productId);

            // تکمیل توزیع با صفرها
            $distribution = [];
            for ($i = 5; $i >= 1; $i--) {
                $distribution[] = [
                    'rating' => $i,
                    'count' => $ratingDistribution[$i] ?? 0,
                ];
            }

            // میانگین امتیاز
            $averageRating = $this->reviewService->getAverageRating((int) $productId);

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
                            // ✅ قبلاً پاسخ ادمین (که واقعاً در پنل مدیریت ثبت
                            // می‌شود) هیچ‌وقت در پاسخ عمومی نمایش داده نمی‌شد.
                            'admin_reply' => $review->admin_reply,
                            'replied_at' => $review->replied_at?->format('Y-m-d'),
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
            Log::error('ReviewController@index: '.$e->getMessage().' | File: '.$e->getFile().' | Line: '.$e->getLine());

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

            $review = $this->reviewService->createReview($request->user()->id, $validated);

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
        } catch (ValidationException $e) {
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

            Log::error('ReviewController@store: '.$e->getMessage());

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
            $this->reviewService->deleteReview((int) $reviewId, $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'نظر حذف شد',
            ]);
        } catch (ModelNotFoundException $e) {
            // deleteReview() فیلترِ user_id را داخل کوئری اعمال می‌کند، پس «وجود
            // ندارد» و «مالِ کاربر دیگر است» هر دو به همین‌جا می‌رسند. عمداً یک
            // پاسخ یکسان می‌دهیم تا وجود/عدم‌وجود نظرِ دیگران فاش نشود.
            return response()->json([
                'success' => false,
                'message' => 'نظر مورد نظر یافت نشد.',
            ], 404);
        } catch (\Exception $e) {
            Log::error('ReviewController@destroy: '.$e->getMessage());

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
            $result = $this->reviewService->incrementHelpful((int) $reviewId, $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => $result['already_voted']
                    ? 'شما قبلاً به این نظر رأی «مفید بود» داده‌اید.'
                    : 'رأی شما با موفقیت ثبت شد.',
                'data' => ['helpful_count' => $result['review']->helpful_count],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'نظر مورد نظر یافت نشد.',
            ], 404);
        } catch (\Exception $e) {
            Log::error('ReviewController@helpful: '.$e->getMessage());

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

        if (! $user) {
            return response()->json([
                'can_review' => false,
                'message' => 'برای ثبت نظر باید وارد حساب کاربری خود شوید.',
            ], 401);
        }

        $product = Product::find($productId);
        if (! $product) {
            return response()->json([
                'can_review' => false,
                'message' => 'محصول مورد نظر یافت نشد.',
            ], 404);
        }

        // بررسی خرید محصول
        $hasPurchased = $this->reviewService->checkUserPurchased($user->id, (int) $productId);

        // ✅ قبلاً has_reviewed هیچ‌وقت محاسبه/برگردانده نمی‌شد — فرانت با
        // مقدار همیشه-false فرم ثبت نظر را حتی برای کاربری که قبلاً نظر
        // داده بود نشان می‌داد.
        $hasReviewed = $this->reviewService->hasUserReviewed($user->id, (int) $productId);

        return response()->json([
            'can_review' => true, // اجازه ثبت نظر (حتی اگر نخریده باشد، بسته به سیاست سایت)
            'has_purchased' => $hasPurchased,
            'has_reviewed' => $hasReviewed,
            'message' => $hasReviewed
                ? 'شما قبلاً برای این محصول نظر ثبت کرده‌اید.'
                : ($hasPurchased
                    ? 'شما این محصول را خریداری کرده‌اید و نشان "خریدار تأییدشده" دریافت می‌کنید.'
                    : 'شما می‌توانید نظر ثبت کنید (اما نشان خریدار تأییدشده نخواهید داشت).'),
        ]);
    }
}
