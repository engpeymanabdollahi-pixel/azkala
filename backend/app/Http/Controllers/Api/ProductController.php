<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\DTOs\Product\ProductFilterDTO;
use App\Models\DeviceFamily;
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
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
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
        /**
     * دریافت لیست محصولات Template (برای کپی توسط فروشندگان)
     */
    public function templates(Request $request)
    {
        $templates = Product::whereNull('seller_id')
            ->where('is_active', true)
            ->with(['category', 'brand', 'deviceModels'])
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($templates),
        ]);
    }
        /**
     * دریافت لیست محصولات الگو (Template) برای فروشندگان
     */
    public function getTemplates(Request $request)
    {
        // deviceModels لازم است چون فرانت‌اند «دستگاه‌های سازگار» را از همین
        // پاسخ می‌خواند؛ بدون eager load، N+1 روی هر تمپلیت می‌زد و چون رابطه
        // اصلاً لود نمی‌شد، همیشه خالی برمی‌گشت — سازگاری هیچ‌وقت دیده نمی‌شد
        // با اینکه در دیتابیس واقعاً ثبت است.
        $query = \App\Models\Product::whereNull('seller_id')
            ->with(['category:id,name', 'brand:id,name', 'deviceModels:id,name']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('category', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('brand', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // نوع دستگاه سازگار — دسته‌بندی‌های واقعی فروشگاه (قاب، شارژر،
        // هدفون و ...) لوازم جانبی‌اند، نه خودِ دستگاه؛ تنها راه واقعی برای
        // «فقط لوازم گوشی» یا «فقط لوازم لپ‌تاپ» دیدن، فیلتر بر اساس نوعِ
        // برندِ دستگاه‌های سازگارِ هر تمپلیت است.
        //
        // ✅ Device-First Architecture فاز ۲ (Legacy Consolidation): این فیلتر
        // قبلاً فقط device_brands.type (ستون منسوخ) را می‌خواند و فقط سه
        // مقدار ثابت mobile/laptop/tablet را می‌پذیرفت — یک مسیر موازیِ
        // سازگاریِ «duplicate» نسبت به device_families که فاز ۱ ساخت، و
        // دقیقاً همان مشکلی که کل معماری Device-First قرار بود حل کند: هیچ
        // خانواده‌ی جدیدی (مثلاً Smartwatch) هرگز از این فیلتر قابل‌عبور
        // نبود، حتی بعد از ساختنش در ادمین. اکنون device_type هر
        // slug واقعیِ device_families را هم می‌پذیرد (نه فقط سه مقدار
        // legacy)؛ سه مقدار قدیمی هنوز به همان خانواده‌های معادل نگاشت
        // می‌شوند تا هیچ فراخوان موجودی نشکند، و type ستون هم به‌عنوان
        // fallback برای برندهایی که هنوز family_id ندارند باقی مانده.
        // مقدار ناشناخته (نه یک legacy value، نه یک slug واقعی) دقیقاً مثل
        // قبل بی‌صدا نادیده گرفته می‌شود — نه ۴۲۲، نه فیلتر نادرست.
        if ($request->filled('device_type')) {
            $deviceType = $request->device_type;
            $legacyToFamilySlug = ['mobile' => 'smartphone', 'laptop' => 'laptop', 'tablet' => 'tablet'];
            $familySlug = $legacyToFamilySlug[$deviceType] ?? $deviceType;

            if (DeviceFamily::where('slug', $familySlug)->exists()) {
                $query->whereHas('deviceModels.series.brand', function ($q) use ($deviceType, $familySlug) {
                    $q->where('type', $deviceType) // legacy fallback برای برند بدون family_id
                      ->orWhereHas('family', fn ($qf) => $qf->where('slug', $familySlug));
                });
            }
        }

        $templates = $query->paginate($request->per_page ?? 50);

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }
}