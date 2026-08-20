<?php

namespace App\Repositories;

use App\Models\DeviceModel;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductRelationship;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductRepository extends BaseRepository
{
    /**
     * Specify Model class name
     */
    protected function model(): string
    {
        return Product::class;
    }

    /**
     * Get active products with filters
     */
    public function getActiveProducts(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = $this->query()
            // ✅ حیاتی: اضافه کردن deviceModels برای محاسبه is_compatible در Resource بدون کوئری اضافی
            // seller هم به همین دلیل اینجاست: ProductResource برای هر محصول
            // loadMissing('seller') می‌زند، پس بدون این، هر ردیف یک کوئری users
            // جداگانه می‌ساخت (N+1).
            // ✅ Variant/Color System فاز ۲.۱: variants هم به همین لیست
            // eager-load اضافه شد — دقیقاً همان دلیل seller/deviceModels
            // بالا: ProductResource::whenLoaded('variants') بدون این، برای
            // محصولاتی که واقعاً variant دارند یک کوئری جدا به‌ازای هر
            // محصول می‌زد. برای محصول بدون variant، این فقط یک کوئری
            // whereIn خالی روی جدول تازه (فعلاً بی‌داده) است — هزینه‌ی
            // اضافه‌ی محسوسی ندارد.
            ->with(['category', 'brand', 'images', 'deviceModels', 'seller', 'variants'])
            ->where('is_active', true);

        // Apply filters
        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        if (! empty($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }

        if (! empty($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        // ✅ Brand Detail فاز ۲: قبلاً $sortBy مستقیم (بدون allow-list) وارد
        // orderBy() می‌شد — یعنی GET /api/v1/products?sort_by=<هر رشته‌ای>
        // همان مقدار را بدون اعتبارسنجی به‌عنوان نام ستون به Eloquent
        // می‌داد. یک ستون ناموجود (مثلاً sort_by=xyz) یک QueryException
        // ناهندل‌شده (۵۰۰ خام، و در محیط APP_DEBUG=true حتی افشای کوئری/
        // اسکیمای دیتابیس) تولید می‌کرد — روی یک endpoint کاملاً عمومی و
        // بدون auth. همان الگوی allow-list که از قبل در
        // AdminProductRepository::getProductsWithFilters() برای پنل ادمین
        // برقرار بود، اینجا هم اعمال شد. Brand Detail (که این فاز اضافه
        // می‌کند) دقیقاً همین ۵ مقدار را می‌فرستد — پس فیلتر جدید هیچ
        // گزینه‌ی sort موجودی را غیرفعال نمی‌کند.
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $allowedSorts = ['created_at', 'price', 'sales_count', 'rating', 'stock', 'views_count', 'name'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }
        if (! in_array($sortOrder, ['asc', 'desc'], true)) {
            $sortOrder = 'desc';
        }
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Get product by slug with all relations
     */
    public function findBySlug(string $slug): ?Product
    {
        return $this->query()
            // ✅ اضافه کردن deviceModels و روابط تو در تو آن برای صفحه جزئیات محصول
            // variants فاز ۲.۱: صفحه‌ی جزئیات دقیقاً همان جایی است که
            // Variant Selector فازهای بعدی به این داده نیاز خواهد داشت —
            // اینجا فقط eager-load آماده شد، هیچ UI ای در همین فاز اضافه
            // نشد.
            ->with(['category', 'brand', 'seller', 'images', 'deviceModels.series.brand', 'variants'])
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Get featured products
     */
    public function getFeatured(int $limit = 10): Collection
    {
        return $this->query()
            ->with(['category', 'brand', 'images', 'deviceModels'])
            ->where('is_active', true)
            ->where('is_featured', true)
            ->limit($limit)
            ->get();
    }

    /**
     * Get special offers
     */
    public function getSpecialOffers(int $limit = 10): Collection
    {
        return $this->query()
            // seller: ProductResource برای هر محصول loadMissing('seller') می‌زند.
            ->with(['category', 'brand', 'images', 'deviceModels', 'seller'])
            ->where('is_active', true)
            ->where('is_special_offer', true)
            ->limit($limit)
            ->get();
    }

    /**
     * دریافت محصولات سازگار با یک مدل دستگاه (شامل خود دستگاه + لوازم جانبی)
     */
    public function getCompatibleProducts(int $modelId): Collection
    {
        // ✅ Device-First Architecture فاز ۱J/۱K/۱M: device_model_product
        // (رابطه‌ی deviceModels()) اکنون تنها منبع حقیقتِ سازگاری
        // محصول↔دستگاه است — ستون موازیِ products.device_model_id دیگر
        // در هیچ کوئری‌ای استفاده نمی‌شود. اگر خودِ مدل درخواستی (یا
        // زنجیره‌ی سری/برند/خانواده‌اش) غیرفعال باشد، نتیجه خالی برمی‌گردد؛
        // درخواست مستقیم به این endpoint نباید یک اکوسیستم غیرفعال را دور
        // بزند.
        if (! $this->isModelDiscoverable($modelId)) {
            return new Collection;
        }

        return Product::query()
            ->where('is_active', true)
            ->whereHas('deviceModels', function ($subQuery) use ($modelId) {
                $subQuery->where('device_models.id', $modelId);
            })
            ->with(['brand', 'category', 'images', 'deviceModels.series.brand'])
            ->get();
    }

    /**
     * دریافت محصولات سازگار با چندین مدل دستگاه
     */
    public function getCompatibleProductsMulti(array $modelIds, int $perPage = 50): LengthAwarePaginator
    {
        $discoverableIds = $this->discoverableModelIds($modelIds);

        if (empty($discoverableIds)) {
            return new LengthAwarePaginator([], 0, $perPage);
        }

        return Product::query()
            ->where('is_active', true)
            ->whereHas('deviceModels', function ($subQuery) use ($discoverableIds) {
                $subQuery->whereIn('device_models.id', $discoverableIds);
            })
            ->with(['brand', 'category', 'images', 'deviceModels'])
            ->paginate($perPage);
    }

    /**
     * ✅ فاز ۱M: زنجیره‌ی کامل مدل→سری→برند→خانواده باید فعال باشد تا مدل
     * از مسیرهای عمومی «قابل‌کشف» باشد.
     */
    protected function isModelDiscoverable(int $modelId): bool
    {
        return DeviceModel::query()
            ->where('id', $modelId)
            ->where('is_active', true)
            ->whereHas('series', function ($q) {
                $q->where('is_active', true)->whereHas('brand', function ($qb) {
                    $qb->where('is_active', true)
                        ->where(function ($qf) {
                            $qf->whereNull('family_id')->orWhereHas('family', fn ($f) => $f->where('is_active', true));
                        });
                });
            })
            ->exists();
    }

    protected function discoverableModelIds(array $modelIds): array
    {
        if (empty($modelIds)) {
            return [];
        }

        return DeviceModel::query()
            ->whereIn('id', $modelIds)
            ->where('is_active', true)
            ->whereHas('series', function ($q) {
                $q->where('is_active', true)->whereHas('brand', function ($qb) {
                    $qb->where('is_active', true)
                        ->where(function ($qf) {
                            $qf->whereNull('family_id')->orWhereHas('family', fn ($f) => $f->where('is_active', true));
                        });
                });
            })
            ->pluck('id')
            ->all();
    }

    /**
     * Get related products
     *
     * ✅ تنها مصرف‌کننده‌ی این متد (ProductService::getProductBySlug) خروجی را
     * دستی map می‌کند و فقط ستون‌های مستقیم (id/name/slug/main_image/price/
     * compare_price/rating/reviews_count/sales_count) را می‌خواند — نه
     * ProductResource و نه هیچ رابطه‌ای. eager loading قبلی چهار رابطه
     * (brand/category/images/deviceModels) که هیچ‌وقت خوانده نمی‌شدند، روی
     * هر بازدید صفحه‌ی جزئیات محصول ۴ کوئری/JOIN کاملاً بی‌فایده اضافه
     * می‌کرد.
     */
    public function getRelatedProducts(int $categoryId, int $excludeId, int $limit = 8): Collection
    {
        return $this->query()
            ->select(['id', 'name', 'slug', 'main_image', 'price', 'compare_price', 'rating', 'reviews_count', 'sales_count'])
            ->where('category_id', $categoryId)
            ->where('id', '!=', $excludeId)
            ->where('is_active', true)
            ->limit($limit)
            ->get();
    }

    /**
     * محصولات مکمل («همراه این محصول») — طبق Product Relationship Phase 2
     * audit، عمداً مستقل از getRelatedProducts بالا (که هم‌دسته‌ای پویاست)
     * و از سازگاری دستگاه. فقط رابطه‌های فعالِ نوع complement که هم محصول
     * مبدأ و هم محصول مقصد فعال باشند (Product::query() به‌خودی‌خود
     * soft-delete را هم فیلتر می‌کند، طبق global scope مدل) — محصول
     * غیرفعال/حذف‌شده هرگز در پاسخ عمومی نشت نمی‌کند.
     */
    public function getComplementaryProducts(int $sourceProductId, int $limit = 6): Collection
    {
        return $this->query()
            ->select(['products.id', 'products.name', 'products.slug', 'products.main_image', 'products.price', 'products.compare_price', 'products.rating', 'products.reviews_count', 'products.sales_count'])
            ->join('product_relationships', 'product_relationships.target_product_id', '=', 'products.id')
            ->where('product_relationships.source_product_id', $sourceProductId)
            ->where('product_relationships.type', ProductRelationship::TYPE_COMPLEMENT)
            ->where('product_relationships.is_active', true)
            ->where('products.is_active', true)
            ->orderBy('product_relationships.sort_order')
            ->limit($limit)
            ->get();
    }

    /**
     * Get user's purchased products
     */
    public function getUserPurchasedProducts(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        $purchasedProductIds = OrderItem::whereHas('order', function ($q) use ($userId) {
            $q->where('user_id', $userId)
                ->where('status', '!=', 'cancelled');
        })->pluck('product_id')->unique();

        return $this->query()
            // seller لازم است چون ProductResource برای هر محصول loadMissing('seller')
            // می‌زند؛ بدون آن هر ردیف یک کوئری users جداگانه می‌ساخت.
            ->with(['category', 'brand', 'images', 'deviceModels', 'seller'])
            ->whereIn('id', $purchasedProductIds)
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->paginate($perPage);
    }

    /**
     * Increment views count
     */
    public function incrementViews(int $productId): void
    {
        $this->query()->where('id', $productId)->increment('views_count');
    }
}
