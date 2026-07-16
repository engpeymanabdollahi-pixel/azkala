<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceSeries extends Model
{
    use HasFactory; // ✅

    protected $fillable = ['brand_id', 'name', 'slug'];

    public function brand()
    {
        return $this->belongsTo(DeviceBrand::class);
    }

    public function models()
    {
        return $this->hasMany(DeviceModel::class);
    }
}