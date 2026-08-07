<?php

namespace App\Services\Product;

use App\DTOs\Product\ProductFilterDTO;
use App\Models\DeviceModel;
use App\Models\Product;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

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
            // کش‌گذاری لیست محصولات با کلید داینامیک بر اساس فیلترها
            $cacheKey = 'products_' . md5(json_encode($filters->toArray()));
            
            return Cache::remember($cacheKey, 600, function () use ($filters) {
                return $this->productRepository->getActiveProducts(
                    $filters->toArray(),
                    $filters->per_page
                );
            });
        } catch (\Exception $e) {
            Log::error('ProductService@getProducts: ' . $e->getMessage());
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

            if (!$product) {
                throw new \Exception('محصول یافت نشد', 404);
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
                    'is_verified' => !is_null($product->seller->seller_verified_at),
                    'total_sales' => $product->seller->total_sales ?? 0,
                    'products_count' => $product->seller->products_count ?? 0,
                    'bio' => $product->seller->bio ?? '',
                    'avatar' => $product->seller->avatar ?? null,
                    'last_seen_at' => $product->seller->last_seen_at,
                ];
            }

            $productData = $product->toArray();
            $productData['images'] = $product->images ? $product->images->pluck('image_url')->toArray() : [];
            $productData['seller'] = $sellerData;

            $relatedProductsData = $relatedProducts->map(function ($p) {
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
            });

            return [
                'product' => $productData,
                'compatible_models' => $compatibleModels,
                'related_products' => $relatedProductsData,
            ];

        } catch (\Exception $e) {
            Log::error('ProductService@getProductBySlug: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getFeaturedProducts(int $limit = 10)
    {
        return Cache::remember('featured_products_' . $limit, 3600, function () use ($limit) {
            return Product::where('is_featured', true)
                ->where('is_active', true)
                // images و seller هم لازم‌اند چون ProductResource می‌خواندشان.
                // کش این را پنهان می‌کرد: فقط در cache miss یک کوئری اضافه به‌ازای
                // هر محصول زده می‌شد، که در شمارش کوئری روی درخواست دوم دیده نمی‌شد.
                ->with(['brand', 'category', 'images', 'seller'])
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();
        });
    }

    public function getSpecialOffers(int $limit = 10): Collection
    {
        return $this->productRepository->getSpecialOffers($limit);
    }

    /**
     * ✅ اصلاح شده: دریافت محصولات سازگار با مدل دستگاه جدید
     */
    public function getCompatibleProducts(int $modelId): array
    {
        try {
            // ✅ بررسی وجود مدل در جدول جدید device_models
            $model = DeviceModel::with('series.brand')->find($modelId);
            
            if (!$model) {
                throw new \Exception('مدل گوشی یافت نشد', 404);
            }

            $products = $this->productRepository->getCompatibleProducts($modelId);

            return [
                'data' => $products,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 100,
                'total' => $products->count(),
            ];

        } catch (\Exception $e) {
            Log::error('ProductService@getCompatibleProducts: ' . $e->getMessage());
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
            ->join($pivotTable, 'device_models.id', '=', $pivotTable . '.device_model_id')
            ->leftJoin('device_series', function ($join) {
                $join->on('device_models.series_id', '=', 'device_series.id')
                    ->whereNull('device_series.deleted_at');
            })
            ->leftJoin('device_brands', function ($join) {
                $join->on('device_series.brand_id', '=', 'device_brands.id')
                    ->whereNull('device_brands.deleted_at');
            })
            ->whereNull('device_models.deleted_at')
            ->where($pivotTable . '.product_id', $productId)
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