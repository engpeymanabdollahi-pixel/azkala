<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource کامل مقاله مجله
 * 
 * برای صفحات:
 * - /magazine (لیست مقالات)
 * - /magazine/{slug} (جزئیات مقاله)
 * - /api/devices/{id}/news (اخبار دستگاه)
 */
class MagazineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            
            // محتوای کامل
            // نکته: MagazineResource فقط برای صفحه جزئیات استفاده می‌شود
            // برای لیست‌ها از MagazineSummaryResource استفاده می‌کنیم که content ندارد
            'content' => $this->content,
            
            'featured_image' => $this->featured_image,
            
            // منبع خبر
            'source' => [
                'name' => $this->source_name,
                'url' => $this->source_url,
                'is_external' => !empty($this->source_url),
            ],
            
            // نویسنده (اگر ادمین نوشته باشد)
            'author' => $this->whenLoaded('author', function () {
                return [
                    'id' => $this->author->id,
                    'name' => $this->author->name,
                    'avatar' => $this->author->avatar,
                ];
            }),
            
            // دسته‌بندی
            'category' => [
                'key' => $this->category,
                'label' => $this->category_label,
            ],
            
            // منبع محتوا (admin / rss / ai)
            'content_source' => [
                'key' => $this->content_source,
                'label' => $this->content_source_label,
                'is_ai_rewritten' => $this->is_ai_rewritten,
            ],
            
            // دستگاه‌های مرتبط
            'devices' => DeviceSummaryResource::collection(
                $this->whenLoaded('devices')
            ),
            
            // آمار
            'stats' => [
                'view_count' => (int) $this->view_count,
                'devices_count' => $this->devices_count ?? $this->devices->count(),
            ],
            
            // زمان‌بندی
            'published_at' => $this->published_at?->format('Y-m-d H:i:s'),
            'published_at_human' => $this->published_at?->diffForHumans(),
            
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}