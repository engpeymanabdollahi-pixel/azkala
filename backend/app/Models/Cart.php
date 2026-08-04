<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Cart extends Model
{
    use HasFactory;

    // هر چهار ستون جمع‌بندی باید fillable بمانند: CartService::recalculateCart
    // آن‌ها را با update() می‌نویسد و Laravel کلیدهای غیرfillable را بی‌صدا
    // دور می‌ریزد — یعنی جمع سبد دیگر ذخیره نمی‌شد و هیچ خطایی هم نمی‌داد.
    protected $fillable = [
        'user_id',
        'session_id',
        'items_count',
        'subtotal',
        'discount',
        'total',
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

    // هر سه اکسسور زیر پیش از این `$this->items` را صدا می‌زدند. اگر رابطه لود
    // نشده بود، Laravel همه‌ی ردیف‌های سبد را به‌صورت مدل می‌ساخت تا فقط یک
    // جمع یا شمارش بگیرد — و صدا زدن هر سه، سه بار این کار را تکرار می‌کرد.
    // حالا وقتی رابطه لود است از همان مجموعه استفاده می‌شود (بدون کوئری) و در
    // غیر این صورت جمع در خود دیتابیس زده می‌شود.

    /**
     * محاسبه جمع کل (بدون تخفیف)
     */
    public function getSubtotalAttribute(): float
    {
        if ($this->relationLoaded('items')) {
            return (float) $this->items->sum(fn ($item) => $item->price * $item->quantity);
        }

        return (float) $this->items()->sum(DB::raw('price * quantity'));
    }

    /**
     * محاسبه تعداد کل آیتم‌ها
     */
    public function getTotalItemsAttribute(): int
    {
        if ($this->relationLoaded('items')) {
            return (int) $this->items->sum('quantity');
        }

        return (int) $this->items()->sum('quantity');
    }

    /**
     * محاسبه تعداد محصولات مختلف
     */
    public function getUniqueProductsCountAttribute(): int
    {
        if ($this->relationLoaded('items')) {
            return $this->items->count();
        }

        return $this->items()->count();
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