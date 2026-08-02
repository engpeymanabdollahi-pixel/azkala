<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\ProductHistory;

class ProductObserver
{
    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        $sellerId = $product->seller_id;
        if (!$sellerId) return; // فقط برای محصولات فروشندگان ثبت شود، نه تمپلیت‌ها

        $changes = $product->getChanges();

        // بررسی تغییر قیمت
        if (array_key_exists('price', $changes) || array_key_exists('discount_price', $changes)) {
            $oldPrice = $product->getOriginal('price') . ( $product->getOriginal('discount_price') ? ' (تخفیف: ' . $product->getOriginal('discount_price') . ')' : '');
            $newPrice = $product->price . ( $product->discount_price ? ' (تخفیف: ' . $product->discount_price . ')' : '');
            
            ProductHistory::create([
                'product_id' => $product->id,
                'seller_id' => $sellerId,
                'field' => 'price',
                'old_value' => $oldPrice,
                'new_value' => $newPrice,
            ]);
        }

        // بررسی تغییر موجودی
        if (array_key_exists('stock', $changes)) {
            ProductHistory::create([
                'product_id' => $product->id,
                'seller_id' => $sellerId,
                'field' => 'stock',
                'old_value' => (string) $product->getOriginal('stock'),
                'new_value' => (string) $product->stock,
            ]);
        }
    }
}