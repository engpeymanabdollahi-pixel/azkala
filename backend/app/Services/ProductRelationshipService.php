<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductRelationship;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * ✅ Product Relationship Phase 2: لایه‌ی مشترک مالکیت/اعتبارسنجی برای
 * مدیریت رابطه‌ی «مکمل» — استفاده‌شده هم توسط SellerProductController
 * (مالکیت محدود به فروشنده) هم AdminProductController (بدون محدودیت
 * مالکیت)، دقیقاً همان الگوی DeviceEnforcementService: یک قانونِ مشترک،
 * نه دو نسخه‌ی احتمالاً ناهم‌خوان.
 *
 * قانون مالکیتِ Hybrid (طبق Phase 2 audit — «اگر شواهدی cross-seller را
 * توجیه نکند، پیش‌فرضِ امن را انتخاب کن، نه STOP»): وقتی $sellerId داده
 * شود (فروشنده)، هم محصول مبدأ هم محصول مقصد باید متعلق به همان فروشنده
 * باشند — جلوگیری از spam/self-promotion روی محصول فروشنده‌ی دیگر. وقتی
 * $sellerId=null (ادمین)، هیچ محدودیت مالکیتی اعمال نمی‌شود.
 */
class ProductRelationshipService
{
    /**
     * فهرست رابطه‌های خروجیِ یک محصول (برای فرم مدیریت).
     */
    public function listForProduct(int $productId, ?int $sellerId): Collection
    {
        $this->resolveOwnedProduct($productId, $sellerId);

        return ProductRelationship::query()
            ->with(['targetProduct:id,name,slug,main_image,is_active'])
            ->where('source_product_id', $productId)
            ->complement()
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * @throws ValidationException
     */
    public function create(int $sourceProductId, int $targetProductId, ?int $sellerId, int $sortOrder = 0): ProductRelationship
    {
        $this->resolveOwnedProduct($sourceProductId, $sellerId);

        if ($sourceProductId === $targetProductId) {
            throw ValidationException::withMessages([
                'target_product_id' => 'یک محصول نمی‌تواند مکمل خودش باشد.',
            ]);
        }

        $this->resolveOwnedProduct($targetProductId, $sellerId, 'محصول مقصد یافت نشد یا متعلق به شما نیست.');

        try {
            return ProductRelationship::create([
                'source_product_id' => $sourceProductId,
                'target_product_id' => $targetProductId,
                'type' => ProductRelationship::TYPE_COMPLEMENT,
                'sort_order' => max(0, $sortOrder),
                'is_active' => true,
            ]);
        } catch (QueryException $e) {
            // ✅ نقض unique constraint (source+target+type تکراری) — به‌جای
            // ۵۰۰ خام، یک خطای اعتبارسنجی قابل‌فهم.
            if ($this->isUniqueConstraintViolation($e)) {
                throw ValidationException::withMessages([
                    'target_product_id' => 'این محصول قبلاً به‌عنوان مکمل ثبت شده است.',
                ]);
            }

            throw $e;
        }
    }

    /**
     * @throws NotFoundHttpException
     */
    public function delete(int $relationshipId, int $sourceProductId, ?int $sellerId): void
    {
        $this->resolveOwnedProduct($sourceProductId, $sellerId);

        $relationship = ProductRelationship::query()
            ->where('id', $relationshipId)
            ->where('source_product_id', $sourceProductId)
            ->first();

        if (! $relationship) {
            throw new NotFoundHttpException('رابطه یافت نشد.');
        }

        $relationship->delete();
    }

    /**
     * محصول را برمی‌گرداند اگر موجود/فعال باشد؛ اگر $sellerId داده شده،
     * مالکیت را هم اجباری می‌کند — یک نقطه‌ی مشترک برای هر سه عملیات بالا.
     *
     * @throws NotFoundHttpException
     */
    private function resolveOwnedProduct(int $productId, ?int $sellerId, string $notFoundMessage = 'محصول یافت نشد یا متعلق به شما نیست.'): Product
    {
        $query = Product::query()->where('id', $productId)->where('is_active', true);

        if ($sellerId !== null) {
            $query->where('seller_id', $sellerId);
        }

        $product = $query->first();

        if (! $product) {
            throw new NotFoundHttpException($notFoundMessage);
        }

        return $product;
    }

    private function isUniqueConstraintViolation(QueryException $e): bool
    {
        // SQLite: 'UNIQUE constraint failed' — سایر درایورها (MySQL 1062 و
        // مشابه) هم توسط همین substring پوشش داده نمی‌شوند، ولی این پروژه
        // فقط روی SQLite اجرا می‌شود (config/database.php)؛ برای اطمینانِ
        // بیشتر SQLSTATE 23000 (Integrity constraint violation، مشترک بین
        // اکثر درایورها) هم چک می‌شود.
        return str_contains($e->getMessage(), 'UNIQUE constraint failed')
            || $e->getCode() === '23000';
    }
}
