<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
        'price',
        'device_model_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
    ];

    /**
     * رابطه با سبد خرید
     */
    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * رابطه با محصول
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * رابطه با مدل دستگاه
     */
    public function deviceModel()
    {
        return $this->belongsTo(DeviceModel::class);
    }
}