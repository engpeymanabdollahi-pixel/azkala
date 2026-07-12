<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\DTOs\Product\ProductFilterDTO;
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
     * لیست محصولات
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
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت محصولات',
            ], 500);
        }
    }

    /**
     * نمایش یک محصول
     */
    public function show($id)
    {
        try {
            $product = $this->productService->getProductById((int) $id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'محصول یافت نشد',
                ], 404);
            }

            // Load relations for ProductResource
            $product->load(['brand', 'category', 'images', 'phoneModels']);

            return response()->json([
                'success' => true,
                'data' => [
                    'product' => new ProductResource($product),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت محصول',
            ], 500);
        }
    }

    /**
     * محصولات بر اساس slug
     */
    public function bySlug(string $slug)
    {
        try {
            $data = $this->productService->getProductBySlug($slug);

            // If data contains a product, wrap it with ProductResource
            if (isset($data['product'])) {
                $data['product'] = new ProductResource($data['product']);
            }

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * محصولات ویژه
     */
    public function featured()
    {
        try {
            $products = $this->productService->getFeaturedProducts(10);

            return response()->json([
                'success' => true,
                'data' => ProductResource::collection($products),
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@featured: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت محصولات ویژه',
            ], 500);
        }
    }

    /**
     * پیشنهادات ویژه
     */
    public function specialOffers()
    {
        try {
            $products = $this->productService->getSpecialOffers(10);

            return response()->json([
                'success' => true,
                'data' => ProductResource::collection($products),
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@specialOffers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت پیشنهادات ویژه',
            ], 500);
        }
    }

    /**
     * دریافت محصولات سازگار با یک مدل گوشی
     */
    public function compatible($modelId)
    {
        try {
            $data = $this->productService->getCompatibleProducts((int) $modelId);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * محصولات سازگار با چندین مدل
     */
    public function compatibleMulti(Request $request)
    {
        $request->validate([
            'model_ids' => 'required|array|min:1',
            'model_ids.*' => 'integer|exists:phone_models,id',
        ]);

        try {
            $products = $this->productService->getCompatibleProductsMulti(
                $request->model_ids,
                50
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => ProductResource::collection($products),
                    'total' => $products->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@compatibleMulti: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت محصولات: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * محصولات خریداری شده توسط کاربر
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
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت محصولات',
            ], 500);
        }
    }
}