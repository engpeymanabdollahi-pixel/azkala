<?php
namespace App\Services;
use App\Models\Product;
use App\Models\ProductDeviceCompatibility;
use Illuminate\Support\Collection;

class DeviceCompatibilityService {
    public function getCompatibleProducts(int $deviceModelId): Collection {
        return Product::whereHas('compatibleDevices', function ($q) use ($deviceModelId) {
            $q->where('device_model_id', $deviceModelId);
        })->get();
    }
    public function isCompatible(int $productId, int $deviceModelId): bool {
        return ProductDeviceCompatibility::where('product_id', $productId)->where('device_model_id', $deviceModelId)->exists();
    }
}