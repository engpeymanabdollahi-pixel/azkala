<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float) $this->price,
            'compare_price' => $this->compare_price ? (float) $this->compare_price : null,
            'stock' => $this->stock,
            'is_active' => (bool) $this->is_active,
            'is_featured' => (bool) $this->is_featured,
            'is_special_offer' => (bool) $this->is_special_offer,
            'sku' => $this->sku,
            
            // ✅ بخش جدید: بررسی سازگاری برای کارت محصول
            'is_compatible' => $this->when($request->has('device_model_id'), function () use ($request) {
                $targetDeviceId = (int) $request->device_model_id;
                
                // اگر رابطه از قبل لود شده باشد (برای جلوگیری از N+1)
                if ($this->relationLoaded('deviceModels')) {
                    return $this->deviceModels->contains('id', $targetDeviceId);
                }
                
                // در غیر این صورت یک کوئری سریع می‌زنیم
                return $this->deviceModels()->where('device_model_id', $targetDeviceId)->exists();
            }),

            // Relations
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
            
            'images' => $this->whenLoaded('images', function () {
                return $this->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'url' => $image->url, // یا image_url بسته به نام ستون دیتابیس شما
                        'is_primary' => (bool) $image->is_primary,
                    ];
                });
            }),
            
            // لیست کامل دستگاه‌ها برای صفحه جزئیات محصول
            'deviceModels' => $this->whenLoaded('deviceModels', function () {
                return $this->deviceModels->map(function ($model) {
                    return [
                        'id' => $model->id,
                        'name' => $model->name,
                        'slug' => $model->slug,
                        'series' => $model->series ? [
                            'id' => $model->series->id,
                            'name' => $model->series->name,
                        ] : null,
                        'brand' => $model->series && $model->series->brand ? [
                            'id' => $model->series->brand->id,
                            'name' => $model->series->brand->name,
                        ] : null,
                    ];
                });
            }),
            
            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            // Meta
            'average_rating' => $this->when($this->reviews_count > 0, round($this->reviews_avg_rating ?? 0, 1)),
            'reviews_count' => $this->reviews_count ?? 0,
        ];
    }
}