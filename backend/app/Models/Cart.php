<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
    ];

    // ==================== Relationships ====================

    /**
     * رابطه با کاربر
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * رابطه با آیتم‌های سبد
     */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    // ==================== Accessors ====================

    /**
     * محاسبه جمع کل (بدون تخفیف)
     */
    public function getSubtotalAttribute(): float
    {
        return (float) $this->items->sum(function ($item) {
            return $item->price * $item->quantity;
        });
    }

    /**
     * محاسبه تعداد کل آیتم‌ها
     */
    public function getTotalItemsAttribute(): int
    {
        return (int) $this->items->sum('quantity');
    }

    /**
     * محاسبه تعداد محصولات مختلف
     */
    public function getUniqueProductsCountAttribute(): int
    {
        return $this->items->count();
    }

    // ==================== Scopes ====================

    /**
     * Scope برای بارگذاری آیتم‌ها با محصول
     */
    public function scopeWithItems($query)
    {
        return $query->with('items.product');
    }
}