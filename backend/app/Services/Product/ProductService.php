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
            return $this->productRepository->getActiveProducts(
                $filters->toArray(),
                $filters->per_page
            );
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

            $this->productRepository->incrementViews($product->id);

            // ✅ اصلاح شده: استفاده از متد جدید getCompatibleModels
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
                ->with(['brand', 'category'])
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
     * ✅ اصلاح شده: دریافت مدل‌های سازگار با محصول (با نام‌های جدید جداول)
     */
    protected function getCompatibleModels(int $productId): \Illuminate\Support\Collection
    {
        // ⚠️ نکته: اگر نام جدول واسط شما product_device_model است، آن را در خط زیر تغییر دهید
        $pivotTable = 'device_model_product'; 

        return DB::table('device_models')
            ->join($pivotTable, 'device_models.id', '=', $pivotTable . '.device_model_id')
            ->leftJoin('device_series', 'device_models.series_id', '=', 'device_series.id')
            ->leftJoin('device_brands', 'device_series.brand_id', '=', 'device_brands.id')
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
                'device_brands.logo as brand_logo',
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
                        'logo' => $model->brand_logo,
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