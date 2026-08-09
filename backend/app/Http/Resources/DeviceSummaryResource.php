<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * خلاصه دستگاه برای نمایش در مقالات مجله
 * فقط اطلاعات ضروری (بدون specs کامل)
 */
class DeviceSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'image' => $this->image,
            'release_year' => $this->release_year,
            
            // اطلاعات برند و سری
            'brand' => $this->whenLoaded('series', function () {
                return $this->series->brand ? [
                    'id' => $this->series->brand->id,
                    'name' => $this->series->brand->name,
                    'slug' => $this->series->brand->slug,
                ] : null;
            }),
            
            'series' => $this->whenLoaded('series', function () {
                return [
                    'id' => $this->series->id,
                    'name' => $this->series->name,
                ];
            }),
            
            // امتیاز ارتباط (از pivot magazine_article_devices)
            'relevance_score' => $this->whenPivotLoaded(
                'magazine_article_devices',
                fn () => (int) $this->pivot->relevance_score
            ),
        ];
    }
}