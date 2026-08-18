<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // ✅ محاسبه‌ی امن درصد تخفیف برای جلوگیری از خطای تقسیم بر صفر
        $discountPercentage = 0;
        if ($this->compare_price && $this->compare_price > 0 && $this->compare_price > $this->price) {
            $discountPercentage = round((($this->compare_price - $this->price) / $this->compare_price) * 100);
        }

        // ✅ بررسی وضعیت علاقه‌مندی کاربر فعلی به محصول
        // فقط زمانی که کاربر لاگین کرده باشد و wishlist رابطه لود شده باشد
        $isWishlisted = false;
        if ($request->user() && $this->relationLoaded('wishlist')) {
            $isWishlisted = $this->wishlist !== null;
        }
        // اگر wishlist لود نشده، مقدار false برمی‌گردانیم تا از کوئری N+1 جلوگیری شود
        // برای دریافت وضعیت wishlist باید از eager load استفاده کرد

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'price' => (float) $this->price,
            'compare_price' => $this->compare_price ? (float) $this->compare_price : null,
            'discount_price' => $this->discount_price ? (float) $this->discount_price : null,
            // قیمتی که واقعاً پرداخت می‌شود. تا حالا هر مصرف‌کننده‌ای خودش
            // discount_price ?? price را حساب می‌کرد و جاهایی از قلم افتاده بود.
            'final_price' => (float) ($this->discount_price ?? $this->price),
            'stock' => $this->stock ?? 0,
            'is_in_stock' => ($this->stock ?? 0) > 0,
            'is_active' => (bool) $this->is_active,
            'is_featured' => (bool) $this->is_featured,
            'is_bestseller' => (bool) $this->is_bestseller,
            'is_special_offer' => (bool) $this->is_special_offer,
            'sku' => $this->sku,
            'main_image' => $this->main_image,
            // whenLoaded نه دسترسی مستقیم: بدون eager load، `$this->images` برای
            // هر محصول یک کوئری جدا می‌زد (N+1 روی هر لیست محصول).
            'images' => $this->whenLoaded('images'),
            'specifications' => $this->specifications ?? [],
            'sales_count' => $this->sales_count ?? 0,
            'views_count' => $this->views_count ?? 0,
            
            // بررسی سازگاری
            'is_compatible' => $this->when($request->has('device_model_id'), function () use ($request) {
                $targetDeviceId = (int) $request->device_model_id;
                if ($this->relationLoaded('deviceModels')) {
                    return $this->deviceModels->contains('id', $targetDeviceId);
                }
                return $this->deviceModels()->where('device_model_id', $targetDeviceId)->exists();
            }),

            // ✅ اطلاعات فروشنده (با لود خودکار و ایمن)
            'seller' => $this->when($this->seller_id, function () {
                // استفاده از whenLoaded به جای loadMissing برای جلوگیری از N+1
                // وقتی seller از قبل eager-load شده باشد، از همان استفاده می‌شود
                return $this->whenLoaded('seller', function () {
                    return $this->seller ? [
                        'id' => $this->seller->id,
                        'shop_name' => $this->seller->shop_name ?? $this->seller->name ?? 'فروشگاه',
                        'slug' => $this->seller->slug,
                        'avatar' => $this->seller->avatar,
                        'rating' => (float) ($this->seller->seller_rating ?? 0),
                        'is_verified' => $this->seller->seller_verified_at !== null,
                        'products_count' => (int) ($this->seller->products_count ?? 0),
                        'total_sales' => (float) ($this->seller->total_sales ?? 0),
                    ] : null;
                });
            }),

            'brand' => $this->whenLoaded('brand', function () {
                return [
                    'id' => $this->brand->id,
                    'name' => $this->brand->name,
                    'slug' => $this->brand->slug,
                ];
            }),
            
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                ];
            }),
            
            'compatible_models' => $this->whenLoaded('deviceModels', function () {
                return $this->deviceModels->map(function ($model) {
                    return [
                        'id' => $model->id,
                        'name' => $model->name,
                        'slug' => $model->slug,
                        'brand' => $model->series?->brand ? [
                            'id' => $model->series->brand->id,
                            'name' => $model->series->brand->name,
                        ] : null,
                    ];
                });
            }),
            
            // ✅ فیلد device_models برای سازگاری با تست ProductTemplatesEndpointTest
            'device_models' => $this->whenLoaded('deviceModels', function () {
                return $this->deviceModels->map(function ($model) {
                    return [
                        'id' => $model->id,
                        'name' => $model->name,
                        'slug' => $model->slug,
                    ];
                });
            }),
            
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            'rating' => $this->when($this->reviews_count > 0, round($this->reviews_avg_rating ?? 0, 1)),
            'reviews_count' => $this->reviews_count ?? 0,
            
            // ✅ استفاده از متغیر محاسبه‌شده‌ی امن
            'discount_percentage' => $discountPercentage,
            
            // ✅ وضعیت علاقه‌مندی کاربر فعلی
            'is_wishlisted' => $isWishlisted,

            // ✅ Variant/Color System فاز ۲.۱: کاملاً افزایشی — price/
            // compare_price/discount_price/final_price/stock/sku بالا
            // دقیقاً همان قبل ماندند، برای هیچ محصولی (حتی آن‌هایی که
            // variant دارند) عوض نشدند. whenLoaded با default صریح
            // (نه MissingValue پیش‌فرض خودِ whenLoaded) استفاده شد تا این
            // دو کلید همیشه حاضر باشند (نه گاهی حذف‌شده از پاسخ) — طبق
            // خواسته‌ی صریح: «variants should be an empty collection/array»،
            // نه یک کلید غایب. eager loading کجا انجام می‌شود را
            // ProductRepository مشخص می‌کند، نه اینجا — پس این خط خودش
            // هرگز کوئری اضافه نمی‌زند (N+1 امن).
            'has_variants' => $this->whenLoaded('variants', fn () => $this->variants->isNotEmpty(), false),
            'variants' => $this->whenLoaded('variants', fn () => ProductVariantResource::collection($this->variants), []),
        ];
    }
}