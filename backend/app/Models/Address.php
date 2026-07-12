<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
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
    ];

    protected $casts = [
        'user_id' => 'integer',
        'is_default' => 'boolean',
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