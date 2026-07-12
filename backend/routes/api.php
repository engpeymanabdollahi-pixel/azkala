<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًں“¦ IMPORT CONTROLLERS
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ

// Public Controllers
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ReviewController;

// Protected Controllers (User)
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\UserDeviceController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\WishlistController;

// Seller Controllers
use App\Http\Controllers\Api\SellerProductController;
use App\Http\Controllers\Api\SellerDashboardController;
use App\Http\Controllers\Api\SellerOrderController;
use App\Http\Controllers\Api\SellerQuickReplyController;
use App\Http\Controllers\Api\SellerRatingController;

// Chat Controllers
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ChatModerationController;
use App\Http\Controllers\Api\ChatFaqController;

// User Ticket Controller
use App\Http\Controllers\Api\UserTicketController;

// Push Notification Controller
use App\Http\Controllers\Api\PushSubscriptionController;

// Admin Controllers
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

// Admin Special Controllers
use App\Http\Controllers\Admin\ReportController as AdminChatReportController;
use App\Http\Controllers\Admin\ChatMonitorController;
use App\Http\Controllers\Admin\SentimentDashboardController;
use App\Http\Controllers\Admin\BlockManagementController;
use App\Http\Controllers\Admin\FaqManagementController;
use App\Http\Controllers\Admin\SuggestionManagementController;
use App\Http\Controllers\Admin\MessageTemplateController;
use App\Http\Controllers\Admin\SupportTicketController;
use App\Http\Controllers\Admin\ReportExportController;

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًںŒگ PUBLIC ROUTES (ط¨ط¯ظˆظ† ظ†غŒط§ط² ط¨ظ‡ ط§ط­ط±ط§ط² ظ‡ظˆغŒطھ)
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ

// ًں”چ Health Check (ط¨ط¯ظˆظ† rate limit)
Route::get('/test', function () {
    return response()->json([
        'success'   => true,
        'message'   => 'Azkala API is working!',
        'timestamp' => now()->toDateTimeString(),
    ]);
});

// ًں”گ Auth (Public) - ط¨ط§ rate limit ط³ط®طھâ€Œع¯غŒط±ط§ظ†ظ‡ ط¨ط±ط§غŒ ط¬ظ„ظˆع¯غŒط±غŒ ط§ط² brute force
Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// ًں“‚ Categories (Public)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// ًںڈ·ï¸ڈ Brands (Public)
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{brand}', [BrandController::class, 'show']);

// ًں“± Devices (Public - ظ…ط¹ظ…ط§ط±غŒ Device-First)
Route::prefix('devices')->group(function () {
    Route::get('/brands', [DeviceController::class, 'brands']);
    Route::get('/brands/{brandId}/series', [DeviceController::class, 'series']);
    Route::get('/series/{seriesId}/models', [DeviceController::class, 'models']);
    Route::get('/models/{modelId}', [DeviceController::class, 'model']);
});

// ًں›چï¸ڈ Products (Public - طھط±طھغŒط¨ ظ…ظ‡ظ…: ط®ط§طµ ط¨ظ‡ ط¹ط§ظ…)
Route::prefix('products')->group(function () {
    Route::get('/featured', [ProductController::class, 'featured']);
    Route::get('/special-offers', [ProductController::class, 'specialOffers']);
    Route::get('/compatible/{modelId}', [ProductController::class, 'compatible']);
    Route::post('/compatible-multi', [ProductController::class, 'compatibleMulti']);
    Route::get('/slug/{slug}', [ProductController::class, 'bySlug']);
    
    // ًں”چ ط¬ط³طھط¬ظˆ ط¨ط§ rate limit (ط¬ظ„ظˆع¯غŒط±غŒ ط§ط² scraping)
    Route::middleware('throttle:search')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
    });
    
    Route::get('/{product}', [ProductController::class, 'show']);
    
    // â­گ Reviews (Public - ظپظ‚ط· ط¯ط±غŒط§ظپطھ)
    Route::get('/{productId}/reviews', [ReviewController::class, 'index']);
});

// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
// ًں”گ PROTECTED ROUTES (ظ†غŒط§ط² ط¨ظ‡ ط§ط­ط±ط§ط² ظ‡ظˆغŒطھ ط¨ط§ Sanctum)
// â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
Route::middleware('auth:sanctum')->group(function () {

    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    // ًں‘¤ USER ROUTES
    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    
    // Profile
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ًں“± User Devices
    Route::prefix('user')->group(function () {
        Route::get('/devices', [UserDeviceController::class, 'index']);
        Route::post('/devices', [UserDeviceController::class, 'store']);
        Route::delete('/devices/{deviceId}', [UserDeviceController::class, 'destroy']);
    });

    // â‌¤ï¸ڈ Wishlist
    Route::prefix('wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/', [WishlistController::class, 'store']);
        Route::delete('/{productId}', [WishlistController::class, 'destroy']);
        Route::get('/check/{productId}', [WishlistController::class, 'check']);
    });

    // ًں’¬ Chat - ط¨ط§ rate limit ط¨ط±ط§غŒ ط¬ظ„ظˆع¯غŒط±غŒ ط§ط² spam
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
        
        // ًںڑ« Chat Moderation
        Route::get('/blocked-users', [ChatModerationController::class, 'getBlockedUsers']);
        Route::post('/block', [ChatModerationController::class, 'blockUser']);
        Route::delete('/unblock/{blockedUserId}', [ChatModerationController::class, 'unblockUser']);
        Route::get('/check-block/{userId}', [ChatModerationController::class, 'checkBlockStatus']);
        Route::post('/report', [ChatModerationController::class, 'reportUser']);
        
        // ًں¤– Chat FAQ
        Route::prefix('faq')->group(function () {
            Route::get('/', [ChatFaqController::class, 'index']);
            Route::post('/', [ChatFaqController::class, 'store']);
            Route::put('/{id}', [ChatFaqController::class, 'update']);
            Route::delete('/{id}', [ChatFaqController::class, 'destroy']);
            Route::post('/seed-defaults', [ChatFaqController::class, 'seedDefaults']);
        });
    });

    // ًںژ« User Tickets - ط¨ط§ rate limit
    Route::prefix('tickets')->middleware('throttle:tickets')->group(function () {
        Route::get('/', [UserTicketController::class, 'index']);
        Route::post('/', [UserTicketController::class, 'store']);
        Route::post('/convert/{conversationId}', [UserTicketController::class, 'convertFromConversation']);
        Route::get('/{id}', [UserTicketController::class, 'show']);
        Route::post('/{id}/message', [UserTicketController::class, 'sendMessage']);
    });

    // âڑ، Quick Replies (ظپط±ظˆط´ظ†ط¯ظ‡)
    Route::prefix('seller')->group(function () {
        Route::get('/quick-replies', [SellerQuickReplyController::class, 'index']);
        Route::post('/quick-replies', [SellerQuickReplyController::class, 'store']);
        Route::delete('/quick-replies/{id}', [SellerQuickReplyController::class, 'destroy']);
    });

    // ًں“چ Addresses
    Route::prefix('addresses')->group(function () {
        Route::get('/', [AddressController::class, 'index']);
        Route::post('/', [AddressController::class, 'store']);
        Route::put('/{addressId}', [AddressController::class, 'update']);
        Route::delete('/{addressId}', [AddressController::class, 'destroy']);
        Route::put('/{addressId}/default', [AddressController::class, 'setDefault']);
    });

    // ًں“¤ Upload Images - ط¨ط§ rate limit
    Route::post('/upload/images', [ImageUploadController::class, 'upload'])->middleware('throttle:upload');

    // â­گ Seller Ratings
    Route::prefix('seller-ratings')->group(function () {
        Route::post('/', [SellerRatingController::class, 'store']);
        Route::get('/seller/{sellerId}', [SellerRatingController::class, 'getSellerRatings']);
        Route::get('/can-rate/{orderId}', [SellerRatingController::class, 'canRate']);
    });

    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    // ًں›’ SHOPPING ROUTES
    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    
    // Cart
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/', [CartController::class, 'store']);
        Route::put('/items/{itemId}', [CartController::class, 'update']);
        Route::delete('/items/{itemId}', [CartController::class, 'destroy']);
        Route::delete('/', [CartController::class, 'clear']);
    });

    // ًں“¦ User Orders
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{orderId}', [OrderController::class, 'show']);
        Route::post('/', [OrderController::class, 'store']);
        Route::post('/{orderId}/cancel', [OrderController::class, 'cancel']);
    });

    // ًں›چï¸ڈ My Products
    Route::get('/products/my-products', [ProductController::class, 'myProducts']);

    // ًںژںï¸ڈ Coupons (ع©ط§ط±ط¨ط±)
    Route::prefix('coupons')->group(function () {
        Route::post('/validate', [CouponController::class, 'validateCoupon']);
        Route::get('/my', [CouponController::class, 'myCoupons']);
    });

    // â­گ Reviews (Protected)
    Route::prefix('reviews')->group(function () {
        Route::post('/', [ReviewController::class, 'store']);
        Route::put('/{reviewId}', [ReviewController::class, 'update']);
        Route::delete('/{reviewId}', [ReviewController::class, 'destroy']);
        Route::post('/{reviewId}/helpful', [ReviewController::class, 'helpful']);
    });
    
    Route::get('/products/{productId}/can-review', [ReviewController::class, 'canReview']);

    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    // ًںڈھ SELLER ROUTES
    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    Route::prefix('seller')->middleware('throttle:seller')->group(function () {
        // Dashboard
        Route::get('/dashboard/stats', [SellerDashboardController::class, 'stats']);
        
        // Products
        Route::get('/products', [SellerProductController::class, 'index']);
        Route::post('/products', [SellerProductController::class, 'store']);
        Route::get('/products/{id}', [SellerProductController::class, 'show']);
        Route::put('/products/{id}', [SellerProductController::class, 'update']);
        Route::delete('/products/{id}', [SellerProductController::class, 'destroy']);
        
        // Orders
        Route::get('/orders', [SellerOrderController::class, 'index']);
        Route::get('/orders/stats', [SellerOrderController::class, 'stats']);
        Route::get('/orders/{orderId}', [SellerOrderController::class, 'show']);
        Route::put('/orders/{orderId}/status', [SellerOrderController::class, 'updateStatus']);
    });

    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    // ًں‘¨â€چًں’¼ ADMIN ROUTES
    // â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
    Route::prefix('admin')->middleware('admin')->group(function () {

        // ًں“ٹ Dashboard
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/dashboard/chat-stats', [AdminDashboardController::class, 'chatStats']);
        Route::get('/dashboard/sentiment-stats', [AdminDashboardController::class, 'sentimentStats']);
        Route::get('/dashboard/recent-chat-activity', [AdminDashboardController::class, 'recentChatActivity']);

        // âڑ™ï¸ڈ Settings Management
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

        // ًں“ٹ Reports (ع¯ط²ط§ط±ط´ط§طھ ظ¾غŒط´ط±ظپطھظ‡ - ظ‚ط¯غŒظ…غŒ)
        Route::prefix('reports')->group(function () {
            Route::get('/overview', [AdminReportController::class, 'overview']);
            Route::get('/dashboard', [AdminReportController::class, 'dashboard']);
            Route::get('/sales-chart', [AdminReportController::class, 'salesChart']);
            Route::get('/top-products', [AdminReportController::class, 'topProducts']);
            Route::get('/top-categories', [AdminReportController::class, 'topCategories']);
            Route::get('/order-status', [AdminReportController::class, 'orderStatus']);
            Route::get('/top-sellers', [AdminReportController::class, 'topSellers']);
        });

        // ًں“ٹ Advanced Reports (ظپط§ط² غ²طŒ غ³طŒ غ´) - ط¨ط§ rate limit ط³ط®طھâ€Œع¯غŒط±ط§ظ†ظ‡
        Route::prefix('advanced-reports')->middleware('throttle:admin-reports')->group(function () {
            // ظپط§ط² غ²
            Route::get('/users-analysis', [AdminAdvancedReportController::class, 'usersAnalysis']);
            Route::get('/seller-performance', [AdminAdvancedReportController::class, 'sellerPerformance']);
            Route::get('/period-comparison', [AdminAdvancedReportController::class, 'periodComparison']);
            
            // ظپط§ط² غ³
            Route::get('/device-analytics', [AdminAdvancedReportController::class, 'deviceAnalytics']);
            Route::get('/basket-analysis', [AdminAdvancedReportController::class, 'basketAnalysis']);
            Route::get('/search-analytics', [AdminAdvancedReportController::class, 'searchAnalytics']);
            Route::get('/product-analytics', [AdminAdvancedReportController::class, 'productAnalytics']);
            Route::get('/chat-analytics', [AdminAdvancedReportController::class, 'chatAnalytics']);
            
            // ظپط§ط² غ´
            Route::get('/predictions', [AdminAdvancedReportController::class, 'predictions']);
            Route::get('/anomalies', [AdminAdvancedReportController::class, 'anomalies']);
        });

        // ًںڑ© Chat Reports (ع¯ط²ط§ط±ط´â€Œظ‡ط§غŒ طھط®ظ„ظپ ع†طھ)
        Route::prefix('chat-reports')->group(function () {
            Route::get('/', [AdminChatReportController::class, 'index']);
            Route::get('/stats', [AdminChatReportController::class, 'stats']);
            Route::get('/{id}', [AdminChatReportController::class, 'show']);
            Route::put('/{id}', [AdminChatReportController::class, 'update']);
            Route::post('/{id}/action', [AdminChatReportController::class, 'action']);
        });

        // ًں’¬ Chat Monitor (ظ†ط¸ط§ط±طھ ط¨ط± ع†طھâ€Œظ‡ط§)
        Route::prefix('chat-monitor')->group(function () {
            Route::get('/', [ChatMonitorController::class, 'index']);
            Route::get('/stats', [ChatMonitorController::class, 'stats']);
            Route::get('/critical', [ChatMonitorController::class, 'critical']);
            Route::get('/{id}', [ChatMonitorController::class, 'show']);
            Route::post('/{id}/intervene', [ChatMonitorController::class, 'intervene']);
            Route::post('/{id}/close', [ChatMonitorController::class, 'close']);
        });

        // ًں§  Sentiment Dashboard
        Route::prefix('sentiment')->group(function () {
            Route::get('/dashboard', [SentimentDashboardController::class, 'dashboard']);
            Route::get('/top-sellers', [SentimentDashboardController::class, 'topSellers']);
            Route::get('/alerts', [SentimentDashboardController::class, 'alerts']);
        });

        // ًںڑ« Block Management (ظ…ط¯غŒط±غŒطھ ط¨ظ„ط§ع© ع©ط§ط±ط¨ط±ط§ظ†)
        Route::prefix('blocks')->group(function () {
            Route::get('/', [BlockManagementController::class, 'index']);
            Route::get('/stats', [BlockManagementController::class, 'stats']);
            Route::post('/block', [BlockManagementController::class, 'blockByAdmin']);
            Route::delete('/{id}', [BlockManagementController::class, 'unblock']);
            Route::delete('/user/{userId}/all', [BlockManagementController::class, 'unblockAll']);
        });

        // ًں¤– FAQ Management (ظ…ط¯غŒط±غŒطھ FAQ ط³ط±ط§ط³ط±غŒ)
        Route::prefix('faq-management')->group(function () {
            Route::get('/', [FaqManagementController::class, 'index']);
            Route::get('/stats', [FaqManagementController::class, 'stats']);
            Route::post('/system', [FaqManagementController::class, 'storeSystem']);
            Route::put('/{id}', [FaqManagementController::class, 'update']);
            Route::delete('/{id}', [FaqManagementController::class, 'destroy']);
            Route::post('/{id}/toggle', [FaqManagementController::class, 'toggle']);
        });

        // ًں’، Suggestion Management (ظ…ط¯غŒط±غŒطھ ظ¾غŒط´ظ†ظ‡ط§ط¯ط§طھ ظ…ط­طµظˆظ„)
        Route::prefix('suggestions')->group(function () {
            Route::get('/stats', [SuggestionManagementController::class, 'stats']);
            Route::get('/top-performers', [SuggestionManagementController::class, 'topPerformers']);
            Route::get('/top-sellers', [SuggestionManagementController::class, 'topSellers']);
            Route::get('/settings', [SuggestionManagementController::class, 'getSettings']);
            Route::put('/settings', [SuggestionManagementController::class, 'updateSettings']);
            Route::get('/', [SuggestionManagementController::class, 'index']);
        });

        // ًں“‌ Message Templates (ظ‚ط§ظ„ط¨â€Œظ‡ط§غŒ ظ¾غŒط§ظ… ط­ط±ظپظ‡â€Œط§غŒ)
        Route::prefix('message-templates')->group(function () {
            Route::get('/', [MessageTemplateController::class, 'index']);
            Route::post('/', [MessageTemplateController::class, 'store']);
            Route::post('/seed-defaults', [MessageTemplateController::class, 'seedDefaults']);
            Route::put('/{id}', [MessageTemplateController::class, 'update']);
            Route::delete('/{id}', [MessageTemplateController::class, 'destroy']);
            Route::post('/{id}/toggle', [MessageTemplateController::class, 'toggle']);
            Route::post('/{id}/track', [MessageTemplateController::class, 'trackUsage']);
        });

        // ًںژ« Support Tickets (طھغŒع©طھâ€Œظ‡ط§غŒ ظ¾ط´طھغŒط¨ط§ظ†غŒ)
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

        // ًں’¬ Reviews Management
        Route::prefix('reviews')->group(function () {
            Route::get('/', [AdminReviewController::class, 'index']);
            Route::put('/{id}/status', [AdminReviewController::class, 'updateStatus']);
            Route::post('/{id}/reply', [AdminReviewController::class, 'reply']);
            Route::delete('/{id}', [AdminReviewController::class, 'destroy']);
            Route::post('/bulk-action', [AdminReviewController::class, 'bulkAction']);
        });

        // ًں‘¥ Users Management
        Route::prefix('users')->group(function () {
            Route::get('/', [AdminUserController::class, 'index']);
            Route::get('/{id}', [AdminUserController::class, 'show']);
            Route::put('/{id}/role', [AdminUserController::class, 'updateRole']);
            Route::put('/{id}/status', [AdminUserController::class, 'updateStatus']);
            Route::post('/{id}/approve-seller', [AdminUserController::class, 'approveSeller']);
            Route::post('/{id}/reject-seller', [AdminUserController::class, 'rejectSeller']);
            
            // ًں“¨ Seller Requests
            Route::get('/seller-requests', [AdminUserController::class, 'sellerRequests']);
            Route::post('/{id}/approve-seller-request', [AdminUserController::class, 'approveSellerRequest']);
            Route::post('/{id}/reject-seller-request', [AdminUserController::class, 'rejectSellerRequest']);
        });

        // ًں“‚ Categories Management
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

        // ًںڈ·ï¸ڈ Brands Management
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

        // ًں“¦ Products Management
        Route::prefix('products')->group(function () {
            Route::get('/', [AdminProductController::class, 'index']);
            Route::get('/stats', [AdminProductController::class, 'stats']);
            Route::get('/{id}', [AdminProductController::class, 'show']);
            Route::get('/{id}/stats', [AdminProductController::class, 'productStats']);
            Route::put('/{id}/quick-update', [AdminProductController::class, 'quickUpdate']);
            Route::delete('/{id}', [AdminProductController::class, 'destroy']);
            Route::post('/bulk-action', [AdminProductController::class, 'bulkAction']);
        });

        // ًں“‹ Orders Management
        Route::prefix('orders')->group(function () {
            Route::get('/', [AdminOrderController::class, 'index']);
            Route::get('/stats', [AdminOrderController::class, 'stats']);
            Route::get('/{id}', [AdminOrderController::class, 'show']);
            Route::put('/{id}/status', [AdminOrderController::class, 'updateStatus']);
            Route::put('/{id}/payment-status', [AdminOrderController::class, 'updatePaymentStatus']);
            Route::post('/{id}/refund', [AdminOrderController::class, 'refund']);
        });

        // ًں“¤ Report Export (ط®ط±ظˆط¬غŒ ع¯ط²ط§ط±ط´ط§طھ) - ط¨ط§ rate limit
        Route::prefix('export')->middleware('throttle:admin-reports')->group(function () {
            Route::get('/orders/excel', [ReportExportController::class, 'exportOrdersExcel']);
            Route::get('/orders/pdf', [ReportExportController::class, 'exportOrdersPdf']);
            Route::get('/users/excel', [ReportExportController::class, 'exportUsersExcel']);
            Route::get('/products/excel', [ReportExportController::class, 'exportProductsExcel']);
            Route::get('/chat/excel', [ReportExportController::class, 'exportChatExcel']);
            Route::get('/reports/excel', [ReportExportController::class, 'exportReportsExcel']);
            Route::get('/summary/pdf', [ReportExportController::class, 'exportSummaryPdf']);
        });

        // ًںژںï¸ڈ Coupons Management
        Route::prefix('coupons')->group(function () {
            Route::get('/', [CouponController::class, 'index']);
            Route::post('/', [CouponController::class, 'store']);
            Route::get('/{id}', [CouponController::class, 'show']);
            Route::put('/{id}', [CouponController::class, 'update']);
            Route::delete('/{id}', [CouponController::class, 'destroy']);
        });
    });

    // ًں”” Push Notifications
    Route::prefix('push')->group(function () {
        Route::post('/subscribe', [PushSubscriptionController::class, 'store']);
        Route::delete('/unsubscribe/{id}', [PushSubscriptionController::class, 'destroy']);
        Route::post('/test', [PushSubscriptionController::class, 'sendTest']);
        Route::get('/vapid-public-key', [PushSubscriptionController::class, 'getVapidPublicKey']);
    });
});