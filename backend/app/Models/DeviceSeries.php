<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeviceSeries extends Model {
    protected $fillable = ['brand_id', 'name', 'slug'];
    public function brand(): BelongsTo { return $this->belongsTo(DeviceBrand::class); }
    public function models(): HasMany { return $this->hasMany(DeviceModel::class); }
}