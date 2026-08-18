<?php

namespace App\Services;

use App\Exceptions\IncompatibleProductException;
use App\Exceptions\OutOfStockException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\ProductDeviceCompatibility;
use Illuminate\Support\Facades\DB;

class CartService
{
    public function getOrCreateCart(?int $userId = null, ?string $sessionId = null): Cart
    {
        if ($userId) {
            return Cart::firstOrCreate(['user_id' => $userId], ['session_id' => $sessionId]);
        }
        return Cart::firstOrCreate(['session_id' => $sessionId], ['user_id' => null]);
    }
   

    /**
     * ✅ Variant/Color System فاز ۳: افزودن به سبد اکنون اختیاری $variantId
     * می‌پذیرد. هویت یک آیتم سبد از «product_id» به «product_id +
     * variant_id» تغییر کرده — دو رنگ مختلف همان محصول دو ردیف جدا
     * می‌شوند، محصول بدون رنگ (legacy) دقیقاً مثل قبل رفتار می‌کند.
     */
    public function addItem(Cart $cart, int $productId, int $quantity = 1, ?int $deviceModelId = null, ?int $variantId = null): CartItem
    {
        return DB::transaction(function () use ($cart, $productId, $quantity, $deviceModelId, $variantId) {
            $product = Product::where('id', $productId)->where('is_active', true)->first();
            if (!$product) {
                throw new \InvalidArgumentException('محصول یافت نشد یا غیرفعال است.');
            }

            // ✅ دفاع IDOR: variant باید واقعاً متعلق به همین product_id
            // باشد — جلوگیری از ارسال product_id=X به همراه variant_id
            // متعلق به محصول دیگر (حتی محصول دیگرِ همان فروشنده).
            $variant = null;
            if ($variantId !== null) {
                $variant = ProductVariant::where('id', $variantId)
                    ->where('product_id', $productId)
                    ->first();

                if (!$variant) {
                    throw new \InvalidArgumentException('رنگ انتخاب‌شده متعلق به این محصول نیست.');
                }
            }

            // ✅ اگر variant انتخاب شده، فقط موجودی همان variant سنجیده
            // می‌شود، نه Product.stock کلی (طبق دستور صریح فاز ۳).
            $availableStock = $variant ? $variant->stock : $product->stock;
            $itemLabel = $variant && $variant->color_name ? "{$product->name} ({$variant->color_name})" : $product->name;

            if ($availableStock < $quantity) {
                throw new OutOfStockException("موجودی محصول '{$itemLabel}' کافی نیست. (موجودی: {$availableStock})");
            }

            if ($deviceModelId) {
                $isCompatible = ProductDeviceCompatibility::where('product_id', $productId)
                    ->where('device_model_id', $deviceModelId)->exists();

                if (!$isCompatible) {
                    throw new IncompatibleProductException("محصول '{$product->name}' با دستگاه انتخابی شما سازگار نیست.");
                }
            }

            // ✅ هویت آیتم سبد: product_id + variant_id. وقتی $variantId
            // برابر null است، Eloquent Query Builder خودش where(...,null) را
            // به whereNull تبدیل می‌کند — یعنی محصولات legacy همچنان با
            // یکدیگر merge می‌شوند، نه با یک آیتم variant-دار.
            $cartItem = $cart->items()
                ->where('product_id', $productId)
                ->where('variant_id', $variantId)
                ->first();

            // ✅ قیمت اسنپ‌شات همیشه سمت سرور محاسبه می‌شود؛ هرگز از کلاینت
            // پذیرفته نمی‌شود. برای رنگ انتخاب‌شده از final_price رنگ
            // (discount_price ?? price) استفاده می‌شود. برای محصول بدون
            // رنگ عمداً از همان $product->price قبلی استفاده شده (نه
            // final_price) تا رفتار قیمت‌گذاری محصولات legacy حتی یک
            // سرسوزن تغییر نکند — هر بحثی درباره‌ی discount_price روی
            // محصولات ساده، خارج از دامنه‌ی همین فاز (فقط variant) است.
            $unitPrice = $variant ? $variant->final_price : $product->price;

            if ($cartItem) {
                $newQuantity = $cartItem->quantity + $quantity;
                if ($availableStock < $newQuantity) {
                    throw new OutOfStockException("موجودی برای افزایش تعداد محصول '{$itemLabel}' کافی نیست.");
                }
                // ✅ فقط quantity آپدیت می‌شود — دقیقاً همان رفتار قبلی
                // برای محصولات بدون رنگ (قیمتِ ثبت‌شده در سبد تغییر
                // نمی‌کند تا merge شدن). تغییر این رفتار خارج از دامنه‌ی
                // همین فاز است.
                $cartItem->quantity = $newQuantity;
                $cartItem->save();
            } else {
                $cartItem = $cart->items()->create([
                    'product_id' => $productId,
                    'variant_id' => $variantId,
                    'quantity' => $quantity,
                    'price' => $unitPrice,
                    'device_model_id' => $deviceModelId,
                ]);
            }

            $this->recalculateCart($cart);
            return $cartItem->fresh();
        });
    }

        public function updateItemQuantity(Cart $cart, int $cartItemId, int $quantity): ?CartItem
    {
        return DB::transaction(function () use ($cart, $cartItemId, $quantity) {
            if ($quantity <= 0) {
                $this->removeItem($cart, $cartItemId);
                return null; // ✅ حالا Type Hint با null سازگار است
            }

            $cartItem = $cart->items()->findOrFail($cartItemId);

            // ✅ فاز ۳: اگر این آیتم به یک رنگ وصل است، موجودی همان رنگ
            // سنجیده می‌شود، نه Product.stock کلی.
            $availableStock = $cartItem->variant_id
                ? ($cartItem->variant?->stock ?? 0)
                : $cartItem->product->stock;

            if ($availableStock < $quantity) {
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
        // ✅ بارگذاری مجدد آیتم‌ها برای اطمینان از به‌روز بودن
        $cart->load('items');
        
        $itemsCount = $cart->items->sum('quantity');
        $subtotal = $cart->items->sum(function ($item) {
            return (float)$item->price * (int)$item->quantity;
        });

        $discount = 0;
        $total = $subtotal - $discount;

        $cart->update([
            'items_count' => $itemsCount,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
        ]);
        
        // ✅ بارگذاری مجدد برای اطمینان از اعمال تغییرات
        $cart->refresh();
    }
}