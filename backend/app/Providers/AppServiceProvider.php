<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ==================== Rate Limiters ====================
        
        // 🌍 Global API Rate Limiter (پیش‌فرض)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // 🔐 Authentication Rate Limiter (login/register)
        RateLimiter::for('auth', function (Request $request) {
            // اگر IP قبلاً بلاک شده، ۵ تلاش در دقیقه
            // در غیر این صورت ۱۰ تلاش در دقیقه
            return Limit::perMinute(10)->by($request->ip());
        });

        // 🔍 Search Rate Limiter (جلوگیری از scraping)
        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // 📤 Upload Rate Limiter (جلوگیری از abuse)
        RateLimiter::for('upload', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // 💬 Chat Rate Limiter (جلوگیری از spam)
        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // 🏪 Seller Actions Rate Limiter
        RateLimiter::for('seller', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // 🛡️ Admin Actions Rate Limiter (سخت‌گیرانه‌تر برای عملیات سنگین)
        RateLimiter::for('admin-reports', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        // 🎫 Ticket Rate Limiter
        RateLimiter::for('tickets', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // 📞 OTP Rate Limiter (اگر در آینده اضافه شود)
        RateLimiter::for('otp', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });
    }
}