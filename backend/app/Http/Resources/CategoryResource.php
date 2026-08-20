<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'image' => $this->image,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,

            // Parent
            'parent_id' => $this->parent_id,
            'parent' => $this->whenLoaded('parent', fn () => [
                'id' => $this->parent->id,
                'name' => $this->parent->name,
                'slug' => $this->parent->slug,
            ]),

            // Children (recursive)
            'children' => CategoryResource::collection($this->whenLoaded('children')),

            // ✅ Marketplace Unification فاز B5: خانواده‌های دستگاهِ متصل —
            // آرایه‌ی خالی یعنی دسته‌ی «سراسری» (برای همه‌ی اکوسیستم‌ها).
            'device_families' => $this->whenLoaded('deviceFamilies', fn () => $this->deviceFamilies->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'slug' => $f->slug,
            ])),
            'is_global' => $this->whenLoaded('deviceFamilies', fn () => $this->deviceFamilies->isEmpty()),

            // Counts
            'products_count' => $this->products_count ?? 0,
            'children_count' => $this->children_count ?? $this->children->count(),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
