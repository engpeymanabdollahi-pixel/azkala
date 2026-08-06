<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicSellerResource;
// ✅ استفاده از ریسورس استاندارد محصول
use App\Models\User;
use App\Services\PublicSellerService;
use Illuminate\Http\Request;

// ✅ ایمپورت کش

class PublicSellerController extends Controller
{
    protected PublicSellerService $publicSellerService;

    public function __construct(PublicSellerService $publicSellerService)
    {
        $this->publicSellerService = $publicSellerService;
    }

    /**
     * 🏆 فروشگاه‌های برتر برای صفحه‌ی اصلی
     * GET /api/v1/sellers/top
     */
    public function top(Request $request)
    {
        $limit = min((int) $request->input('limit', 8), 20);
        $sellers = $this->publicSellerService->getTopSellers($limit);

        return response()->json([
            'success' => true,
            'data' => PublicSellerResource::collection($sellers),
        ]);
    }

    /**
     * 🏪 دریافت اطلاعات پروفایل شعبه آنلاین (با کش ۵ دقیقه‌ای)
     * GET /api/v1/sellers/{slug}
     */
    public function show($slug)
    {
        $seller = $this->publicSellerService->findActiveSellerBySlug($slug);

        if (! $seller) {
            return response()->json(['success' => false, 'message' => 'فروشنده یافت نشد'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new PublicSellerResource($seller),
        ]);
    }

    /**
     * 📦 دریافت محصولات شعبه آنلاین (نسخه ساده و بدون Resource)
     * GET /api/v1/sellers/{slug}/products
     */
    public function products(Request $request, $slug)
    {
        $seller = $this->publicSellerService->findActiveSellerBySlug($slug);

        if (! $seller) {
            return response()->json(['success' => false, 'message' => 'فروشنده یافت نشد'], 404);
        }

        $paginatedProducts = $this->publicSellerService->getSellerProducts($seller, [
            'sort' => $request->input('sort', 'newest'),
            'search' => $request->input('search'),
            'category_id' => $request->input('category_id'),
            'has_discount' => $request->boolean('has_discount'),
            'per_page' => $request->input('per_page', 20),
        ]);

        // ✅ استفاده از transform روی Collection داخلی (روش استاندارد و امن لاراول)
        $paginatedProducts->getCollection()->transform(function ($p) use ($seller) {
            $discount = 0;
            if ($p->compare_price && $p->compare_price > 0 && $p->compare_price > $p->price) {
                $discount = round((($p->compare_price - $p->price) / $p->compare_price) * 100);
            }

            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'main_image' => $p->main_image,
                'images' => is_string($p->images) ? json_decode($p->images, true) : ($p->images ?? []),
                'price' => (float) $p->price,
                'compare_price' => $p->compare_price ? (float) $p->compare_price : null,
                'stock' => (int) $p->stock,
                'status' => $p->status ?? 'active',
                'rating' => (float) ($p->rating ?? 0),
                'reviews_count' => (int) ($p->reviews_count ?? 0),
                'sales_count' => (int) ($p->sales_count ?? 0),
                'discount_percentage' => $discount,
                'seller' => [
                    'id' => $seller->id,
                    'shop_name' => $seller->shop_name ?? $seller->name,
                    'slug' => $seller->slug,
                ],
                'category' => $p->category ? [
                    'id' => $p->category->id,
                    'name' => $p->category->name,
                    'slug' => $p->category->slug,
                ] : null,
                'created_at' => $p->created_at?->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $paginatedProducts->items(),
            'meta' => [
                'current_page' => $paginatedProducts->currentPage(),
                'per_page' => $paginatedProducts->perPage(),
                'total' => $paginatedProducts->total(),
                'last_page' => $paginatedProducts->lastPage(),
            ],
        ]);
    }

    /**
     * ⭐ نظرات واقعی خریداران درباره‌ی این شعبه (از seller_ratings)
     * GET /api/v1/sellers/{slug}/reviews
     */
    public function reviews(Request $request, $slug)
    {
        $seller = $this->publicSellerService->findActiveSellerBySlug($slug);

        if (! $seller) {
            return response()->json(['success' => false, 'message' => 'فروشنده یافت نشد'], 404);
        }

        $perPage = min((int) $request->input('per_page', 10), 30);
        $ratings = $this->publicSellerService->getSellerReviews($seller, $perPage);

        return response()->json([
            'success' => true,
            'data' => $ratings->getCollection()->map(fn ($r) => [
                'id' => $r->id,
                'user_name' => $r->user->name ?? 'کاربر ازکالا',
                'product_quality' => (int) $r->product_quality,
                'shipping_speed' => (int) $r->shipping_speed,
                'communication' => (int) $r->communication,
                'overall_rating' => (float) $r->overall_rating,
                'comment' => $r->comment,
                'created_at' => $r->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $ratings->currentPage(),
                'last_page' => $ratings->lastPage(),
                'total' => $ratings->total(),
            ],
        ]);
    }

    /**
     * ❤️ دنبال کردن شعبه آنلاین (RESTful)
     * POST /api/v1/sellers/{id}/follow
     */
    public function follow(Request $request, $id)
    {
        $user = $request->user();
        $seller = $this->publicSellerService->findActiveSellerById((int) $id);

        if ($user->id === $seller->id) {
            return response()->json(['success' => false, 'message' => 'شما نمی‌توانید فروشگاه خود را دنبال کنید.'], 400);
        }

        if ($user->isFollowingSeller($seller->id)) {
            return response()->json([
                'success' => true,
                'message' => 'شما قبلاً این شعبه را دنبال کرده‌اید.',
                'is_following' => true,
                'followers_count' => $seller->followers_count,
            ]);
        }

        // ✅ نسخه دوم: استفاده از تراکنش برای جلوگیری از Race Condition
        $this->publicSellerService->followSeller($user, $seller);

        return response()->json([
            'success' => true,
            'message' => 'شعبه آنلاین با موفقیت به لیست علاقه‌مندی‌های شما اضافه شد.',
            'is_following' => true,
            'followers_count' => $seller->fresh()->followers_count,
        ]);
    }

    /**
     * 💔 لغو دنبال کردن شعبه آنلاین (RESTful)
     * DELETE /api/v1/sellers/{id}/follow
     */
    public function unfollow(Request $request, $id)
    {
        $user = $request->user();
        $seller = $this->publicSellerService->findSellerById((int) $id);

        if (! $user->isFollowingSeller($seller->id)) {
            return response()->json([
                'success' => true,
                'message' => 'شما این شعبه را دنبال نکرده‌اید.',
                'is_following' => false,
                'followers_count' => $seller->followers_count,
            ]);
        }

        $this->publicSellerService->unfollowSeller($user, $seller);

        return response()->json([
            'success' => true,
            'message' => 'دنبال کردن شعبه با موفقیت لغو شد.',
            'is_following' => false,
            'followers_count' => $seller->fresh()->followers_count,
        ]);
    }

    /**
     * 📋 لیست فروشندگان دنبال‌شده توسط کاربر فعلی (برای داشبورد)
     * GET /api/v1/user/followed-sellers
     */
    public function followedSellers(Request $request)
    {
        $sellers = $this->publicSellerService->getFollowedSellers($request->user());

        return response()->json([
            'success' => true,
            'data' => PublicSellerResource::collection($sellers),
        ]);
    }
}
