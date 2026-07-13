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

    public function show($id)
    {
        try {
            $product = $this->productService->getProductById((int) $id);
            if (!$product) {
                return response()->json(['success' => false, 'message' => 'محصول یافت نشد'], 404);
            }

            $product->load(['brand', 'category', 'images', 'phoneModels']);

            return response()->json([
                'success' => true,
                'data' => ['product' => new ProductResource($product)],
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@show: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت محصول'], 500);
        }
    }

    public function bySlug(string $slug)
    {
        try {
            $result = $this->productService->getProductBySlug($slug);

            if (!$result) {
                return response()->json(['success' => false, 'message' => 'محصول یافت نشد'], 404);
            }

            // اگر سرویس آرایه برگرداند و کلید product داشته باشد
            if (is_array($result) && isset($result['product'])) {
                $product = $result['product'];
                
                // اگر یک مدل واقعی باشد، آن را به Resource می‌دهیم
                if ($product instanceof \App\Models\Product) {
                    $product->loadMissing(['brand', 'category', 'images', 'phoneModels']);
                    $result['product'] = new ProductResource($product);
                } 
                // اگر آرایه باشد، به آبجکت تبدیل می‌کنیم تا Resource خطا ندهد
                elseif (is_array($product)) {
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

    public function compatible($modelId)
    {
        try {
            $data = $this->productService->getCompatibleProducts((int) $modelId);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $status);
        }
    }

    public function compatibleMulti(Request $request)
    {
        $request->validate([
            'model_ids' => 'required|array|min:1',
            'model_ids.*' => 'integer|exists:phone_models,id',
        ]);

        try {
            $products = $this->productService->getCompatibleProductsMulti($request->model_ids, 50);
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => ProductResource::collection($products),
                    'total' => $products->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('ProductController@compatibleMulti: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا در دریافت محصولات'], 500);
        }
    }

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