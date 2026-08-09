<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * خلاصه مقاله برای لیست‌ها و تیترها
 * 
 * برای استفاده در:
 * - HomePage (تب اخبار دستگاه)
 * - Sidebar آخرین اخبار
 * - Related articles
 */
class MagazineSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            'featured_image' => $this->featured_image,
            
            'category' => [
                'key' => $this->category,
                'label' => $this->category_label,
            ],
            
            'source_name' => $this->source_name,
            
            'published_at' => $this->published_at?->format('Y-m-d H:i:s'),
            'published_at_human' => $this->published_at?->diffForHumans(),
            
            'stats' => [
                'view_count' => (int) $this->view_count,
            ],
        ];
    }
}