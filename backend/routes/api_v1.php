<?php

use Illuminate\Support\Facades\Route;

// ═══════════════════════════════════════════════════════════════
// 📌 API v1 - نسخه جدید با ساختار استاندارد
// ═══════════════════════════════════════════════════════════════

// Health Check
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Azkala API v1 is working!',
        'version' => '1.0.0',
        'timestamp' => now()->toDateTimeString(),
    ]);
});

// ═══════════════════════════════════════════════════════════════
// 🔓 PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════

// Auth
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
});

// Categories
Route::get('/categories', [\App\Http\Controllers\Api\CategoryController::class, 'index']);
Route::get('/categories/{category}', [\App\Http\Controllers\Api\CategoryController::class, 'show']);

// Brands
Route::get('/brands', [\App\Http\Controllers\Api\BrandController::class, 'index']);
Route::get('/brands/{brand}', [\App\Http\Controllers\Api\BrandController::class, 'show']);

// Devices (Device-First)
Route::prefix('devices')->group(function () {
    Route::get('/brands', [\App\Http\Controllers\Api\DeviceController::class, 'brands']);
    Route::get('/brands/{brandId}/series', [\App\Http\Controllers\Api\DeviceController::class, 'series']);
    Route::get('/series/{seriesId}/models', [\App\Http\Controllers\Api\DeviceController::class, 'models']);
    Route::get('/models/{modelId}', [\App\Http\Controllers\Api\DeviceController::class, 'model']);
});

// Products
Route::prefix('products')->group(function () {
    Route::get('/featured', [\App\Http\Controllers\Api\ProductController::class, 'featured']);
    Route::get('/special-offers', [\App\Http\Controllers\Api\ProductController::class, 'specialOffers']);
    Route::get('/compatible/{modelId}', [\App\Http\Controllers\Api\ProductController::class, 'compatible']);
    Route::post('/compatible-multi', [\App\Http\Controllers\Api\ProductController::class, 'compatibleMulti']);
    Route::get('/slug/{slug}', [\App\Http\Controllers\Api\ProductController::class, 'bySlug']);
    
    Route::middleware('throttle:search')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ProductController::class, 'index']);
    });
    
    Route::get('/{product}', [\App\Http\Controllers\Api\ProductController::class, 'show']);
    Route::get('/{productId}/reviews', [\App\Http\Controllers\Api\ReviewController::class, 'index']);
});

// ═══════════════════════════════════════════════════════════════
// 🔒 PROTECTED ROUTES (auth:sanctum)
// ═══════════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->group(function () {
    
    // User Profile
    Route::prefix('user')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\AuthController::class, 'user']);
        Route::put('/', [\App\Http\Controllers\Api\AuthController::class, 'update']);
        Route::post('/change-password', [\App\Http\Controllers\Api\AuthController::class, 'changePassword']);
        Route::get('/devices', [\App\Http\Controllers\Api\UserDeviceController::class, 'index']);
        Route::post('/devices', [\App\Http\Controllers\Api\UserDeviceController::class, 'store']);
        Route::delete('/devices/{deviceId}', [\App\Http\Controllers\Api\UserDeviceController::class, 'destroy']);
    });
    
    // Logout
    Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    
    // Wishlist
    Route::prefix('wishlist')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\WishlistController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\WishlistController::class, 'store']);
        Route::delete('/{productId}', [\App\Http\Controllers\Api\WishlistController::class, 'destroy']);
        Route::get('/check/{productId}', [\App\Http\Controllers\Api\WishlistController::class, 'check']);
    });
    
    // Addresses
    Route::prefix('addresses')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\AddressController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\AddressController::class, 'store']);
        Route::put('/{addressId}', [\App\Http\Controllers\Api\AddressController::class, 'update']);
        Route::delete('/{addressId}', [\App\Http\Controllers\Api\AddressController::class, 'destroy']);
        Route::put('/{addressId}/default', [\App\Http\Controllers\Api\AddressController::class, 'setDefault']);
    });
    
    // Cart
    Route::prefix('cart')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\CartController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\CartController::class, 'store']);
        Route::put('/items/{itemId}', [\App\Http\Controllers\Api\CartController::class, 'update']);
        Route::delete('/items/{itemId}', [\App\Http\Controllers\Api\CartController::class, 'destroy']);
        Route::delete('/', [\App\Http\Controllers\Api\CartController::class, 'clear']);
    });
    
    // Orders
    Route::prefix('orders')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\OrderController::class, 'index']);
        Route::get('/{orderId}', [\App\Http\Controllers\Api\OrderController::class, 'show']);
        Route::post('/', [\App\Http\Controllers\Api\OrderController::class, 'store']);
        Route::post('/{orderId}/cancel', [\App\Http\Controllers\Api\OrderController::class, 'cancel']);
    });
    
    // Coupons
    Route::prefix('coupons')->group(function () {
        Route::post('/validate', [\App\Http\Controllers\Api\CouponController::class, 'validateCoupon']);
        Route::get('/my', [\App\Http\Controllers\Api\CouponController::class, 'myCoupons']);
    });
    
    // Reviews
    Route::prefix('reviews')->group(function () {
        Route::post('/', [\App\Http\Controllers\Api\ReviewController::class, 'store']);
        Route::put('/{reviewId}', [\App\Http\Controllers\Api\ReviewController::class, 'update']);
        Route::delete('/{reviewId}', [\App\Http\Controllers\Api\ReviewController::class, 'destroy']);
        Route::post('/{reviewId}/helpful', [\App\Http\Controllers\Api\ReviewController::class, 'helpful']);
    });
    Route::get('/products/{productId}/can-review', [\App\Http\Controllers\Api\ReviewController::class, 'canReview']);
    
    // ═══════════════════════════════════════════════════════════
    // 🏪 SELLER ROUTES
    // ═══════════════════════════════════════════════════════════
    Route::prefix('seller')->middleware('throttle:seller')->group(function () {
        Route::get('/dashboard/stats', [\App\Http\Controllers\Api\SellerDashboardController::class, 'stats']);
        
        Route::prefix('products')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\SellerProductController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\SellerProductController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\SellerProductController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\SellerProductController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\SellerProductController::class, 'destroy']);
        });
        
        Route::prefix('orders')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\SellerOrderController::class, 'index']);
            Route::get('/stats', [\App\Http\Controllers\Api\SellerOrderController::class, 'stats']);
            Route::get('/{orderId}', [\App\Http\Controllers\Api\SellerOrderController::class, 'show']);
            Route::put('/{orderId}/status', [\App\Http\Controllers\Api\SellerOrderController::class, 'updateStatus']);
        });
        
        Route::prefix('quick-replies')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\SellerQuickReplyController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\SellerQuickReplyController::class, 'store']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\SellerQuickReplyController::class, 'destroy']);
        });
    });
    
    // ═══════════════════════════════════════════════════════════
    // 🛠️ ADMIN ROUTES
    // ═══════════════════════════════════════════════════════════
    Route::prefix('admin')->middleware('admin')->group(function () {
        
        // Dashboard
        Route::prefix('dashboard')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Api\AdminDashboardController::class, 'stats']);
            Route::get('/chat-stats', [\App\Http\Controllers\Api\AdminDashboardController::class, 'chatStats']);
            Route::get('/sentiment-stats', [\App\Http\Controllers\Api\AdminDashboardController::class, 'sentimentStats']);
            Route::get('/recent-chat-activity', [\App\Http\Controllers\Api\AdminDashboardController::class, 'recentChatActivity']);
        });
        
        // Products Management
        Route::prefix('products')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\AdminProductController::class, 'index']);
            Route::get('/stats', [\App\Http\Controllers\Api\AdminProductController::class, 'stats']);
            Route::get('/{id}', [\App\Http\Controllers\Api\AdminProductController::class, 'show']);
            Route::get('/{id}/stats', [\App\Http\Controllers\Api\AdminProductController::class, 'productStats']);
            Route::put('/{id}/quick-update', [\App\Http\Controllers\Api\AdminProductController::class, 'quickUpdate']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\AdminProductController::class, 'destroy']);
            Route::post('/bulk-action', [\App\Http\Controllers\Api\AdminProductController::class, 'bulkAction']);
        });
        
        // Orders Management
        Route::prefix('orders')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\AdminOrderController::class, 'index']);
            Route::get('/stats', [\App\Http\Controllers\Api\AdminOrderController::class, 'stats']);
            Route::get('/{id}', [\App\Http\Controllers\Api\AdminOrderController::class, 'show']);
            Route::put('/{id}/status', [\App\Http\Controllers\Api\AdminOrderController::class, 'updateStatus']);
            Route::put('/{id}/payment-status', [\App\Http\Controllers\Api\AdminOrderController::class, 'updatePaymentStatus']);
            Route::post('/{id}/refund', [\App\Http\Controllers\Api\AdminOrderController::class, 'refund']);
        });
        
        // Users Management
        Route::prefix('users')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\AdminUserController::class, 'index']);
            Route::get('/seller-requests', [\App\Http\Controllers\Api\AdminUserController::class, 'sellerRequests']);
            Route::get('/{id}', [\App\Http\Controllers\Api\AdminUserController::class, 'show']);
            Route::put('/{id}/role', [\App\Http\Controllers\Api\AdminUserController::class, 'updateRole']);
            Route::put('/{id}/status', [\App\Http\Controllers\Api\AdminUserController::class, 'updateStatus']);
            Route::post('/{id}/approve-seller', [\App\Http\Controllers\Api\AdminUserController::class, 'approveSeller']);
            Route::post('/{id}/reject-seller', [\App\Http\Controllers\Api\AdminUserController::class, 'rejectSeller']);
            Route::post('/{id}/approve-seller-request', [\App\Http\Controllers\Api\AdminUserController::class, 'approveSellerRequest']);
            Route::post('/{id}/reject-seller-request', [\App\Http\Controllers\Api\AdminUserController::class, 'rejectSellerRequest']);
        });
        
        // Categories Management
        Route::prefix('categories')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\AdminCategoryController::class, 'index']);
            Route::get('/tree', [\App\Http\Controllers\Api\AdminCategoryController::class, 'tree']);
            Route::post('/', [\App\Http\Controllers\Api\AdminCategoryController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\AdminCategoryController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\AdminCategoryController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\AdminCategoryController::class, 'destroy']);
            Route::put('/reorder', [\App\Http\Controllers\Api\AdminCategoryController::class, 'reorder']);
            Route::post('/bulk-action', [\App\Http\Controllers\Api\AdminCategoryController::class, 'bulkAction']);
        });
        
        // Brands Management
        Route::prefix('brands')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\AdminBrandController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\AdminBrandController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\Api\AdminBrandController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\Api\AdminBrandController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\AdminBrandController::class, 'destroy']);
            Route::post('/{id}/verify', [\App\Http\Controllers\Api\AdminBrandController::class, 'verify']);
            Route::post('/{id}/unverify', [\App\Http\Controllers\Api\AdminBrandController::class, 'unverify']);
            Route::post('/bulk-action', [\App\Http\Controllers\Api\AdminBrandController::class, 'bulkAction']);
        });
        
        // Reviews Management
        Route::prefix('reviews')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\AdminReviewController::class, 'index']);
            Route::put('/{id}/status', [\App\Http\Controllers\Api\AdminReviewController::class, 'updateStatus']);
            Route::post('/{id}/reply', [\App\Http\Controllers\Api\AdminReviewController::class, 'reply']);
            Route::delete('/{id}', [\App\Http\Controllers\Api\AdminReviewController::class, 'destroy']);
            Route::post('/bulk-action', [\App\Http\Controllers\Api\AdminReviewController::class, 'bulkAction']);
        });
        
        // Settings Management
        Route::prefix('settings')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\AdminSettingController::class, 'index']);
            Route::post('/seed-defaults', [\App\Http\Controllers\Api\AdminSettingController::class, 'seedDefaults']);
            Route::post('/update-group/{group}', [\App\Http\Controllers\Api\AdminSettingController::class, 'updateGroup']);
            Route::put('/{key}', [\App\Http\Controllers\Api\AdminSettingController::class, 'update']);
            Route::post('/{key}/toggle-lock', [\App\Http\Controllers\Api\AdminSettingController::class, 'toggleLock']);
            Route::get('/history', [\App\Http\Controllers\Api\AdminSettingController::class, 'history']);
            Route::post('/rollback/{historyId}', [\App\Http\Controllers\Api\AdminSettingController::class, 'rollback']);
            Route::get('/export', [\App\Http\Controllers\Api\AdminSettingController::class, 'export']);
            Route::post('/import', [\App\Http\Controllers\Api\AdminSettingController::class, 'import']);
            Route::post('/test-smtp', [\App\Http\Controllers\Api\AdminSettingController::class, 'testSmtp']);
            Route::post('/test-sms', [\App\Http\Controllers\Api\AdminSettingController::class, 'testSms']);
        });
        
        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/overview', [\App\Http\Controllers\Api\AdminReportController::class, 'overview']);
            Route::get('/dashboard', [\App\Http\Controllers\Api\AdminReportController::class, 'dashboard']);
            Route::get('/sales-chart', [\App\Http\Controllers\Api\AdminReportController::class, 'salesChart']);
            Route::get('/top-products', [\App\Http\Controllers\Api\AdminReportController::class, 'topProducts']);
            Route::get('/top-categories', [\App\Http\Controllers\Api\AdminReportController::class, 'topCategories']);
            Route::get('/order-status', [\App\Http\Controllers\Api\AdminReportController::class, 'orderStatus']);
            Route::get('/top-sellers', [\App\Http\Controllers\Api\AdminReportController::class, 'topSellers']);
        });
    });
});