<?php

namespace App\Services\Admin;

use App\Models\Product;
use App\Repositories\AdminProductRepository;
use Illuminate\Support\Facades\Log;

class AdminProductService
{
    protected AdminProductRepository $repository;

    public function __construct(AdminProductRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get products list with filters
     */
    public function getProducts(array $filters = [], int $perPage = 20): array
    {
        try {
            $products = $this->repository->getProductsWithFilters($filters, $perPage);
            $stats = $this->repository->getStats();

            return [
                'products' => $products->map(function ($product) {
                    return $this->formatProduct($product);
                }),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
                'stats' => $stats,
            ];
        } catch (\Exception $e) {
            Log::error('AdminProductService@getProducts: '.$e->getMessage());
            throw new \Exception('خطا در دریافت محصولات: '.$e->getMessage(), 500);
        }
    }

    /**
     * Quick update product
     */
    public function quickUpdate(int $id, array $data): Product
    {
        try {
            $product = $this->repository->findOrFail($id);

            return $this->repository->quickUpdate($product, $data);
        } catch (\Exception $e) {
            Log::error('AdminProductService@quickUpdate: '.$e->getMessage());
            throw new \Exception('خطا در به‌روزرسانی: '.$e->getMessage(), 500);
        }
    }

    /**
     * Bulk action on products
     */
    public function bulkAction(array $ids, string $action): array
    {
        try {
            $count = $this->repository->bulkAction($ids, $action);

            $messages = [
                'activate' => "{$count} محصول فعال شد",
                'deactivate' => "{$count} محصول غیرفعال شد",
                'feature' => "{$count} محصول ویژه شد",
                'unfeature' => "{$count} محصول از ویژه خارج شد",
                'delete' => "{$count} محصول حذف شد",
            ];

            return [
                'count' => $count,
                'message' => $messages[$action] ?? 'عملیات انجام شد',
            ];
        } catch (\Exception $e) {
            Log::error('AdminProductService@bulkAction: '.$e->getMessage());
            throw new \Exception('خطا در عملیات', 500);
        }
    }

    /**
     * Delete product
     */
    public function deleteProduct(int $id): bool
    {
        try {
            $product = $this->repository->findOrFail($id);

            return $this->repository->delete($product);
        } catch (\Exception $e) {
            Log::error('AdminProductService@deleteProduct: '.$e->getMessage());
            throw new \Exception('خطا در حذف', 500);
        }
    }

    /**
     * Get product stats
     */
    public function getProductStats(int $id): array
    {
        try {
            $product = $this->repository->findOrFail($id);
            $last30Days = $this->repository->getProductStats($id);
            $performanceScore = $this->calculatePerformanceScore($product);

            return [
                'product' => $product,
                'last_30_days' => $last30Days,
                'performance_score' => $performanceScore,
            ];
        } catch (\Exception $e) {
            Log::error('AdminProductService@getProductStats: '.$e->getMessage());
            throw new \Exception('خطا', 500);
        }
    }

    /**
     * Calculate performance score (0-100)
     */
    public function calculatePerformanceScore(Product $product): int
    {
        $score = 0;

        // Sales score (max 40)
        $sales = $product->sales_count ?? 0;
        if ($sales >= 100) {
            $score += 40;
        } elseif ($sales >= 50) {
            $score += 30;
        } elseif ($sales >= 20) {
            $score += 20;
        } elseif ($sales >= 5) {
            $score += 10;
        }

        // Rating score (max 30)
        $rating = $product->rating ?? 0;
        if ($rating >= 4.5) {
            $score += 30;
        } elseif ($rating >= 4) {
            $score += 25;
        } elseif ($rating >= 3.5) {
            $score += 15;
        } elseif ($rating >= 3) {
            $score += 10;
        }

        // Stock score (max 15)
        $stock = $product->stock ?? 0;
        if ($stock >= 50) {
            $score += 15;
        } elseif ($stock >= 20) {
            $score += 10;
        } elseif ($stock >= 5) {
            $score += 5;
        }

        // Views score (max 15)
        $views = $product->views_count ?? 0;
        if ($views >= 1000) {
            $score += 15;
        } elseif ($views >= 500) {
            $score += 10;
        } elseif ($views >= 100) {
            $score += 5;
        }

        return $score;
    }

    /**
     * Format product data
     */
    protected function formatProduct(Product $product): array
    {
        // از رابطه‌ی از پیش بارگذاری‌شده می‌خوانیم؛ getSellerInfo() یک کوئری خام
        // به‌ازای هر محصول می‌زد. اگر رابطه بارگذاری نشده باشد (مسیرهایی که این
        // متد را روی یک مدل تکی صدا می‌زنند) به همان مسیر قبلی برمی‌گردیم.
        $seller = $product->relationLoaded('seller')
            ? ($product->seller ? [
                'id' => $product->seller->id,
                'name' => $product->seller->name,
                'shop_name' => $product->seller->shop_name ?? $product->seller->name,
            ] : null)
            : $this->repository->getSellerInfo($product->seller_id);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'main_image' => $product->main_image,
            'price' => (float) $product->price,
            'discount_price' => $product->discount_price ? (float) $product->discount_price : null,
            // ✅ قبلاً این ستون واقعی (قیمت «قبل» برای نمایش خط‌خورده) اصلاً
            // در پاسخ نبود، با اینکه جدول ادمین دقیقاً روی
            // product.compare_price نمایش تخفیف را شرط می‌زد — یعنی هیچ
            // محصولی، هرچقدر هم compare_price واقعی داشت، در پنل ادمین
            // قیمت خط‌خورده نشان نمی‌داد.
            'compare_price' => $product->compare_price ? (float) $product->compare_price : null,
            'stock' => $product->stock,
            'rating' => (float) ($product->rating ?? 0),
            'reviews_count' => $product->reviews_count ?? 0,
            'views_count' => $product->views_count ?? 0,
            'sales_count' => $product->sales_count ?? 0,
            'is_active' => (bool) $product->is_active,
            'is_featured' => (bool) ($product->is_featured ?? false),
            'is_special_offer' => (bool) ($product->is_special_offer ?? false),
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null,
            'brand' => $product->brand ? [
                'id' => $product->brand->id,
                'name' => $product->brand->name,
            ] : null,
            'seller' => $seller,
            'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i') : null,
            'performance_score' => $this->calculatePerformanceScore($product),
        ];
    }
}
