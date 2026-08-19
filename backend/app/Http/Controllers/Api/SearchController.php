<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\PublicSellerResource;
use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * SearchController - Global Search API برای ازکالا
 *
 * مطابق سند مرجع (بخش ۱۰ Search System):
 * "برای ازکالا Search باید یک Component بسیار جدی باشد"
 *
 * نتایج باید شامل:
 * - Products
 * - Devices (منحصر به ازکالا)
 * - Categories
 * - Sellers
 */
class SearchController extends Controller
{
    /**
     * جستجوی global - ترکیب همه entity ها
     * GET /api/v1/search/global?q=cab&device_model_id=1
     *
     * مثال: کاربر سرچ می‌کند "قاب آیفون 15"
     * نتیجه:
     * - محصولات: قاب سیلیکونی، قاب ضدضربه، ...
     * - دستگاه: Apple iPhone 15
     * - دسته: قاب گوشی
     * - فروشندگان: تکنولایف، دیجی‌استور، ...
     */
    public function global(Request $request)
    {
       $validated = $request->validate([
    'q' => 'required|string|min:2|max:100',
    // ✅ loosening: اگر device_model_id وجود نداشت، نادیده بگیر (نه 422)
    'device_model_id' => 'nullable|integer',
    'category_id' => 'nullable|integer',
    'limit' => 'nullable|integer|min:1|max:20',
]);

$query = trim($validated['q']);

// ✅ نرمال‌سازی: اگر device_model_id در دیتابیس نبود، null کن
$deviceModelId = null;
if (!empty($validated['device_model_id'])) {
    $exists = \App\Models\DeviceModel::where('id', $validated['device_model_id'])->exists();
    $deviceModelId = $exists ? (int) $validated['device_model_id'] : null;
}

// ✅ نرمال‌سازی: اگر category_id در دیتابیس نبود، null کن
$categoryId = null;
if (!empty($validated['category_id'])) {
    $exists = \App\Models\Category::where('id', $validated['category_id'])->exists();
    $categoryId = $exists ? (int) $validated['category_id'] : null;
}
        $limit = min((int) ($validated['limit'] ?? 8), 20);

        // ==================== 1. Products Search ====================
        // ✅ قبلاً 'status' بود؛ این ستون اصلاً روی جدول products وجود
        // ندارد (فقط is_active بولین دارد). چون Laravel برای SQLite
        // شناسه‌ها را با کوتیشن دوتایی می‌گذارد، "status" = ? به‌جای خطای
        // «no such column» به‌عنوان رشته‌ی لفظی «status» با ورودی مقایسه
        // می‌شد و همیشه false بود — یعنی جستجو همیشه صفر نتیجه برمی‌گرداند،
        // بدون هیچ خطایی. روی MySQL (که شناسه را با بک‌تیک می‌گذارد) همین
        // خط ۵۰۰ واقعی می‌داد.
        $productsQuery = Product::query()
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%")
                    ->orWhereHas('category', function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%");
                    })
                    ->orWhereHas('brand', function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%");
                    });
            });

        // Device-aware filtering (ویژگی منحصر به ازکالا)
        if ($deviceModelId) {
            $productsQuery->whereHas('deviceModels', function ($q) use ($deviceModelId) {
                $q->where('device_models.id', $deviceModelId);
            });
        }

        // Category filtering
        if ($categoryId) {
            $productsQuery->where('category_id', $categoryId);
        }

        // ✅ قبلاً 'compatibleModels' بود — این رابطه اصلاً روی Product تعریف
        // نشده (نام واقعی‌اش deviceModels است، همان چیزی که ProductResource
        // هم برای compatible_models/device_models انتظار دارد)؛ نتیجه‌اش
        // «Call to undefined relationship» و ۵۰۰ روی هر جستجوی موفق بود.
        $products = $productsQuery
            ->with(['seller', 'category', 'brand', 'deviceModels'])
            ->orderByDesc('sales_count')
            ->limit($limit)
            ->get();

        // ==================== 2. Devices Search (منحصر به ازکالا) ====================
        // جستجو در DeviceBrands (مستقیم)
        $deviceBrands = DeviceBrand::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%");
            })
            ->with('family:id,name,slug,icon')
            ->limit(5)
            ->get(['id', 'name', 'slug', 'family_id']);

        // جستجو در DeviceModels (از طریق series.brand)
        $deviceModels = DeviceModel::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%")
                    // جستجو در نام برند از طریق series
                    ->orWhereHas('series.brand', function ($subQ) use ($query) {
                        $subQ->where('name', 'like', "%{$query}%");
                    });
            })
            ->with(['series.brand:id,name,slug,family_id', 'series.brand.family:id,name,slug,icon'])
            ->limit(8)
            ->get(['id', 'name', 'slug', 'series_id', 'release_year']);

        // ==================== 3. Categories Search ====================
        $categories = Category::where('is_active', true)
            ->where('name', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'slug', 'icon', 'parent_id']);

        // ==================== 4. Sellers Search ====================
        // ✅ قبلاً برای هر فروشنده (تا ۵ تا) در یک حلقه دو کوئری COUNT جدا زده
        // می‌شد (products_count و followers_count) — یعنی تا ۱۰ کوئری اضافه
        // روی هر درخواست جستجو، فقط برای بخش فروشندگان. withCount همه را در
        // همان یک کوئری اصلی با LEFT JOIN COUNT محاسبه می‌کند. rating و
        // verified_at هم حذف شدند چون PublicSellerResource خودش این‌ها را
        // مستقیماً از seller_rating/seller_verified_at می‌خواند — ست کردنشان
        // اینجا کد مرده بود.
        $sellers = User::where('role', 'seller')
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('shop_name', 'like', "%{$query}%")
                    ->orWhere('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%");
            })
            ->withCount([
                'products' => fn ($q) => $q->where('is_active', true),
                'followers',
            ])
            ->limit(5)
            ->get();

        // ==================== Response ====================
        return response()->json([
            'success' => true,
            'data' => [
                'query' => $query,
                'products' => [
                    'count' => $products->count(),
                    'items' => ProductResource::collection($products),
                ],
                'devices' => [
                    'brands_count' => $deviceBrands->count(),
                    'brands' => $deviceBrands,
                    'models_count' => $deviceModels->count(),
                    'models' => $deviceModels,
                ],
                'categories' => [
                    'count' => $categories->count(),
                    'items' => $categories,
                ],
                'sellers' => [
                    'count' => $sellers->count(),
                    'items' => PublicSellerResource::collection($sellers),
                ],
            ],
        ]);
    }

    /**
     * جستجوی دستگاه‌ها (مخصوص DeviceSelector)
     * GET /api/v1/search/devices?q=iPhone
     */
    public function devices(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2|max:100',
            // ✅ Device-First Architecture — حذف نهایی type: فیلتر family
            // (slug واقعیِ device_families) جایگزینِ family-first فیلتر
            // legacy است — دیگر به سه مقدار ثابت mobile/laptop/tablet
            // محدود نیست، هر خانواده‌ی جدید/آینده هم بدون تغییر کد کار
            // می‌کند.
            'family' => 'nullable|string|exists:device_families,slug',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        $query = trim($validated['q']);
        $familySlug = $validated['family'] ?? null;
        $limit = min((int) ($validated['limit'] ?? 10), 20);

        // Brands (DeviceBrand مستقیم)
        $brandsQuery = DeviceBrand::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%");
            });

        if ($familySlug) {
            $brandsQuery->whereHas('family', fn ($q) => $q->where('slug', $familySlug));
        }

        $brands = $brandsQuery->with('family:id,name,slug,icon')->limit($limit)->get(['id', 'name', 'slug', 'family_id']);

        // Models (از طریق series.brand)
        $modelsQuery = DeviceModel::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%")
                    ->orWhereHas('series.brand', function ($subQ) use ($query) {
                        $subQ->where('name', 'like', "%{$query}%");
                    });
            });

        if ($familySlug) {
            $modelsQuery->whereHas('series.brand.family', function ($subQ) use ($familySlug) {
                $subQ->where('slug', $familySlug);
            });
        }

        $models = $modelsQuery
            ->with(['series.brand:id,name,slug,family_id', 'series.brand.family:id,name,slug,icon'])
            ->limit($limit * 2)
            ->get(['id', 'name', 'slug', 'series_id', 'release_year']);

        return response()->json([
            'success' => true,
            'data' => [
                'brands' => $brands,
                'models' => $models,
            ],
        ]);
    }

    /**
     * Popular Suggestions (از API به جای hardcoded)
     * GET /api/v1/search/popular
     */
    public function popular(Request $request)
    {
        // فعلاً از hardcoded استفاده می‌کنیم
        // بعداً می‌توانیم از search_analytics table بگیریم
        $popular = [
            'قاب آیفون 15',
            'شارژر سامسونگ',
            'AirPods Pro 2',
            'گلس گوشی',
            'هندزفری بلوتوثی',
            'پاوربانک',
            'کیف لپ‌تاپ',
            'ماوس گیمینگ',
        ];

        return response()->json([
            'success' => true,
            'data' => $popular,
        ]);
    }
}
