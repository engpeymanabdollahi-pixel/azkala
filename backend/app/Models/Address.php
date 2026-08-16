<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Address extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'full_name',
        'phone',
        'province',
        'city',
        'address',
        'postal_code',
        'is_default',
        // ✅ Nearby Stores Completion Phase — مختصات اختیاری، فقط برای
        // استفاده‌ی صریح کاربر به‌عنوان منبع مکان جستجوی «فروشگاه‌های
        // نزدیک»؛ هیچ ارتباطی با Checkout/Order ندارد.
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'is_default' => 'boolean',
        // ✅ دقیقاً همان قرارداد Store::latitude/longitude (decimal:7).
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    // ==================== Relationships ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ==================== Scopes ====================

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ==================== Methods ====================

    /**
     * تنظیم این آدرس به عنوان پیش‌فرض و حذف پیش‌فرض بودن بقیه
     */
    public function setAsDefault(): void
    {
        // حذف پیش‌فرض بودن همه آدرس‌های کاربر
        self::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);
        
        // تنظیم این آدرس به عنوان پیش‌فرض
        $this->is_default = true;
        $this->save();
    }

    /**
     * فرمت کامل آدرس
     */
    public function getFullAddressAttribute(): string
    {
        return "{$this->province}، {$this->city}، {$this->address}" . 
               ($this->postal_code ? " - کد پستی: {$this->postal_code}" : '');
    }
}