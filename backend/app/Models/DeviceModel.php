<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceModel extends Model
{
    use HasFactory; // ✅

    protected $fillable = ['series_id', 'name', 'slug', 'release_year'];

    public function series()
    {
        return $this->belongsTo(DeviceSeries::class);
    }
}