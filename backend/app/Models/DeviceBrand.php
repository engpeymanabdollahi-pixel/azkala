<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeviceBrand extends Model {
    protected $fillable = ['name', 'slug'];
    public function series(): HasMany { return $this->hasMany(DeviceSeries::class); }
    public function models(): HasMany { return $this->hasManyThrough(DeviceModel::class, DeviceSeries::class); }
}