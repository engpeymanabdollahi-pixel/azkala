<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\DTOs\Product\ProductFilterDTO;
use App\Services\Product\ProductService;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductController extends Controller
{
    public function __construct(protected ProductService $productService) {}

    /**
     * لیست محصولات با فیلتر
     */
    public function index(Request $request)
    {
        $filters = ProductFilterDTO::fromRequest($request);
        $products = $this->productService->getProducts($filters);

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products),
        ]);
    }

    /**
     * نمایش جزئیات یک محصول
     */
    public function show($id)
    {
        $product = $this->productService->getProductById((int) $id);

        if (!$product) {
            throw new NotFoundHttpException('محصول یافت نشد');
        }

        $product->load(['brand', 'category', 'images', 'deviceModels']);

        return response()->json([
            'success' => true,
            'data' => ['product' => new ProductResource($product)],
        ]);
    }

    /**
     * نمایش محصول بر اساس اسلاگ
     */
    public function bySlug(string $slug)
    {
        $result = $this->productService->getProductBySlug($slug);

        if (!$result || !isset($result['product'])) {
            throw new NotFoundHttpException('محصول یافت نشد');
        }

        $product = $result['product'];
        
        // بارگذاری روابط در صورتی که آبجکت مدل باشد
        if ($product instanceof \App\Models\Product) {
            $product->loadMissing(['brand', 'category', 'images', 'deviceModels']);
            $result['product'] = new ProductResource($product);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * محصولات ویژه
     */
    public function featured()
    {
        $products = $this->productService->getFeaturedProducts(10);
        
        return response()->json([
            'success' => true, 
            'data' => ProductResource::collection($products)
        ]);
    }

    /**
     * پیشنهادات ویژه (تخفیف‌دار)
     */
    public function specialOffers()
    {
        $products = $this->productService->getSpecialOffers(10);
        
        return response()->json([
            'success' => true, 
            'data' => ProductResource::collection($products)
        ]);
    }

    /**
     * محصولات سازگار با یک مدل گوشی
     */
    public function compatible($modelId)
    {
        $data = $this->productService->getCompatibleProducts((int) $modelId);
        
        return response()->json([
            'success' => true, 
            'data' => $data
        ]);
    }

    /**
     * محصولات سازگار با چندین مدل گوشی
     */
    public function compatibleMulti(Request $request)
    {
        $validated = $request->validate([
            'model_ids' => 'required|array|min:1',
            'model_ids.*' => 'integer|exists:device_models,id',
        ]);

        $products = $this->productService->getCompatibleProductsMulti($validated['model_ids'], 50);
        
        return response()->json([
            'success' => true,
            'data' => [
                'data' => ProductResource::collection($products),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * محصولاتی که کاربر قبلاً خریداری کرده است
     */
    public function myProducts(Request $request)
    {
        $userId = $request->user()->id;
        $products = $this->productService->getUserPurchasedProducts($userId, 20);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => ProductResource::collection($products),
                'total' => $products->total(),
            ],
        ]);
    }
}