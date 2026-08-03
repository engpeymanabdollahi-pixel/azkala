<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeviceSeries extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['brand_id', 'name', 'slug', 'is_active'];

    // ✅ اصلاح: مشخص کردن نام دقیق کلید خارجی
    public function brand()
    {
        return $this->belongsTo(DeviceBrand::class, 'brand_id');
    }

    // ✅ اصلاح: مشخص کردن نام دقیق کلید خارجی
    public function models()
    {
        return $this->hasMany(DeviceModel::class, 'series_id');
    }
}