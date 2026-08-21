<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class NewsletterSubscriber extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'subscribed_at',
        'unsubscribed_at',
        'is_confirmed',
    ];

    protected $casts = [
        'subscribed_at' => 'datetime',
        'unsubscribed_at' => 'datetime',
        'is_confirmed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: فقط subscriberهای فعال
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotNull('subscribed_at')
                     ->whereNull('unsubscribed_at');
    }

    /**
     * Scope: فقط subscriberهای تأییدشده
     */
    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->where('is_confirmed', true);
    }
}