<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /**
     * تعیین اینکه آیا کاربر می‌تواند محصول را ویرایش کند
     */
    public function update(User $user, Product $product): bool
    {
        // ادمین همه چیز را می‌تواند ویرایش کند
        if ($user->role === 'admin') {
            return true;
        }

        // فروشنده فقط می‌تواند محصولات خودش را ویرایش کند
        return $user->id === $product->seller_id;
    }

    /**
     * تعیین اینکه آیا کاربر می‌تواند محصول را حذف کند
     */
    public function delete(User $user, Product $product): bool
    {
        // ادمین همه چیز را می‌تواند حذف کند
        if ($user->role === 'admin') {
            return true;
        }

        // فروشنده فقط می‌تواند محصولات خودش را حذف کند
        return $user->id === $product->seller_id;
    }
}