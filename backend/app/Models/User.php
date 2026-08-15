<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    // ✅ HasRoles (spatie/laravel-permission) لایه‌ی «Administrative
    // Access» (Super Admin / Admin / Manager + Permission) را اضافه
    // می‌کند — کاملاً جدا از ستون users.role (customer/seller/admin/
    // pending_seller) که دست‌نخورده می‌ماند و همچنان تنها شرط ورود به
    // /admin/* است (EnsureAdminRole بدون تغییر). این trait فقط داخل
    // مسیرهای ادمین (از طریق EnsurePermission) استفاده می‌شود.
    //
    // نکته‌ی امنیتی بررسی‌شده: HasRoles یک Gate::before سراسری ثبت
    // می‌کند که برای *هر* authorize()/can() در کل اپ ابتدا
    // checkPermissionTo($ability) را چک می‌کند. چون همه‌ی Permission
    // های این پروژه نقطه‌دار و module-prefixed هستند (مثل
    // 'orders.view')، با نام متدهای Policy فعلی (OrderPolicy/
    // ProductPolicy/ProductAlertPolicy: 'view', 'update', 'cancel',
    // 'updateStatus', ...) هرگز برابر نمی‌شوند — پس این هوک همیشه
    // null برمی‌گرداند و اجرای عادی Policy را دست‌نخورده رها می‌کند.
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'shop_name',
        'slug',               // ✅ اضافه شد
        'banner',             // ✅ اضافه شد
        'followers_count',    // ✅ اضافه ش
        'email',
        'role',
        'phone',
        'avatar',
        'is_active',
        'password',
        'seller_rating',
        'seller_badge',
        'seller_verified_at',
        'total_sales',
        'products_count',
        'last_login_at',
        'bio',
        'national_code',
        'bank_name',
        'bank_account',
        'last_seen_at',

    ];

    protected $hidden = [
        'password',
        'remember_token',
        'email_active',
        'phone_active',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'seller_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'seller_rating' => 'decimal:2',
        'total_sales' => 'decimal:2',
        'products_count' => 'integer',
        'last_seen_at' => 'datetime',

    ];

    // ==================== Accessors ====================

    /**
     * ✅ ستون avatar فقط مسیر نسبی داخل storage/app/public را نگه می‌دارد
     * (مثلاً "seller/avatars/x.jpg" — دقیقاً چیزی که Storage::store()
     * برمی‌گرداند). قبلاً هر جا این مقدار مستقیم serialize می‌شد (UserResource،
     * ReviewResource، MagazineResource، ProductResource.seller، AuthController
     * که مدل خام را برمی‌گرداند، رویدادهای چت و...) یک مسیر نسبی خام به
     * فرانت‌اند می‌رفت که هیچ‌جا (به‌جز SellerPage.tsx که خودش یک
     * normalizer محلی دارد) به URL کامل تبدیل نمی‌شد — یعنی آواتار در
     * منوی کاربر (UserMenu)، لیست کاربران ادمین، و کارت فروشنده در صفحه‌ی
     * محصول شکسته نمایش داده می‌شد. این accessor دقیقاً همان الگویی را که
     * PublicSellerResource/SellerSettingsController از قبل برای این ستون
     * استفاده می‌کردند (asset('storage/'.$path)) در یک نقطه‌ی مرکزی
     * اعمال می‌کند تا هر جای دیگری هم که $user->avatar خوانده شود درست
     * باشد، بدون نیاز به تکرار همین تبدیل در هر Resource/Controller.
     *
     * مسیر نسبی خام (برای مثلاً Storage::delete) با
     * getRawOriginal('avatar') در دسترس می‌ماند — SellerSettingsController
     * برای حذف فایل قدیمی از همین متد استفاده می‌کند، نه از این accessor.
     */
    public function getAvatarAttribute($value)
    {
        return $value ? asset('storage/'.$value) : null;
    }

    /**
     * ✅ همان مشکل و همان راه‌حل avatar، برای ستون banner: هنوز حداقل یک
     * مصرف‌کننده‌ی فرانت‌اند (SellerCard.tsx، بخش featured) این مقدار را
     * بدون normalize مستقیم به src تصویر می‌داد.
     */
    public function getBannerAttribute($value)
    {
        return $value ? asset('storage/'.$value) : null;
    }

    // ==================== Relationships ====================

    public function products()
    {
        return $this->hasMany(Product::class, 'seller_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function sellerRequest()
    {
        return $this->hasOne(SellerRequest::class);
    }

    /**
     * آخرین اسنپ‌شات محاسبه‌شده‌ی امتیاز عملکرد — توسط
     * SellerPerformanceService نوشته می‌شود، نه به‌صورت مستقیم توسط کاربر.
     */
    public function performanceScore()
    {
        return $this->hasOne(SellerPerformanceScore::class, 'seller_id');
    }

    // Relations جدید
    public function sellerRatings()
    {
        return $this->hasMany(SellerRating::class, 'seller_id');
    }

    // ✅ اضافه شد — برای شمارش واقعیِ سفارشاتی که آیتم‌هایی از این فروشنده
    // دارند (همان الگویی که SellerService::getSellerOrdersStats با
    // OrderItem::where('seller_id', ...) پیاده‌سازی کرده، اینجا هم لازم بود).
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'seller_id');
    }

    public function givenSellerRatings()
    {
        return $this->hasMany(SellerRating::class, 'user_id');
    }

    // محاسبه میانگین امتیاز فروشنده
    public function getAverageSellerRating()
    {
        return $this->sellerRatings()->avg('overall_rating') ?? 0;
    }

    // بررسی آیا کاربر می‌تواند به این فروشنده امتیاز دهد
    public function canRateSeller($sellerId, $orderId)
    {
        return Order::where('id', $orderId)
            ->where('user_id', $this->id)
            ->where('status', 'delivered')
            ->where('payment_status', 'paid')
            ->whereDoesntHave('sellerRating', function ($q) use ($sellerId) {
                $q->where('seller_id', $sellerId);
            })
            ->exists();
    }

    // ==================== Scopes ====================

    public function scopeSellers($query)
    {
        return $query->where('role', 'seller');
    }

    public function scopeCustomers($query)
    {
        return $query->where('role', 'customer');
    }

    public function scopePendingSellers($query)
    {
        return $query->where('role', 'pending_seller');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function isWishlisted($productId)
    {
        return $this->wishlists()->where('product_id', $productId)->exists();
    }

    /**
     * Get all product alerts for this user
     */
    public function alerts()
    {
        return $this->hasMany(ProductAlert::class);
    }

    public function isOnline(): bool
    {
        return $this->last_seen_at && $this->last_seen_at->diffInMinutes(now()) < 5;
    }

    public function getLastSeenFormatted(): string
    {
        if (! $this->last_seen_at) {
            return 'نامشخص';
        }

        // ✅ diffInMinutes/diffInHours/diffInDays در Carbon مقدار float برمی‌گردانند
        // (مثلاً 2.0028573666667) — قبلاً مستقیم داخل رشته جاگذاری می‌شد و برای
        // هر کاربری که ۱ تا ۵۹ دقیقه پیش آنلاین بوده، متنی مثل
        // «2.0028573666667 دقیقه پیش» به‌جای «۲ دقیقه پیش» نمایش داده می‌شد.
        $minutes = (int) floor($this->last_seen_at->diffInMinutes(now()));

        if ($minutes < 1) {
            return 'همین الان';
        }
        if ($minutes < 60) {
            return "{$minutes} دقیقه پیش";
        }

        $hours = (int) floor($this->last_seen_at->diffInHours(now()));
        if ($hours < 24) {
            return "{$hours} ساعت پیش";
        }

        $days = (int) floor($this->last_seen_at->diffInDays(now()));
        if ($days < 7) {
            return "{$days} روز پیش";
        }

        return $this->last_seen_at->format('Y/m/d');
    }

    public function blockedUsers()
    {
        return $this->hasMany(BlockedUser::class);
    }

    public function blockedBy()
    {
        return $this->hasMany(BlockedUser::class, 'blocked_user_id');
    }

    public function chatReports()
    {
        return $this->hasMany(ChatReport::class, 'reporter_id');
    }

    public function reportedIn()
    {
        return $this->hasMany(ChatReport::class, 'reported_user_id');
    }

    public function isBlocked($userId): bool
    {
        return $this->blockedUsers()->where('blocked_user_id', $userId)->exists();
    }

    public function blockUser($userId, $reason = null)
    {
        return BlockedUser::firstOrCreate([
            'user_id' => $this->id,
            'blocked_user_id' => $userId,
        ], ['reason' => $reason]);
    }

    public function unblockUser($userId)
    {
        return BlockedUser::where('user_id', $this->id)
            ->where('blocked_user_id', $userId)
            ->delete();
    }

    /**
     * مکالمات به عنوان خریدار
     */
    public function conversationsAsBuyer()
    {
        return $this->hasMany(Conversation::class, 'buyer_id');
    }

    /**
     * مکالمات به عنوان فروشنده
     */
    public function conversationsAsSeller()
    {
        return $this->hasMany(Conversation::class, 'seller_id');
    }

    /**
     * احساسات پیام‌های کاربر
     */
    public function sentiments()
    {
        return $this->hasManyThrough(
            MessageSentiment::class,
            Message::class,
            'sender_id', // Foreign key on messages table
            'message_id', // Foreign key on message_sentiments table
            'id', // Local key on users table
            'id' // Local key on messages table
        );
    }

    /**
     * گزارش‌های ثبت شده علیه این کاربر
     */
    public function reported()
    {
        return $this->hasMany(ChatReport::class, 'reported_user_id');
    }

    /**
     * تیکت‌های اختصاص داده شده به این کاربر
     */
    public function assignedTickets()
    {
        return $this->hasMany(SupportTicket::class, 'assigned_to');
    }

    /**
     * تیکت‌های ایجاد شده توسط این کاربر
     */
    public function createdTickets()
    {
        return $this->hasMany(SupportTicket::class, 'user_id');
    }

    /**
     * رابطه یک‌به‌یک با سبد خرید
     */
    public function cart()
    {
        return $this->hasOne(Cart::class);
    }
    // ==================== Storefront Relationships ====================

    public function followers()
    {
        return $this->belongsToMany(User::class, 'seller_follows', 'seller_id', 'user_id')
            ->withTimestamps();
    }

    public function followingSellers()
    {
        return $this->belongsToMany(User::class, 'seller_follows', 'user_id', 'seller_id')
            ->where('role', 'seller')
            ->withTimestamps();
    }

    public function isFollowingSeller($sellerId)
    {
        return $this->followingSellers()->where('seller_id', $sellerId)->exists();
    }

    // ==================== Helper Methods ====================

    public function getRouteKeyName()
    {
        return 'slug'; // اجازه می‌دهد روت‌ها با slug به جای ID کار کنند
    }

    /**
     * ✅ ستون slug روی users یک قید unique واقعی دارد (مایگریشن
     * add_slug_to_users_table)، ولی قبلاً هیچ منطق برخوردی برای اسلاگ
     * تکراری وجود نداشت — دو فروشنده با نام فروشگاه یکسان (یا حتی
     * نام‌های متفاوتی که Str::slug یک خروجی یکسان می‌دهد) باعث خطای
     * دیتابیس «UNIQUE constraint failed» می‌شدند. همان الگوی افزودن
     * پسوند عددی که در Services/Seller/SellerService برای اسلاگ محصول
     * استفاده می‌شود، اینجا هم به‌صورت یک متد قابل استفاده‌ی مشترک درآمد
     * (هم از boot() پایین، هم از AdminUserService::finalApproveRequest
     * وقتی فروشنده یک shop_alias دلخواه انتخاب کرده باشد).
     */
    public static function generateUniqueSlug(string $base, ?int $excludeId = null): string
    {
        $baseSlug = Str::slug($base) ?: 'shop-'.($excludeId ?? uniqid());
        $slug = $baseSlug;
        $count = 1;
        while (static::where('slug', $slug)->where('id', '!=', $excludeId ?? 0)->exists()) {
            $slug = $baseSlug.'-'.$count;
            $count++;
        }

        return $slug;
    }

    /**
     * خلاصه‌ی نقش/Permission های Administrative برای Frontend (بخش ۱۸
     * درخواست: authStore.ts) — عمداً *accessor عمومی* (مثل $appends)
     * نیست: اگر global می‌شد، روی هر سریالایز شدن User در کل اپ (لیست
     * سفارشات با user تودرتو، محصولات با seller، نظرات، ...) هم اجرا
     * می‌شد و برای هزاران کاربر customer/seller بی‌ربط کوئری‌های
     * roles/permissions اضافه می‌زد (N+1 — دقیقاً همان چیزی که بخش ۳۵
     * منع کرده). این متد را فقط AuthController (login/OTP/refresh/
     * profile) صراحتاً صدا می‌زند — یعنی حداکثر یک‌بار در هر نشست، نه
     * روی هر پاسخ حاوی User.
     *
     * برای غیر-admin (customer/seller/pending_seller) همیشه خالی است —
     * این لایه فقط برای users.role=admin معنا دارد.
     */
    public function administrativeAccessSummary(): array
    {
        if ($this->role !== 'admin') {
            return ['administrative_role' => null, 'permissions' => []];
        }

        $administrativeRole = collect(['super_admin', 'admin', 'manager'])
            ->first(fn (string $role) => $this->hasRole($role));

        return [
            'administrative_role' => $administrativeRole,
            'permissions' => $this->getAllPermissions()->pluck('name')->values()->all(),
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::saving(function ($user) {
            // ✅ isDirty('shop_name') در لحظه‌ی create() برای هر مقداری —
            // حتی null صریح — true است (رکورد تازه، همه‌چیز «dirty» است).
            // بدون شرط !empty($user->shop_name)، هر کاربر عادی/pending_seller
            // که با shop_name خالی ساخته می‌شد بلافاصله یک اسلاگ بی‌معنی
            // مثل «shop-» می‌گرفت — و چون از این به بعد slug دیگر خالی
            // نبود، وقتی بعداً finalApproveRequest واقعاً shop_name را پر
            // می‌کرد، این شرط (چون slug دیگر خالی نیست) دوباره اجرا نمی‌شد
            // و اسلاگ همیشه «shop-» بی‌معنی می‌ماند.
            if ($user->isDirty('shop_name') && ! empty($user->shop_name) && ! $user->slug) {
                $user->slug = static::generateUniqueSlug($user->shop_name, $user->id);
            }
        });

        // ✅ Backward compatibility حیاتی برای سیستم Multi-Admin/Manager:
        // با اضافه‌شدن EnsurePermission روی ~۱۷۶ route ادمین، یک کاربر با
        // users.role=admin که هیچ نقش Administrative (spatie) ندارد دیگر
        // هیچ Permission ای ندارد — یعنی بدون این هوک، همان لحظه‌ای که
        // کسی (از طریق AdminUserService::updateUserRole یا حتی مستقیم
        // User::create) به role=admin ارتقا پیدا کند، وارد پنل می‌شود ولی
        // به هیچ‌چیز دسترسی ندارد (قفل‌شدگی که دستور صریح منع کرده).
        //
        // این هوک دقیقاً همان رفتار قبلی سیستم را حفظ می‌کند: «شدن admin»
        // پیش‌فرض یعنی دسترسی گسترده (نقش Administrative «admin»، نه
        // super_admin) — Super Admin بعداً می‌تواند از پنل Admin Access
        // این را به «manager» با Permission محدود downgrade کند.
        //
        // wasChanged('role') (نه هر save ای) عمداً استفاده شده — فقط در
        // لحظه‌ی *واقعی* تبدیل به admin اجرا می‌شود، نه در هر ذخیره‌ی
        // بعدی (مثلاً toggle کردن is_active) — وگرنه اگر Super Admin
        // صراحتاً نقش Administrative یک ادمین را حذف کند، اولین ذخیره‌ی
        // بعدی آن کاربر (حتی برای یک تغییر بی‌ربط) دوباره پنهانی
        // «admin» را به او برمی‌گرداند و آن تصمیم را دور می‌زد.
        //
        // برای کاربرانی که این کد قبل از استقرارش «admin» بوده‌اند
        // (رجوع به AdministrativeAccessSeeder برای backfill یک‌باره).
        static::saved(function ($user) {
            // ✅ wasChanged('role') به‌تنهایی برای INSERT جدید کار
            // نمی‌کند — چون Eloquent برای یک رکورد کاملاً تازه هیچ
            // «original» ای قبل از insert ندارد که باهاش مقایسه کند، پس
            // wasChanged('role') حتی وقتی role مستقیم روی مقدار 'admin'
            // ست شده باشد، false برمی‌گرداند (تایید‌شده مستقیم با تست).
            // wasRecentlyCreated دقیقاً برای همین لحظه‌ی insert true است؛
            // ترکیبش با wasChanged('role') هر دو مسیر (ساخته‌شدن مستقیم
            // با role=admin، و ارتقای بعدی یک کاربر موجود) را می‌پوشاند.
            $justBecameAdmin = $user->wasRecentlyCreated || $user->wasChanged('role');

            if ($user->role === 'admin' && $justBecameAdmin && ! $user->roles()->exists()) {
                $user->assignRole('admin');
            }
        });
    }
}
