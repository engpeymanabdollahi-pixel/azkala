<?php
namespace App\Services;
use App\Exceptions\IncompatibleProductException;
use App\Models\Product;
use App\Models\ProductDeviceCompatibility;

class CartService {
    public function addWithCompatibilityCheck(int $userId, int $productId, int $deviceModelId, int $quantity) {
        $isCompatible = ProductDeviceCompatibility::where('product_id', $productId)
            ->where('device_model_id', $deviceModelId)->exists();
        if (!$isCompatible) {
            throw new IncompatibleProductException('This product is not compatible with your device.');
        }
        $product = Product::find($productId);
        $item = new \stdClass();
        $item->user_id = $userId;
        $item->product_id = $productId;
        $item->quantity = $quantity;
        $item->total_price = $product ? $product->price : 0;
        return $item;
    }
}