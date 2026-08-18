<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeviceBrand extends Model
{
    use HasFactory, SoftDeletes;

    // ✅ 'type' یک ستون deprecated است — فقط برای سازگاری موقت طول مهاجرت
    // Device-First (فاز ۱D) نگه داشته شده؛ منبع حقیقتِ اکوسیستم اکنون
    // family_id (رابطه‌ی family()) است. type در یک migration پاکسازی
    // جداگانه، بعد از اطمینان از عدم وابستگی معماری، حذف خواهد شد.
    protected $fillable = [
        'name',
        'slug',
        'type',
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