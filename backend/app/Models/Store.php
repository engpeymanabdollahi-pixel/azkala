<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * فروشگاه فیزیکی یک seller (users.role=seller). رجوع به کامنت migration
 * برای دلیل nullable بودن seller_id/latitude/longitude.
 */
class Store extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'seller_id',
        'name',
        'phone',
        'province',
        'city',
        'address',
        'latitude',
        'longitude',
        'is_active',
        'verified_at',
    ];

    protected $casts = [
        'seller_id' => 'integer',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_active' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function hours(): HasMany
    {
        return $this->hasMany(StoreHour::class);
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(StoreInventory::class);
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    /**
     * فقط فروشگاه‌هایی که می‌توانند در جستجوی عمومی «نزدیک من» ظاهر
     * شوند: فعال + تأییدشده توسط ادمین + مختصات معتبر ثبت‌شده + متعلق
     * به یک seller واقعی (نه ردیف یتیم بعد از حذف کاربر — رجوع به
     * کامنت migration).
     *
     * ✅ ستون‌ها عمداً با «stores.» قید شده‌اند — NearbyStoreService این
     * scope را روی کوئری‌ای صدا می‌زند که با products JOIN شده، و products
     * هم ستونی به نام is_active دارد؛ بدون قید صریح، SQLite با خطای
     * «ambiguous column name: is_active» کرش می‌کرد (این باگ واقعی حین
     * نوشتن تست‌های Phase 22 با یک درخواست HTTP واقعی پیدا شد).
     */
    public function scopePubliclyDiscoverable($query)
    {
        return $query
            ->where('stores.is_active', true)
            ->whereNotNull('stores.verified_at')
            ->whereNotNull('stores.seller_id')
            ->whereNotNull('stores.latitude')
            ->whereNotNull('stores.longitude');
    }
}
