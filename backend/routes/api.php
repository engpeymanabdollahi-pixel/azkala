<?php

use Illuminate\Support\Facades\Route;

// عمومی
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SellerRequestController;
use App\Http\Controllers\Api\AdController;


// کاربر
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PushSubscriptionController;
use App\Http\Controllers\Api\UserDeviceController;
use App\Http\Controllers\Api\UserTicketController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\ProductAlertController;
use App\Http\Controllers\Api\MagazineController;
use App\Http\Controllers\Api\AdminMagazineController;
use App\Http\Controllers\Api\DevController;

// چت
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ChatFaqController;
use App\Http\Controllers\Api\ChatModerationController;

// فروشنده
use App\Http\Controllers\Api\SellerDashboardController;
use App\Http\Controllers\Api\SellerOrderController;
use App\Http\Controllers\Api\SellerProductController;
use App\Http\Controllers\Api\SellerQuickReplyController;
use App\Http\Controllers\Api\SellerRatingController;

// ادمین
use App\Http\Controllers\Api\AdminBrandController;
use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AdminAdvancedReportController;
use App\Http\Controllers\Api\AdminReviewController;
use App\Http\Controllers\Api\AdminSettingController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminDeviceBrandController;
use App\Http\Controllers\Api\AdminDeviceSeriesController;
use App\Http\Controllers\Api\AdminDeviceModelController;



// ادمین (ویژه)
use App\Http\Controllers\Admin\BlockManagementController;
use App\Http\Controllers\Admin\ChatMonitorController;
use App\Http\Controllers\Admin\FaqManagementController;
use App\Http\Controllers\Admin\MessageTemplateController;
use App\Http\Controllers\Admin\ReportController as AdminChatReportController;
use App\Http\Controllers\Admin\ReportExportController;
use App\Http\Controllers\Admin\SentimentDashboardController;
use App\Http\Controllers\Admin\SupportTicketController;
use App\Http\Controllers\Admin\SuggestionManagementController;

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

    Route::get('/devices/hierarchy', [App\Http\Controllers\Api\DeviceController::class, 'getHierarchy'])->name('devices.hierarchy');

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
        Route::get('/top', [\App\Http\Controllers\Api\PublicSellerController::class, 'top'])->name('top');
        Route::get('/{slug}', [\App\Http\Controllers\Api\PublicSellerController::class, 'show'])->name('show');
        Route::get('/{slug}/products', [\App\Http\Controllers\Api\PublicSellerController::class, 'products'])->name('products');
        // ✅ اضافه شد — تب «نظرات» صفحه‌ی عمومی فروشگاه قبلاً کاملاً placeholder
        // بود؛ seller_ratings واقعی وجود دارد ولی هیچ روتی آن را expose نمی‌کرد.
        Route::get('/{slug}/reviews', [\App\Http\Controllers\Api\PublicSellerController::class, 'reviews'])->name('reviews');
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
        Route::get('/templates', [ProductController::class, 'getTemplates'])->name('templates');
        // نیازمند ورود است، ولی باید همین‌جا — قبل از /{product} — ثبت شود.
        // قبلاً پایین‌تر داخل گروه auth:sanctum بود، یعنی بعد از wildcard، پس
        // «my-products» به‌عنوان شناسه‌ی محصول تفسیر می‌شد و ۴۰۴ می‌گرفت.
        Route::get('/my-products', [ProductController::class, 'myProducts'])
            ->middleware('auth:sanctum')
            ->name('my-products');
        Route::get('/{product}', [ProductController::class, 'show'])->name('show');
    });
       
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

    Route::get('/site-settings', function () {
        try {
            $keys = [
                'site_name', 'site_logo', 'site_favicon',
                'support_phone', 'support_email', 'address', 'working_hours',
                'instagram_url', 'telegram_url', 'twitter_url', 'about_text',
                // ✅ کد اینماد/ساماندهی — فوتر فقط وقتی این‌ها واقعاً تنظیم
                // شده باشند نماد اعتماد نمایش می‌دهد (نه یک نماد ثابت و
                // بدون‌کد که ادعای غیرقابل‌استعلام محسوب می‌شود).
                'enamad_code', 'samandehi_code',
            ];
            
            $settings = \App\Models\Setting::whereIn('key', $keys)->get();
            
            $result = [];
            foreach ($settings as $setting) {
                if (in_array($setting->key, ['site_logo', 'site_favicon']) && $setting->value) {
                    // ✅ اصلاح حیاتی: فقط اسلش‌های ابتدایی را حذف می‌کنیم، نه کاراکترهای خاص
                    $cleanPath = ltrim($setting->value, '/');
                    
                    // ساخت آدرس کامل و صحیح
                    $result[$setting->key] = asset('storage/' . $cleanPath);
                } else {
                    $result[$setting->key] = $setting->value;
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Site Settings Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'data' => []], 500);
        }
    });
    
    // ============================================================
    // ۲. مسیرهای محافظت‌شده (Auth)
    // ============================================================
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/upload/images', [App\Http\Controllers\Api\ImageUploadController::class, 'upload'])->name('upload.images');
        
        // درخواست‌های فروشندگی
        // این تنها تعریف هر کدام از این مسیرهاست؛ قبلاً بخشی از آن‌ها در
        // routes/api_v1.php هم تکرار شده بود و چون هر دو فایل mount می‌شدند،
        // آخرین تعریف برنده می‌شد و معلوم نبود کدام کنترلر واقعاً اجرا می‌شود.
        Route::get('/user/seller-request-status', [\App\Http\Controllers\Api\SellerRequestController::class, 'getStatus']);
        Route::post('/seller-requests', [\App\Http\Controllers\Api\SellerRequestController::class, 'store'])->name('seller-requests.store');
        Route::post('/seller-requests/{sellerRequest}/upload-documents', [\App\Http\Controllers\Api\SellerRequestController::class, 'uploadDocuments'])->name('seller-requests.upload-documents');
        // ✅ PUT .../complete حذف شد — controller method متناظرش (SellerRequestController::complete)
        // کد مرده و هیچ‌وقت از فرانت‌اند صدا زده نمی‌شد (رجوع به کامنت آن‌جا).

        // امتیاز و نظر به فروشنده
        Route::post('/seller-ratings', [SellerRatingController::class, 'store']);
        Route::get('/seller-ratings/seller/{sellerId}', [SellerRatingController::class, 'index']);
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
                Route::delete('/{deviceId}', [UserDeviceController::class, 'destroy'])->name('destroy');
            });

            // نوتیفیکیشن‌ها
            Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index'])->name('notifications.index');
            Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead'])->name('notifications.read');
            Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

            // لیست فروشندگان دنبال‌شده
            Route::get('/followed-sellers', [\App\Http\Controllers\Api\PublicSellerController::class, 'followedSellers'])->name('followed-sellers');
        });

        // روت‌های RESTful دنبال کردن فروشندگان
        Route::prefix('sellers')->group(function () {
            Route::post('/{id}/follow', [\App\Http\Controllers\Api\PublicSellerController::class, 'follow'])->name('sellers.follow');
            Route::delete('/{id}/follow', [\App\Http\Controllers\Api\PublicSellerController::class, 'unfollow'])->name('sellers.unfollow');
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
        Route::prefix('seller')->middleware('throttle:seller')->name('seller.')->group(function () {
            Route::get('/dashboard/stats', [SellerDashboardController::class, 'stats'])->name('dashboard.stats');
            Route::get('/wallet', [SellerDashboardController::class, 'wallet'])->name('wallet');
            
                        // ============================================================
            // مدیریت تبلیغات (Admin Ads)
            // ============================================================
            Route::prefix('ads')->name('ads.')->group(function () {
                Route::get('/', [\App\Http\Controllers\Admin\AdminAdController::class, 'index'])->name('index');
                Route::post('/', [\App\Http\Controllers\Admin\AdminAdController::class, 'store'])->name('store');
                Route::get('/{ad}', [\App\Http\Controllers\Admin\AdminAdController::class, 'show'])->name('show');
                Route::put('/{ad}', [\App\Http\Controllers\Admin\AdminAdController::class, 'update'])->name('update');
                Route::delete('/{ad}', [\App\Http\Controllers\Admin\AdminAdController::class, 'destroy'])->name('destroy');
                Route::post('/{ad}/toggle', [\App\Http\Controllers\Admin\AdminAdController::class, 'toggle'])->name('toggle');
            });
            Route::prefix('products')->name('products.')->group(function () {
                Route::get('/', [SellerProductController::class, 'index'])->name('index');
                Route::post('/', [SellerProductController::class, 'store'])->name('store');
                Route::get('/templates', [\App\Http\Controllers\Api\ProductController::class, 'getTemplates'])->name('templates');
                Route::post('/copy-template/{templateId}', [SellerProductController::class, 'copyFromTemplate'])->name('copy-template');
                Route::get('/{id}/history', [SellerProductController::class, 'getHistory'])->name('history');
                Route::get('/{product}', [SellerProductController::class, 'show'])->name('show');
                Route::put('/{product}', [SellerProductController::class, 'update'])->name('update');
                Route::delete('/{product}', [SellerProductController::class, 'destroy'])->name('destroy');
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
            Route::post('/settings', [\App\Http\Controllers\Api\SellerSettingsController::class, 'update'])->name('settings.update');
            
        }); // ✅ پایان گروه seller (همه چیز حالا درست داخل این گروه است)

        // 👨‍💼 ادمین (داخل گروه auth)
        Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () {
            
            Route::prefix('dashboard')->name('dashboard.')->group(function () {
                Route::get('/stats', [AdminDashboardController::class, 'stats'])->name('stats');
                Route::get('/chat-stats', [AdminDashboardController::class, 'chatStats'])->name('chat-stats');
                Route::get('/sentiment-stats', [AdminDashboardController::class, 'sentimentStats'])->name('sentiment-stats');
                Route::get('/recent-chat-activity', [AdminDashboardController::class, 'recentChatActivity'])->name('recent-chat-activity');
            });
            // ۲. این بلوک روت را در کنار سایر روت‌های ادمین اضافه کنید:
            // نکته: پیشوندِ نام (device-brands. / device-series. / device-models.)
            // الزامی است؛ بدون آن هر سه گروه نام‌های یکسانِ admin.index/store/update/
            // destroy می‌گیرند و آخرین ثبت، قبلی‌ها را از جدولِ نام‌ها بیرون می‌کند.
Route::prefix('device-brands')->name('device-brands.')->group(function () {
    Route::get('/', [AdminDeviceBrandController::class, 'index'])->name('index');
    Route::post('/', [AdminDeviceBrandController::class, 'store'])->name('store');
    Route::put('/{id}', [AdminDeviceBrandController::class, 'update'])->name('update');
    Route::delete('/{id}', [AdminDeviceBrandController::class, 'destroy'])->name('destroy');
});
Route::prefix('device-series')->name('device-series.')->group(function () {
    Route::get('/', [AdminDeviceSeriesController::class, 'index'])->name('index');
    Route::get('/brands-dropdown', [AdminDeviceSeriesController::class, 'getBrandsForDropdown'])->name('brands.dropdown'); // برای دراپ‌داون
    Route::post('/', [AdminDeviceSeriesController::class, 'store'])->name('store');
    Route::put('/{id}', [AdminDeviceSeriesController::class, 'update'])->name('update');
    Route::delete('/{id}', [AdminDeviceSeriesController::class, 'destroy'])->name('destroy');
});
Route::prefix('device-models')->name('device-models.')->group(function () {
    Route::get('/', [AdminDeviceModelController::class, 'index'])->name('index');
    Route::get('/series-dropdown', [AdminDeviceModelController::class, 'getSeriesForDropdown'])->name('series.dropdown');
    Route::post('/', [AdminDeviceModelController::class, 'store'])->name('store');
    Route::put('/{id}', [AdminDeviceModelController::class, 'update'])->name('update');
    Route::delete('/{id}', [AdminDeviceModelController::class, 'destroy'])->name('destroy');
});
            
            Route::prefix('settings')->name('settings.')->group(function () {
                Route::get('/', [AdminSettingController::class, 'index'])->name('index');
                Route::post('/seed-defaults', [AdminSettingController::class, 'seedDefaults'])->name('seed-defaults');
                Route::post('/update-group/{group}', [AdminSettingController::class, 'updateGroup'])->name('update-group');
                Route::put('/{key}', [AdminSettingController::class, 'update'])->name('update');
                Route::post('/{key}/toggle-lock', [AdminSettingController::class, 'toggleLock'])->name('toggle-lock');
                Route::get('/history', [AdminSettingController::class, 'history'])->name('history');
                Route::post('/rollback/{history}', [AdminSettingController::class, 'rollback'])->name('rollback');
                Route::get('/export', [AdminSettingController::class, 'export'])->name('export');
                Route::post('/import', [AdminSettingController::class, 'import'])->name('import');
                Route::post('/test-smtp', [AdminSettingController::class, 'testSmtp'])->name('test-smtp');
                Route::post('/test-sms', [AdminSettingController::class, 'testSms'])->name('test-sms');
            });

            Route::prefix('reports')->name('reports.')->group(function () {
                Route::get('/overview', [AdminReportController::class, 'overview'])->name('overview');
                Route::get('/dashboard', [AdminReportController::class, 'dashboard'])->name('dashboard');
                Route::get('/sales-chart', [AdminReportController::class, 'salesChart'])->name('sales-chart');
                Route::get('/top-products', [AdminReportController::class, 'topProducts'])->name('top-products');
                Route::get('/top-categories', [AdminReportController::class, 'topCategories'])->name('top-categories');
                Route::get('/order-status', [AdminReportController::class, 'orderStatus'])->name('order-status');
                Route::get('/top-sellers', [AdminReportController::class, 'topSellers'])->name('top-sellers');
            });

            Route::prefix('advanced-reports')->middleware('throttle:admin-reports')->name('advanced-reports.')->group(function () {
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

            Route::prefix('export')->middleware('throttle:admin-reports')->name('export.')->group(function () {
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
                Route::get('/', [AdminUserController::class, 'index'])->name('index');
                Route::get('/seller-requests', [AdminUserController::class, 'sellerRequests'])->name('seller-requests');
                Route::get('/{user}', [AdminUserController::class, 'show'])->name('show');
                Route::put('/{user}/role', [AdminUserController::class, 'updateRole'])->name('update-role');
                Route::put('/{user}/status', [AdminUserController::class, 'updateStatus'])->name('update-status');
                Route::post('/{user}/reject-seller', [AdminUserController::class, 'rejectSeller'])->name('reject-seller');
                // ✅ approve-seller-request حذف شد (controller method متناظرش
                // هم حذف شد — رجوع به کامنت AdminUserController). reject-seller-request
                // هم حذف شد چون دقیقاً همان controller method مسیر reject
                // پایین‌تر را صدا می‌زد؛ فرانت‌اند فقط از reject استفاده می‌کرد.
                // ❌ approve-seller («تایید یک‌کلیکی») هم حذف شد — رجوع به
                // کامنت کامل در AdminUserRepository::rejectSeller().
                Route::post('/{id}/initial-approve', [AdminUserController::class, 'initialApproveRequest'])->name('initial-approve');
                Route::post('/{id}/final-approve', [AdminUserController::class, 'finalApproveRequest'])->name('final-approve');
                Route::post('/{id}/reject', [AdminUserController::class, 'rejectSellerRequest'])->name('reject');
            });

            Route::prefix('categories')->name('categories.')->group(function () {
                Route::get('/', [AdminCategoryController::class, 'index'])->name('index');
                Route::get('/tree', [AdminCategoryController::class, 'tree'])->name('tree');
                Route::post('/', [AdminCategoryController::class, 'store'])->name('store');
                // /reorder باید قبل از /{category} بیاید؛ در غیر این صورت PUT
                // روی آن با «reorder» به‌عنوان شناسه به update() می‌رسد و
                // implicit binding با ۴۰۴ ردش می‌کند.
                Route::put('/reorder', [AdminCategoryController::class, 'reorder'])->name('reorder');
                Route::get('/{category}', [AdminCategoryController::class, 'show'])->name('show');
                Route::put('/{category}', [AdminCategoryController::class, 'update'])->name('update');
                Route::delete('/{category}', [AdminCategoryController::class, 'destroy'])->name('destroy');
                Route::post('/bulk-action', [AdminCategoryController::class, 'bulkAction'])->name('bulk-action');
            });

                       Route::prefix('brands')->name('brands.')->group(function () {
                Route::get('/', [AdminBrandController::class, 'index'])->name('index');
                Route::post('/', [AdminBrandController::class, 'store'])->name('store');
                Route::get('/{id}', [AdminBrandController::class, 'show'])->name('show');          // ✅ تغییر به {id}
                Route::put('/{id}', [AdminBrandController::class, 'update'])->name('update');      // ✅ تغییر به {id}
                Route::delete('/{id}', [AdminBrandController::class, 'destroy'])->name('destroy'); // ✅ تغییر به {id}
                Route::post('/{id}/verify', [AdminBrandController::class, 'verify'])->name('verify');       // ✅ تغییر به {id}
                Route::post('/{id}/unverify', [AdminBrandController::class, 'unverify'])->name('unverify'); // ✅ تغییر به {id}
                Route::post('/bulk-action', [AdminBrandController::class, 'bulkAction'])->name('bulk-action');
            });
                        // ============================================================
            // مدیریت تبلیغات (Admin Ads)
            // ============================================================
            Route::prefix('ads')->name('ads.')->group(function () {
                Route::get('/', [\App\Http\Controllers\Admin\AdminAdController::class, 'index'])->name('index');
                Route::post('/', [\App\Http\Controllers\Admin\AdminAdController::class, 'store'])->name('store');
                Route::get('/{ad}', [\App\Http\Controllers\Admin\AdminAdController::class, 'show'])->name('show');
                Route::put('/{ad}', [\App\Http\Controllers\Admin\AdminAdController::class, 'update'])->name('update');
                Route::delete('/{ad}', [\App\Http\Controllers\Admin\AdminAdController::class, 'destroy'])->name('destroy');
                Route::post('/{ad}/toggle', [\App\Http\Controllers\Admin\AdminAdController::class, 'toggle'])->name('toggle');
            });

            // ============================================================
            // مدیریت مجله ازکالا (Admin Magazine)
            // ============================================================
            Route::prefix('magazine')->name('magazine.')->group(function () {
                // این routes باید قبل از {article} باشند
                Route::get('/stats', [AdminMagazineController::class, 'stats'])->name('stats');
                Route::post('/bulk-action', [AdminMagazineController::class, 'bulkAction'])->name('bulk-action');
                
                // لیست همه مقالات (شامل unpublished)
                Route::get('/', [AdminMagazineController::class, 'index'])->name('index');
                
                // ایجاد مقاله جدید
                Route::post('/', [AdminMagazineController::class, 'store'])->name('store');
                
                // جزئیات، ویرایش، حذف
                Route::get('/{article}', [AdminMagazineController::class, 'show'])->name('show');
                Route::put('/{article}', [AdminMagazineController::class, 'update'])->name('update');
                Route::delete('/{article}', [AdminMagazineController::class, 'destroy'])->name('destroy');
                
                // انتشار سریع
                Route::post('/{article}/toggle', [AdminMagazineController::class, 'toggle'])->name('toggle');
            });

            Route::prefix('products')->name('products.')->group(function () {
                Route::get('/', [AdminProductController::class, 'index'])->name('index');
                // باید قبل از /{product} ثبت شود؛ در routes/api_v1.php بعد از آن
                // تعریف شده بود و در عمل هرگز match نمی‌شد (implicit binding روی
                // «templates» محصولی پیدا نمی‌کرد و ۴۰۴ می‌داد).
                Route::get('/templates', [\App\Http\Controllers\Api\ProductController::class, 'getTemplates'])->name('templates');
                // stats() آمارِ یک محصول را برمی‌گرداند (getProductStats($id) صدا
                // می‌زند) ولی به /stats بدون پارامتر وصل بود، و /{product}/stats به
                // متدِ ناموجودِ productStats اشاره می‌کرد. فرانت‌اند هم همین دومی را
                // صدا می‌زند. جای درستش اینجاست؛ روت بی‌پارامتر حذف شد.
                Route::get('/{product}/stats', [AdminProductController::class, 'stats'])->name('product-stats');
                Route::put('/{product}/quick-update', [AdminProductController::class, 'quickUpdate'])->name('quick-update');
                Route::delete('/{product}', [AdminProductController::class, 'destroy'])->name('destroy');
                Route::post('/bulk-action', [AdminProductController::class, 'bulkAction'])->name('bulk-action');
            });

            Route::prefix('orders')->name('orders.')->group(function () {
                Route::get('/', [AdminOrderController::class, 'index'])->name('index');
                Route::get('/stats', [AdminOrderController::class, 'stats'])->name('stats');
                Route::get('/{order}', [AdminOrderController::class, 'show'])->name('show');
                Route::put('/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('update-status');
                Route::put('/{order}/payment-status', [AdminOrderController::class, 'updatePaymentStatus'])->name('update-payment-status');
                // POST /{order}/refund حذف شد: AdminOrderController::refund وجود
                // نداشت، هیچ‌جای فرانت‌اند صدایش نمی‌زد، و معنای بازپرداخت (کامل یا
                // جزئی، اتصال به درگاه، برگشت موجودی) تصمیم محصولی است نه حدسِ ما.
                // تا وقتی رفتارش مشخص شود، یک روتِ ۵۰۰دهنده بدتر از نبودنش است.
            });

            Route::prefix('reviews')->name('reviews.')->group(function () {
                Route::get('/', [AdminReviewController::class, 'index'])->name('index');
                Route::put('/{review}/status', [AdminReviewController::class, 'updateStatus'])->name('update-status');
                Route::post('/{review}/reply', [AdminReviewController::class, 'reply'])->name('reply');
                Route::delete('/{review}', [AdminReviewController::class, 'destroy'])->name('destroy');
                Route::post('/bulk-action', [AdminReviewController::class, 'bulkAction'])->name('bulk-action');
            });

            Route::prefix('coupons')->name('coupons.')->group(function () {
                Route::get('/', [CouponController::class, 'index'])->name('index');
                Route::post('/', [CouponController::class, 'store'])->name('store');
                Route::get('/{coupon}', [CouponController::class, 'show'])->name('show');
                Route::put('/{coupon}', [CouponController::class, 'update'])->name('update');
                Route::delete('/{coupon}', [CouponController::class, 'destroy'])->name('destroy');
            });

            Route::prefix('chat-management')->name('chat-management.')->group(function () {
                Route::prefix('reports')->name('reports.')->group(function () {
                    Route::get('/', [AdminChatReportController::class, 'index'])->name('index');
                    Route::get('/stats', [AdminChatReportController::class, 'stats'])->name('stats');
                    Route::get('/{report}', [AdminChatReportController::class, 'show'])->name('show');
                    Route::put('/{report}', [AdminChatReportController::class, 'update'])->name('update');
                    Route::post('/{report}/action', [AdminChatReportController::class, 'action'])->name('action');
                });

                Route::prefix('monitor')->name('monitor.')->group(function () {
                    Route::get('/', [ChatMonitorController::class, 'index'])->name('index');
                    Route::get('/stats', [ChatMonitorController::class, 'stats'])->name('stats');
                    Route::get('/{chat}', [ChatMonitorController::class, 'show'])->name('show');
                    Route::post('/{chat}/intervene', [ChatMonitorController::class, 'intervene'])->name('intervene');
                    Route::post('/{chat}/close', [ChatMonitorController::class, 'close'])->name('close');
                });

                Route::prefix('sentiment')->name('sentiment.')->group(function () {
                    Route::get('/dashboard', [SentimentDashboardController::class, 'dashboard'])->name('dashboard');
                    Route::get('/top-sellers', [SentimentDashboardController::class, 'topSellers'])->name('top-sellers');
                    Route::get('/alerts', [SentimentDashboardController::class, 'alerts'])->name('alerts');
                });

                Route::prefix('blocks')->name('blocks.')->group(function () {
                    Route::get('/', [BlockManagementController::class, 'index'])->name('index');
                    Route::get('/stats', [BlockManagementController::class, 'stats'])->name('stats');
                    Route::post('/block', [BlockManagementController::class, 'blockByAdmin'])->name('block');
                    Route::delete('/{block}', [BlockManagementController::class, 'unblock'])->name('unblock');
                    Route::delete('/user/{user}/all', [BlockManagementController::class, 'unblockAll'])->name('unblock-all');
                });

                Route::prefix('faq')->name('faq.')->group(function () {
                    Route::get('/', [FaqManagementController::class, 'index'])->name('index');
                    Route::get('/stats', [FaqManagementController::class, 'stats'])->name('stats');
                    Route::post('/system', [FaqManagementController::class, 'storeSystem'])->name('store-system');
                    Route::put('/{faq}', [FaqManagementController::class, 'update'])->name('update');
                    Route::delete('/{faq}', [FaqManagementController::class, 'destroy'])->name('destroy');
                    Route::post('/{faq}/toggle', [FaqManagementController::class, 'toggle'])->name('toggle');
                });

                Route::prefix('suggestions')->name('suggestions.')->group(function () {
                    Route::get('/', [SuggestionManagementController::class, 'index'])->name('index');
                    Route::get('/stats', [SuggestionManagementController::class, 'stats'])->name('stats');
                    Route::get('/top-performers', [SuggestionManagementController::class, 'topPerformers'])->name('top-performers');
                    Route::get('/top-sellers', [SuggestionManagementController::class, 'topSellers'])->name('top-sellers');
                    Route::get('/settings', [SuggestionManagementController::class, 'getSettings'])->name('settings');
                    Route::put('/settings', [SuggestionManagementController::class, 'updateSettings'])->name('update-settings');
                });

                Route::prefix('message-templates')->name('message-templates.')->group(function () {
                    Route::get('/', [MessageTemplateController::class, 'index'])->name('index');
                    Route::post('/', [MessageTemplateController::class, 'store'])->name('store');
                    Route::post('/seed-defaults', [MessageTemplateController::class, 'seedDefaults'])->name('seed-defaults');
                    Route::put('/{template}', [MessageTemplateController::class, 'update'])->name('update');
                    Route::delete('/{template}', [MessageTemplateController::class, 'destroy'])->name('destroy');
                    Route::post('/{template}/toggle', [MessageTemplateController::class, 'toggle'])->name('toggle');
                    Route::post('/{template}/track', [MessageTemplateController::class, 'trackUsage'])->name('track');
                });

                Route::prefix('tickets')->name('tickets.')->group(function () {
                    Route::get('/', [SupportTicketController::class, 'index'])->name('index');
                    Route::get('/stats', [SupportTicketController::class, 'stats'])->name('stats');
                    Route::get('/support-staff', [SupportTicketController::class, 'getSupportStaff'])->name('support-staff');
                    Route::post('/', [SupportTicketController::class, 'store'])->name('store');
                    Route::post('/convert/{conversation}', [SupportTicketController::class, 'convertFromConversation'])->name('convert');
                    Route::get('/{ticket}', [SupportTicketController::class, 'show'])->name('show');
                    Route::put('/{ticket}', [SupportTicketController::class, 'update'])->name('update');
                    Route::post('/{ticket}/assign', [SupportTicketController::class, 'assign'])->name('assign');
                    Route::post('/{ticket}/escalate', [SupportTicketController::class, 'escalate'])->name('escalate');
                    Route::post('/{ticket}/message', [SupportTicketController::class, 'sendMessage'])->name('send-message');
                });
            });

            Route::prefix('push')->name('push.')->group(function () {
                Route::post('/subscribe', [PushSubscriptionController::class, 'store'])->name('subscribe');
                Route::delete('/unsubscribe/{subscription}', [PushSubscriptionController::class, 'destroy'])->name('unsubscribe');
                Route::post('/test', [PushSubscriptionController::class, 'sendTest'])->name('test');
                Route::get('/vapid-public-key', [PushSubscriptionController::class, 'getVapidPublicKey'])->name('vapid-public-key');
            });

        }); // پایان گروه admin

    }); // ✅ پایان گروه auth:sanctum (فقط یک بار و در جای درست بسته شده است)

}); // ✅ پایان گروه نسخه‌بندی v1