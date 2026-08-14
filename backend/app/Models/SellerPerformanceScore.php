<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * اسنپ‌شات فعلیِ امتیاز عملکرد یک فروشنده — با recalculate بازنویسی
 * می‌شود. فقط توسط سیستم (SellerPerformanceService) نوشته می‌شود؛ خودِ
 * فروشنده هیچ مسیر نوشتنی به این جدول ندارد.
 */
class SellerPerformanceScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'seller_id',
        'score',
        'level',
        'rating_component',
        'success_rate_component',
        'cancellation_component',
        'quality_component',
        'reliability_component',
        'total_orders',
        'successful_orders',
        'cancelled_orders',
        'is_new_seller',
        'calculated_at',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'rating_component' => 'decimal:2',
        'success_rate_component' => 'decimal:2',
        'cancellation_component' => 'decimal:2',
        'quality_component' => 'decimal:2',
        'reliability_component' => 'decimal:2',
        'total_orders' => 'integer',
        'successful_orders' => 'integer',
        'cancelled_orders' => 'integer',
        'is_new_seller' => 'boolean',
        'calculated_at' => 'datetime',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
