<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceBrand extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'is_active'];

    // ✅ اصلاح: مشخص کردن نام دقیق کلید خارجی
    public function series()
    {
        return $this->hasMany(DeviceSeries::class, 'brand_id');
    }
}