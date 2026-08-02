<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

// ایمپورت Event و Listenerها
use App\Events\Order\OrderCreated;
use App\Listeners\SendOrderConfirmationSms;
use App\Listeners\NotifySellerOfNewOrder;

// ✅ ایمپورت‌های جدید برای Observer محصول
use App\Models\Product;
use App\Observers\ProductObserver;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // ==================== ۱. ثبت Observerها (جدید) ====================
        // ✅ ثبت Observer برای ردیابی خودکار تغییرات قیمت و موجودی محصول
        Product::observe(ProductObserver::class);

        // ==================== ۲. ثبت Eventها و Listenerها ====================
        Event::listen(
            OrderCreated::class,
            SendOrderConfirmationSms::class,
        );

        Event::listen(
            OrderCreated::class,
            NotifySellerOfNewOrder::class,
        );

        // ==================== ۳. تنظیمات Rate Limiting ====================
        
        // 🌍 Global API Rate Limiter
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // 🔐 Authentication Rate Limiter
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // 🔍 Search Rate Limiter
        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // 📤 Upload Rate Limiter
        RateLimiter::for('upload', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // 💬 Chat Rate Limiter
        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // 🏪 Seller Actions Rate Limiter
        RateLimiter::for('seller', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // 🛡️ Admin Actions Rate Limiter
        RateLimiter::for('admin-reports', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        // 🎫 Ticket Rate Limiter
        RateLimiter::for('tickets', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // 📞 OTP Rate Limiter
        RateLimiter::for('otp', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });
    }
}