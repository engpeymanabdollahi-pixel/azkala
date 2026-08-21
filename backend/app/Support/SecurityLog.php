<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Helper یکپارچه برای logging رویدادهای امنیتی.
 *
 * همه event ها به channel 'security' می‌روند.
 * همه context ها از SensitiveDataSanitizer عبور می‌کنند.
 * append-only: این کلاس فقط می‌نویسد، هرگز نمی‌خواند.
 */
class SecurityLog
{
    /**
     * ثبت یک رویداد امنیتی با context دلخواه.
     *
     * @param string $event نام event با فرمت dot-notation (مثلاً 'auth.login.success')
     * @param array  $context داده‌های ساختاریافته
     */
    public static function event(string $event, array $context = []): void
    {
        $payload = array_merge([
            'event'     => $event,
            'timestamp' => now()->toIso8601String(),
        ], $context);

        // sanitize پیش از نوشتن — هرگز داده حساس وارد log نمی‌شود
        $payload = SensitiveDataSanitizer::sanitize($payload);

        Log::channel('security')->info($event, $payload);
    }

    /**
     * ثبت رویداد امنیتی مرتبط با request (با context استاندارد HTTP).
     *
     * این متد به‌طور خودکار IP، User-Agent، route و user_id را جمع می‌کند
     * تا همه event ها ساختار یکسان داشته باشند.
     */
    public static function auth(string $event, Request $request, array $extra = []): void
    {
        self::event($event, array_merge([
            'user_id'    => $request->user()?->id,
            'ip'         => $request->ip(),
            'user_agent' => substr((string) ($request->userAgent() ?? ''), 0, 255),
            'route'      => $request->route()?->getName() ?? $request->path(),
            'method'     => $request->method(),
        ], $extra));
    }
        /**
     * ثبت رویداد امنیتی از Service Layer (که Request مستقیم ندارد).
     *
     * از request() global helper استفاده می‌کند که:
     * - در HTTP context: Request فعلی را برمی‌گرداند
     * - در CLI context (artisan, queue): null برمی‌گرداند
     *
     * کاملاً null-safe است و هیچ‌گاه استثنا نمی‌دهد.
     */
    public static function service(string $event, array $extra = []): void
    {
        $request = request();

        self::event($event, array_merge([
            'user_id'    => $request?->user()?->id,
            'ip'         => $request?->ip(),
            'user_agent' => $request ? substr((string) ($request->userAgent() ?? ''), 0, 255) : null,
            'route'      => $request?->route()?->getName() ?? ($request?->path() ?? 'cli'),
            'method'     => $request?->method() ?? 'CLI',
        ], $extra));
    }
}