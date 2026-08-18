<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class BrandController extends Controller
{
    public function index()
    {
        // ✅ فاز ۰ Brand Backend Correctness: قبلاً فقط orderBy('name') بود —
        // یعنی ستون sort_order (که پنل ادمین از قبل قابل‌ویرایش کرده و
        // به‌صورت پیش‌فرض هم مبنای مرتب‌سازی AdminBrandRepository است:
        // 'sort_by' => $request->get('sort_by', 'sort_order')) در API
        // عمومی هیچ اثری نداشت. orderBy('name') به‌عنوان tie-breaker دوم
        // اضافه شد تا وقتی چند برند sort_order یکسان دارند (مثلاً همه ۰
        // پیش‌فرض) ترتیب قطعی/deterministic بماند، نه وابسته به ترتیب
        // فیزیکی ردیف‌های DB.
        $brands = Brand::active()
            ->withCount("products")
            ->orderBy("sort_order")
            ->orderBy("name")
            ->get();

        return response()->json([
            "success" => true,
            "data" => BrandResource::collection($brands),
        ]);
    }

    /**
     * برند بر اساس slug — قرینه‌ی /products/slug/{slug}.
     *
     * brand.service.ts از قبل این مسیر را صدا می‌زد ولی هیچ روتی برایش وجود
     * نداشت، پس همیشه ۴۰۴ می‌گرفت. فقط برندهای فعال، مثل show().
     */
    public function bySlug(string $slug)
    {
        $brand = Brand::active()->where('slug', $slug)->firstOrFail();

        return $this->show($brand);
    }

    /**
     * ✅ فاز ۰ Brand Backend Correctness — دو مشکل تایید‌شده:
     *
     * ۱. برند inactive از این مسیر قابل‌مشاهده بود: بر خلاف index()/bySlug()
     *    (که هر دو Brand::active() دارند)، show(Brand $brand) با implicit
     *    route-model-binding هر برندی (حتی is_active=false) را resolve
     *    می‌کرد و بدون هیچ چک اضافه‌ای برمی‌گرداند — ناهماهنگ با همان
     *    قاعده‌ی «فقط برند فعال» که در دو endpoint خواهر از قبل برقرار
     *    است. (برند soft-deleted از قبل درست ۴۰۴ می‌داد، چون SoftDeletes
     *    یک global scope واقعی است و حتی route-model-binding را هم فیلتر
     *    می‌کند — آن بخش نیازی به تغییر نداشت.)
     *
     * ۲. $brand->load(['products' => ...]) کل محصولات فعال برند (با
     *    category هرکدام) را بدون هیچ صفحه‌بندی از DB می‌خواند — ولی
     *    BrandResource::toArray() اصلاً کلید 'products' را در خروجی
     *    serialize نمی‌کند (بررسی مستقیم فایل، هیچ ارجاعی به
     *    $this->products وجود ندارد). یعنی این کوئری صرفاً هدر می‌رفت:
     *    نه در پاسخ استفاده می‌شد، نه هیچ مصرف‌کننده‌ی فرانتی به آن متکی
     *    بود (brand.service.ts::getBrand/getBrandBySlug فقط فیلدهای سطح
     *    بالای Brand را تایپ کرده‌اند، بدون products). حذف این load هیچ
     *    تغییری در ساختار JSON پاسخ ایجاد نمی‌کند — دقیقاً همان قرارداد
     *    فعلی حفظ می‌شود. جایگزین آن (به‌جای products کامل)
     *    loadCount('products') است تا products_count واقعی/زنده باشد
     *    (نه ستون DB که هیچ observer ای آن را sync نمی‌کند).
     */
    public function show(Brand $brand)
    {
        if (! $brand->is_active) {
            // ✅ همان الگوی ProductController::show() (throw new
            // NotFoundHttpException به‌جای abort خام) تا شکل خطا با بقیه‌ی
            // این کنترلرها یکدست بماند.
            throw new NotFoundHttpException('برند یافت نشد');
        }

        $brand->loadCount('products');

        return response()->json([
            "success" => true,
            "data" => new BrandResource($brand),
        ]);
    }
}