<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SellerTransaction extends Model
{
    protected $fillable = [
        'seller_id',
        'order_id',
        'type',
        'amount',
        'description',
        'status',
        'commission_deducted',
        // ✅ ستون‌های جدید سیستم کمیسیون هوشمند (رجوع به مایگریشن
        // add_commission_audit_fields_to_seller_transactions_table) — بدون
        // اضافه‌شدن به fillable، create() آن‌ها را بی‌صدا نادیده می‌گرفت.
        'commission_rate',
        'commission_source',
        'seller_level',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
    ];

    /**
     * رابطه با فروشنده
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * رابطه با سفارش
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}