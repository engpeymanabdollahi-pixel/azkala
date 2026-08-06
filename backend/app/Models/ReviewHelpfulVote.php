<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ✅ رأیِ «مفید بود» یک کاربر روی یک نظر — برای جلوگیری از رأی تکراری
 * (قبلاً ReviewController::helpful() فقط helpful_count را افزایش می‌داد
 * و هیچ ردی از اینکه کدام کاربر رأی داده نگه نمی‌داشت).
 */
class ReviewHelpfulVote extends Model
{
    protected $fillable = [
        'review_id',
        'user_id',
    ];

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
