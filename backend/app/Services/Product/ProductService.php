<?php

namespace App\Services\Product;

use App\DTOs\Product\ProductFilterDTO;
use App\Http\Resources\ProductVariantResource;
use App\Models\DeviceModel;
use App\Models\Product;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductService
{
    protected ProductRepository $productRepository;

    public function __construct(ProductRepository $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    public function getProducts(ProductFilterDTO $filters): LengthAwarePaginator
    {
        try {
            return $this->productRepository->getActiveProducts(
                $filters->toArray(),
                $filters->per_page
            );
        } catch (\Exception $e) {
            Log::error('ProductService@getProducts: '.$e->getMessage());
            throw $e;
        }
    }

    public function getProductById(int $id): ?Model
    {
        return $this->productRepository->find($id);
    }

    public function getProductBySlug(string $slug): array
    {
        try {
            $product = $this->productRepository->findBySlug($slug);

            if (! $product) {
                // ✅ قبلاً یک \Exception ساده با کد 404 پرتاب می‌شد؛ لاراول
                // HttpExceptionInterface را برای تعیین کد HTTP بررسی می‌کند، نه
                // getCode() یک Exception عادی را — یعنی هر اسلاگ ناموجود
                // (چه از کاربر واقعی، چه از کراولر) به‌جای ۴۰۴ تمیز، ۵۰۰
                // می‌گرفت (دقیقاً چیزی که در لاگ‌های واقعی ثبت شده بود).
                throw new NotFoundHttpException('محصول یافت نشد');
            }

            // ✅ این خط حیاتی را اضافه کنید
            $product->loadMissing(['seller', 'images']);

            $this->productRepository->incrementViews($product->id);

            $compatibleModels = $this->getCompatibleModels($product->id);

            $relatedProducts = $this->productRepository->getRelatedProducts(
                $product->category_id,
                $product->id,
                8
            );

            // ✅ Product Relationship Phase 2: «همراه این محصول» — مستقل و
            // مجزا از $relatedProducts بالا (هم‌دسته‌ای پویا) و از
            // compatible_models (سازگاری دستگاه). دو دیتاست هرگز merge
            // نمی‌شوند.
            $complementaryProducts = $this->productRepository->getComplementaryProducts(
                $product->id,
                6
            );

            $sellerData = null;
            if ($product->seller) {
                $sellerData = [
                    'id' => $product->seller->id,
                    'shop_name' => $product->seller->shop_name ?? $product->seller->name ?? 'فروشنده ازکالا',
                    'slug' => $product->seller->slug, // ✅ این خط حیاتی را اضافه کنید
                    'slug' => $product->seller->slug, // ✅ این خط حیاتی را اضافه کنید
                    'user_id' => $product->seller->id,
                    'rating' => (float) ($product->seller->seller_rating ?? 0),
                    'badge' => $product->seller->seller_badge ?? null,
                    'is_verified' => ! is_null($product->seller->seller_verified_at),
                    'total_sales' => $product->seller->total_sales ?? 0,
                    'products_count' => $product->seller->products_count ?? 0,
                    'bio' => $product->seller->bio ?? '',
                    'avatar' => $product->seller->avatar ?? null,
                    'last_seen_at' => $product->seller->last_seen_at,
                ];
            }

            $productData = $product->toArray();
            // ✅ فیلد واقعی ProductImage `image_path` است؛ `image_url` وجود
            // ندارد و چون جدول product_images تا قبل از ProductImageSeeder
            // همیشه خالی بود، این خط هرگز دیده نمی‌شد (همیشه [null,null,null]
            // برمی‌گرداند). فرانت‌اند قرارداد `images: string[]` را انتظار دارد.
            $productData['images'] = $product->images ? $product->images->pluck('image_path')->toArray() : [];
            $productData['seller'] = $sellerData;

            // ✅ Variant/Color System فاز ۳: این متد (نه ProductResource) واقعاً
            // پاسخ صفحه‌ی جزئیات محصول را می‌سازد — ProductController::bySlug
            // فقط وقتی $result['product'] یک instanceof Product باشد آن را با
            // ProductResource می‌پیچد، ولی همین‌جا همیشه یک آرایه‌ی خام
            // ($product->toArray()) برگردانده می‌شود، پس آن شرط هرگز true
            // نمی‌شود (باگ از‌قبل موجود، کاملاً بی‌ربط به variants، خارج از
            // دامنه‌ی این فاز برای رفع کامل). بدون این دو خط، has_variants
            // اصلاً در پاسخ نبود و variants به‌شکل خام مدل (نه سریالایز‌شده‌ی
            // یکدست ProductVariantResource) برمی‌گشت — دقیقاً همان دو چیزی که
            // انتخابگر رنگ در صفحه‌ی محصول به آن نیاز دارد.
            $productData['has_variants'] = $product->relationLoaded('variants')
                ? $product->variants->isNotEmpty()
                : false;
            $productData['variants'] = $product->relationLoaded('variants')
                ? ProductVariantResource::collection($product->variants)->resolve()
                : [];

            $mapProductSummary = function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'main_image' => $p->main_image,
                    'price' => (float) $p->price,
                    'compare_price' => $p->compare_price ? (float) $p->compare_price : null,
                    'discount_percentage' => $p->discount_percentage ?? 0,
                    'rating' => (float) ($p->rating ?? 0),
                    'reviews_count' => $p->reviews_count ?? 0,
                    'sales_count' => $p->sales_count ?? 0,
                ];
            };

            $relatedProductsData = $relatedProducts->map($mapProductSummary);
            $complementaryProductsData = $complementaryProducts->map($mapProductSummary);

            return [
                'product' => $productData,
                'compatible_models' => $compatibleModels,
                'related_products' => $relatedProductsData,
                'complementary_products' => $complementaryProductsData,
            ];

        } catch (NotFoundHttpException $e) {
            // اسلاگ ناموجود یک خطای واقعی سرور نیست (کاربر لینک قدیمی زده یا
            // کراولر اسلاگ اشتباه خوانده)؛ نباید هر بار لاگ ERROR اسپم کند.
            throw $e;
        } catch (\Exception $e) {
            Log::error('ProductService@getProductBySlug: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * ✅ رفع باگ واقعی و قابل‌بازتولید GET /api/v1/products/featured → 500:
     * نسخه‌ی قبلی کل Collection مدل‌های Eloquent (با روابط brand/category/
     * images/seller بارشده) را مستقیماً با Cache::remember کش می‌کرد.
     * درایور کش این پروژه 'database' است (config/cache.php → CACHE_STORE)،
     * یعنی serialize() خامِ PHP از کل گراف آبجکت‌ها در جدول cache ذخیره
     * می‌شود. در یک پردازش/درخواست تازه (که کلاس‌های لازم هنوز autoload
     * نشده‌اند)، unserialize() این گراف پیچیده با خطای واقعی زیر شکست
     * می‌خورد — تأیید شده با بازتولید مستقیم (دو فراخوانی جدا، یکی cache
     * miss که موفق است، بعدی cache hit که می‌شکند):
     *   "Error: The script tried to call a method on an incomplete
     *    object... Illuminate\Database\Eloquent\Collection ... was
     *    loaded before unserialize()"
     * یعنی دقیقاً endpoint اولین بار (cache miss) کار می‌کرد و بعد از آن
     * (cache hit) با ۵۰۰ می‌شکست — همان چیزی که گزارش شده بود.
     *
     * فیکس: فقط آرایه‌ی سبک ID ها cache می‌شود (یک آرایه‌ی int ساده،
     * serialize/unserialize‌اش صد-در-صد امن است، نه گراف Eloquent) و
     * مدل‌ها با روابطشان هر بار fresh از DB خوانده می‌شوند — یک کوئری
     * indexed سبک روی is_featured/is_active، نه باری که کش قرار بود
     * جلویش را بگیرد. AzkalaSyncCommand از قبل کلید 'featured_product_ids_'
     * را هم پاک می‌کند (کنار 'featured_products_' قدیمی) — این تغییر
     * همان کلید را واقعاً پر می‌کند.
     */
    public function getFeaturedProducts(int $limit = 10)
    {
        $ids = Cache::remember('featured_product_ids_'.$limit, 3600, function () use ($limit) {
            return Product::where('is_featured', true)
                ->where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->pluck('id')
                ->all();
        });

        if (empty($ids)) {
            return collect();
        }

        $products = Product::whereIn('id', $ids)
            ->with(['brand', 'category', 'images', 'seller'])
            ->get();

        // whereIn ترتیب را تضمین نمی‌کند — ترتیب اصلی (جدیدترین اول) از
        // روی همان آرایه‌ی cache‌شده‌ی $ids بازسازی می‌شود.
        $order = array_flip($ids);

        return $products->sortBy(fn ($product) => $order[$product->id] ?? PHP_INT_MAX)->values();
    }

    public function getSpecialOffers(int $limit = 10): Collection
    {
        return $this->productRepository->getSpecialOffers($limit);
    }

    /**
     * ✅ اصلاح شده: دریافت محصولات سازگار با مدل دستگاه جدید
     */
    public function getCompatibleProducts(int $modelId, int $perPage = 20): array
    {
        try {
            // ✅ بررسی وجود مدل در جدول جدید device_models
            $model = DeviceModel::with('series.brand')->find($modelId);

            if (! $model) {
                throw new \Exception('مدل گوشی یافت نشد', 404);
            }

            // ✅ Marketplace Unification فاز C4: قبلاً همیشه یک شکلِ صفحه‌بندیِ
            // ساختگی برمی‌گشت (current_page=1, last_page=1, per_page=100)
            // بدون توجه به تعداد واقعی نتایج — یعنی برای دستگاه‌های محبوب با
            // ده‌ها محصول سازگار، همه در یک «صفحه» ساختگی برمی‌گشتند. کلیدها
            // دقیقاً همان قبلی‌اند (بدون شکستن قرارداد API)، فقط مقادیر
            // اکنون از یک LengthAwarePaginator واقعی می‌آیند.
            $products = $this->productRepository->getCompatibleProducts($modelId, $perPage);

            return [
                'data' => $products->items(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ];

        } catch (\Exception $e) {
            Log::error('ProductService@getCompatibleProducts: '.$e->getMessage());
            throw $e;
        }
    }

    public function getCompatibleProductsMulti(array $modelIds, int $perPage = 50): LengthAwarePaginator
    {
        return $this->productRepository->getCompatibleProductsMulti($modelIds, $perPage);
    }

    public function getUserPurchasedProducts(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->productRepository->getUserPurchasedProducts($userId, $perPage);
    }

    /**
     * ✅ اصلاح شده: دریافت مدل‌های سازگار با محصول (بدون ستون logo که وجود ندارد)
     */
    protected function getCompatibleModels(int $productId): \Illuminate\Support\Collection
    {
        $pivotTable = 'device_model_product';

        // ✅ این کوئری خام است و global scope مربوط به SoftDeletes روی آن اعمال
        // نمی‌شود، پس deleted_at باید دستی فیلتر شود. برای leftJoinها شرط داخل
        // خود join گذاشته شده تا اگر سری/برند حذف نرم شده باشد، مدل همچنان
        // برگردانده شود (با مقدار null) نه اینکه کل ردیف حذف شود.
        return DB::table('device_models')
            ->join($pivotTable, 'device_models.id', '=', $pivotTable.'.device_model_id')
            ->leftJoin('device_series', function ($join) {
                $join->on('device_models.series_id', '=', 'device_series.id')
                    ->whereNull('device_series.deleted_at');
            })
            ->leftJoin('device_brands', function ($join) {
                $join->on('device_series.brand_id', '=', 'device_brands.id')
                    ->whereNull('device_brands.deleted_at');
            })
            ->whereNull('device_models.deleted_at')
            ->where($pivotTable.'.product_id', $productId)
            ->select(
                'device_models.id',
                'device_models.name',
                'device_models.slug',
                'device_models.image',
                'device_models.release_year',
                'device_brands.id as brand_id',
                'device_brands.name as brand_name',
                'device_brands.slug as brand_slug',
                // 'device_brands.logo' حذف شد چون در دیتابیس وجود ندارد و باعث خطای 500 می‌شد
                'device_series.id as series_id',
                'device_series.name as series_name',
                'device_series.slug as series_slug'
            )
            ->get()
            ->map(function ($model) {
                return [
                    'id' => (int) $model->id,
                    'name' => $model->name,
                    'slug' => $model->slug,
                    'image' => $model->image,
                    'release_year' => $model->release_year,
                    'brand' => $model->brand_id ? [
                        'id' => (int) $model->brand_id,
                        'name' => $model->brand_name,
                        'slug' => $model->brand_slug,
                        'logo' => null, // مقدار null قرار داده شد تا خطا ندهد
                    ] : null,
                    'series' => $model->series_id ? [
                        'id' => (int) $model->series_id,
                        'name' => $model->series_name,
                        'slug' => $model->series_slug,
                    ] : null,
                ];
            });
    }
}
