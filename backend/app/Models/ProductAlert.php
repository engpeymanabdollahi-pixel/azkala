<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ProductAlert extends Model
{
    use HasFactory;

    /**
     * فیلدهای قابل پر کردن
     */
    protected $fillable = [
        'user_id',
        'product_id',
        'type',
        'target_price',
        'original_price',
        'is_active',
        'is_triggered',
        'triggered_at',
        'channels',
    ];

    /**
     * تبدیل نوع فیلدها
     */
    protected $casts = [
        'channels' => 'array',
        'is_active' => 'boolean',
        'is_triggered' => 'boolean',
        'triggered_at' => 'datetime',
        'target_price' => 'decimal:2',
        'original_price' => 'decimal:2',
    ];

    /**
     * رابطه با کاربر
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * رابطه با محصول
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * اسکوپ: آلرت‌های فعال و تریگر نشده (pending)
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('is_triggered', false);
    }

    /**
     * اسکوپ: آلرت‌های فعال
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * بررسی اینکه آیا شرط آلرت برقرار است
     */
    public function isConditionMet(float $currentPrice, int $currentStock): bool
    {
        return match($this->type) {
            'restock' => $currentStock > 0,
            'price_drop' => $currentPrice < $this->original_price,
            'target_price' => $this->target_price && $currentPrice <= $this->target_price,
        };
    }

    /**
     * دریافت پیام مناسب برای این آلرت
     */
    public function getMessageAttribute(): string
    {
        return match($this->type) {
            'restock' => 'محصول دوباره موجود شد!',
            'price_drop' => 'قیمت محصول کاهش یافت!',
            'target_price' => 'قیمت محصول به محدوده دلخواه شما رسید!',
        };
    }
}
