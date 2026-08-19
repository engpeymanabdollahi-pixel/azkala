<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeviceBrand extends Model
{
    use HasFactory, SoftDeletes;

    // ✅ Device-First Architecture — حذف نهایی: ستون type حذف شد. منبع
    // حقیقتِ اکوسیستم family_id (رابطه‌ی family()) است.
    protected $fillable = [
        'name',
        'slug',
        'family_id',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * رابطه با سری‌های دستگاه
     */
    public function series()
    {
        return $this->hasMany(DeviceSeries::class, 'brand_id');
    }

    /**
     * اکوسیستم دستگاه (Smartphone/Laptop/Tablet/...) — منبع حقیقت فعلی.
     */
    public function family()
    {
        return $this->belongsTo(DeviceFamily::class, 'family_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}