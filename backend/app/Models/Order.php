<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'payment_status',
        'payment_method',
        'subtotal',
        'tax',
        'shipping',
        'discount',
        'total',
        'shipping_address',
        'tracking_number',
        'notes',
        'coupon_code',
        'coupon_id',
    ];

   protected $casts = [
    'subtotal' => 'decimal:4',
    'tax' => 'decimal:4',
    'shipping' => 'decimal:4',
    'discount' => 'decimal:4',
    'total' => 'decimal:4',
    // ستون واقعی JSON است، ولی بدون این cast، هر خواننده‌ی مدل (کنترلر
    // فروشنده، پاسخ خام API) رشته‌ی JSON خام را می‌گرفت نه یک آرایه —
    // AdminOrderService از قبل مجبور بود دستی is_string()/json_decode کند،
    // چون همین‌جا cast نبود.
    'shipping_address' => 'array',
];

    // ==================== Relationships ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }
public function sellerRating()
{
    return $this->hasOne(SellerRating::class);
}

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }
}