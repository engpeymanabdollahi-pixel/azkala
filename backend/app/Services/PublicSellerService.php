<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SellerRating;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PublicSellerService
{
    /**
     * ✅ قبلاً PublicSellerResource::reviews_count/orders_count همیشه ۰
     * هاردکد بود («برای جلوگیری از خطای کوئری» طبق کامنت خودش) — یعنی
     * صفحه‌ی عمومی فروشگاه امتیاز ستاره‌ای واقعی را کنار «۰ نظر» ثابت نشان
     * می‌داد، حتی وقتی seller_ratings واقعی وجود داشت. اینجا (فقط برای
     * واکشیِ تک‌فروشنده، نه لیست‌های top/followed که ریسک N+1 دارند) این
     * دو مقدار واقعی محاسبه و به‌عنوان attribute اضافه به مدل چسبانده
     * می‌شوند تا PublicSellerResource بدون کوئری اضافه بخواندشان.
     */
    public function findActiveSellerBySlug(string $slug): ?User
    {
        $seller = User::where('slug', $slug)
            ->where('role', 'seller')
            ->where('is_active', true)
            ->first();

        if ($seller) {
            $this->attachRealCounts($seller);
        }

        return $seller;
    }

    private function attachRealCounts(User $seller): void
    {
        $seller->setAttribute('reviews_count', $seller->sellerRatings()->count());
        $seller->setAttribute(
            'orders_count',
            $seller->orderItems()->distinct('order_id')->count('order_id')
        );
        // ✅ فاز ۶ (Seller Store ↔ Nearby Stores): تعداد شعبه‌ی فیزیکیِ
        // واقعاً «قابل کشف عمومی» همین فروشنده — دقیقاً همان تعریفی که
        // NearbyStoreService برای «فروشگاه واقعی و نمایش‌پذیر» استفاده
        // می‌کند (Store::scopePubliclyDiscoverable: فعال + تأییدشده +
        // دارای مختصات) — نه صرفاً همه‌ی ردیف‌های stores این فروشنده (که
        // می‌توانست شامل شعبه‌ی هنوز تأییدنشده/غیرفعال هم باشد و به کاربر
        // چیزی نشان دهد که در جستجوی «فروشگاه‌های نزدیک» هرگز ظاهر نمی‌شود).
        $seller->setAttribute('stores_count', $seller->stores()->publiclyDiscoverable()->count());
    }

    public function findActiveSellerById(int $id): User
    {
        return User::where('id', $id)
            ->where('role', 'seller')
            ->where('is_active', true)
            ->firstOrFail();
    }

    public function findSellerById(int $id): User
    {
        return User::where('id', $id)->where('role', 'seller')->firstOrFail();
    }

    /**
     * فروشگاه‌های برتر برای صفحه‌ی اصلی.
     *
     * فروشگاه بدون محصول فعال حذف می‌شود — نمایاندنش در «فروشگاه‌های برتر»
     * فقط به یک ویترین خالی می‌رسد.
     *
     * ✅ قبلاً has('products')/withCount('products') فیلتر is_active
     * نداشتند — یعنی فروشنده‌ای که همه‌ی محصولاتش غیرفعال/از انبار خارج
     * شده بود هم به شرط داشتن حتی یک محصول (فعال یا نه) در لیست می‌ماند —
     * دقیقاً برخلاف همین کامنت بالا. الگوی withCount با closure اسکوپ‌شده
     * همان چیزی است که در SearchController::global برای شمارش محصولات
     * فروشنده استفاده شده.
     *
     * ✅ مهم‌تر: orderByDesc('seller_rating') در همین پوش (که has/withCount
     * جایگزین where('products_count', '>', 0) شد) به‌اشتباه با
     * orderByDesc('products_count') عوض شده بود — یعنی «فروشگاه‌های برتر»
     * دیگر اصلاً بر اساس امتیاز مرتب نمی‌شد، بلکه فقط بر اساس تعداد محصول.
     * ترتیب قبلی (امتیاز، سپس دنبال‌کننده) که خود نام ویژگی هم به آن اشاره
     * دارد برگردانده شد.
     */
    public function getTopSellers(int $limit = 8)
    {
        return User::where('role', 'seller')
            ->where('is_active', true)
            ->whereHas('products', fn ($q) => $q->where('is_active', true))
            ->withCount(['products' => fn ($q) => $q->where('is_active', true)])
            ->orderByDesc('seller_rating')
            ->orderByDesc('followers_count')
            ->limit($limit)
            ->get();
    }

    public function getSellerProducts(User $seller, array $filters): LengthAwarePaginator
    {
        // images لازم است چون ProductResource آن را می‌خواند؛ بدون eager load
        // هر محصول یک کوئری product_images جداگانه می‌زد.
        $query = Product::where('seller_id', $seller->id)
            ->where('is_active', true)
            ->with(['category', 'images']);

        $sort = $filters['sort'] ?? 'newest';
        match ($sort) {
            'popular' => $query->orderBy('sales_count', 'desc'),
            'price_low' => $query->orderBy('price', 'asc'),
            'price_high' => $query->orderBy('price', 'desc'),
            'rating' => $query->orderBy('rating', 'desc'),
            default => $query->latest(),
        };

        if (! empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['has_discount'])) {
            $query->whereNotNull('compare_price')->whereRaw('compare_price > price');
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        return $query->paginate($perPage);
    }

    /**
     * ✅ داده‌ی واقعی برای تب «نظرات» که قبلاً کاملاً placeholder «به‌زودی»
     * بود — seller_ratings دقیقاً همین داده را دارد (تفکیک کیفیت محصول/
     * سرعت ارسال/ارتباط + متن نظر) و به سفارش واقعی وصل است، ولی هیچ‌جای
     * فرانت‌اند تا امروز آن را نمی‌خواند.
     */
    public function getSellerReviews(User $seller, int $perPage = 10): LengthAwarePaginator
    {
        return SellerRating::where('seller_id', $seller->id)
            ->with('user:id,name,avatar')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * ✅ فاز ۳.۵ (بازبینی صفحه فروشگاه): این دو متد قبلاً بعد از
     * follow/unfollow، Cache::forget("public_seller_profile_{$seller->slug}")
     * را صدا می‌زدند — ولی در کل کدبیس هیچ‌جا (نه اینجا، نه
     * findActiveSellerBySlug، نه هیچ کنترلری) این کلید با
     * Cache::remember/Cache::put واقعاً ست نمی‌شد؛ یعنی کد مرده‌ای بود که
     * ظاهر یک لایه‌ی cache را نشان می‌داد بدون اینکه واقعاً وجود داشته
     * باشد (بی‌ضرر چون forget روی کلید ناموجود no-op است، ولی گمراه‌کننده
     * برای هر توسعه‌دهنده‌ی بعدی).
     *
     * عمداً به‌جای پیاده‌سازی نصفه‌ونیمه‌ی caching فقط همین‌جا، این کد مرده
     * حذف شد نه بازسازی: findActiveSellerBySlug واقعاً روی هر
     * GET /sellers/{slug} صدا زده می‌شود، ولی reviews_count/orders_count/
     * rating/followers_count هم از منابع دیگری تغییر می‌کنند که هیچ‌کدام
     * امروز این کلید را invalidate نمی‌کنند (ثبت نظر جدید در
     * SellerRatingController، تکمیل سفارش در AdminOrderService، ویرایش
     * پروفایل فروشگاه در تنظیمات فروشنده). caching واقعی و درست نیازمند
     * اضافه‌کردن Cache::forget به همه‌ی آن نقطه‌ها هم هست — خارج از scope
     * همین بازبینی؛ اگر در آینده لازم شد، به‌عنوان یک کار مجزا با تست
     * صریح staleness مستند شود (رجوع به گزارش نهایی، بخش Remaining Work).
     */
    public function followSeller(User $user, User $seller): void
    {
        DB::transaction(function () use ($user, $seller) {
            $user->followingSellers()->attach($seller->id);
            $seller->increment('followers_count');
        });
    }

    public function unfollowSeller(User $user, User $seller): void
    {
        DB::transaction(function () use ($user, $seller) {
            $user->followingSellers()->detach($seller->id);
            $seller->decrement('followers_count');
        });
    }

    public function getFollowedSellers(User $user): LengthAwarePaginator
    {
        return $user->followingSellers()
            ->where('is_active', true)
            ->latest('seller_follows.created_at')
            ->paginate(20);
    }
}
