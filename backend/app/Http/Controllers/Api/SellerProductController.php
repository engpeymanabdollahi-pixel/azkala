<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Seller\SellerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerProductController extends Controller
{
    protected SellerService $sellerService;

    public function __construct(SellerService $sellerService)
    {
        $this->sellerService = $sellerService;
    }

    /**
     * لیست محصولات فروشنده
     */
    public function index(Request $request)
    {
        try {
            $sellerId = $request->user()->id;
            $perPage = (int) $request->get('per_page', 10);

            $products = $this->sellerService->getSellerProductsList($sellerId, $perPage);

            return response()->json([
                'success' => true,
                'data' => $products,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerProductController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * ثبت محصول جدید
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'short_description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'sku' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'main_image' => 'nullable|string',
            'gallery' => 'nullable|array',
            'gallery.*' => 'string',
        ]);

        try {
            $sellerId = $request->user()->id;
            $product = $this->sellerService->createProduct($sellerId, $validated);

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت ثبت شد',
                'data' => $product->load(['category', 'brand']),
            ], 201);

        } catch (\Exception $e) {
            Log::error('SellerProductController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * نمایش یک محصول
     */
    public function show(Request $request, $id)
    {
        try {
            $sellerId = $request->user()->id;
            $product = $this->sellerService->getSellerProductDetail((int) $id, $sellerId);

            return response()->json([
                'success' => true,
                'data' => $product,
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
     * بروزرسانی محصول
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'short_description' => 'nullable|string|max:500',
            'price' => 'sometimes|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'sku' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'main_image' => 'nullable|string',
            'gallery' => 'nullable|array',
            'gallery.*' => 'string',
        ]);

        try {
            $sellerId = $request->user()->id;
            $product = $this->sellerService->updateProduct((int) $id, $sellerId, $validated);

            return response()->json([
                'success' => true,
                'message' => 'محصول به‌روزرسانی شد',
                'data' => $product,
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
     * حذف محصول
     */
    public function destroy(Request $request, $id)
    {
        try {
            $sellerId = $request->user()->id;
            $this->sellerService->deleteProduct((int) $id, $sellerId);

            return response()->json([
                'success' => true,
                'message' => 'محصول حذف شد',
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}