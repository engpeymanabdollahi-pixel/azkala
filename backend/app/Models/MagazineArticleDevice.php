<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MagazineArticleDevice extends Model
{
    protected $fillable = [
        'article_id',
        'device_model_id',
        'relevance_score',
    ];

    protected $casts = [
        'relevance_score' => 'integer',
    ];

    // ==================== Relationships ====================

    public function article(): BelongsTo
    {
        return $this->belongsTo(MagazineArticle::class);
    }

    public function deviceModel(): BelongsTo
    {
        return $this->belongsTo(DeviceModel::class, 'device_model_id');
    }
}