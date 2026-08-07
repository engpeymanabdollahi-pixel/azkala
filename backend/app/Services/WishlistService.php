<?php

namespace App\Services;

use App\Models\Wishlist;
use Illuminate\Pagination\LengthAwarePaginator;

class WishlistService
{
    public function getUserWishlist(int $userId): LengthAwarePaginator
    {
        return Wishlist::with('product')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->paginate(20);
    }

    public function addToWishlist(int $userId, int $productId): Wishlist
    {
        $existing = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            throw new \Exception('این محصول قبلاً در لیست علاقه‌مندی‌های شما وجود دارد.', 409);
        }

        return Wishlist::create([
            'user_id' => $userId,
            'product_id' => $productId,
        ]);
    }

    public function removeFromWishlist(int $userId, int $productId): bool
    {
        return (bool) Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->delete();
    }

    public function isWishlisted(int $userId, int $productId): bool
    {
        return Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();
    }
}
