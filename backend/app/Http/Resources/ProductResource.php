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

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'price' => (float) $this->price,
            'compare_price' => $this->compare_price ? (float) $this->compare_price : null,
            'stock' => $this->stock,
            'status' => $this->status,
            'is_active' => (bool) $this->is_active,
            'is_featured' => (bool) $this->is_featured,
            'is_special_offer' => (bool) $this->is_special_offer,
            'sku' => $this->sku,
            'main_image' => $this->main_image,
            'images' => $this->images ?? [],
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
                $this->loadMissing('seller');
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
            
            'compatible_models' => $this->whenLoaded('compatibleModels', function () {
                return $this->compatibleModels->map(function ($model) {
                    return [
                        'id' => $model->id,
                        'name' => $model->name,
                        'slug' => $model->slug,
                        'brand' => $model->brand ? [
                            'id' => $model->brand->id,
                            'name' => $model->brand->name,
                        ] : null,
                    ];
                });
            }),
            
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            'rating' => $this->when($this->reviews_count > 0, round($this->reviews_avg_rating ?? 0, 1)),
            'reviews_count' => $this->reviews_count ?? 0,
            
            // ✅ استفاده از متغیر محاسبه‌شده‌ی امن
            'discount_percentage' => $discountPercentage,
        ];
    }
}