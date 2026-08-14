<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Production Deployment Checklist (Azkala)

این بخش برای استقرار واقعی روی production نوشته شده — بدون این موارد، بخش‌هایی
از اپلیکیشن به‌صورت خاموش (بدون خطای قابل‌مشاهده) کار نمی‌کنند:

1. **`.env` تولید**: `APP_ENV=production`, `APP_DEBUG=false` (حتماً false — در
   غیر این‌صورت stack trace کامل به کاربر نمایش داده می‌شود)، `APP_KEY` واقعی
   (`php artisan key:generate`)، `CORS_ALLOWED_ORIGINS` و
   `SANCTUM_STATEFUL_DOMAINS` برابر دامنه‌ی واقعی فرانت‌اند (نه localhost).
2. **Queue worker همیشه‌روشن الزامی است** — چون `QUEUE_CONNECTION=database`
   است (نه `sync`)، صف‌ها فقط با یک worker فعال پردازش می‌شوند، نه خودکار:
   - ارسال پیامک OTP ثبت‌نام/ورود (`App\Jobs\SendOtpSms`, صف `sms`)
   - ایمیل/اعلان تأیید سفارش (`App\Jobs\ProcessOrderConfirmation`)
   - اطلاع‌رسانی سفارش جدید به فروشنده، هشدار بازگشت موجودی/افت قیمت
   بدون یک process دائمی `php artisan queue:work` (مثلاً زیر Supervisor یا
   systemd)، این job ها فقط در جدول `jobs` انباشته می‌شوند و کاربر واقعی هرگز
   کد OTP را دریافت نمی‌کند.
3. **Scheduler** باید هر دقیقه از cron واقعی سرور اجرا شود:
   `* * * * * php artisan schedule:run >> /dev/null 2>&1` — در غیر این‌صورت
   job زمان‌بندی‌شده‌ی جمع‌آوری اخبار (`fetch-persian-news`, ساعتی) هرگز اجرا
   نمی‌شود.
4. **`php artisan storage:link`** باید یک‌بار بعد از استقرار اجرا شود تا
   تصاویر آپلودشده (محصولات، آواتار و…) از `public/storage` قابل‌دسترسی باشند.
5. **پرداخت آنلاین**: در حال حاضر مسیر gateway واقعی (زرین‌پال/آی‌دی‌پی) در
   بک‌اند پیاده‌سازی نشده؛ جریان فعلی سفارش بر پایه‌ی تأیید دستی
   کارت‌به‌کارت (`offline_payment_enabled` + شماره کارت در تنظیمات) است. اگر
   قصد فعال‌سازی درگاه خودکار هست، باید پیش از production پیاده‌سازی و تست
   شود.
6. **Cache/Queue/Session روی `database`**: تنظیمات Redis در `.env` تعریف شده
   ولی به‌عنوان backend فعال cache/queue/session استفاده نمی‌شود
   (`CACHE_STORE=database`, `QUEUE_CONNECTION=database`,
   `SESSION_DRIVER=database`). برای اکثر بارها کافی است؛ اگر ترافیک بالا رفت،
   سوییچ به Redis یک تصمیم زیرساختی جداگانه است.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
