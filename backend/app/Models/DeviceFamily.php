<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * DeviceFamily — مرز اکوسیستم دستگاه (Smartphone/Laptop/Tablet/...).
 *
 * درجه‌یک‌ترین موجودیت سلسله‌مراتب دستگاه: DeviceFamily → DeviceBrand →
 * DeviceSeries → DeviceModel. افزودن یک اکوسیستم جدید (مثلاً Smartwatch)
 * فقط یک ردیف جدید در همین جدول است — هیچ تغییر کدی لازم نیست.
 */
class DeviceFamily extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'is_active' => true,
        'sort_order' => 0,
    ];

    public function brands(): HasMany
    {
        return $this->hasMany(DeviceBrand::class, 'family_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            Category::class,
            'category_device_family',
            'device_family_id',
            'category_id'
        );
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
