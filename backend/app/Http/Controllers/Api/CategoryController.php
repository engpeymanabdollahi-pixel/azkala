<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    /**
     * لیست دسته‌بندی‌ها
     */
    public function index(Request $request)
    {
        try {
            $query = Category::with(['children', 'deviceFamilies:id,name,slug'])->root()->active();

            if ($request->has('with_products_count')) {
                $query->withCount('products');
            }

            // ✅ Marketplace Unification فاز B5/C2: وقتی کاربر دستگاهی
            // انتخاب کرده، فقط دسته‌های همان اکوسیستم + دسته‌های سراسری
            // (بدون هیچ خانواده‌ی متصل) نشان داده شوند — طبق همان قرارداد
            // معافیتِ مستندشده در DeviceEnforcementService.
            if ($request->filled('family_id')) {
                $query->forFamily((int) $request->get('family_id'));
            }

            $categories = $query->orderBy('sort_order')->get();

            return response()->json([
                'success' => true,
                'data' => CategoryResource::collection($categories),
            ]);
        } catch (\Exception $e) {
            Log::error('CategoryController@index: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت دسته‌بندی‌ها: '.$e->getMessage(),
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
            Log::error('CategoryController@show: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت دسته‌بندی',
            ], 500);
        }
    }
}
