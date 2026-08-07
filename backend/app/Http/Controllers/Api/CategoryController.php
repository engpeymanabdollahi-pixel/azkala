<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    /**
     * لیست دسته‌بندی‌ها
     */
    public function index(Request $request)
    {
        try {
            // کش‌گذاری لیست دسته‌بندی‌ها برای ۱ ساعت
            $cacheKey = 'categories_' . ($request->has('with_products_count') ? 'with_count' : 'simple');
            
            $categories = Cache::remember($cacheKey, 3600, function () use ($request) {
                $query = Category::with('children')->root()->active();

                if ($request->has('with_products_count')) {
                    $query->withCount('products');
                }

                return $query->orderBy('sort_order')->get();
            });

            return response()->json([
                'success' => true,
                'data' => CategoryResource::collection($categories),
            ]);
        } catch (\Exception $e) {
            Log::error('CategoryController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت دسته‌بندی‌ها: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * جزئیات یک دسته‌بندی
     */
    public function show(Category $category)
    {
        try {
            $category->load(['children', 'products' => function ($query) {
                $query->where('is_active', true)->with('brand');
            }]);

            return response()->json([
                'success' => true,
                'data' => new CategoryResource($category),
            ]);
        } catch (\Exception $e) {
            Log::error('CategoryController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت دسته‌بندی',
            ], 500);
        }
    }
}