<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Seller\SellerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
            $page = (int) $request->get('page', 1);
            $perPage = (int) $request->get('per_page', 20);

            $products = $this->sellerService->getSellerProductsList($sellerId, $page, $perPage);

            return response()->json([
                'success' => true,
                'data' => $products,
            ]);
        } catch (\Exception $e) {
            Log::error('SellerProductController@index: ' . $e->getMessage());
            $statusCode = (int) $e->getCode();
            $statusCode = ($statusCode >= 100 && $statusCode < 600) ? $statusCode : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
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

        // ✅ تولید خودکار slug یکتا
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $count = 1;
        while (\App\Models\Product::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $count;
            $count++;
        }
        $validated['slug'] = $slug;

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
            $statusCode = (int) $e->getCode();
            $statusCode = ($statusCode >= 100 && $statusCode < 600) ? $statusCode : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
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
            $statusCode = (int) $e->getCode();
            $statusCode = ($statusCode >= 100 && $statusCode < 600) ? $statusCode : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
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

        // ✅ بروزرسانی slug در صورت تغییر نام
        if (isset($validated['name'])) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $count = 1;
            while (\App\Models\Product::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $baseSlug . '-' . $count;
                $count++;
            }
            $validated['slug'] = $slug;
        }

        try {
            $sellerId = $request->user()->id;
            $product = $this->sellerService->updateProduct((int) $id, $sellerId, $validated);

            return response()->json([
                'success' => true,
                'message' => 'محصول به‌روزرسانی شد',
                'data' => $product,
            ]);
        } catch (\Exception $e) {
            $statusCode = (int) $e->getCode();
            $statusCode = ($statusCode >= 100 && $statusCode < 600) ? $statusCode : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
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
            $statusCode = (int) $e->getCode();
            $statusCode = ($statusCode >= 100 && $statusCode < 600) ? $statusCode : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
        }
    }
}