<?php

namespace App\Services;

use App\Models\Wishlist;
use Illuminate\Database\QueryException;
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

    /**
     * ✅ محافظت در برابر race condition واقعی: چک SELECT بالا و INSERT
     * پایین دو کوئری جدا هستند — بین آن دو، یک درخواست همزمان دیگر
     * (مثلاً دو تب باز، یا دو کلیک واقعاً هم‌زمان که گارد frontend
     * isWishlistBusy بین‌شان رد شده) می‌تواند همان ردیف را بسازد. قبل از
     * این fix، آن INSERT دوم روی unique constraint واقعی دیتابیس
     * (wishlists.user_id+product_id، رجوع به migration) با یک
     * QueryException (SQLSTATE 23000) شکست می‌خورد که هرگز اینجا catch
     * نمی‌شد — به بالا (WishlistController@store) به‌عنوان یک \Exception
     * عمومی می‌رسید که $e->getCode() آن رشته‌ی '23000' است، نه عدد صحیح
     * ۴۰۹، پس شرط `$e->getCode() === 409` false می‌شد و کاربر یک ۵۰۰
     * عمومی («خطای داخلی سرور») می‌دید، نه پیام روشن «قبلاً اضافه شده».
     * دقیقاً همان چیزی که تسک صریحاً خواسته: «یک پاسخ واقعیِ
     * already-wishlisted هرگز نباید به‌عنوان خطای عمومی اپلیکیشن ظاهر شود».
     */
    public function addToWishlist(int $userId, int $productId): Wishlist
    {
        $existing = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            throw new \Exception('این محصول قبلاً در لیست علاقه‌مندی‌های شما وجود دارد.', 409);
        }

        try {
            return Wishlist::create([
                'user_id' => $userId,
                'product_id' => $productId,
            ]);
        } catch (QueryException $e) {
            if ($this->isUniqueConstraintViolation($e)) {
                throw new \Exception('این محصول قبلاً در لیست علاقه‌مندی‌های شما وجود دارد.', 409);
            }

            throw $e;
        }
    }

    private function isUniqueConstraintViolation(QueryException $e): bool
    {
        // همان کد SQLSTATE که ReferralRewardService از قبل برای همین منظور
        // استفاده می‌کند — پایدار روی MySQL و SQLite (محیط تست).
        return $e->getCode() === '23000';
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
