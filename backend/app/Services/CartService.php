<?php

namespace App\Services;

use App\Exceptions\IncompatibleProductException;
use App\Exceptions\OutOfStockException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Models\ProductDeviceCompatibility;
use Illuminate\Support\Facades\DB;
use App\Services\DeviceCompatibilityService;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function getOrCreateCart(?int $userId = null, ?string $sessionId = null): Cart
    {
        if ($userId) {
            return Cart::firstOrCreate(['user_id' => $userId], ['session_id' => $sessionId]);
        }
        return Cart::firstOrCreate(['session_id' => $sessionId], ['user_id' => null]);
    }
    public function addWithCompatibilityCheck(User $user, int $productId, int $quantity, ?int $deviceModelId = null)
{
    // ۱. بررسی سازگاری در صورت وجود دستگاه
    if ($deviceModelId) {
        $compatibilityService = app(DeviceCompatibilityService::class);
        $isCompatible = $compatibilityService->check($productId, $deviceModelId);
        
        if (!$isCompatible) {
            throw ValidationException::withMessages([
                'product_id' => 'این محصول با دستگاه انتخابی شما سازگار نیست.'
            ]);
        }
    }

    // ۲. دریافت محصول برای گرفتن قیمت
    $product = Product::findOrFail($productId);

    // ۳. دریافت یا ایجاد سبد خرید
    $cart = $user->cart ?: $user->cart()->create([
        'user_id' => $user->id,
        'items_count' => 0,
        'subtotal' => 0,
        'discount' => 0,
        'total' => 0,
    ]);
    
    // ۴. ایجاد یا به‌روزرسانی آیتم سبد با ارسال price
    $cartItem = $cart->items()->updateOrCreate(
        ['product_id' => $productId],
        [
            'quantity' => $quantity,
            'price' => $product->price, // ✅ اضافه شد
            'device_model_id' => $deviceModelId,
        ]
    );

    // ۵. محاسبه مجدد سبد خرید
    $this->recalculateCart($cart);

    return $cartItem;
}

    public function addItem(Cart $cart, int $productId, int $quantity = 1, ?int $deviceModelId = null): CartItem
    {
        return DB::transaction(function () use ($cart, $productId, $quantity, $deviceModelId) {
            $product = Product::where('id', $productId)->where('is_active', true)->first();
            if (!$product) {
                throw new \InvalidArgumentException('محصول یافت نشد یا غیرفعال است.');
            }

            if ($product->stock < $quantity) {
                throw new OutOfStockException("موجودی محصول '{$product->name}' کافی نیست. (موجودی: {$product->stock})");
            }

            if ($deviceModelId) {
                $isCompatible = ProductDeviceCompatibility::where('product_id', $productId)
                    ->where('device_model_id', $deviceModelId)->exists();
                
                if (!$isCompatible) {
                    throw new IncompatibleProductException("محصول '{$product->name}' با دستگاه انتخابی شما سازگار نیست.");
                }
            }

            $cartItem = $cart->items()->where('product_id', $productId)->first();

            if ($cartItem) {
                $newQuantity = $cartItem->quantity + $quantity;
                if ($product->stock < $newQuantity) {
                    throw new OutOfStockException("موجودی برای افزایش تعداد محصول '{$product->name}' کافی نیست.");
                }
                $cartItem->quantity = $newQuantity;
                $cartItem->save();
            } else {
                $cartItem = $cart->items()->create([
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'price' => $product->price,
                    'device_model_id' => $deviceModelId,
                ]);
            }

            $this->recalculateCart($cart);
            return $cartItem->fresh();
        });
    }

    public function updateItemQuantity(Cart $cart, int $cartItemId, int $quantity): CartItem
    {
        return DB::transaction(function () use ($cart, $cartItemId, $quantity) {
            if ($quantity <= 0) {
                $this->removeItem($cart, $cartItemId);
                return null;
            }

            $cartItem = $cart->items()->findOrFail($cartItemId);
            if ($cartItem->product->stock < $quantity) {
                throw new OutOfStockException("موجودی محصول '{$cartItem->product->name}' کافی نیست.");
            }

            $cartItem->quantity = $quantity;
            $cartItem->save();
            $this->recalculateCart($cart);
            return $cartItem->fresh();
        });
    }

    public function removeItem(Cart $cart, int $cartItemId): bool
    {
        return DB::transaction(function () use ($cart, $cartItemId) {
            $deleted = $cart->items()->where('id', $cartItemId)->delete();
            if ($deleted) {
                $this->recalculateCart($cart);
            }
            return (bool) $deleted;
        });
    }

    public function clearCart(Cart $cart): void
    {
        DB::transaction(function () use ($cart) {
            $cart->items()->delete();
            $this->recalculateCart($cart);
        });
    }

    private function recalculateCart(Cart $cart): void
    {
        $cart->load('items');
        $itemsCount = $cart->items->sum('quantity');
        $subtotal = $cart->items->sum(function ($item) {
            return $item->price * $item->quantity;
        });

        $discount = 0; 
        $total = $subtotal - $discount;

        $cart->update([
            'items_count' => $itemsCount,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
        ]);
    }
}