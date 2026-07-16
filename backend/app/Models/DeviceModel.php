<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeviceModel extends Model {
    protected $fillable = ['series_id', 'name', 'slug', 'release_year'];
    public function series(): BelongsTo { return $this->belongsTo(DeviceSeries::class); }
    public function compatibleProducts(): HasMany { return $this->hasMany(ProductDeviceCompatibility::class); }
}