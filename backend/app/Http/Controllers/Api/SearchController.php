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
use Illuminate\Support\Facades\DB;

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
            'device_model_id' => 'nullable|integer|exists:device_models,id',
            'category_id' => 'nullable|integer|exists:categories,id',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        $query = trim($validated['q']);
        $deviceModelId = $validated['device_model_id'] ?? null;
        $categoryId = $validated['category_id'] ?? null;
        $limit = min((int) ($validated['limit'] ?? 8), 20);

        // ==================== 1. Products Search ====================
        $productsQuery = Product::query()
            ->where('status', 'active')
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

        $products = $productsQuery
            ->with(['seller', 'category', 'brand', 'compatibleModels'])
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
    ->limit(5)
    ->get(['id', 'name', 'slug', 'type']);

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
    ->with(['series.brand:id,name,slug,type'])
    ->limit(8)
    ->get(['id', 'name', 'slug', 'series_id', 'release_year']);

        // ==================== 3. Categories Search ====================
        $categories = Category::where('is_active', true)
            ->where('name', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'slug', 'icon', 'parent_id']);

        // ==================== 4. Sellers Search ====================
        $sellers = User::where('role', 'seller')
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('shop_name', 'like', "%{$query}%")
                    ->orWhere('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get();

        // attach real counts برای sellers (مثل PublicSellerService)
        foreach ($sellers as $seller) {
            $seller->products_count = Product::where('seller_id', $seller->id)
                ->where('status', 'active')
                ->count();
            $seller->rating = (float) ($seller->seller_rating ?? 0);
            $seller->followers_count = DB::table('seller_follows')
                ->where('seller_id', $seller->id)
                ->count();
            $seller->verified_at = $seller->seller_verified_at;
        }

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
        'type' => 'nullable|string|in:mobile,laptop,tablet,accessory',
        'limit' => 'nullable|integer|min:1|max:20',
    ]);

    $query = trim($validated['q']);
    $type = $validated['type'] ?? null;
    $limit = min((int) ($validated['limit'] ?? 10), 20);

    // Brands (DeviceBrand مستقیم)
    $brandsQuery = DeviceBrand::where('is_active', true)
        ->where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
                ->orWhere('slug', 'like', "%{$query}%");
        });

    if ($type) {
        $brandsQuery->where('type', $type);
    }

    $brands = $brandsQuery->limit($limit)->get(['id', 'name', 'slug', 'type']);

    // Models (از طریق series.brand)
    $modelsQuery = DeviceModel::where('is_active', true)
        ->where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
                ->orWhere('slug', 'like', "%{$query}%")
                ->orWhereHas('series.brand', function ($subQ) use ($query) {
                    $subQ->where('name', 'like', "%{$query}%");
                });
        });

    if ($type) {
        $modelsQuery->whereHas('series.brand', function ($subQ) use ($type) {
            $subQ->where('type', $type);
        });
    }

    $models = $modelsQuery
        ->with(['series.brand:id,name,slug,type'])
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