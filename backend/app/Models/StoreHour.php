<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreHour extends Model
{
    protected $fillable = [
        'store_id',
        'day_of_week',
        'opens_at',
        'closes_at',
        'is_closed',
    ];

    protected $casts = [
        'store_id' => 'integer',
        'day_of_week' => 'integer',
        'is_closed' => 'boolean',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
