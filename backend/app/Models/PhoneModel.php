<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PhoneModel extends Model
{
    protected $fillable = [
        'brand_id',
        'series_id',
        'name',
        'slug',
        'image',
        'release_year',
        'screen_size',
        'weight',
        'compatible_products_count',
        'is_active',
    ];

    protected $casts = [
        'release_year' => 'integer',
        'compatible_products_count' => 'integer',
        'is_active' => 'boolean',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(PhoneSeries::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_phone_models');
    }
}