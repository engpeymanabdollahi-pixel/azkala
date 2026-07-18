<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\DTOs\Product\ProductFilterDTO;
use App\Models\DeviceModel; // ✅ اضافه شده برای اعتبارسنجی دقیق
use App\Services\Product\ProductService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    protected ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    /**
     * لیست محصولات با فیلتر
     */
    public function index(Request $request)
    {
        try {
            $filters = ProductFilterDTO::fromRequest($request);
            $products = $this->productService->getProducts($filters);

            return response()->json([
                'success' => true,
                'data' => ProductResource::collection($products),
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@index: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت محصولات'], 500);
        }
    }

    /**
     * نمایش جزئیات یک محصول
     */
    public function show($id)
    {
        try {
            $product = $this->productService->getProductById((int) $id);
            
            if (!$product) {
                return response()->json(['success' => false, 'message' => 'محصول یافت نشد'], 404);
            }

            // ✅ نکته مهم: نام رابطه (relationship) در مدل Product باید 'deviceModels' باشد نه 'phoneModels'
            $product->load(['brand', 'category', 'images', 'deviceModels']);

            return response()->json([
                'success' => true,
                'data' => ['product' => new ProductResource($product)],
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@show: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت محصول'], 500);
        }
    }

    /**
     * نمایش محصول بر اساس اسلاگ
     */
    public function bySlug(string $slug)
    {
        try {
            $result = $this->productService->getProductBySlug($slug);

            if (!$result) {
                return response()->json(['success' => false, 'message' => 'محصول یافت نشد'], 404);
            }

            if (is_array($result) && isset($result['product'])) {
                $product = $result['product'];
                
                if ($product instanceof \App\Models\Product) {
                    $product->loadMissing(['brand', 'category', 'images', 'deviceModels']);
                    $result['product'] = new ProductResource($product);
                } elseif (is_array($product)) {
                    $result['product'] = (object) $product;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@bySlug: ' . $e->getMessage() . ' | Line: ' . $e->getLine());
            $status = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت محصول: ' . $e->getMessage(),
            ], $status);
        }
    }

    /**
     * محصولات ویژه
     */
    public function featured()
    {
        try {
            $products = $this->productService->getFeaturedProducts(10);
            return response()->json(['success' => true, 'data' => ProductResource::collection($products)]);
        } catch (\Exception $e) {
            Log::error('ProductController@featured: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت محصولات ویژه'], 500);
        }
    }

    /**
     * پیشنهادات ویژه (تخفیف‌دار)
     */
    public function specialOffers()
    {
        try {
            $products = $this->productService->getSpecialOffers(10);
            return response()->json(['success' => true, 'data' => ProductResource::collection($products)]);
        } catch (\Exception $e) {
            Log::error('ProductController@specialOffers: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت پیشنهادات ویژه'], 500);
        }
    }

       /**
     * محصولات سازگار با یک مدل گوشی
     */
    public function compatible($modelId)
    {
        try {
            $data = $this->productService->getCompatibleProducts((int) $modelId);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ProductController@compatible: ' . $e->getMessage());
            
            // ✅ راه‌حل ریشه‌ای: اطمینان از اینکه کد وضعیت یک عدد صحیح معتبر است
            $statusCode = $e->getCode();
            if (!is_int($statusCode) || $statusCode < 400 || $statusCode >= 600) {
                $statusCode = 500; // اگر رشته یا نامعتبر بود، پیش‌فرض ۵۰۰ در نظر بگیر
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'خطا در دریافت محصولات سازگار'
            ], $statusCode);
        }
    }

    /**
     * محصولات سازگار با چندین مدل گوشی
     */
    public function compatibleMulti(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'model_ids' => 'required|array|min:1',
            'model_ids.*' => 'integer|exists:device_models,id', // ✅ نام جدول جدید
        ]);

        try {
            $products = $this->productService->getCompatibleProductsMulti($validated['model_ids'], 50);
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => \App\Http\Resources\ProductResource::collection($products),
                    'total' => $products->total(),
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ProductController@compatibleMulti: ' . $e->getMessage());
            
            // ✅ راه‌حل ریشه‌ای: اطمینان از اینکه کد وضعیت یک عدد صحیح معتبر است
            $statusCode = $e->getCode();
            if (!is_int($statusCode) || $statusCode < 400 || $statusCode >= 600) {
                $statusCode = 500;
            }

            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت محصولات'
            ], $statusCode);
        }
    }

    /**
     * محصولاتی که کاربر قبلاً خریداری کرده است
     */
    public function myProducts(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $products = $this->productService->getUserPurchasedProducts($userId, 20);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => ProductResource::collection($products),
                    'total' => $products->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@myProducts: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت محصولات'], 500);
        }
    }
}