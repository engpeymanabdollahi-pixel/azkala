<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatFaq extends Model
{
    protected $table = 'chat_faq';
    
    protected $fillable = [
        'seller_id',
        'question_pattern',
        'answer',
        'category',
        'priority',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
        'usage_count' => 'integer',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * بررسی اینکه آیا پیام با این FAQ مطابقت دارد
     */
    public function matches(string $message): bool
    {
        $pattern = '/' . $this->question_pattern . '/iu';
        return (bool) preg_match($pattern, $message);
    }

    /**
     * افزایش تعداد استفاده
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }
}