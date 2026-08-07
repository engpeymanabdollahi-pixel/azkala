<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\SellerProductController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminBrandController;
use App\Http\Controllers\Api\AdminDeviceBrandController;
use App\Http\Controllers\Api\AdminDeviceSeriesController;
use App\Http\Controllers\Api\AdminDeviceModelController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;

/**
 * @OA\OpenApi(
 *     @OA\Info(
 *         title="Azkala API",
 *         version="1.0.0",
 *         description="مستندات کامل API فروشگاه ازکالا"
 *     )
 * )
 */

// Public Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/otp/request', [AuthController::class, 'requestOtp']);
Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Product Routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/slug/{slug}', [ProductController::class, 'bySlug']);
Route::get('/products/featured', [ProductController::class, 'featured']);
Route::get('/products/special-offers', [ProductController::class, 'specialOffers']);
Route::get('/products/compatible/{modelId}', [ProductController::class, 'compatible']);
Route::post('/products/compatible-multi', [ProductController::class, 'compatibleMulti']);

// Category Routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Brand Routes  
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{brand}', [BrandController::class, 'show']);
Route::get('/brands/slug/{slug}', [BrandController::class, 'bySlug']);

// Protected Routes (Require Authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/add', [CartController::class, 'add']);
    Route::patch('/cart/update/{id}', [CartController::class, 'update']);
    Route::delete('/cart/remove/{id}', [CartController::class, 'remove']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

    // Wishlist
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/toggle/{productId}', [WishlistController::class, 'toggle']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'remove']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/my-reviews', [ReviewController::class, 'myReviews']);

    // Chat
    Route::get('/chat/conversations', [ChatController::class, 'conversations']);
    Route::get('/chat/conversation/{id}', [ChatController::class, 'conversation']);
    Route::post('/chat/send', [ChatController::class, 'sendMessage']);
    Route::get('/chat/online-status', [ChatController::class, 'getOnlineStatus']);

    // Tickets
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::post('/tickets/{ticket}/reply', [TicketController::class, 'reply']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // User Profile
    Route::get('/user/profile', [AuthController::class, 'profile']);
    Route::patch('/user/profile', [AuthController::class, 'updateProfile']);

    // My Products
    Route::get('/my-products', [ProductController::class, 'myProducts']);

    // Payment
    Route::post('/payment/initiate', [PaymentController::class, 'initiate']);
    Route::get('/payment/callback', [PaymentController::class, 'callback']);
    Route::get('/payment/verify', [PaymentController::class, 'verify']);
});

// Seller Routes
Route::middleware(['auth:sanctum', 'role:seller'])->prefix('seller')->group(function () {
    Route::get('/products', [SellerProductController::class, 'index']);
    Route::post('/products', [SellerProductController::class, 'store']);
    Route::get('/products/{product}', [SellerProductController::class, 'show']);
    Route::put('/products/{product}', [SellerProductController::class, 'update']);
    Route::delete('/products/{product}', [SellerProductController::class, 'destroy']);
    
    Route::get('/orders', [OrderController::class, 'sellerOrders']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    
    Route::get('/templates', [ProductController::class, 'getTemplates']);
});

// Admin Routes
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    
    // Products
    Route::apiResource('products', AdminProductController::class);
    
    // Orders
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
    
    // Users
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{user}', [AdminUserController::class, 'show']);
    Route::patch('/users/{user}/role', [AdminUserController::class, 'updateRole']);
    
    // Categories
    Route::apiResource('categories', AdminCategoryController::class);
    
    // Brands
    Route::apiResource('brands', AdminBrandController::class);
    
    // Device Management
    Route::apiResource('device-brands', AdminDeviceBrandController::class);
    Route::apiResource('device-series', AdminDeviceSeriesController::class);
    Route::apiResource('device-models', AdminDeviceModelController::class);
    
    // Settings
    Route::get('/settings', [AdminSettingController::class, 'index']);
    Route::patch('/settings/{key}', [AdminSettingController::class, 'update']);
    Route::post('/settings/test-smtp', [AdminSettingController::class, 'testSmtp']);
    Route::post('/settings/test-sms', [AdminSettingController::class, 'testSms']);
});

// Broadcasting Auth
Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate'])->middleware('auth:sanctum');
