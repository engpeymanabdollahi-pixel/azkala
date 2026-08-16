<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * موجودی فیزیکی یک محصول در یک فروشگاه خاص — رجوع به کامنت migration
 * برای دلیل استقلال کامل از products.stock.
 */
class StoreInventory extends Model
{
    protected $table = 'store_inventory';

    protected $fillable = [
        'store_id',
        'product_id',
        'stock',
        'pickup_enabled',
    ];

    protected $casts = [
        'store_id' => 'integer',
        'product_id' => 'integer',
        'stock' => 'integer',
        'pickup_enabled' => 'boolean',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
