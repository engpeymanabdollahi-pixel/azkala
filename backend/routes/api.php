<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ============================================================
// 📦 وارد کردن کنترلرها
// ============================================================

// کنترلرهای عمومی
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ReviewController;

// کنترلرهای محافظت‌شده (کاربر)
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\UserDeviceController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\WishlistController;

// کنترلرهای فروشنده
use App\Http\Controllers\Api\SellerProductController;
use App\Http\Controllers\Api\SellerDashboardController;
use App\Http\Controllers\Api\SellerOrderController;
use App\Http\Controllers\Api\SellerQuickReplyController;
use App\Http\Controllers\Api\SellerRatingController;

// کنترلرهای چت
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ChatModerationController;
use App\Http\Controllers\Api\ChatFaqController;

// کنترلر تیکت کاربر
use App\Http\Controllers\Api\UserTicketController;

// کنترلر اعلان‌های فشاری
use App\Http\Controllers\Api\PushSubscriptionController;

// کنترلرهای ادمین
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminReviewController;
use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminBrandController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AdminAdvancedReportController;
use App\Http\Controllers\Api\AdminSettingController;

// کنترلرهای ویژه ادمین
use App\Http\Controllers\Admin\ReportController as AdminChatReportController;
use App\Http\Controllers\Admin\ChatMonitorController;
use App\Http\Controllers\Admin\SentimentDashboardController;
use App\Http\Controllers\Admin\BlockManagementController;
use App\Http\Controllers\Admin\FaqManagementController;
use App\Http\Controllers\Admin\SuggestionManagementController;
use App\Http\Controllers\Admin\MessageTemplateController;
use App\Http\Controllers\Admin\SupportTicketController;
use App\Http\Controllers\Admin\ReportExportController;

// ============================================================
// 🌐 مسیرهای عمومی (بدون نیاز به احراز هویت)
// ============================================================

// 🔍 بررسی سلامت (بدون محدودیت نرخ)
Route::get('/test', function () {
    return response()->json([
        'success'   => true,
        'message'   => 'Azkala API is working!',
        'timestamp' => now()->toDateTimeString(),
    ]);
});

// 🔐 احراز هویت (عمومی) - با محدودیت نرخ سخت‌گیرانه برای جلوگیری از brute force
Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'sendOtp']);
      Route::post('/verify-otp', [AuthController::class, 'handleOtp']);
          Route::post('/login', [AuthController::class, 'login']);
});

// 📂 دسته‌بندی‌ها (عمومی)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// 🏷️ برندها (عمومی)
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{brand}', [BrandController::class, 'show']);

// 📱 دستگاه‌ها (عمومی - معماری Device-First)
Route::prefix('devices')->group(function () {
    Route::get('/brands', [DeviceController::class, 'brands']);
    Route::get('/brands/{brandId}/series', [DeviceController::class, 'series']);
    Route::get('/series/{seriesId}/models', [DeviceController::class, 'models']);
    Route::get('/models/{modelId}', [DeviceController::class, 'model']);
});

// 🛍️ محصولات (عمومی - ترتیب مهم: خاص به عام)
Route::prefix('products')->group(function () {
    Route::get('/featured', [ProductController::class, 'featured']);
    Route::get('/special-offers', [ProductController::class, 'specialOffers']);
    Route::get('/compatible/{modelId}', [ProductController::class, 'compatible']);
    Route::post('/compatible-multi', [ProductController::class, 'compatibleMulti']);
    Route::get('/slug/{slug}', [ProductController::class, 'bySlug']);

    // 🔍 جستجو با محدودیت نرخ (جلوگیری از scraping)
    Route::middleware('throttle:search')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
    });

    Route::get('/{product}', [ProductController::class, 'show']);

    // ⭐ نظرات (عمومی - فقط دریافت)
    Route::get('/{productId}/reviews', [ReviewController::class, 'index']);
});

// ============================================================
// 🔐 مسیرهای محافظت‌شده (نیاز به احراز هویت با Sanctum)
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/seller-requests', [SellerRequestController::class, 'store']);


    // ============================================================
    // 👤 مسیرهای کاربر
    // ============================================================

    // پروفایل
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // 📱 دستگاه‌های کاربر
    Route::prefix('user')->group(function () {
        Route::get('/devices', [UserDeviceController::class, 'index']);
        Route::post('/devices', [UserDeviceController::class, 'store']);
        Route::delete('/devices/{deviceId}', [UserDeviceController::class, 'destroy']);
    });

    // ❤️ علاقه‌مندی‌ها
    Route::prefix('wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/', [WishlistController::class, 'store']);
        Route::delete('/{productId}', [WishlistController::class, 'destroy']);
        Route::get('/check/{productId}', [WishlistController::class, 'check']);
    });

    // 💬 چت - با محدودیت نرخ برای جلوگیری از spam
    Route::prefix('chat')->middleware('throttle:chat')->group(function () {
        Route::get('/conversations', [ChatController::class, 'index']);
        Route::post('/conversations/start', [ChatController::class, 'startConversation']);
        Route::get('/conversations/{conversationId}', [ChatController::class, 'show']);
        Route::get('/conversations/{conversationId}/messages', [ChatController::class, 'getMessages']);
        Route::post('/conversations/{conversationId}/messages', [ChatController::class, 'sendMessage']);
        Route::delete('/conversations/{conversationId}', [ChatController::class, 'deleteConversation']);
        Route::get('/conversations/{conversationId}/suggestions', [ChatController::class, 'getProductSuggestions']);
        Route::post('/conversations/{conversationId}/suggest', [ChatController::class, 'suggestProduct']);
        Route::get('/conversations/{conversationId}/sentiment', [ChatController::class, 'getSentimentStats']);
        Route::post('/online-status', [ChatController::class, 'getOnlineStatus']);

        // 🚫 مدیریت مسدودسازی
        Route::get('/blocked-users', [ChatModerationController::class, 'getBlockedUsers']);
        Route::post('/block', [ChatModerationController::class, 'blockUser']);
        Route::delete('/unblock/{blockedUserId}', [ChatModerationController::class, 'unblockUser']);
        Route::get('/check-block/{userId}', [ChatModerationController::class, 'checkBlockStatus']);
        Route::post('/report', [ChatModerationController::class, 'reportUser']);

        // 🤖 سوالات متداول چت
        Route::prefix('faq')->group(function () {
            Route::get('/', [ChatFaqController::class, 'index']);
            Route::post('/', [ChatFaqController::class, 'store']);
            Route::put('/{id}', [ChatFaqController::class, 'update']);
            Route::delete('/{id}', [ChatFaqController::class, 'destroy']);
            Route::post('/seed-defaults', [ChatFaqController::class, 'seedDefaults']);
        });
    });

    // 🎫 تیکت‌های کاربر - با محدودیت نرخ
    Route::prefix('tickets')->middleware('throttle:tickets')->group(function () {
        Route::get('/', [UserTicketController::class, 'index']);
        Route::post('/', [UserTicketController::class, 'store']);
        Route::post('/convert/{conversationId}', [UserTicketController::class, 'convertFromConversation']);
        Route::get('/{id}', [UserTicketController::class, 'show']);
        Route::post('/{id}/message', [UserTicketController::class, 'sendMessage']);
    });

    // ⚡ پاسخ‌های سریع (فروشنده)
    Route::prefix('seller')->group(function () {
        Route::get('/quick-replies', [SellerQuickReplyController::class, 'index']);
        Route::post('/quick-replies', [SellerQuickReplyController::class, 'store']);
        Route::delete('/quick-replies/{id}', [SellerQuickReplyController::class, 'destroy']);
    });

    // 📍 آدرس‌ها
    Route::prefix('addresses')->group(function () {
        Route::get('/', [AddressController::class, 'index']);
        Route::post('/', [AddressController::class, 'store']);
        Route::put('/{addressId}', [AddressController::class, 'update']);
        Route::delete('/{addressId}', [AddressController::class, 'destroy']);
        Route::put('/{addressId}/default', [AddressController::class, 'setDefault']);
    });

    // 📤 آپلود تصاویر - با محدودیت نرخ
    Route::post('/upload/images', [ImageUploadController::class, 'upload'])->middleware('throttle:upload');

    // ⭐ امتیازات فروشنده
    Route::prefix('seller-ratings')->group(function () {
        Route::post('/', [SellerRatingController::class, 'store']);
        Route::get('/seller/{sellerId}', [SellerRatingController::class, 'getSellerRatings']);
        Route::get('/can-rate/{orderId}', [SellerRatingController::class, 'canRate']);
    });

    // ============================================================
    // 🛒 مسیرهای خرید
    // ============================================================

    // سبد خرید
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/', [CartController::class, 'store']);
        Route::put('/items/{itemId}', [CartController::class, 'update']);
        Route::delete('/items/{itemId}', [CartController::class, 'destroy']);
        Route::delete('/', [CartController::class, 'clear']);
    });

    // 📦 سفارشات کاربر
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{orderId}', [OrderController::class, 'show']);
        Route::post('/', [OrderController::class, 'store']);
        Route::post('/{orderId}/cancel', [OrderController::class, 'cancel']);
    });

    // 🛍️ محصولات من
    Route::get('/products/my-products', [ProductController::class, 'myProducts']);

    // 🎟️ کدهای تخفیف (کاربر)
    Route::prefix('coupons')->group(function () {
        Route::post('/validate', [CouponController::class, 'validateCoupon']);
        Route::get('/my', [CouponController::class, 'myCoupons']);
    });

    // ⭐ نظرات (محافظت‌شده)
    Route::prefix('reviews')->group(function () {
        Route::post('/', [ReviewController::class, 'store']);
        Route::put('/{reviewId}', [ReviewController::class, 'update']);
        Route::delete('/{reviewId}', [ReviewController::class, 'destroy']);
        Route::post('/{reviewId}/helpful', [ReviewController::class, 'helpful']);
    });

    Route::get('/products/{productId}/can-review', [ReviewController::class, 'canReview']);

    // ============================================================
    // 🏪 مسیرهای فروشنده
    // ============================================================
    Route::prefix('seller')->middleware('throttle:seller')->group(function () {
        // داشبورد
        Route::get('/dashboard/stats', [SellerDashboardController::class, 'stats']);
        Route::get('/wallet', [SellerDashboardController::class, 'wallet']); // کیف پول فروشنده

        // محصولات
        Route::get('/products', [SellerProductController::class, 'index']);
        Route::post('/products', [SellerProductController::class, 'store']);
        Route::get('/products/{id}', [SellerProductController::class, 'show']);
        Route::put('/products/{id}', [SellerProductController::class, 'update']);
        Route::delete('/products/{id}', [SellerProductController::class, 'destroy']);

        // سفارشات
        Route::get('/orders', [SellerOrderController::class, 'index']);
        Route::get('/orders/stats', [SellerOrderController::class, 'stats']);
        Route::get('/orders/{orderId}', [SellerOrderController::class, 'show']);
        Route::put('/orders/{orderId}/status', [SellerOrderController::class, 'updateStatus']);
    });

    // ============================================================
    // 👨‍💼 مسیرهای ادمین
    // ============================================================
    Route::prefix('admin')->middleware('admin')->group(function () {

        // 📊 داشبورد
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/dashboard/chat-stats', [AdminDashboardController::class, 'chatStats']);
        Route::get('/dashboard/sentiment-stats', [AdminDashboardController::class, 'sentimentStats']);
        Route::get('/dashboard/recent-chat-activity', [AdminDashboardController::class, 'recentChatActivity']);

        // ⚙️ مدیریت تنظیمات
        Route::prefix('settings')->group(function () {
            Route::get('/', [AdminSettingController::class, 'index']);
            Route::post('/seed-defaults', [AdminSettingController::class, 'seedDefaults']);
            Route::post('/update-group/{group}', [AdminSettingController::class, 'updateGroup']);
            Route::put('/{key}', [AdminSettingController::class, 'update']);
            Route::post('/{key}/toggle-lock', [AdminSettingController::class, 'toggleLock']);
            Route::get('/history', [AdminSettingController::class, 'history']);
            Route::post('/rollback/{historyId}', [AdminSettingController::class, 'rollback']);
            Route::get('/export', [AdminSettingController::class, 'export']);
            Route::post('/import', [AdminSettingController::class, 'import']);
            Route::post('/test-smtp', [AdminSettingController::class, 'testSmtp']);
            Route::post('/test-sms', [AdminSettingController::class, 'testSms']);
        });

        // 📊 گزارشات (پیشرفته - قدیمی)
        Route::prefix('reports')->group(function () {
            Route::get('/overview', [AdminReportController::class, 'overview']);
            Route::get('/dashboard', [AdminReportController::class, 'dashboard']);
            Route::get('/sales-chart', [AdminReportController::class, 'salesChart']);
            Route::get('/top-products', [AdminReportController::class, 'topProducts']);
            Route::get('/top-categories', [AdminReportController::class, 'topCategories']);
            Route::get('/order-status', [AdminReportController::class, 'orderStatus']);
            Route::get('/top-sellers', [AdminReportController::class, 'topSellers']);
        });

        // 📊 گزارشات پیشرفته (فاز ۲، ۳، ۴) - با محدودیت نرخ سخت‌گیرانه
        Route::prefix('advanced-reports')->middleware('throttle:admin-reports')->group(function () {
            // فاز ۲
            Route::get('/users-analysis', [AdminAdvancedReportController::class, 'usersAnalysis']);
            Route::get('/seller-performance', [AdminAdvancedReportController::class, 'sellerPerformance']);
            Route::get('/period-comparison', [AdminAdvancedReportController::class, 'periodComparison']);

            // فاز ۳
            Route::get('/device-analytics', [AdminAdvancedReportController::class, 'deviceAnalytics']);
            Route::get('/basket-analysis', [AdminAdvancedReportController::class, 'basketAnalysis']);
            Route::get('/search-analytics', [AdminAdvancedReportController::class, 'searchAnalytics']);
            Route::get('/product-analytics', [AdminAdvancedReportController::class, 'productAnalytics']);
            Route::get('/chat-analytics', [AdminAdvancedReportController::class, 'chatAnalytics']);

            // فاز ۴
            Route::get('/predictions', [AdminAdvancedReportController::class, 'predictions']);
            Route::get('/anomalies', [AdminAdvancedReportController::class, 'anomalies']);
        });
        // این خط را در گروه روت‌های ادمین قرار دهید
Route::get('/admin/dashboard', function () {
    return response()->json(['success' => true, 'message' => 'Admin Dashboard']);
});

        // 🚨 گزارشات چت
        Route::prefix('chat-reports')->group(function () {
            Route::get('/', [AdminChatReportController::class, 'index']);
            Route::get('/stats', [AdminChatReportController::class, 'stats']);
            Route::get('/{id}', [AdminChatReportController::class, 'show']);
            Route::put('/{id}', [AdminChatReportController::class, 'update']);
            Route::post('/{id}/action', [AdminChatReportController::class, 'action']);
        });

        // 💬 پایش چت‌ها
        Route::prefix('chat-monitor')->group(function () {
            Route::get('/', [ChatMonitorController::class, 'index']);
            Route::get('/stats', [ChatMonitorController::class, 'stats']);
            Route::get('/critical', [ChatMonitorController::class, 'critical']);
            Route::get('/{id}', [ChatMonitorController::class, 'show']);
            Route::post('/{id}/intervene', [ChatMonitorController::class, 'intervene']);
            Route::post('/{id}/close', [ChatMonitorController::class, 'close']);
        });

        // 🧠 داشبورد احساسات
        Route::prefix('sentiment')->group(function () {
            Route::get('/dashboard', [SentimentDashboardController::class, 'dashboard']);
            Route::get('/top-sellers', [SentimentDashboardController::class, 'topSellers']);
            Route::get('/alerts', [SentimentDashboardController::class, 'alerts']);
        });

        // 🚫 مدیریت مسدودسازی کاربران
        Route::prefix('blocks')->group(function () {
            Route::get('/', [BlockManagementController::class, 'index']);
            Route::get('/stats', [BlockManagementController::class, 'stats']);
            Route::post('/block', [BlockManagementController::class, 'blockByAdmin']);
            Route::delete('/{id}', [BlockManagementController::class, 'unblock']);
            Route::delete('/user/{userId}/all', [BlockManagementController::class, 'unblockAll']);
        });
        // دریافت لیست درخواست‌های فروشندگی برای پنل ادمین
Route::get('/admin/seller-requests', function () {
    $requests = \App\Models\SellerRequest::with('user:id,name,email')->latest()->get();
    
    return response()->json([
        'success' => true,
        'data' => [
            'requests' => $requests
        ]
    ]);
});

        // 🤖 مدیریت FAQ سراسری
        Route::prefix('faq-management')->group(function () {
            Route::get('/', [FaqManagementController::class, 'index']);
            Route::get('/stats', [FaqManagementController::class, 'stats']);
            Route::post('/system', [FaqManagementController::class, 'storeSystem']);
            Route::put('/{id}', [FaqManagementController::class, 'update']);
            Route::delete('/{id}', [FaqManagementController::class, 'destroy']);
            Route::post('/{id}/toggle', [FaqManagementController::class, 'toggle']);
        });

        // 💡 مدیریت پیشنهادات محصول
        Route::prefix('suggestions')->group(function () {
            Route::get('/stats', [SuggestionManagementController::class, 'stats']);
            Route::get('/top-performers', [SuggestionManagementController::class, 'topPerformers']);
            Route::get('/top-sellers', [SuggestionManagementController::class, 'topSellers']);
            Route::get('/settings', [SuggestionManagementController::class, 'getSettings']);
            Route::put('/settings', [SuggestionManagementController::class, 'updateSettings']);
            Route::get('/', [SuggestionManagementController::class, 'index']);
        });

        // 📌 قالب‌های پیام حرفه‌ای
        Route::prefix('message-templates')->group(function () {
            Route::get('/', [MessageTemplateController::class, 'index']);
            Route::post('/', [MessageTemplateController::class, 'store']);
            Route::post('/seed-defaults', [MessageTemplateController::class, 'seedDefaults']);
            Route::put('/{id}', [MessageTemplateController::class, 'update']);
            Route::delete('/{id}', [MessageTemplateController::class, 'destroy']);
            Route::post('/{id}/toggle', [MessageTemplateController::class, 'toggle']);
            Route::post('/{id}/track', [MessageTemplateController::class, 'trackUsage']);
        });

        // 🎫 تیکت‌های پشتیبانی
        Route::prefix('tickets')->group(function () {
            Route::get('/', [SupportTicketController::class, 'index']);
            Route::get('/stats', [SupportTicketController::class, 'stats']);
            Route::get('/support-staff', [SupportTicketController::class, 'getSupportStaff']);
            Route::post('/', [SupportTicketController::class, 'store']);
            Route::post('/convert/{conversationId}', [SupportTicketController::class, 'convertFromConversation']);
            Route::get('/{id}', [SupportTicketController::class, 'show']);
            Route::put('/{id}', [SupportTicketController::class, 'update']);
            Route::post('/{id}/assign', [SupportTicketController::class, 'assign']);
            Route::post('/{id}/escalate', [SupportTicketController::class, 'escalate']);
            Route::post('/{id}/message', [SupportTicketController::class, 'sendMessage']);
        });

        // 💬 مدیریت نظرات
        Route::prefix('reviews')->group(function () {
            Route::get('/', [AdminReviewController::class, 'index']);
            Route::put('/{id}/status', [AdminReviewController::class, 'updateStatus']);
            Route::post('/{id}/reply', [AdminReviewController::class, 'reply']);
            Route::delete('/{id}', [AdminReviewController::class, 'destroy']);
            Route::post('/bulk-action', [AdminReviewController::class, 'bulkAction']);
        });

        // 👥 مدیریت کاربران
        Route::prefix('users')->group(function () {
            Route::get('/', [AdminUserController::class, 'index']);
            Route::get('/{id}', [AdminUserController::class, 'show']);
            Route::put('/{id}/role', [AdminUserController::class, 'updateRole']);
            Route::put('/{id}/status', [AdminUserController::class, 'updateStatus']);
            Route::post('/{id}/approve-seller', [AdminUserController::class, 'approveSeller']);
            Route::post('/{id}/reject-seller', [AdminUserController::class, 'rejectSeller']);

            // 📨 درخواست‌های فروشندگی
            Route::get('/seller-requests', [AdminUserController::class, 'sellerRequests']);
            Route::post('/{id}/approve-seller-request', [AdminUserController::class, 'approveSellerRequest']);
            Route::post('/{id}/reject-seller-request', [AdminUserController::class, 'rejectSellerRequest']);
        });

        // 📂 مدیریت دسته‌بندی‌ها
        Route::prefix('categories')->group(function () {
            Route::get('/', [AdminCategoryController::class, 'index']);
            Route::get('/tree', [AdminCategoryController::class, 'tree']);
            Route::post('/', [AdminCategoryController::class, 'store']);
            Route::get('/{id}', [AdminCategoryController::class, 'show']);
            Route::put('/{id}', [AdminCategoryController::class, 'update']);
            Route::delete('/{id}', [AdminCategoryController::class, 'destroy']);
            Route::put('/reorder', [AdminCategoryController::class, 'reorder']);
            Route::post('/bulk-action', [AdminCategoryController::class, 'bulkAction']);
        });

        // 🏷️ مدیریت برندها
        Route::prefix('brands')->group(function () {
            Route::get('/', [AdminBrandController::class, 'index']);
            Route::post('/', [AdminBrandController::class, 'store']);
            Route::get('/{id}', [AdminBrandController::class, 'show']);
            Route::put('/{id}', [AdminBrandController::class, 'update']);
            Route::delete('/{id}', [AdminBrandController::class, 'destroy']);
            Route::post('/{id}/verify', [AdminBrandController::class, 'verify']);
            Route::post('/{id}/unverify', [AdminBrandController::class, 'unverify']);
            Route::post('/bulk-action', [AdminBrandController::class, 'bulkAction']);
        });

        // 📦 مدیریت محصولات
        Route::prefix('products')->group(function () {
            Route::get('/', [AdminProductController::class, 'index']);
            Route::get('/stats', [AdminProductController::class, 'stats']);
            Route::get('/{id}', [AdminProductController::class, 'show']);
            Route::get('/{id}/stats', [AdminProductController::class, 'productStats']);
            Route::put('/{id}/quick-update', [AdminProductController::class, 'quickUpdate']);
            Route::delete('/{id}', [AdminProductController::class, 'destroy']);
            Route::post('/bulk-action', [AdminProductController::class, 'bulkAction']);
        });

        // 📋 مدیریت سفارشات
        Route::prefix('orders')->group(function () {
            Route::get('/', [AdminOrderController::class, 'index']);
            Route::get('/stats', [AdminOrderController::class, 'stats']);
            Route::get('/{id}', [AdminOrderController::class, 'show']);
            Route::put('/{id}/status', [AdminOrderController::class, 'updateStatus']);
            Route::put('/{id}/payment-status', [AdminOrderController::class, 'updatePaymentStatus']);
            Route::post('/{id}/refund', [AdminOrderController::class, 'refund']);
        });

        // 📤 خروجی گزارشات - با محدودیت نرخ
        Route::prefix('export')->middleware('throttle:admin-reports')->group(function () {
            Route::get('/orders/excel', [ReportExportController::class, 'exportOrdersExcel']);
            Route::get('/orders/pdf', [ReportExportController::class, 'exportOrdersPdf']);
            Route::get('/users/excel', [ReportExportController::class, 'exportUsersExcel']);
            Route::get('/products/excel', [ReportExportController::class, 'exportProductsExcel']);
            Route::get('/chat/excel', [ReportExportController::class, 'exportChatExcel']);
            Route::get('/reports/excel', [ReportExportController::class, 'exportReportsExcel']);
            Route::get('/summary/pdf', [ReportExportController::class, 'exportSummaryPdf']);
        });

        // 🎟️ مدیریت کدهای تخفیف
        Route::prefix('coupons')->group(function () {
            Route::get('/', [CouponController::class, 'index']);
            Route::post('/', [CouponController::class, 'store']);
            Route::get('/{id}', [CouponController::class, 'show']);
            Route::put('/{id}', [CouponController::class, 'update']);
            Route::delete('/{id}', [CouponController::class, 'destroy']);
        });
    });

    // 🔔 اعلان‌های فشاری
    Route::prefix('push')->group(function () {
        Route::post('/subscribe', [PushSubscriptionController::class, 'store']);
        Route::delete('/unsubscribe/{id}', [PushSubscriptionController::class, 'destroy']);
        Route::post('/test', [PushSubscriptionController::class, 'sendTest']);
        Route::get('/vapid-public-key', [PushSubscriptionController::class, 'getVapidPublicKey']);
    });
});