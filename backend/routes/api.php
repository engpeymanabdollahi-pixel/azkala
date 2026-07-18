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
// ۱. مسیرهای عمومی
// ============================================================
Route::get('/test', function () {
    return response()->json(['success' => true, 'message' => 'Azkala API is working!', 'timestamp' => now()->toDateTimeString()]);
})->name('test');

// در بخش مسیرهای عمومی، کنار سایر روت‌های devices
Route::get('/devices/hierarchy', [App\Http\Controllers\Api\DeviceController::class, 'getHierarchy']);

Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'sendOtp'])->name('register');
    Route::post('/verify-otp', [AuthController::class, 'handleOtp'])->name('verify-otp');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::get('/categories/{category}', [CategoryController::class, 'show'])->name('categories.show');
Route::get('/brands', [BrandController::class, 'index'])->name('brands.index');
Route::get('/brands/{brand}', [BrandController::class, 'show'])->name('brands.show');

Route::prefix('devices')->name('devices.')->group(function () {
    Route::get('/brands', [DeviceController::class, 'brands'])->name('brands');
    Route::get('/brands/{brandId}/series', [DeviceController::class, 'series'])->name('series');
    Route::get('/series/{seriesId}/models', [DeviceController::class, 'models'])->name('models');
    Route::get('/models/{modelId}', [DeviceController::class, 'model'])->name('model');
        Route::get('/header-hierarchy', [DeviceController::class, 'getHeaderHierarchy'])->name('header-hierarchy');

});

Route::prefix('products')->name('products.')->group(function () {
    Route::get('/featured', [ProductController::class, 'featured'])->name('featured');
    Route::get('/special-offers', [ProductController::class, 'specialOffers'])->name('special-offers');
    Route::get('/compatible/{modelId}', [ProductController::class, 'compatible'])->name('compatible');
    Route::post('/compatible-multi', [ProductController::class, 'compatibleMulti'])->name('compatible-multi');
    Route::get('/slug/{slug}', [ProductController::class, 'bySlug'])->name('by-slug');
    Route::get('/{product}', [ProductController::class, 'show'])->name('show');
    Route::get('/{productId}/reviews', [ReviewController::class, 'index'])->name('reviews.index');
    Route::middleware('throttle:search')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('index');
    });
});

// ============================================================
// ۲. مسیرهای محافظت‌شده (Auth)
// ============================================================
Route::middleware('auth:sanctum')->group(function () {

Route::post('/upload/images', [App\Http\Controllers\Api\ImageUploadController::class, 'upload'])
        ->name('upload.images');

    // ✅ لاگ‌اوت (خارج از هر prefix دیگری)
    Route::post('/logout', function (\Illuminate\Http\Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'با موفقیت خارج شدید']);
    })->name('logout');

    // 👤 کاربر
    Route::prefix('user')->name('user.')->group(function () {
        Route::get('/', [AuthController::class, 'user'])->name('profile');
        Route::put('/', [AuthController::class, 'update'])->name('update');
        Route::post('/change-password', [AuthController::class, 'changePassword'])->name('change-password');
        Route::get('/seller-request-status', [AuthController::class, 'getSellerRequestStatus'])->name('seller-request-status');

        
        Route::prefix('devices')->name('devices.')->group(function () {
            Route::get('/', [UserDeviceController::class, 'index'])->name('index');
            Route::post('/', [UserDeviceController::class, 'store'])->name('store');
            Route::delete('/{deviceId}', [UserDeviceController::class, 'destroy'])->name('destroy');
        });
    });

    Route::post('/seller-requests', [SellerRequestController::class, 'store'])->name('seller-requests.store');

    // 🛒 سبد خرید و سفارش
    Route::prefix('cart')->name('cart.')->group(function () {
        Route::get('/', [CartController::class, 'index'])->name('index');
        Route::post('/', [CartController::class, 'store'])->name('store');
        Route::put('/{cartItemId}', [CartController::class, 'update'])->name('update');
        Route::delete('/{cartItemId}', [CartController::class, 'destroy'])->name('destroy');
        Route::delete('/clear', [CartController::class, 'clear'])->name('clear');
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

    // ❤️ تعاملات
    Route::prefix('wishlist')->name('wishlist.')->group(function () {
        Route::get('/', [WishlistController::class, 'index'])->name('index');
        Route::post('/', [WishlistController::class, 'store'])->name('store');
        Route::delete('/{productId}', [WishlistController::class, 'destroy'])->name('destroy');
        Route::get('/check/{productId}', [WishlistController::class, 'check'])->name('check');
    });

    Route::prefix('addresses')->name('addresses.')->group(function () {
        Route::get('/', [AddressController::class, 'index'])->name('index');
        Route::post('/', [AddressController::class, 'store'])->name('store');
        Route::put('/{address}', [AddressController::class, 'update'])->name('update');
        Route::delete('/{address}', [AddressController::class, 'destroy'])->name('destroy');
        Route::put('/{address}/default', [AddressController::class, 'setDefault'])->name('set-default');
    });

    Route::prefix('reviews')->name('reviews.')->group(function () {
        Route::post('/', [ReviewController::class, 'store'])->name('store');
        Route::put('/{review}', [ReviewController::class, 'update'])->name('update');
        Route::delete('/{review}', [ReviewController::class, 'destroy'])->name('destroy');
        Route::post('/{review}/helpful', [ReviewController::class, 'helpful'])->name('helpful');
    });
    
    Route::get('/products/{productId}/can-review', [ReviewController::class, 'canReview'])->name('products.can-review');
    Route::get('/products/my-products', [ProductController::class, 'myProducts'])->name('products.my-products');

    // 💬 چت و تیکت
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

    // 🏪 فروشنده
    Route::prefix('seller')->middleware('throttle:seller')->name('seller.')->group(function () {
        Route::get('/dashboard/stats', [SellerDashboardController::class, 'stats'])->name('dashboard.stats');
        Route::get('/wallet', [SellerDashboardController::class, 'wallet'])->name('wallet');
        
        Route::prefix('products')->name('products.')->group(function () {
            Route::get('/', [SellerProductController::class, 'index'])->name('index');
            Route::post('/', [SellerProductController::class, 'store'])->name('store');
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

        Route::prefix('ratings')->name('ratings.')->group(function () {
            Route::post('/', [SellerRatingController::class, 'store'])->name('store');
            Route::get('/seller/{seller}', [SellerRatingController::class, 'getSellerRatings'])->name('seller-ratings');
            Route::get('/can-rate/{order}', [SellerRatingController::class, 'canRate'])->name('can-rate');
        });
    });

    // 👨‍💼 ادمین
    Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () {
        
        Route::prefix('dashboard')->name('dashboard.')->group(function () {
            Route::get('/stats', [AdminDashboardController::class, 'stats'])->name('stats');
            Route::get('/chat-stats', [AdminDashboardController::class, 'chatStats'])->name('chat-stats');
            Route::get('/sentiment-stats', [AdminDashboardController::class, 'sentimentStats'])->name('sentiment-stats');
            Route::get('/recent-chat-activity', [AdminDashboardController::class, 'recentChatActivity'])->name('recent-chat-activity');
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
        });

        // ✅ کاربران ادمین (ترتیب حیاتی: ثابت قبل از پارامتر)
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [AdminUserController::class, 'index'])->name('index');
            
            // این خط باید حتماً قبل از /{user} باشد
            Route::get('/seller-requests', [AdminUserController::class, 'sellerRequests'])->name('seller-requests');
            
            Route::get('/{user}', [AdminUserController::class, 'show'])->name('show');
            Route::put('/{user}/role', [AdminUserController::class, 'updateRole'])->name('update-role');
            Route::put('/{user}/status', [AdminUserController::class, 'updateStatus'])->name('update-status');
            Route::post('/{user}/approve-seller', [AdminUserController::class, 'approveSeller'])->name('approve-seller');
            Route::post('/{user}/reject-seller', [AdminUserController::class, 'rejectSeller'])->name('reject-seller');
            Route::post('/{user}/approve-seller-request', [AdminUserController::class, 'approveSellerRequest'])->name('approve-seller-request');
            Route::post('/{user}/reject-seller-request', [AdminUserController::class, 'rejectSellerRequest'])->name('reject-seller-request');
        });

        Route::prefix('categories')->name('categories.')->group(function () {
            Route::get('/', [AdminCategoryController::class, 'index'])->name('index');
            Route::get('/tree', [AdminCategoryController::class, 'tree'])->name('tree');
            Route::post('/', [AdminCategoryController::class, 'store'])->name('store');
            Route::get('/{category}', [AdminCategoryController::class, 'show'])->name('show');
            Route::put('/{category}', [AdminCategoryController::class, 'update'])->name('update');
            Route::delete('/{category}', [AdminCategoryController::class, 'destroy'])->name('destroy');
            Route::put('/reorder', [AdminCategoryController::class, 'reorder'])->name('reorder');
            Route::post('/bulk-action', [AdminCategoryController::class, 'bulkAction'])->name('bulk-action');
        });

        Route::prefix('brands')->name('brands.')->group(function () {
            Route::get('/', [AdminBrandController::class, 'index'])->name('index');
            Route::post('/', [AdminBrandController::class, 'store'])->name('store');
            Route::get('/{brand}', [AdminBrandController::class, 'show'])->name('show');
            Route::put('/{brand}', [AdminBrandController::class, 'update'])->name('update');
            Route::delete('/{brand}', [AdminBrandController::class, 'destroy'])->name('destroy');
            Route::post('/{brand}/verify', [AdminBrandController::class, 'verify'])->name('verify');
            Route::post('/{brand}/unverify', [AdminBrandController::class, 'unverify'])->name('unverify');
            Route::post('/bulk-action', [AdminBrandController::class, 'bulkAction'])->name('bulk-action');
        });

        Route::prefix('products')->name('products.')->group(function () {
            Route::get('/', [AdminProductController::class, 'index'])->name('index');
            Route::get('/stats', [AdminProductController::class, 'stats'])->name('stats');
            Route::get('/{product}', [AdminProductController::class, 'show'])->name('show');
            Route::get('/{product}/stats', [AdminProductController::class, 'productStats'])->name('product-stats');
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
            Route::post('/{order}/refund', [AdminOrderController::class, 'refund'])->name('refund');
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
                Route::get('/critical', [ChatMonitorController::class, 'critical'])->name('critical');
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

        // سایر سرویس‌ها

        Route::prefix('push')->name('push.')->group(function () {
            Route::post('/subscribe', [PushSubscriptionController::class, 'store'])->name('subscribe');
            Route::delete('/unsubscribe/{subscription}', [PushSubscriptionController::class, 'destroy'])->name('unsubscribe');
            Route::post('/test', [PushSubscriptionController::class, 'sendTest'])->name('test');
            Route::get('/vapid-public-key', [PushSubscriptionController::class, 'getVapidPublicKey'])->name('vapid-public-key');
        });

    }); // پایان گروه admin

}); // پایان گروه auth:sanctum