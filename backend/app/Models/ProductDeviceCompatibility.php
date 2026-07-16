<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductDeviceCompatibility extends Model
{
    protected $table = 'product_device_compatibility';
    
    protected $fillable = [
        'product_id',
        'device_model_id',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function deviceModel()
    {
        return $this->belongsTo(DeviceModel::class);
    }
}