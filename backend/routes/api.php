<?php

use App\Http\Controllers\Admin\AdminAdController;
// عمومی
use App\Http\Controllers\Admin\BlockManagementController;
use App\Http\Controllers\Admin\ChatMonitorController;
use App\Http\Controllers\Admin\FaqManagementController;
use App\Http\Controllers\Admin\MessageTemplateController;
use App\Http\Controllers\Admin\ReportController as AdminChatReportController;
use App\Http\Controllers\Admin\ReportExportController;
use App\Http\Controllers\Admin\SentimentDashboardController;
use App\Http\Controllers\Admin\SuggestionManagementController;
// کاربر
use App\Http\Controllers\Admin\SupportTicketController;
use App\Http\Controllers\Api\AdController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AdminAdvancedReportController;
use App\Http\Controllers\Api\AdminAiArticleController;
use App\Http\Controllers\Api\AdminBrandController;
use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminDeviceBrandController;
use App\Http\Controllers\Api\AdminDeviceFamilyController;
use App\Http\Controllers\Api\AdminDeviceModelController;
use App\Http\Controllers\Api\AdminDeviceSeriesController;
use App\Http\Controllers\Api\AdminMagazineController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\NewsletterController;
// چت
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AdminReviewController;
use App\Http\Controllers\Api\AdminSettingController;
// فروشنده
use App\Http\Controllers\Api\AdminAccessController;
use App\Http\Controllers\Api\AdminCommissionController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BulkProductController;
use App\Http\Controllers\Api\DebugController;
// ادمین
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ChatFaqController;
use App\Http\Controllers\Api\ChatModerationController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\DevController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\MagazineController;
use App\Http\Controllers\Api\AdminStoreController;
use App\Http\Controllers\Api\AdminReferralController;
use App\Http\Controllers\Api\AdminReferralRuleController;
use App\Http\Controllers\Api\NearbyStoreController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductAlertController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PublicSellerController;
// ادمین (ویژه)
use App\Http\Controllers\Api\PushSubscriptionController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SellerDashboardController;
use App\Http\Controllers\Api\SellerOrderController;
use App\Http\Controllers\Api\SellerProductController;
use App\Http\Controllers\Api\SellerQuickReplyController;
use App\Http\Controllers\Api\SellerRatingController;
use App\Http\Controllers\Api\SellerRequestController;
use App\Http\Controllers\Api\SellerSettingsController;
use App\Http\Controllers\Api\SellerStoreController;
use App\Http\Controllers\Api\SellerStoreInventoryController;
use App\Http\Controllers\Api\UserDeviceController;
use App\Http\Controllers\Api\UserTicketController;
use App\Http\Controllers\Api\WishlistController;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminAccessLogController;

// ============================================================
// ✅ نسخه‌بندی API: تمام روت‌ها درون پیشوند v1 قرار می‌گیرند
// ============================================================
Route::prefix('v1')->group(function () {

    // ۱. مسیرهای عمومی
    Route::get('/test', function () {
        return response()->json(['success' => true, 'message' => 'Azkala API v1 is working!', 'timestamp' => now()->toDateTimeString()]);
    })->name('test');

    // ============================================================
    // 🛠️ ابزارهای توسعه (فقط در APP_ENV=local فعال است)
    // ============================================================
    if (app()->environment('local')) {
        Route::prefix('dev')->name('dev.')->group(function () {
            // دریافت OTP برای یک شماره (بدون نیاز به پیامک)
            Route::get('/otp/{phone}', [DevController::class, 'getOtp'])->name('otp');
            // Login سریع ادمین (بدون نیاز به OTP)
            Route::post('/admin-login', [DevController::class, 'adminLogin'])->name('admin-login');
        });
    }

    Route::get('/devices/hierarchy', [DeviceController::class, 'getHierarchy'])->name('devices.hierarchy');

    // throttle:auth (۱۰ درخواست در دقیقه به ازای هر IP، مشترک بین این سه مسیر)
    // نه throttle:10,1 که سهمیه را برای هر مسیر جدا حساب می‌کند و عملاً سقف را
    // برای یک مهاجم سه‌برابر می‌کند.
    // نام‌ها با پیشوند auth. — به‌خصوص login که در غیر این صورت با روتِ وبِ
    // هم‌نام (routes/web.php) تداخل می‌کند و چون بعد از آن ثبت می‌شود،
    // route('login') در Authenticate.php را به این مسیرِ POSTیِ API می‌بَرَد.
    Route::middleware('throttle:auth')->name('auth.')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
        Route::post('/verify-otp', [AuthController::class, 'handleOtp'])->name('verify-otp');
        Route::post('/login', [AuthController::class, 'login'])->name('login');
    });

    // 🏪 روت‌های عمومی شعبه آنلاین فروشندگان (خارج از auth)
    Route::prefix('sellers')->name('sellers.')->group(function () {
        // /top باید قبل از /{slug} ثبت شود — وگرنه به‌عنوان اسلاگ یک فروشنده
        // تفسیر می‌شود و همیشه ۴۰۴ می‌دهد.
        Route::get('/top', [PublicSellerController::class, 'top'])->name('top');
        Route::get('/{slug}', [PublicSellerController::class, 'show'])->name('show');
        Route::get('/{slug}/products', [PublicSellerController::class, 'products'])->name('products');
        // ✅ اضافه شد — تب «نظرات» صفحه‌ی عمومی فروشگاه قبلاً کاملاً placeholder
        // بود؛ seller_ratings واقعی وجود دارد ولی هیچ روتی آن را expose نمی‌کرد.
        Route::get('/{slug}/reviews', [PublicSellerController::class, 'reviews'])->name('reviews');
    });

    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{category}', [CategoryController::class, 'show'])->name('categories.show');
    Route::get('/brands', [BrandController::class, 'index'])->name('brands.index');
    // قبل از /{brand} — وگرنه «slug» به‌عنوان شناسه‌ی برند تفسیر می‌شود.
    Route::get('/brands/slug/{slug}', [BrandController::class, 'bySlug'])->name('brands.by-slug');
    Route::get('/brands/{brand}', [BrandController::class, 'show'])->name('brands.show');

    Route::prefix('devices')->name('devices.')->group(function () {
        Route::get('/brands', [DeviceController::class, 'brands'])->name('brands');
        Route::get('/brands/{brandId}/series', [DeviceController::class, 'series'])->name('series');
        Route::get('/series/{seriesId}/models', [DeviceController::class, 'models'])->name('models');
        Route::get('/models/{modelId}', [DeviceController::class, 'model'])->name('model');
        Route::get('/header-hierarchy', [DeviceController::class, 'getHeaderHierarchy'])->name('header-hierarchy');
    });

    // ✅ Device-First Architecture فاز ۱F: لیست عمومی خانواده‌های فعالِ
    // دستگاه (Smartphone/Laptop/Tablet/...) — تنها منبعِ اکوسیستم‌های
    // دستگاهِ فرانت‌اند؛ افزودن خانواده‌ی جدید از ادمین نیازی به تغییر کد
    // فرانت‌اند ندارد.
    Route::get('/device-families', [DeviceController::class, 'families'])->name('device-families.index');

    Route::prefix('products')->name('products.')->group(function () {
        Route::middleware('throttle:search')->group(function () {
            Route::get('/', [ProductController::class, 'index'])->name('index');
        });
        Route::get('/featured', [ProductController::class, 'featured'])->name('featured');
        Route::get('/special-offers', [ProductController::class, 'specialOffers'])->name('special-offers');
        Route::get('/compatible/{modelId}', [ProductController::class, 'compatible'])->name('compatible');
        Route::post('/compatible-multi', [ProductController::class, 'compatibleMulti'])->name('compatible-multi');
        Route::get('/slug/{slug}', [ProductController::class, 'bySlug'])->name('by-slug');
        Route::get('/{productId}/reviews', [ReviewController::class, 'index'])->name('reviews.index');
        // 📍 Nearby Physical Stores — عمومی، بدون نیاز به ورود؛ throttle
        // اختصاصی خودش را دارد (نه throttle:search که برای جستجوی متنی
        // محصولات است).
        Route::get('/{product}/nearby-stores', [NearbyStoreController::class, 'index'])
            ->middleware('throttle:nearby-stores')
            ->name('nearby-stores');
        Route::get('/templates', [ProductController::class, 'getTemplates'])->name('templates');
        // نیازمند ورود است، ولی باید همین‌جا — قبل از /{product} — ثبت شود.
        // قبلاً پایین‌تر داخل گروه auth:sanctum بود، یعنی بعد از wildcard، پس
        // «my-products» به‌عنوان شناسه‌ی محصول تفسیر می‌شد و ۴۰۴ می‌گرفت.
        Route::get('/my-products', [ProductController::class, 'myProducts'])
            ->middleware('auth:sanctum')
            ->name('my-products');
        Route::get('/{product}', [ProductController::class, 'show'])->name('show');
    });
    // ==================== Search API (ازکالا Marketplace) ====================
    // ✅ قبلاً هیچ throttle روی این گروه نبود؛ /global خودش چند جدول
    // (products/categories/brands/device_models/users) را با LIKE می‌گردد،
    // بدون محدودیت نرخ یعنی هرکس می‌توانست بدون هیچ سقفی این کوئری‌های
    // نسبتاً سنگین را پشت سر هم بزند.
    Route::prefix('search')->name('search.')->middleware('throttle:search')->group(function () {
        Route::get('/global', [SearchController::class, 'global'])->name('global');
        Route::get('/devices', [SearchController::class, 'devices'])->name('devices');
        Route::get('/popular', [SearchController::class, 'popular'])->name('popular');
    });
    // Debug endpoint (فقط در development)
    if (app()->environment('local')) {
        Route::get('/debug/stats', [DebugController::class, 'stats'])->name('debug.stats');
    }

    // ==========================================
    // مسیر عمومی دریافت تنظیمات ظاهری سایت (بدون نیاز به لاگین)
    // ==========================================
    // ============================================================
    // مجله ازکالا (Magazine) - Public endpoints
    // ============================================================
    Route::prefix('magazine')->name('magazine.')->group(function () {
        // این routes باید قبل از {slug} باشند تا تداخل نکنند
        Route::get('/featured', [MagazineController::class, 'featured'])->name('featured');
        Route::get('/stats', [MagazineController::class, 'stats'])->name('stats');
        Route::get('/category/{category}', [MagazineController::class, 'byCategory'])->name('category');
        Route::get('/device/{modelId}/news', [MagazineController::class, 'deviceNews'])->name('device.news');

        // لیست مقالات (با pagination و فیلترها)
        Route::get('/', [MagazineController::class, 'index'])->name('index');

        // جزئیات مقاله (باید آخر باشد چون {slug} همه چیز را match می‌کند)
        Route::get('/{slug}', [MagazineController::class, 'show'])->name('show');
    });

    // ============================================================
    // تبلیغات ازکالا (Ads) - Public endpoints
    // ✅ مستقل از magazine - منطقاً به مجله ربطی ندارد
    // ============================================================
    Route::get('/ads/active', [AdController::class, 'active'])->name('ads.active');

    Route::get('/site-settings', function () {
    try {
        $keys = [
            // General
            'site_name', 'site_logo', 'site_favicon',
            'support_phone', 'support_email', 'address', 'working_hours',
            // Social
            'instagram_url', 'telegram_url', 'twitter_url', 'about_text',
            // Legal
            'enamad_code', 'samandehi_code',
            // ✅ متن‌های حقوقی قابل‌ویرایش از پنل ادمین — قبلاً در تنظیمات
            // seed می‌شدند ولی هرگز به این whitelist اضافه نشده بودند، یعنی
            // هیچ صفحه‌ای (حتی اگر می‌خواست) نمی‌توانست آن‌ها را بخواند.
            // اگر ادمین این‌ها را خالی بگذارد، صفحات مربوطه از متن پیش‌فرض
            // hardcoded خودشان استفاده می‌کنند.
            'terms_text', 'privacy_text', 'warranty_text', 'seller_terms_text',
            // ✅ Marketing - Announcement Bar
            'announcement_enabled',
            'announcement_text',
            'announcement_link',
            'announcement_bg_color',
            'announcement_show_live_users',
            // ✅ Seller Request
            'seller_request_bg_image',
            // ✅ Shipping — صفحه‌ی «روش‌ها و هزینه‌ی ارسال» باید هزینه‌ها و
            // روش‌های فعال واقعی را نشان بدهد، نه رقم هاردکد. هیچ‌کدام از
            // این کلیدها اطلاعات حساس (مثل merchant ID درگاه پرداخت) ندارند.
            'post_pishtaz_enabled', 'post_pishtaz_cost',
            'tipax_enabled', 'tipax_cost',
            'free_shipping_enabled', 'free_shipping_min_amount',
            'express_delivery_enabled', 'express_delivery_cost',
        ];

            $settings = Setting::whereIn('key', $keys)->get();

            $result = [];
            foreach ($settings as $setting) {
                if (in_array($setting->key, ['site_logo', 'site_favicon']) && $setting->value) {
                    // ✅ اصلاح حیاتی: فقط اسلش‌های ابتدایی را حذف می‌کنیم، نه کاراکترهای خاص
                    $cleanPath = ltrim($setting->value, '/');

                    // ساخت آدرس کامل و صحیح
                    $result[$setting->key] = asset('storage/'.$cleanPath);
                } else {
                    $result[$setting->key] = $setting->value;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (Exception $e) {
            Log::error('Site Settings Error: '.$e->getMessage());

            return response()->json(['success' => false, 'data' => []], 500);
        }
    });

    // ✅ صفحه‌ی «درباره ازکالا» قبلاً چهار آمار کاملاً ثابت و ساختگی («+۱۰,۰۰۰
    // محصول»، «+۵۰۰ فروشنده»، «۹۸٪ رضایت»، «+۵۰,۰۰۰ مشتری») نشان می‌داد که
    // به هیچ داده‌ی واقعی وصل نبودند. «رضایت ۹۸٪» و «مشتری» بدون یک تعریف
    // دقیق (کدام معیار؟ کدام بازه؟) قابل محاسبه‌ی صادقانه نیستند و عمداً
    // حذف شدند؛ تعداد محصول و فروشنده اما واقعاً قابل شمارش‌اند — این
    // endpoint دقیقاً همان دو عدد را از دیتابیس واقعی برمی‌گرداند.
    Route::get('/platform-stats', function () {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'products_count' => \App\Models\Product::where('is_active', true)->count(),
                    'sellers_count' => \App\Models\User::where('role', 'seller')
                        ->where('is_active', true)
                        ->whereNull('deleted_at')
                        ->count(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Platform Stats Error: '.$e->getMessage());

            return response()->json(['success' => false, 'data' => ['products_count' => 0, 'sellers_count' => 0]], 500);
        }
    });

    // ============================================================
    // ۲. مسیرهای محافظت‌شده (Auth)
    // ============================================================
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/upload/images', [ImageUploadController::class, 'upload'])->name('upload.images');

        // درخواست‌های فروشندگی
        // این تنها تعریف هر کدام از این مسیرهاست؛ قبلاً بخشی از آن‌ها در
        // routes/api_v1.php هم تکرار شده بود و چون هر دو فایل mount می‌شدند،
        // آخرین تعریف برنده می‌شد و معلوم نبود کدام کنترلر واقعاً اجرا می‌شود.
        Route::get('/user/seller-request-status', [SellerRequestController::class, 'getStatus']);
        Route::post('/seller-requests', [SellerRequestController::class, 'store'])->name('seller-requests.store');
        Route::post('/seller-requests/{sellerRequest}/upload-documents', [SellerRequestController::class, 'uploadDocuments'])->name('seller-requests.upload-documents');
        // ✅ PUT .../complete حذف شد — controller method متناظرش (SellerRequestController::complete)
        // کد مرده و هیچ‌وقت از فرانت‌اند صدا زده نمی‌شد (رجوع به کامنت آن‌جا).

        // امتیاز و نظر به فروشنده
        Route::post('/seller-ratings', [SellerRatingController::class, 'store']);
        Route::get('/seller-ratings/seller/{sellerId}', [SellerRatingController::class, 'getSellerRatings']);
        Route::get('/seller-ratings/can-rate/{orderId}', [SellerRatingController::class, 'canRate']);

        // خروج از حساب
        // این closure نسخه‌ی خودش از logout را داشت و AuthController::logout را
        // کاملاً دور می‌زد — یعنی هر اصلاحی روی کنترلر بی‌اثر بود. حالا هر دو یک
        // مسیر دارند و منطق خروج فقط یک جا زندگی می‌کند.
        // خروج از حساب
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        // ✅ اضافه شد: Refresh token برای جلوگیری از logout ناگهانی
        Route::post('/refresh', [AuthController::class, 'refresh'])->name('refresh');

        // روت‌های مربوط به کاربر
        Route::prefix('user')->name('user.')->group(function () {
            Route::get('/', [AuthController::class, 'user'])->name('profile');
            Route::put('/', [AuthController::class, 'update'])->name('update');
            Route::post('/change-password', [AuthController::class, 'changePassword'])->name('change-password');

            Route::prefix('devices')->name('devices.')->group(function () {
               Route::get('/', [UserDeviceController::class, 'index'])->name('index');
Route::post('/', [UserDeviceController::class, 'store'])->name('store');
Route::put('/{deviceId}', [UserDeviceController::class, 'update'])->name('update');
Route::delete('/{deviceId}', [UserDeviceController::class, 'destroy'])->name('destroy');
            });

            // نوتیفیکیشن‌ها
            Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
            Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
            Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

            // لیست فروشندگان دنبال‌شده
            Route::get('/followed-sellers', [PublicSellerController::class, 'followedSellers'])->name('followed-sellers');

            // ✅ Referral System — Phase 2 (فقط GET؛ ساخت Referral endpoint
            // عمومی ندارد، فقط از مسیر ثبت‌نام سمت سرور capture می‌شود)
            Route::get('/referral', [ReferralController::class, 'me'])->name('referral');
            Route::get('/referrals', [ReferralController::class, 'myReferrals'])->name('referrals');
        });

        // روت‌های RESTful دنبال کردن فروشندگان
        Route::prefix('sellers')->group(function () {
            Route::post('/{id}/follow', [PublicSellerController::class, 'follow'])->name('sellers.follow');
            Route::delete('/{id}/follow', [PublicSellerController::class, 'unfollow'])->name('sellers.unfollow');
        });

        // سایر روت‌های کاربری
        Route::prefix('cart')->name('cart.')->group(function () {
            Route::get('/', [CartController::class, 'index'])->name('index');
            Route::post('/', [CartController::class, 'store'])->name('store');
            // /clear باید قبل از /{cartItemId} بیاید، وگرنه wildcard آن را می‌گیرد
            // و درخواست با «clear» به‌عنوان شناسه به destroy() می‌رسد.
            Route::delete('/clear', [CartController::class, 'clear'])->name('clear');
            Route::put('/{cartItemId}', [CartController::class, 'update'])->name('update');
            Route::delete('/{cartItemId}', [CartController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('orders')->name('orders.')->group(function () {
            Route::get('/', [OrderController::class, 'index'])->name('index');
            Route::get('/{order}', [OrderController::class, 'show'])->name('show');
            Route::post('/', [OrderController::class, 'store'])->name('store');
            Route::post('/{order}/cancel', [OrderController::class, 'cancel'])->name('cancel');
        });

        Route::prefix('coupons')->name('coupons.')->group(function () {
            Route::post('/validate', [CouponController::class, 'validateCoupon'])->name('validate');
            Route::get('/my', [CouponController::class, 'myCoupons'])->name('my');
        });

        Route::prefix('wishlist')->name('wishlist.')->group(function () {
            Route::get('/', [WishlistController::class, 'index'])->name('index');
            Route::post('/', [WishlistController::class, 'store'])->name('store');
            Route::delete('/{productId}', [WishlistController::class, 'destroy'])->name('destroy');
            Route::get('/check/{productId}', [WishlistController::class, 'check'])->name('check');
        });
        // 🚨 Product Alerts
        Route::prefix('alerts')->name('alerts.')->group(function () {
            Route::get('/', [ProductAlertController::class, 'index'])->name('index');
            Route::post('/', [ProductAlertController::class, 'store'])->name('store');
            Route::delete('/{alert}', [ProductAlertController::class, 'destroy'])->name('destroy');
            Route::patch('/{alert}/toggle', [ProductAlertController::class, 'toggle'])->name('toggle');
        });

        Route::get('/products/{product}/alert-status', [ProductAlertController::class, 'status'])
            ->name('products.alert-status');

        Route::prefix('addresses')->name('addresses.')->group(function () {
            Route::get('/', [AddressController::class, 'index'])->name('index');
            Route::post('/', [AddressController::class, 'store'])->name('store');
            Route::put('/{address}', [AddressController::class, 'update'])->name('update');
            Route::delete('/{address}', [AddressController::class, 'destroy'])->name('destroy');
            Route::put('/{address}/default', [AddressController::class, 'setDefault'])->name('set-default');
        });

        Route::prefix('reviews')->name('reviews.')->group(function () {
            Route::post('/', [ReviewController::class, 'store'])->name('store');
            // PUT /reviews/{review} حذف شد: ReviewController::update وجود نداشت
            // (۵۰۰ می‌داد) و فرانت‌اند هم فقط DELETE می‌زند.
            Route::delete('/{review}', [ReviewController::class, 'destroy'])->name('destroy');
            Route::post('/{review}/helpful', [ReviewController::class, 'helpful'])->name('helpful');
        });

        Route::get('/products/{productId}/can-review', [ReviewController::class, 'canReview'])->name('products.can-review');
        Route::get('/products/my-products', [ProductController::class, 'myProducts'])->name('products.my-products');

        Route::prefix('chat')->middleware('throttle:chat')->name('chat.')->group(function () {
            Route::get('/conversations', [ChatController::class, 'index'])->name('conversations.index');
            Route::post('/conversations/start', [ChatController::class, 'startConversation'])->name('conversations.start');
            Route::get('/conversations/{conversation}', [ChatController::class, 'show'])->name('conversations.show');
            Route::get('/conversations/{conversation}/messages', [ChatController::class, 'getMessages'])->name('conversations.messages');
            Route::post('/conversations/{conversation}/messages', [ChatController::class, 'sendMessage'])->name('conversations.send-message');
            Route::delete('/conversations/{conversation}', [ChatController::class, 'deleteConversation'])->name('conversations.destroy');
            Route::get('/conversations/{conversation}/suggestions', [ChatController::class, 'getProductSuggestions'])->name('conversations.suggestions');
            Route::post('/conversations/{conversation}/suggest', [ChatController::class, 'suggestProduct'])->name('conversations.suggest');
            Route::get('/conversations/{conversation}/sentiment', [ChatController::class, 'getSentimentStats'])->name('conversations.sentiment');
            Route::post('/online-status', [ChatController::class, 'getOnlineStatus'])->name('online-status');

            Route::prefix('moderation')->name('moderation.')->group(function () {
                Route::get('/blocked-users', [ChatModerationController::class, 'getBlockedUsers'])->name('blocked-users');
                Route::post('/block', [ChatModerationController::class, 'blockUser'])->name('block');
                Route::delete('/unblock/{blockedUser}', [ChatModerationController::class, 'unblockUser'])->name('unblock');
                Route::get('/check-block/{user}', [ChatModerationController::class, 'checkBlockStatus'])->name('check-block');
                Route::post('/report', [ChatModerationController::class, 'reportUser'])->name('report');
            });

            Route::prefix('faq')->name('faq.')->group(function () {
                Route::get('/', [ChatFaqController::class, 'index'])->name('index');
                Route::post('/', [ChatFaqController::class, 'store'])->name('store');
                Route::put('/{id}', [ChatFaqController::class, 'update'])->name('update');
                Route::delete('/{id}', [ChatFaqController::class, 'destroy'])->name('destroy');
                Route::post('/seed-defaults', [ChatFaqController::class, 'seedDefaults'])->name('seed-defaults');
            });
        });

        Route::prefix('tickets')->middleware('throttle:tickets')->name('tickets.')->group(function () {
            Route::get('/', [UserTicketController::class, 'index'])->name('index');
            Route::post('/', [UserTicketController::class, 'store'])->name('store');
            Route::post('/convert/{conversation}', [UserTicketController::class, 'convertFromConversation'])->name('convert');
            Route::get('/{ticket}', [UserTicketController::class, 'show'])->name('show');
            Route::post('/{ticket}/message', [UserTicketController::class, 'sendMessage'])->name('send-message');
        });

        // 🏪 فروشنده (داخل گروه auth)
        Route::prefix('seller')->middleware(['throttle:seller', 'seller'])->name('seller.')->group(function () {
            Route::get('/dashboard/stats', [SellerDashboardController::class, 'stats'])->name('dashboard.stats');
            Route::get('/wallet', [SellerDashboardController::class, 'wallet'])->name('wallet');

            // ✅ seller/ads حذف شد چون AdminAdController در seller معنا ندارد
            // اگر در آینده SellerAdController ساخته شد، اینجا اضافه می‌شود

            Route::prefix('products')->name('products.')->group(function () {
                // Bulk Product Upload
                Route::get('/bulk/template', [BulkProductController::class, 'downloadTemplate'])->name('bulk.template');
                Route::post('/bulk/validate', [BulkProductController::class, 'validateFile'])->name('bulk.validate');
                Route::post('/bulk/commit', [BulkProductController::class, 'commit'])->name('bulk.commit');
                Route::get('/', [SellerProductController::class, 'index'])->name('index');
                Route::post('/', [SellerProductController::class, 'store'])->name('store');
                Route::get('/templates', [ProductController::class, 'getTemplates'])->name('templates');
                Route::post('/copy-template/{templateId}', [SellerProductController::class, 'copyFromTemplate'])->name('copy-template');
                Route::get('/{id}/history', [SellerProductController::class, 'getHistory'])->name('history');
                Route::get('/{product}', [SellerProductController::class, 'show'])->name('show');
                Route::put('/{product}', [SellerProductController::class, 'update'])->name('update');
                Route::delete('/{product}', [SellerProductController::class, 'destroy'])->name('destroy');

                // ✅ Product Relationship Phase 2: «همراه این محصول» (complement) —
                // مالکیتِ هر دو طرف در ProductRelationshipService اجباری می‌شود.
                Route::get('/{product}/relationships', [SellerProductController::class, 'relationships'])->name('relationships.index');
                Route::post('/{product}/relationships', [SellerProductController::class, 'storeRelationship'])->name('relationships.store');
                Route::delete('/{product}/relationships/{relationship}', [SellerProductController::class, 'destroyRelationship'])->name('relationships.destroy');
            });

            Route::prefix('orders')->name('orders.')->group(function () {
                Route::get('/', [SellerOrderController::class, 'index'])->name('index');
                Route::get('/stats', [SellerOrderController::class, 'stats'])->name('stats');
                Route::get('/{order}', [SellerOrderController::class, 'show'])->name('show');
                Route::put('/{order}/status', [SellerOrderController::class, 'updateStatus'])->name('update-status');
            });

            Route::prefix('quick-replies')->name('quick-replies.')->group(function () {
                Route::get('/', [SellerQuickReplyController::class, 'index'])->name('index');
                Route::post('/', [SellerQuickReplyController::class, 'store'])->name('store');
                Route::delete('/{reply}', [SellerQuickReplyController::class, 'destroy'])->name('destroy');
            });

            // ✅ روت جدید برای به‌روزرسانی تنظیمات فروشگاه
            Route::post('/settings', [SellerSettingsController::class, 'update'])->name('settings.update');

            // 🏬 Nearby Physical Stores — فروشگاه‌های فیزیکی این فروشنده
            // (نامش با «/settings» بالا تداخلی ندارد؛ آن یکی تنظیمات
            // حساب فروشنده است، این یکی شعبه‌های فیزیکی).
            Route::prefix('stores')->name('stores.')->group(function () {
                Route::get('/', [SellerStoreController::class, 'index'])->name('index');
                Route::post('/', [SellerStoreController::class, 'store'])->name('store');
                Route::get('/{id}', [SellerStoreController::class, 'show'])->name('show');
                Route::put('/{id}', [SellerStoreController::class, 'update'])->name('update');
                Route::delete('/{id}', [SellerStoreController::class, 'destroy'])->name('destroy');
                Route::put('/{id}/hours', [SellerStoreController::class, 'setHours'])->name('hours');

                Route::get('/{storeId}/inventory', [SellerStoreInventoryController::class, 'index'])->name('inventory.index');
                Route::post('/{storeId}/inventory', [SellerStoreInventoryController::class, 'upsert'])->name('inventory.upsert');
                Route::delete('/{storeId}/inventory/{productId}', [SellerStoreInventoryController::class, 'destroy'])->name('inventory.destroy');
            });

        }); // ✅ پایان گروه seller (همه چیز حالا درست داخل این گروه است)

        // 👨‍💼 ادمین (داخل گروه auth)
        Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () {

            // ✅ P1 Forensic Audit fix: قبلاً این گروه هیچ permission:X
            // نداشت (فقط middleware('admin') بالای کل گروه) — یک
            // 'manager' با صفر Permission همچنان می‌توانست این آمار را
            // ببیند، برخلاف تمام ماژول‌های همسایه که هرکدام permission
            // دانه‌ریز خودشان را دارند.
            Route::prefix('dashboard')->middleware('permission:dashboard.view')->name('dashboard.')->group(function () {
                Route::get('/stats', [AdminDashboardController::class, 'stats'])->name('stats');
                Route::get('/chat-stats', [AdminDashboardController::class, 'chatStats'])->name('chat-stats');
                Route::get('/sentiment-stats', [AdminDashboardController::class, 'sentimentStats'])->name('sentiment-stats');
                Route::get('/recent-chat-activity', [AdminDashboardController::class, 'recentChatActivity'])->name('recent-chat-activity');
            });
                        // ✅ فاز ۲ Observability: نمایش لاگ‌های تغییر دسترسی مدیریتی.
            // AdminAccessLog append-only است و توسط AdminAccessService نوشته
            // می‌شود؛ این endpoint فقط خواندن تاریخچه را ممکن می‌کند.
            // permission:admin.access.view (non-sensitive) در
            // config/azkala/permissions.php تعریف شده است.
            Route::prefix('access-logs')->middleware('permission:admin.access.view')->name('access-logs.')->group(function () {
                Route::get('/', [AdminAccessLogController::class, 'index'])->name('index');
                Route::get('/actions', [AdminAccessLogController::class, 'actions'])->name('actions');
            });
            // ۲. این بلوک روت را در کنار سایر روت‌های ادمین اضافه کنید:
            // نکته: پیشوندِ نام (device-brands. / device-series. / device-models.)
            // الزامی است؛ بدون آن هر سه گروه نام‌های یکسانِ admin.index/store/update/
            // destroy می‌گیرند و آخرین ثبت، قبلی‌ها را از جدولِ نام‌ها بیرون می‌کند.
            // ✅ Device-First Architecture فاز ۱E: CRUD خانواده‌های دستگاه —
            // باید قبل از device-brands ثبت شود تا با {id} تداخل نکند
            // (هر دو گروه از پیشوند متفاوتی استفاده می‌کنند، پس تداخل واقعی
            // نیست، ولی هم‌جواری منطقی همین‌جاست).
            Route::prefix('device-families')->name('device-families.')->group(function () {
                Route::get('/', [AdminDeviceFamilyController::class, 'index'])->middleware('permission:catalog.view')->name('index');
                Route::get('/{id}', [AdminDeviceFamilyController::class, 'show'])->middleware('permission:catalog.view')->name('show');
                Route::post('/', [AdminDeviceFamilyController::class, 'store'])->middleware('permission:catalog.manage')->name('store');
                Route::put('/{id}', [AdminDeviceFamilyController::class, 'update'])->middleware('permission:catalog.manage')->name('update');
                Route::delete('/{id}', [AdminDeviceFamilyController::class, 'destroy'])->middleware('permission:catalog.manage')->name('destroy');
            });
            Route::prefix('device-brands')->name('device-brands.')->group(function () {
                Route::get('/', [AdminDeviceBrandController::class, 'index'])->middleware('permission:catalog.view')->name('index');
                Route::post('/', [AdminDeviceBrandController::class, 'store'])->middleware('permission:catalog.manage')->name('store');
                Route::put('/{id}', [AdminDeviceBrandController::class, 'update'])->middleware('permission:catalog.manage')->name('update');
                Route::delete('/{id}', [AdminDeviceBrandController::class, 'destroy'])->middleware('permission:catalog.manage')->name('destroy');
            });
            Route::prefix('device-series')->name('device-series.')->group(function () {
                Route::get('/', [AdminDeviceSeriesController::class, 'index'])->middleware('permission:catalog.view')->name('index');
                Route::get('/brands-dropdown', [AdminDeviceSeriesController::class, 'getBrandsForDropdown'])->middleware('permission:catalog.view')->name('brands.dropdown'); // برای دراپ‌داون
                Route::post('/', [AdminDeviceSeriesController::class, 'store'])->middleware('permission:catalog.manage')->name('store');
                Route::put('/{id}', [AdminDeviceSeriesController::class, 'update'])->middleware('permission:catalog.manage')->name('update');
                Route::delete('/{id}', [AdminDeviceSeriesController::class, 'destroy'])->middleware('permission:catalog.manage')->name('destroy');
            });
            Route::prefix('device-models')->name('device-models.')->group(function () {
                Route::get('/', [AdminDeviceModelController::class, 'index'])->middleware('permission:catalog.view')->name('index');
                Route::get('/series-dropdown', [AdminDeviceModelController::class, 'getSeriesForDropdown'])->middleware('permission:catalog.view')->name('series.dropdown');
                Route::post('/', [AdminDeviceModelController::class, 'store'])->middleware('permission:catalog.manage')->name('store');
                Route::put('/{id}', [AdminDeviceModelController::class, 'update'])->middleware('permission:catalog.manage')->name('update');
                Route::delete('/{id}', [AdminDeviceModelController::class, 'destroy'])->middleware('permission:catalog.manage')->name('destroy');
            });

            Route::prefix('settings')->name('settings.')->group(function () {
                Route::get('/', [AdminSettingController::class, 'index'])->middleware('permission:settings.view')->name('index');
                Route::post('/seed-defaults', [AdminSettingController::class, 'seedDefaults'])->middleware('permission:settings.manage')->name('seed-defaults');
                Route::post('/update-group/{group}', [AdminSettingController::class, 'updateGroup'])->middleware('permission:settings.manage')->name('update-group');
                Route::put('/{key}', [AdminSettingController::class, 'update'])->middleware('permission:settings.manage')->name('update');
                Route::post('/{key}/toggle-lock', [AdminSettingController::class, 'toggleLock'])->middleware('permission:settings.manage')->name('toggle-lock');
                Route::get('/history', [AdminSettingController::class, 'history'])->middleware('permission:settings.view')->name('history');
                Route::post('/rollback/{history}', [AdminSettingController::class, 'rollback'])->middleware('permission:settings.manage')->name('rollback');
                Route::get('/export', [AdminSettingController::class, 'export'])->middleware('permission:settings.view')->name('export');
                Route::post('/import', [AdminSettingController::class, 'import'])->middleware('permission:settings.manage')->name('import');
                Route::post('/test-smtp', [AdminSettingController::class, 'testSmtp'])->middleware('permission:settings.manage')->name('test-smtp');
                Route::post('/test-sms', [AdminSettingController::class, 'testSms'])->middleware('permission:settings.manage')->name('test-sms');
            });

            Route::prefix('reports')->middleware('permission:reports.view')->name('reports.')->group(function () {
                Route::get('/overview', [AdminReportController::class, 'overview'])->name('overview');
                Route::get('/dashboard', [AdminReportController::class, 'dashboard'])->name('dashboard');
                Route::get('/sales-chart', [AdminReportController::class, 'salesChart'])->name('sales-chart');
                Route::get('/top-products', [AdminReportController::class, 'topProducts'])->name('top-products');
                Route::get('/top-categories', [AdminReportController::class, 'topCategories'])->name('top-categories');
                Route::get('/order-status', [AdminReportController::class, 'orderStatus'])->name('order-status');
                Route::get('/top-sellers', [AdminReportController::class, 'topSellers'])->name('top-sellers');
            });

            Route::prefix('advanced-reports')->middleware(['throttle:admin-reports', 'permission:reports.view'])->name('advanced-reports.')->group(function () {
                Route::get('/users-analysis', [AdminAdvancedReportController::class, 'usersAnalysis'])->name('users-analysis');
                Route::get('/seller-performance', [AdminAdvancedReportController::class, 'sellerPerformance'])->name('seller-performance');
                Route::get('/period-comparison', [AdminAdvancedReportController::class, 'periodComparison'])->name('period-comparison');
                Route::get('/device-analytics', [AdminAdvancedReportController::class, 'deviceAnalytics'])->name('device-analytics');
                Route::get('/basket-analysis', [AdminAdvancedReportController::class, 'basketAnalysis'])->name('basket-analysis');
                Route::get('/search-analytics', [AdminAdvancedReportController::class, 'searchAnalytics'])->name('search-analytics');
                Route::get('/product-analytics', [AdminAdvancedReportController::class, 'productAnalytics'])->name('product-analytics');
                Route::get('/chat-analytics', [AdminAdvancedReportController::class, 'chatAnalytics'])->name('chat-analytics');
                Route::get('/predictions', [AdminAdvancedReportController::class, 'predictions'])->name('predictions');
                Route::get('/anomalies', [AdminAdvancedReportController::class, 'anomalies'])->name('anomalies');
            });

            Route::prefix('export')->middleware(['throttle:admin-reports', 'permission:reports.export'])->name('export.')->group(function () {
                Route::get('/orders/excel', [ReportExportController::class, 'exportOrdersExcel'])->name('orders.excel');
                Route::get('/orders/pdf', [ReportExportController::class, 'exportOrdersPdf'])->name('orders.pdf');
                Route::get('/users/excel', [ReportExportController::class, 'exportUsersExcel'])->name('users.excel');
                Route::get('/products/excel', [ReportExportController::class, 'exportProductsExcel'])->name('products.excel');
                Route::get('/chat/excel', [ReportExportController::class, 'exportChatExcel'])->name('chat.excel');
                Route::get('/reports/excel', [ReportExportController::class, 'exportReportsExcel'])->name('reports.excel');
                Route::get('/summary/pdf', [ReportExportController::class, 'exportSummaryPdf'])->name('summary.pdf');
                Route::get('/users/pdf', [ReportExportController::class, 'exportUsersPdf'])->name('users.pdf');
            });

            Route::prefix('users')->name('users.')->group(function () {
                Route::get('/', [AdminUserController::class, 'index'])->middleware('permission:users.view')->name('index');
                Route::get('/seller-requests', [AdminUserController::class, 'sellerRequests'])->middleware('permission:sellers.view')->name('seller-requests');
                Route::get('/{user}', [AdminUserController::class, 'show'])->middleware('permission:users.view')->name('show');
                Route::put('/{user}/role', [AdminUserController::class, 'updateRole'])->middleware('permission:users.role.manage')->name('update-role');
                Route::put('/{user}/status', [AdminUserController::class, 'updateStatus'])->middleware('permission:users.manage')->name('update-status');
                Route::post('/{user}/reject-seller', [AdminUserController::class, 'rejectSeller'])->middleware('permission:sellers.manage')->name('reject-seller');
                // ✅ approve-seller-request حذف شد (controller method متناظرش
                // هم حذف شد — رجوع به کامنت AdminUserController). reject-seller-request
                // هم حذف شد چون دقیقاً همان controller method مسیر reject
                // پایین‌تر را صدا می‌زد؛ فرانت‌اند فقط از reject استفاده می‌کرد.
                // ❌ approve-seller («تایید یک‌کلیکی») هم حذف شد — رجوع به
                // کامنت کامل در AdminUserRepository::rejectSeller().
                Route::post('/{id}/initial-approve', [AdminUserController::class, 'initialApproveRequest'])->middleware('permission:sellers.manage')->name('initial-approve');
                Route::post('/{id}/final-approve', [AdminUserController::class, 'finalApproveRequest'])->middleware('permission:sellers.manage')->name('final-approve');
                Route::post('/{id}/reject', [AdminUserController::class, 'rejectSellerRequest'])->middleware('permission:sellers.manage')->name('reject');

                // 💹 سیستم کمیسیون هوشمند — امتیاز عملکرد و override هر فروشنده
                // ✅ {user:id} صریح لازم است چون User::getRouteKeyName() برای
                // مسیرهای عمومی «slug» برمی‌گرداند — بدون این، implicit
                // binding سعی می‌کند کاربر را با slug پیدا کند (نه id) و برای
                // فروشنده‌ی بدون slug همیشه ۴۰۴ می‌داد.
                Route::get('/{user:id}/commission', [AdminCommissionController::class, 'sellerInfo'])->middleware('permission:commission.override.view')->name('commission.show');
                Route::put('/{user:id}/commission-override', [AdminCommissionController::class, 'setSellerOverride'])->middleware('permission:commission.override.manage')->name('commission.override');
            });

            // 🏬 Nearby Physical Stores — تایید/رد/فعال‌سازی فروشگاه‌های
            // فیزیکی ثبت‌شده توسط فروشندگان (Phase 16). یک فروشگاه تا
            // تاییدنشدن (verify) هرگز در جستجوی عمومی نمایش داده نمی‌شود.
            Route::prefix('stores')->name('stores.')->group(function () {
                Route::get('/', [AdminStoreController::class, 'index'])->middleware('permission:stores.view')->name('index');
                Route::post('/{id}/verify', [AdminStoreController::class, 'verify'])->middleware('permission:stores.manage')->name('verify');
                Route::post('/{id}/reject', [AdminStoreController::class, 'reject'])->middleware('permission:stores.manage')->name('reject');
                Route::post('/{id}/deactivate', [AdminStoreController::class, 'deactivate'])->middleware('permission:stores.manage')->name('deactivate');
                Route::post('/{id}/activate', [AdminStoreController::class, 'activate'])->middleware('permission:stores.manage')->name('activate');
            });

            // 🎁 Referral System — Phase 3 (Admin Module). MVP فقط
            // نمایش/ممیزی است — هیچ endpoint نوشتنی‌ای اینجا نیست (رجوع
            // به کامنت AdminReferralController).
            Route::prefix('referrals')->name('referrals.')->group(function () {
                Route::get('/', [AdminReferralController::class, 'index'])->middleware('permission:referrals.view')->name('index');
                Route::get('/{referral}', [AdminReferralController::class, 'show'])->middleware('permission:referrals.view')->name('show');
            });

            // 🎯 Referral Rule Engine (Part 4 audit) — قوانین پاداش سطحی
            // (milestone). permission:referrals.manage از قبل در taxonomy
            // موجود بود، دقیقاً برای همین «توسعه‌ی آینده» رزرو شده بود.
            Route::prefix('referral-rules')->name('referral-rules.')->group(function () {
                Route::get('/', [AdminReferralRuleController::class, 'index'])->middleware('permission:referrals.view')->name('index');
                Route::post('/', [AdminReferralRuleController::class, 'store'])->middleware('permission:referrals.manage')->name('store');
                Route::put('/{id}', [AdminReferralRuleController::class, 'update'])->middleware('permission:referrals.manage')->name('update');
                Route::delete('/{id}', [AdminReferralRuleController::class, 'destroy'])->middleware('permission:referrals.manage')->name('destroy');
                Route::post('/{id}/toggle', [AdminReferralRuleController::class, 'toggle'])->middleware('permission:referrals.manage')->name('toggle');
                Route::get('/triggers/history', [AdminReferralRuleController::class, 'triggerHistory'])->middleware('permission:referrals.view')->name('triggers.history');
            });

            // 👑 مدیریت Administrative Access (Super Admin/Admin/Manager + Permission)
            // — لایه‌ی جدید و مستقل از users.role؛ رجوع به AdminAccessService
            // برای hierarchy/delegation/self-modification.
            Route::prefix('access')->name('access.')->group(function () {
                Route::get('/users', [AdminAccessController::class, 'users'])->middleware('permission:admin.access.view')->name('users.index');
                Route::get('/users/{id}', [AdminAccessController::class, 'show'])->middleware('permission:admin.access.view')->name('users.show');
                Route::get('/roles', [AdminAccessController::class, 'roles'])->middleware('permission:admin.access.view')->name('roles');
                Route::get('/permissions', [AdminAccessController::class, 'permissions'])->middleware('permission:admin.access.view')->name('permissions');
                Route::put('/users/{id}/role', [AdminAccessController::class, 'updateRole'])->middleware('permission:admin.access.manage')->name('users.role');
                Route::put('/users/{id}/permissions', [AdminAccessController::class, 'updatePermissions'])->middleware('permission:admin.access.manage')->name('users.permissions');
            });

            // 💹 قوانین کمیسیون (بازه‌ی امتیاز → سطح → نرخ) — سراسری، نه مخصوص یک فروشنده
            Route::prefix('commission-rules')->name('commission-rules.')->group(function () {
                Route::get('/', [AdminCommissionController::class, 'rules'])->middleware('permission:commission.view')->name('index');
                Route::post('/', [AdminCommissionController::class, 'storeRule'])->middleware('permission:commission.rules.manage')->name('store');
                Route::put('/{id}', [AdminCommissionController::class, 'updateRule'])->middleware('permission:commission.rules.manage')->name('update');
                Route::delete('/{id}', [AdminCommissionController::class, 'destroyRule'])->middleware('permission:commission.rules.manage')->name('destroy');
            });

            Route::prefix('categories')->name('categories.')->group(function () {
                Route::get('/', [AdminCategoryController::class, 'index'])->middleware('permission:catalog.view')->name('index');
                Route::get('/tree', [AdminCategoryController::class, 'tree'])->middleware('permission:catalog.view')->name('tree');
                Route::post('/', [AdminCategoryController::class, 'store'])->middleware('permission:catalog.manage')->name('store');
                // /reorder باید قبل از /{category} بیاید؛ در غیر این صورت PUT
                // روی آن با «reorder» به‌عنوان شناسه به update() می‌رسد و
                // implicit binding با ۴۰۴ ردش می‌کند.
                Route::put('/reorder', [AdminCategoryController::class, 'reorder'])->middleware('permission:catalog.manage')->name('reorder');
                Route::get('/{category}', [AdminCategoryController::class, 'show'])->middleware('permission:catalog.view')->name('show');
                Route::put('/{category}', [AdminCategoryController::class, 'update'])->middleware('permission:catalog.manage')->name('update');
                Route::delete('/{category}', [AdminCategoryController::class, 'destroy'])->middleware('permission:catalog.manage')->name('destroy');
                Route::post('/bulk-action', [AdminCategoryController::class, 'bulkAction'])->middleware('permission:catalog.manage')->name('bulk-action');
            });

            Route::prefix('brands')->name('brands.')->group(function () {
                Route::get('/', [AdminBrandController::class, 'index'])->middleware('permission:catalog.view')->name('index');
                Route::post('/', [AdminBrandController::class, 'store'])->middleware('permission:catalog.manage')->name('store');
                Route::get('/{id}', [AdminBrandController::class, 'show'])->middleware('permission:catalog.view')->name('show');          // ✅ تغییر به {id}
                Route::put('/{id}', [AdminBrandController::class, 'update'])->middleware('permission:catalog.manage')->name('update');      // ✅ تغییر به {id}
                Route::delete('/{id}', [AdminBrandController::class, 'destroy'])->middleware('permission:catalog.manage')->name('destroy'); // ✅ تغییر به {id}
                Route::post('/{id}/verify', [AdminBrandController::class, 'verify'])->middleware('permission:catalog.manage')->name('verify');       // ✅ تغییر به {id}
                Route::post('/{id}/unverify', [AdminBrandController::class, 'unverify'])->middleware('permission:catalog.manage')->name('unverify'); // ✅ تغییر به {id}
                Route::post('/bulk-action', [AdminBrandController::class, 'bulkAction'])->middleware('permission:catalog.manage')->name('bulk-action');
            });
            // ============================================================
            // مدیریت تبلیغات (Admin Ads)
            // ============================================================
            Route::prefix('ads')->name('ads.')->group(function () {
                Route::get('/', [AdminAdController::class, 'index'])->middleware('permission:ads.view')->name('index');
                Route::post('/', [AdminAdController::class, 'store'])->middleware('permission:ads.manage')->name('store');
                Route::get('/{ad}', [AdminAdController::class, 'show'])->middleware('permission:ads.view')->name('show');
                Route::put('/{ad}', [AdminAdController::class, 'update'])->middleware('permission:ads.manage')->name('update');
                Route::delete('/{ad}', [AdminAdController::class, 'destroy'])->middleware('permission:ads.manage')->name('destroy');
                Route::post('/{ad}/toggle', [AdminAdController::class, 'toggle'])->middleware('permission:ads.manage')->name('toggle');
            });

            // ============================================================
            // مدیریت مجله ازکالا (Admin Magazine)
            // ============================================================
            Route::prefix('magazine')->name('magazine.')->group(function () {
                Route::get('/stats', [AdminMagazineController::class, 'stats'])->middleware('permission:content.view')->name('stats');
                Route::post('/bulk-action', [AdminMagazineController::class, 'bulkAction'])->middleware('permission:content.manage')->name('bulk-action');

                Route::get('/', [AdminMagazineController::class, 'index'])->middleware('permission:content.view')->name('index');
                Route::post('/', [AdminMagazineController::class, 'store'])->middleware('permission:content.manage')->name('store');
                Route::get('/{article}', [AdminMagazineController::class, 'show'])->middleware('permission:content.view')->name('show');
                Route::put('/{article}', [AdminMagazineController::class, 'update'])->middleware('permission:content.manage')->name('update');
                Route::delete('/{article}', [AdminMagazineController::class, 'destroy'])->middleware('permission:content.manage')->name('destroy');
                Route::post('/{article}/toggle', [AdminMagazineController::class, 'toggle'])->middleware('permission:content.manage')->name('toggle');

                // ✨ AI Routes
                Route::prefix('ai')->middleware('permission:content.manage')->name('ai.')->group(function () {
                    Route::post('/generate', [AdminAiArticleController::class, 'generate'])->name('generate');
                    Route::post('/rewrite', [AdminAiArticleController::class, 'rewrite'])->name('rewrite');
                    Route::post('/suggest-title', [AdminAiArticleController::class, 'suggestTitle'])->name('suggest-title');
                });
            });

            Route::prefix('products')->name('products.')->group(function () {
                Route::get('/', [AdminProductController::class, 'index'])->middleware('permission:products.view')->name('index');
                // باید قبل از /{product} ثبت شود؛ در routes/api_v1.php بعد از آن
                // تعریف شده بود و در عمل هرگز match نمی‌شد (implicit binding روی
                // «templates» محصولی پیدا نمی‌کرد و ۴۰۴ می‌داد).
                Route::get('/templates', [ProductController::class, 'getTemplates'])->middleware('permission:products.view')->name('templates');
                // stats() آمارِ یک محصول را برمی‌گرداند (getProductStats($id) صدا
                // می‌زند) ولی به /stats بدون پارامتر وصل بود، و /{product}/stats به
                // متدِ ناموجودِ productStats اشاره می‌کرد. فرانت‌اند هم همین دومی را
                // صدا می‌زند. جای درستش اینجاست؛ روت بی‌پارامتر حذف شد.
                Route::get('/{product}/stats', [AdminProductController::class, 'stats'])->middleware('permission:products.view')->name('product-stats');
                Route::put('/{product}/quick-update', [AdminProductController::class, 'quickUpdate'])->middleware('permission:products.manage')->name('quick-update');
                Route::delete('/{product}', [AdminProductController::class, 'destroy'])->middleware('permission:products.manage')->name('destroy');
                Route::post('/bulk-action', [AdminProductController::class, 'bulkAction'])->middleware('permission:products.manage')->name('bulk-action');

                // ✅ Product Relationship Phase 2: مدیریت «مکمل» توسط ادمین — بدون
                // محدودیت مالکیت (Hybrid ownership).
                Route::get('/{product}/relationships', [AdminProductController::class, 'relationships'])->middleware('permission:products.view')->name('relationships.index');
                Route::post('/{product}/relationships', [AdminProductController::class, 'storeRelationship'])->middleware('permission:products.manage')->name('relationships.store');
                Route::delete('/{product}/relationships/{relationship}', [AdminProductController::class, 'destroyRelationship'])->middleware('permission:products.manage')->name('relationships.destroy');
            });

            Route::prefix('orders')->name('orders.')->group(function () {
                Route::get('/', [AdminOrderController::class, 'index'])->middleware('permission:orders.view')->name('index');
                Route::get('/stats', [AdminOrderController::class, 'stats'])->middleware('permission:orders.view')->name('stats');
                Route::get('/{order}', [AdminOrderController::class, 'show'])->middleware('permission:orders.view')->name('show');
                // ✅ finance.payout اینجا در middleware عمداً نیامده — چون این
                // route یک endpoint واحد برای *همه‌ی* انتقال‌های وضعیت است
                // (pending/processing/shipped/cancelled/returned هم همین‌جا)،
                // نه فقط delivered/completed. الزام اضافی finance.payout فقط
                // برای انتقال به delivered/completed (که واقعاً Payout مالی
                // trigger می‌کند) داخل AdminOrderService::updateStatus به شکل
                // Service-level enforcement چک می‌شود — دقیقاً طبق دستور «امنیت
                // را فقط به Middleware محدود نکن».
                Route::put('/{order}/status', [AdminOrderController::class, 'updateStatus'])->middleware('permission:orders.manage')->name('update-status');
                Route::put('/{order}/payment-status', [AdminOrderController::class, 'updatePaymentStatus'])->middleware('permission:orders.payment.manage')->name('update-payment-status');
                // POST /{order}/refund حذف شد: AdminOrderController::refund وجود
                // نداشت، هیچ‌جای فرانت‌اند صدایش نمی‌زد، و معنای بازپرداخت (کامل یا
                // جزئی، اتصال به درگاه، برگشت موجودی) تصمیم محصولی است نه حدسِ ما.
                // تا وقتی رفتارش مشخص شود، یک روتِ ۵۰۰دهنده بدتر از نبودنش است.
            });

            Route::prefix('reviews')->name('reviews.')->group(function () {
                Route::get('/', [AdminReviewController::class, 'index'])->middleware('permission:reviews.view')->name('index');
                Route::put('/{review}/status', [AdminReviewController::class, 'updateStatus'])->middleware('permission:reviews.manage')->name('update-status');
                Route::post('/{review}/reply', [AdminReviewController::class, 'reply'])->middleware('permission:reviews.manage')->name('reply');
                Route::delete('/{review}', [AdminReviewController::class, 'destroy'])->middleware('permission:reviews.manage')->name('destroy');
                Route::post('/bulk-action', [AdminReviewController::class, 'bulkAction'])->middleware('permission:reviews.manage')->name('bulk-action');
            });

            Route::prefix('coupons')->name('coupons.')->group(function () {
                Route::get('/', [CouponController::class, 'index'])->middleware('permission:coupons.view')->name('index');
                Route::post('/', [CouponController::class, 'store'])->middleware('permission:coupons.manage')->name('store');
                Route::get('/{coupon}', [CouponController::class, 'show'])->middleware('permission:coupons.view')->name('show');
                Route::put('/{coupon}', [CouponController::class, 'update'])->middleware('permission:coupons.manage')->name('update');
                Route::delete('/{coupon}', [CouponController::class, 'destroy'])->middleware('permission:coupons.manage')->name('destroy');
            });

            Route::prefix('chat-management')->name('chat-management.')->group(function () {
                Route::prefix('reports')->name('reports.')->group(function () {
                    Route::get('/', [AdminChatReportController::class, 'index'])->middleware('permission:support.view')->name('index');
                    Route::get('/stats', [AdminChatReportController::class, 'stats'])->middleware('permission:support.view')->name('stats');
                    Route::get('/{report}', [AdminChatReportController::class, 'show'])->middleware('permission:support.view')->name('show');
                    Route::put('/{report}', [AdminChatReportController::class, 'update'])->middleware('permission:support.manage')->name('update');
                    Route::post('/{report}/action', [AdminChatReportController::class, 'action'])->middleware('permission:support.manage')->name('action');
                });

                Route::prefix('monitor')->name('monitor.')->group(function () {
                    Route::get('/', [ChatMonitorController::class, 'index'])->middleware('permission:support.view')->name('index');
                    Route::get('/stats', [ChatMonitorController::class, 'stats'])->middleware('permission:support.view')->name('stats');
                    Route::get('/{chat}', [ChatMonitorController::class, 'show'])->middleware('permission:support.view')->name('show');
                    Route::post('/{chat}/intervene', [ChatMonitorController::class, 'intervene'])->middleware('permission:support.manage')->name('intervene');
                    Route::post('/{chat}/close', [ChatMonitorController::class, 'close'])->middleware('permission:support.manage')->name('close');
                });

                Route::prefix('sentiment')->middleware('permission:support.view')->name('sentiment.')->group(function () {
                    Route::get('/dashboard', [SentimentDashboardController::class, 'dashboard'])->name('dashboard');
                    Route::get('/top-sellers', [SentimentDashboardController::class, 'topSellers'])->name('top-sellers');
                    Route::get('/alerts', [SentimentDashboardController::class, 'alerts'])->name('alerts');
                });

                Route::prefix('blocks')->name('blocks.')->group(function () {
                    Route::get('/', [BlockManagementController::class, 'index'])->middleware('permission:support.view')->name('index');
                    Route::get('/stats', [BlockManagementController::class, 'stats'])->middleware('permission:support.view')->name('stats');
                    Route::post('/block', [BlockManagementController::class, 'blockByAdmin'])->middleware('permission:support.manage')->name('block');
                    Route::delete('/{block}', [BlockManagementController::class, 'unblock'])->middleware('permission:support.manage')->name('unblock');
                    Route::delete('/user/{user}/all', [BlockManagementController::class, 'unblockAll'])->middleware('permission:support.manage')->name('unblock-all');
                });

                Route::prefix('faq')->name('faq.')->group(function () {
                    Route::get('/', [FaqManagementController::class, 'index'])->middleware('permission:support.view')->name('index');
                    Route::get('/stats', [FaqManagementController::class, 'stats'])->middleware('permission:support.view')->name('stats');
                    Route::post('/system', [FaqManagementController::class, 'storeSystem'])->middleware('permission:support.manage')->name('store-system');
                    Route::put('/{faq}', [FaqManagementController::class, 'update'])->middleware('permission:support.manage')->name('update');
                    Route::delete('/{faq}', [FaqManagementController::class, 'destroy'])->middleware('permission:support.manage')->name('destroy');
                    Route::post('/{faq}/toggle', [FaqManagementController::class, 'toggle'])->middleware('permission:support.manage')->name('toggle');
                });

                Route::prefix('suggestions')->name('suggestions.')->group(function () {
                    Route::get('/', [SuggestionManagementController::class, 'index'])->middleware('permission:support.view')->name('index');
                    Route::get('/stats', [SuggestionManagementController::class, 'stats'])->middleware('permission:support.view')->name('stats');
                    Route::get('/top-performers', [SuggestionManagementController::class, 'topPerformers'])->middleware('permission:support.view')->name('top-performers');
                    Route::get('/top-sellers', [SuggestionManagementController::class, 'topSellers'])->middleware('permission:support.view')->name('top-sellers');
                    Route::get('/settings', [SuggestionManagementController::class, 'getSettings'])->middleware('permission:support.view')->name('settings');
                    Route::put('/settings', [SuggestionManagementController::class, 'updateSettings'])->middleware('permission:support.manage')->name('update-settings');
                });

                Route::prefix('message-templates')->name('message-templates.')->group(function () {
                    Route::get('/', [MessageTemplateController::class, 'index'])->middleware('permission:support.view')->name('index');
                    Route::post('/', [MessageTemplateController::class, 'store'])->middleware('permission:support.manage')->name('store');
                    Route::post('/seed-defaults', [MessageTemplateController::class, 'seedDefaults'])->middleware('permission:support.manage')->name('seed-defaults');
                    Route::put('/{template}', [MessageTemplateController::class, 'update'])->middleware('permission:support.manage')->name('update');
                    Route::delete('/{template}', [MessageTemplateController::class, 'destroy'])->middleware('permission:support.manage')->name('destroy');
                    Route::post('/{template}/toggle', [MessageTemplateController::class, 'toggle'])->middleware('permission:support.manage')->name('toggle');
                    Route::post('/{template}/track', [MessageTemplateController::class, 'trackUsage'])->middleware('permission:support.manage')->name('track');
                });

                Route::prefix('tickets')->name('tickets.')->group(function () {
                    Route::get('/', [SupportTicketController::class, 'index'])->middleware('permission:support.view')->name('index');
                    Route::get('/stats', [SupportTicketController::class, 'stats'])->middleware('permission:support.view')->name('stats');
                    Route::get('/support-staff', [SupportTicketController::class, 'getSupportStaff'])->middleware('permission:support.view')->name('support-staff');
                    Route::post('/', [SupportTicketController::class, 'store'])->middleware('permission:support.manage')->name('store');
                    Route::post('/convert/{conversation}', [SupportTicketController::class, 'convertFromConversation'])->middleware('permission:support.manage')->name('convert');
                    Route::get('/{ticket}', [SupportTicketController::class, 'show'])->middleware('permission:support.view')->name('show');
                    Route::put('/{ticket}', [SupportTicketController::class, 'update'])->middleware('permission:support.manage')->name('update');
                    Route::post('/{ticket}/assign', [SupportTicketController::class, 'assign'])->middleware('permission:support.manage')->name('assign');
                    Route::post('/{ticket}/escalate', [SupportTicketController::class, 'escalate'])->middleware('permission:support.manage')->name('escalate');
                    Route::post('/{ticket}/message', [SupportTicketController::class, 'sendMessage'])->middleware('permission:support.manage')->name('send-message');
                });
            });

            // ✅ ارسال Push Notification یک قابلیت ارتباطی broadcast (به همه‌ی
            // کاربران) است — نزدیک‌ترین module موجود support است؛ ساخت یک
            // Permission تک‌مصرفی جداگانه («notifications.manage») فقط برای
            // همین ۴ route، طبق دستور «از ساخت Permission بی‌دلیل خودداری کن»
            // توجیه نداشت.
            Route::prefix('push')->middleware('permission:support.manage')->name('push.')->group(function () {
                Route::post('/subscribe', [PushSubscriptionController::class, 'store'])->name('subscribe');
                Route::delete('/unsubscribe/{subscription}', [PushSubscriptionController::class, 'destroy'])->name('unsubscribe');
                Route::post('/test', [PushSubscriptionController::class, 'sendTest'])->name('test');
                Route::get('/vapid-public-key', [PushSubscriptionController::class, 'getVapidPublicKey'])->name('vapid-public-key');
            });

        }); // پایان گروه admin
        // Newsletter (protected)
Route::middleware('auth:sanctum')->prefix('newsletter')->group(function () {
    Route::get('/status', [NewsletterController::class, 'status']);
    Route::post('/subscribe', [NewsletterController::class, 'subscribe']);
    Route::post('/unsubscribe', [NewsletterController::class, 'unsubscribe']);
});

    }); // ✅ پایان گروه auth:sanctum (فقط یک بار و در جای درست بسته شده است)

}); // ✅ پایان گروه نسخه‌بندی v1
