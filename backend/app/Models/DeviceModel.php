<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeviceModel extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['series_id', 'name', 'slug', 'release_year', 'is_active'];

    // ✅ اصلاح: مشخص کردن نام دقیق کلید خارجی
    public function series()
    {
        return $this->belongsTo(DeviceSeries::class, 'series_id');
    }
}