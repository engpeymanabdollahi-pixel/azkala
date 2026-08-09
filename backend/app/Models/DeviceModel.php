<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DeviceModel extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['series_id', 'name', 'slug', 'release_year', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'release_year' => 'integer',
    ];

    // ==================== Relationships ====================

    /**
     * سری دستگاه (مثلاً iPhone 15)
     */
    public function series(): BelongsTo
    {
        return $this->belongsTo(DeviceSeries::class, 'series_id');
    }

    /**
     * مقالات مجله مرتبط با این دستگاه
     */
    public function magazineArticles(): BelongsToMany
    {
        return $this->belongsToMany(
            MagazineArticle::class,
            'magazine_article_devices',
            'device_model_id',
            'article_id'
        )->withPivot('relevance_score')
         ->withTimestamps();
    }

    /**
     * آخرین اخبار این دستگاه (shortcut)
     */
    public function latestNews(int $limit = 5)
    {
        return $this->magazineArticles()
            ->published()
            ->latestPublished()
            ->limit($limit)
            ->get();
    }

    /**
     * تعداد مقالات مرتبط
     */
    public function getArticlesCountAttribute(): int
    {
        return $this->magazineArticles()->published()->count();
    }
}