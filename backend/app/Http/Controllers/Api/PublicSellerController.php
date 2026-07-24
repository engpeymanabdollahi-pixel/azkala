<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicSellerResource;
use App\Http\Resources\ProductResource; // ✅ استفاده از ریسورس استاندارد محصول
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache; // ✅ ایمپورت کش
use Illuminate\Support\Facades\DB;

class PublicSellerController extends Controller
{
    /**
     * 🏪 دریافت اطلاعات پروفایل شعبه آنلاین (با کش ۵ دقیقه‌ای)
     * GET /api/v1/sellers/{slug}
     */
       public function show($slug)
    {
        $seller = \App\Models\User::where('slug', $slug)
            ->where('role', 'seller')
            ->where('is_active', true)
            ->first();

        if (!$seller) {
            return response()->json(['success' => false, 'message' => 'فروشنده یافت نشد'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new \App\Http\Resources\PublicSellerResource($seller),
        ]);
    }

    /**
     * 📦 دریافت محصولات شعبه آنلاین با فیلتر و مرتب‌سازی
     * GET /api/v1/sellers/{slug}/products
     */
    public function products(Request $request, $slug)
    {
        $seller = User::where('slug', $slug)
            ->where('role', 'seller')
            ->where('is_active', true)
            ->firstOrFail();

        $query = $seller->products()
            ->where('status', 'active')
            ->with(['category', 'seller']);

        // مرتب‌سازی
        $sort = $request->input('sort', 'newest');
        match ($sort) {
            'popular' => $query->orderBy('sales_count', 'desc'),
            'price_low' => $query->orderBy('price', 'asc'),
            'price_high' => $query->orderBy('price', 'desc'),
            'rating' => $query->orderBy('rating', 'desc'),
            default => $query->latest(),
        };

        // جستجو
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        // فیلتر دسته‌بندی
        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        // ✅ فیلتر محصولات تخفیف‌دار
        if ($request->boolean('has_discount')) {
            $query->whereNotNull('compare_price')
                  ->whereRaw('compare_price > price');
        }

        // ✅ اصلاح ۳: استفاده از Paginator بومی لاراول (شامل meta و links به صورت خودکار)
        $products = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products), // لاراول خودش meta و links را اضافه می‌کند
        ]);
    }

    /**
     * ❤️ دنبال کردن شعبه آنلاین (RESTful)
     * POST /api/v1/sellers/{id}/follow
     */
    public function follow(Request $request, $id)
    {
        $user = $request->user();
        $seller = User::where('id', $id)
            ->where('role', 'seller')
            ->where('is_active', true)
            ->firstOrFail();

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
        DB::transaction(function () use ($user, $seller) {
            $user->followingSellers()->attach($seller->id);
            $seller->increment('followers_count');
            
            // ✅ اصلاح ۱: پاک کردن کش پروفایل پس از تغییر تعداد فالوورها
            Cache::forget("public_seller_profile_{$seller->slug}");
        });

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
        $seller = User::where('id', $id)->where('role', 'seller')->firstOrFail();

        if (!$user->isFollowingSeller($seller->id)) {
            return response()->json([
                'success' => true,
                'message' => 'شما این شعبه را دنبال نکرده‌اید.',
                'is_following' => false,
                'followers_count' => $seller->followers_count,
            ]);
        }

        DB::transaction(function () use ($user, $seller) {
            $user->followingSellers()->detach($seller->id);
            $seller->decrement('followers_count');
            
            // ✅ اصلاح ۱: پاک کردن کش پروفایل
            Cache::forget("public_seller_profile_{$seller->slug}");
        });

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
        $sellers = $request->user()->followingSellers()
            ->where('is_active', true)
            ->latest('seller_follows.created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => PublicSellerResource::collection($sellers),
        ]);
    }
}