<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

// ایمپورت Event و Listenerهای مرتبط با سفارشات
use App\Events\Order\OrderCreated;
use App\Listeners\SendOrderConfirmationSms;
use App\Listeners\NotifySellerOfNewOrder;

// ایمپورت Model و Observer مرتبط با محصولات (برای Audit Log)
use App\Models\Product;
use App\Observers\ProductObserver;
use App\Support\SecurityLog;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     * 
     * @return void
     */
    public function register(): void
    {
        // این متد برای ثبت کلاس‌ها در Service Container استفاده می‌شود.
        // در حال حاضر نیازی به ثبت دستی سرویس خاصی در اینجا نیست.
    }

    /**
     * Bootstrap any application services.
     * 
     * @return void
     */
    public function boot(): void
    {
        // ============================================================
        // ۰. سخت‌گیری Eloquent در محیط غیرتولید
        // ============================================================
        // به‌صورت پیش‌فرض، اگر کلیدی که به create/update می‌دهید در $fillable
        // نباشد، Laravel بی‌صدا دورش می‌ریزد. یعنی یک ستون از قلم‌افتاده در
        // fillable باعث می‌شود مقدار هرگز ذخیره نشود، بدون هیچ خطا یا لاگی —
        // دقیقاً همان اتفاقی که برای جمع‌های سبد خرید افتاده بود.
        //
        // در تولید فعال نمی‌شود تا یک درخواست تکی کل صفحه را نشکند.
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());

        // ============================================================
        // ۱. ثبت Observerها (ردیابی تغییرات داده‌ها)
        // ============================================================
        // ردیابی خودکار تغییرات قیمت و موجودی محصول و ذخیره در ProductHistory
        Product::observe(ProductObserver::class);

        // ============================================================
        // ۲. ثبت Eventها و Listenerها (معماری Event-Driven)
        // ============================================================
        // ارسال پیامک تأیید سفارش به خریدار
        Event::listen(
            OrderCreated::class,
            SendOrderConfirmationSms::class,
        );

        // اطلاع‌رسانی به فروشنده درباره سفارش جدید
        Event::listen(
            OrderCreated::class,
            NotifySellerOfNewOrder::class,
        );

        // ============================================================
        // ۳. تنظیمات Rate Limiting (محدودسازی نرخ درخواست‌ها)
        // ============================================================
        // نکته معماری: تعریف Rate Limiterها در اینجا (به جای bootstrap/app.php)
        // از خطای "Facade root not resolved" در حین اجرای php artisan package:discover
        // در محیط‌های CI/CD (مانند GitHub Actions) جلوگیری می‌کند.

        // 🌍 محدودکننده عمومی API (۶۰ درخواست در دقیقه برای هر کاربر یا IP)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    SecurityLog::auth('abuse.rate_limit.hit', $request, [
                        'limiter'  => 'api',
                        'user_id'  => $request->user()?->id,
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429, $headers);
                });
        });

        // 🔐 محدودکننده احراز هویت (۱۰ درخواست در دقیقه برای جلوگیری از Brute Force)
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    SecurityLog::auth('abuse.rate_limit.hit', $request, [
                        'limiter'     => 'auth',
                        'reason'      => 'brute_force_protection',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'تعداد تلاش‌های ورود بیش از حد مجاز است.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429, $headers);
                });
        });

        // 📞 محدودکننده ارسال OTP (۳ درخواست در دقیقه برای هر IP)
        RateLimiter::for('otp', function (Request $request) {
            return Limit::perMinute(3)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    SecurityLog::auth('abuse.rate_limit.hit', $request, [
                        'limiter'     => 'otp',
                        'reason'      => 'otp_spam_protection',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'تعداد درخواست‌های OTP بیش از حد مجاز است.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429, $headers);
                });
        });

        // 🔍 محدودکننده جستجو (۳۰ درخواست در دقیقه)
        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // 📤 محدودکننده آپلود فایل (۱۰ درخواست در دقیقه)
        RateLimiter::for('upload', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // 💬 محدودکننده سیستم چت (۳۰ درخواست در دقیقه)
        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // 🎫 محدودکننده ارسال تیکت پشتیبانی (۱۰ درخواست در دقیقه)
        RateLimiter::for('tickets', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // 🏪 محدودکننده اقدامات پنل فروشندگان (۶۰ درخواست در دقیقه)
        RateLimiter::for('seller', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // 🛡️ محدودکننده اقدامات حساس ادمین (مانند Export و گزارش‌های پیشرفته)
        // (۲۰ درخواست در دقیقه برای جلوگیری از فشار ناگهانی به دیتابیس)
        RateLimiter::for('admin-reports', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        // 📍 محدودکننده‌ی اختصاصیِ جستجوی «فروشگاه‌های نزدیک» (Nearby
        // Physical Stores — Phase 11). این endpoint عمومی است (بدون نیاز
        // به ورود) و می‌تواند از سمت مرورگر با هر تغییر مکان/رفرش صفحه‌ی
        // محصول به‌طور مکرر صدا زده شود؛ عمداً از throttle:search استفاده
        // نشده چون آن یکی برای جستجوی متنی محصولات است، نه کوئری جغرافیایی.
        RateLimiter::for('nearby-stores', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });
    }
}