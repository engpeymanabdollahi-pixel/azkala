<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageTemplate extends Model
{
    protected $fillable = [
        'title',
        'content',
        'category',
        'icon',
        'is_active',
        'is_system',
        'usage_count',
        'priority',
        'variables',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_system' => 'boolean',
        'variables' => 'array',
    ];

    /**
     * پردازش متغیرهای داینامیک
     */
    public function processVariables(array $context = []): string
    {
        $content = $this->content;
        
        foreach ($context as $key => $value) {
            $content = str_replace("{{$key}}", $value, $content);
        }
        
        return $content;
    }

    /**
     * افزایش تعداد استفاده
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Scope برای قالب‌های فعال
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope برای دسته‌بندی خاص
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}