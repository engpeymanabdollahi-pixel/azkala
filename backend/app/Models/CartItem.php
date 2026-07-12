<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
        'price',
    ];

    protected $casts = [
        'cart_id' => 'integer',
        'product_id' => 'integer',
        'quantity' => 'integer',
        'price' => 'decimal:2',
    ];

    // ==================== Relationships ====================

    /**
     * رابطه با سبد
     */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * رابطه با محصول
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ==================== Accessors ====================

    /**
     * محاسبه قیمت کل این آیتم
     */
    public function getTotalAttribute(): float
    {
        return (float) $this->price * $this->quantity;
    }

    // ==================== Methods ====================

    /**
     * به‌روزرسانی قیمت از محصول (در صورت تغییر قیمت)
     */
    public function refreshPrice(): self
    {
        if ($this->product) {
            $this->price = $this->product->discount_price ?? $this->product->price;
            $this->save();
        }
        return $this;
    }

    /**
     * بررسی موجودی کافی
     */
    public function hasEnoughStock(): bool
    {
        if (!$this->product) {
            return false;
        }
        return $this->product->stock >= $this->quantity;
    }
}