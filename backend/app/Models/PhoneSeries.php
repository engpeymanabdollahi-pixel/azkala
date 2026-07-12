<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhoneSeries extends Model
{
    protected $table = 'phone_series';
    
    protected $fillable = [
        'brand_id',
        'name',
        'slug',
        'image',
        'models_count',
        'is_active',
    ];

    protected $casts = [
        'models_count' => 'integer',
        'is_active' => 'boolean',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function models(): HasMany
    {
        return $this->hasMany(PhoneModel::class, 'series_id');
    }
}