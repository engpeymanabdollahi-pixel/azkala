<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ✅ Variant/Color System فاز ۲.۱: سریالایز یکنواخت هر رنگ — همان الگوی
 * decimal→float و null-guard که در ProductResource برای price/
 * compare_price/discount_price استفاده شده، عیناً تکرار شده تا فرانت
 * دقیقاً همان شکل عددی را برای رنگ‌ها هم ببیند.
 */
class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'color_name' => $this->color_name,
            'color_code' => $this->color_code,
            'sku' => $this->sku,
            'price' => $this->price !== null ? (float) $this->price : null,
            'compare_price' => $this->compare_price !== null ? (float) $this->compare_price : null,
            'discount_price' => $this->discount_price !== null ? (float) $this->discount_price : null,
            'stock' => $this->stock ?? 0,
            'is_in_stock' => ($this->stock ?? 0) > 0,
            'image' => $this->image,
            'attributes' => $this->attributes ?? [],
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
