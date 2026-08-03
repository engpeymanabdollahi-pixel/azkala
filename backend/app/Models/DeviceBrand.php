<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeviceBrand extends Model
{
    use HasFactory, SoftDeletes;

    // ✅ اضافه شدن 'type' برای ذخیره‌سازی نوع دستگاه (mobile, laptop, tablet, accessory)
    protected $fillable = [
        'name', 
        'slug', 
        'type', 
        'is_active'
    ];

    /**
     * رابطه با سری‌های دستگاه
     */
    public function series()
    {
        return $this->hasMany(DeviceSeries::class, 'brand_id');
    }
}