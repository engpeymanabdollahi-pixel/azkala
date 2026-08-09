<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class MagazineArticle extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * انواع دسته‌بندی مقالات
     */
    const CATEGORY_NEWS = 'news';
    const CATEGORY_REVIEW = 'review';
    const CATEGORY_COMPARISON = 'comparison';
    const CATEGORY_GUIDE = 'guide';
    const CATEGORY_RUMOR = 'rumor';

    /**
     * انواع منبع محتوا
     */
    const SOURCE_ADMIN = 'admin';      // نوشته شده توسط ادمین
    const SOURCE_RSS = 'rss';          // از RSS خوانده شده
    const SOURCE_AI = 'ai_generated';  // بازنویسی شده توسط AI

    protected $fillable = [
        'slug',
        'title',
        'excerpt',
        'content',
        'featured_image',
        'source_url',
        'source_name',
        'author_id',
        'category',
        'language',
        'view_count',
        'published_at',
        'is_published',
        'content_source',
        'is_ai_rewritten',
        'ai_rewrite_prompt',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_published' => 'boolean',
        'is_ai_rewritten' => 'boolean',
        'view_count' => 'integer',
    ];

    // ==================== Relationships ====================

    /**
     * نویسنده مقاله (اگر ادمین نوشته باشد)
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * دستگاه‌های مرتبط با این مقاله
     */
    public function devices(): BelongsToMany
    {
        return $this->belongsToMany(
            DeviceModel::class,
            'magazine_article_devices',
            'article_id',
            'device_model_id'
        )->withPivot('relevance_score')
         ->withTimestamps();
    }

    // ==================== Scopes ====================

    /**
     * فقط مقالات منتشر شده
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true)
                     ->whereNotNull('published_at')
                     ->where('published_at', '<=', now());
    }

    /**
     * فیلتر بر اساس دسته‌بندی
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * فیلتر بر اساس دستگاه خاص
     */
    public function scopeForDevice($query, int $deviceId)
    {
        return $query->whereHas('devices', function ($q) use ($deviceId) {
            $q->where('device_models.id', $deviceId);
        });
    }

    /**
     * جستجو در عنوان و خلاصه
     */
    public function scopeSearch($query, string $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
              ->orWhere('excerpt', 'like', "%{$keyword}%");
        });
    }

    /**
     * مرتب‌سازی بر اساس تاریخ انتشار (جدیدترین اول)
     */
    public function scopeLatestPublished($query)
    {
        return $query->orderBy('published_at', 'desc');
    }

    /**
     * مقالات پربازدید
     */
    public function scopeMostViewed($query)
    {
        return $query->orderBy('view_count', 'desc');
    }

    // ==================== Helper Methods ====================

    /**
     * تولید slug از عنوان
     */
    public static function generateSlug(string $title): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (static::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * افزایش بازدید
     */
    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }

    /**
     * آیا مقاله منتشر شده است؟
     */
    public function isLive(): bool
    {
        return $this->is_published 
            && $this->published_at 
            && $this->published_at->isPast();
    }

    /**
     * آیا مقاله توسط ادمین نوشته شده؟
     */
    public function isWrittenByAdmin(): bool
    {
        return $this->content_source === self::SOURCE_ADMIN;
    }

    /**
     * آیا مقاله توسط AI بازنویسی شده؟
     */
    public function isAiRewritten(): bool
    {
        return $this->is_ai_rewritten;
    }

    /**
     * نام فارسی دسته‌بندی
     */
    public function getCategoryLabelAttribute(): string
    {
        return match($this->category) {
            self::CATEGORY_NEWS => 'اخبار',
            self::CATEGORY_REVIEW => 'بررسی',
            self::CATEGORY_COMPARISON => 'مقایسه',
            self::CATEGORY_GUIDE => 'راهنما',
            self::CATEGORY_RUMOR => 'شایعات',
            default => 'عمومی',
        };
    }

    /**
     * نام فارسی منبع محتوا
     */
    public function getContentSourceLabelAttribute(): string
    {
        return match($this->content_source) {
            self::SOURCE_ADMIN => 'نگارش ازکالا',
            self::SOURCE_RSS => 'از منبع خارجی',
            self::SOURCE_AI => 'بازنویسی هوشمند',
            default => 'نامشخص',
        };
    }
}