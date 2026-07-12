<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SellerRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'seller_id',
        'order_id',
        'product_quality',
        'shipping_speed',
        'communication',
        'overall_rating',
        'comment',
    ];

    protected $casts = [
        'product_quality' => 'integer',
        'shipping_speed' => 'integer',
        'communication' => 'integer',
        'overall_rating' => 'decimal:1',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}