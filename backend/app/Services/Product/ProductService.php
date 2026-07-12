<?php

namespace App\Services\Product;

use App\DTOs\Product\ProductFilterDTO;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductService
{
    protected ProductRepository $productRepository;

    public function __construct(ProductRepository $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    /**
     * Get paginated products with filters
     */
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

    /**
     * Get product by ID
     */
    public function getProductById(int $id): ?Model
    {
        return $this->productRepository->find($id);
    }

    /**
     * Get product by slug with all details
     */
    public function getProductBySlug(string $slug): array
    {
        try {
            $product = $this->productRepository->findBySlug($slug);

            if (!$product) {
                throw new \Exception('محصول یافت نشد', 404);
            }

            // Increment views
            $this->productRepository->incrementViews($product->id);

            // Get compatible models
            $compatibleModels = $this->getCompatibleModels($product->id);

            // Get related products
            $relatedProducts = $this->productRepository->getRelatedProducts(
                $product->category_id,
                $product->id,
                8
            );

            // Build seller data
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

            // Build product data
            $productData = $product->toArray();
            $productData['images'] = $product->images->pluck('image_url')->toArray();
            $productData['seller'] = $sellerData;

            // Build related products data
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

    /**
     * Get featured products
     */
    public function getFeaturedProducts(int $limit = 10): Collection
    {
        return $this->productRepository->getFeatured($limit);
    }

    /**
     * Get special offers
     */
    public function getSpecialOffers(int $limit = 10): Collection
    {
        return $this->productRepository->getSpecialOffers($limit);
    }

    /**
     * Get compatible products for a device model
     */
    public function getCompatibleProducts(int $modelId): array
    {
        try {
            // Check if model exists
            $modelExists = DB::table('phone_models')->where('id', $modelId)->exists();
            
            if (!$modelExists) {
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

    /**
     * Get compatible products for multiple device models
     */
    public function getCompatibleProductsMulti(array $modelIds, int $perPage = 50): LengthAwarePaginator
    {
        return $this->productRepository->getCompatibleProductsMulti($modelIds, $perPage);
    }

    /**
     * Get user's purchased products
     */
    public function getUserPurchasedProducts(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->productRepository->getUserPurchasedProducts($userId, $perPage);
    }

   /**
 * Get compatible models for a product
 */
protected function getCompatibleModels(int $productId): \Illuminate\Support\Collection
    {
        return DB::table('phone_models')
            ->join('product_phone_models', 'phone_models.id', '=', 'product_phone_models.phone_model_id')
            ->leftJoin('brands', 'phone_models.brand_id', '=', 'brands.id')
            ->leftJoin('phone_series', 'phone_models.series_id', '=', 'phone_series.id')
            ->where('product_phone_models.product_id', $productId)
            ->select(
                'phone_models.*',
                'brands.id as brand_id',
                'brands.name as brand_name',
                'brands.slug as brand_slug',
                'brands.logo as brand_logo',
                'phone_series.id as series_id',
                'phone_series.name as series_name',
                'phone_series.slug as series_slug'
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