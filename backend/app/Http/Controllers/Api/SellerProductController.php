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
            
            // ✅ اضافه کردن اعتبارسنجی دستگاه‌های سازگار
            'device_model_ids' => 'nullable|array',
            'device_model_ids.*' => 'exists:device_models,id',
        ]);

        // تولید خودکار slug یکتا
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

            // ✅ ذخیره رابطه چند به چند در جدول واسط
            if (isset($validated['device_model_ids'])) {
                $product->deviceModels()->sync($validated['device_model_ids']);
            }

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت ثبت شد',
                'data' => $product->load(['category', 'brand', 'deviceModels']),
            ], 201);

        } catch (\Exception $e) {
            Log::error('SellerProductController@store: ' . $e->getMessage());
            $statusCode = (int) $e->getCode();
            $statusCode = ($statusCode >= 100 && $statusCode < 600) ? $statusCode : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
        }
    }

    /**
     * نمایش یک محصول (برای پر کردن فرم ویرایش)
     */
    public function show(Request $request, $id)
    {
        try {
            $sellerId = $request->user()->id;
            $product = $this->sellerService->getSellerProductDetail((int) $id, $sellerId);

            // ✅ لود کردن دستگاه‌های سازگار برای نمایش در فرم ویرایش
            $product->load(['category', 'brand', 'deviceModels']);

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
        $sellerId = $request->user()->id;

        // ۱. بررسی مالکیت: محصول باید هم وجود داشته باشد و هم متعلق به همین فروشنده باشد
        $product = \App\Models\Product::where('id', $id)
                                      ->where('seller_id', $sellerId)
                                      ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'محصول یافت نشد یا متعلق به شما نیست. (شما اجازه ویرایش این محصول را ندارید)'
            ], 403); // 403 Forbidden به جای 500 Internal Error
        }

        // ۲. اعتبارسنجی داده‌ها
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
            
            // ✅ اعتبارسنجی دستگاه‌های سازگار
            'device_model_ids' => 'nullable|array',
            'device_model_ids.*' => 'exists:device_models,id',
        ]);

        // ۳. بروزرسانی slug در صورت تغییر نام
        if (isset($validated['name']) && $validated['name'] !== $product->name) {
            $baseSlug = \Illuminate\Support\Str::slug($validated['name']);
            $slug = $baseSlug;
            $count = 1;
            while (\App\Models\Product::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $baseSlug . '-' . $count;
                $count++;
            }
            $validated['slug'] = $slug;
        }

        try {
            // ۴. به‌روزرسانی مستقیم و امن محصول (بدون تکیه به Service که ممکن است findOrFail داشته باشد)
            $product->update($validated);

            // ۵. ✅ به‌روزرسانی رابطه چند به چند در جدول واسط
            if (isset($validated['device_model_ids'])) {
                $product->deviceModels()->sync($validated['device_model_ids']);
            } else {
                $product->deviceModels()->sync([]);
            }

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت به‌روزرسانی شد',
                'data' => $product->fresh()->load(['category', 'brand', 'deviceModels']),
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SellerProductController@update: ' . $e->getMessage());
            
            $statusCode = $e->getCode();
            if (!is_int($statusCode) || $statusCode < 400 || $statusCode >= 600) {
                $statusCode = 500;
            }

            return response()->json([
                'success' => false,
                'message' => 'خطا در به‌روزرسانی محصول: ' . $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * حذف محصول
     */
    public function destroy($id)
    {
        try {
            $sellerId = auth()->id();

            $product = \App\Models\Product::where('id', $id)
                                          ->where('seller_id', $sellerId)
                                          ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'محصول یافت نشد یا متعلق به شما نیست.'
                ], 404);
            }

            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت حذف شد.'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SellerProductController@destroy: ' . $e->getMessage());
            
            $statusCode = $e->getCode();
            if (!is_int($statusCode) || $statusCode < 400 || $statusCode >= 600) {
                $statusCode = 500;
            }

            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف محصول: ' . $e->getMessage()
            ], $statusCode);
        }
    }
}