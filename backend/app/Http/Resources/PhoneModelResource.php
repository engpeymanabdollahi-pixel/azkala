<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhoneModelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'image' => $this->image,
            'release_year' => $this->release_year,
            
            // Relations
            'brand' => $this->whenLoaded('brand', fn() => [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ]),
            
            'series' => $this->whenLoaded('series', fn() => [
                'id' => $this->series->id,
                'name' => $this->series->name,
            ]),
            
            // Counts
            'products_count' => $this->products_count ?? 0,
            
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}