<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;

class DeviceCompatibilityService 
{
    public function getCompatibleProducts(int $deviceModelId): Collection 
    {
        return Product::whereHas('deviceModels', function ($q) use ($deviceModelId) {
            $q->where('device_model_id', $deviceModelId);
        })->get();
    }

    // ✅ متد check اضافه شد تا با فراخوانی در CartService هماهنگ باشد
    public function check(int $productId, int $deviceModelId): bool 
    {
        return Product::where('id', $productId)
            ->whereHas('deviceModels', function ($q) use ($deviceModelId) {
                $q->where('device_model_id', $deviceModelId);
            })->exists();
    }
}