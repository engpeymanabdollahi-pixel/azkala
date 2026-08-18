<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Seller\SellerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB; // ✅ این خط حی
use App\Models\Product; // ✅ این خط باید اضافه شود

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

            // specifications ستون واقعی محصول است (fillable و cast:array در
            // مدل)، ولی اینجا در قوانین اعتبارسنجی نبود — یعنی validate()
            // بی‌صدا حذفش می‌کرد، پس فرم فروشنده هیچ‌وقت مشخصات فنی وارد‌شده
            // را ذخیره نمی‌کرد.
            'specifications' => 'nullable|array',

            // ✅ اضافه کردن اعتبارسنجی دستگاه‌های سازگار
            'device_model_ids' => 'nullable|array',
            'device_model_ids.*' => 'exists:device_models,id',

            // ✅ Variant/Color System فاز ۲.۱: کاملاً اختیاری — عدم ارسال
            // این کلید یعنی محصول بدون رنگ، دقیقاً همان رفتار قبلی.
            // price/stock نهایی هرگز از final_price/is_in_stock محاسبه‌شده
            // پذیرفته نمی‌شود — فقط همین ستون‌های خام اعتبارسنجی می‌شوند.
            'variants' => 'sometimes|array',
            'variants.*.color_name' => 'nullable|string|max:100',
            'variants.*.color_code' => 'nullable|string|max:20',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.compare_price' => 'nullable|numeric|min:0',
            'variants.*.discount_price' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.image' => 'nullable|string',
            'variants.*.attributes' => 'nullable|array',
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
                'data' => $product->load(['category', 'brand', 'deviceModels', 'variants']),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
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

            // همان دلیل store(): specifications قبلاً اینجا هم غایب بود.
            'specifications' => 'nullable|array',

            // ✅ اعتبارسنجی دستگاه‌های سازگار
            'device_model_ids' => 'nullable|array',
            'device_model_ids.*' => 'exists:device_models,id',

            // ✅ Variant/Color System فاز ۲.۱: طبق تصمیم صریح، عدم ارسال
            // این کلید یعنی «رنگ‌های فعلی دست‌نخورده بمانند» — نه حذف. اگر
            // ارسال شود، کل مجموعه‌ی رنگ‌های محصول با آن جایگزین می‌شود
            // (ایجاد/به‌روزرسانی/حذفِ صریحِ مواردی که دیگر نیستند).
            'variants' => 'sometimes|array',
            'variants.*.id' => 'sometimes|integer',
            'variants.*.color_name' => 'nullable|string|max:100',
            'variants.*.color_code' => 'nullable|string|max:20',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.compare_price' => 'nullable|numeric|min:0',
            'variants.*.discount_price' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.image' => 'nullable|string',
            'variants.*.attributes' => 'nullable|array',
        ]);

        try {
            $product = $this->sellerService->updateProduct((int) $id, $sellerId, $validated);

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت به‌روزرسانی شد',
                'data' => $product,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'محصول یافت نشد یا متعلق به شما نیست. (شما اجازه ویرایش این محصول را ندارید)'
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('SellerProductController@update: ' . $e->getMessage());

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
            $this->sellerService->deleteProduct((int) $id, $sellerId);

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت حذف شد.'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'محصول یافت نشد یا متعلق به شما نیست.'
            ], 404);
        } catch (\Exception $e) {
            Log::error('SellerProductController@destroy: ' . $e->getMessage());

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
               /**
     * کپی محصول از Template و اختصاص به فروشنده (Enterprise Grade)
     */
    public function copyFromTemplate(Request $request, int $templateId)
    {
        return DB::transaction(function () use ($request, $templateId) {
            $template = Product::query()
                ->whereNull('seller_id')
                ->with(['category', 'brand', 'deviceModels'])
                ->findOrFail($templateId);

            $sellerId = $request->user()->id;

            do {
                $slug = Str::slug($template->name) . '-s' . $sellerId . '-' . Str::lower(Str::random(6));
            } while (Product::where('slug', $slug)->exists());

            $sku = sprintf('TMPL-%d-%s', $sellerId, Str::upper(Str::random(8)));

            $newProduct = $template->replicate();
            
            $newProduct->seller_id = $sellerId;
            $newProduct->slug = $slug;
            $newProduct->sku = $sku;
            $newProduct->is_active = false;
            $newProduct->views_count = 0;
            $newProduct->sales_count = 0;
            $newProduct->rating = 0;
            $newProduct->reviews_count = 0;
            $newProduct->save();

            if ($template->deviceModels->isNotEmpty()) {
                $newProduct->deviceModels()->sync($template->deviceModels->pluck('id'));
            }

            $newProduct->load(['category', 'brand', 'deviceModels']);

            Log::info('Template copied successfully', [
                'template_id' => $template->id,
                'seller_id'   => $sellerId,
                'product_id'  => $newProduct->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت ایجاد شد. اکنون می‌توانید قیمت و موجودی آن را ویرایش کنید.',
                'data' => [
                    'product_id' => $newProduct->id, // ✅ این خط حیاتی است تا ریدایرکت فرانت‌اند کار کند
                    'product' => $newProduct,
                ],
            ], 201);
        });
    }
        /**
     * دریافت تاریخچه تغییرات قیمت و موجودی یک محصول
     */
    public function getHistory(Request $request, int $id)
    {
        try {
            $sellerId = $request->user()->id;
            $histories = $this->sellerService->getSellerProductHistory($id, $sellerId);

            return response()->json([
                'success' => true,
                'data' => $histories,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'محصول یافت نشد یا متعلق به شما نیست.'
            ], 403);
        }
    }
}