<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceBrand extends Model
{
    use HasFactory; // ✅ این خط جادویی مشکل را حل می‌کند

    protected $fillable = ['name', 'slug'];

    public function series()
    {
        return $this->hasMany(DeviceSeries::class);
    }
}