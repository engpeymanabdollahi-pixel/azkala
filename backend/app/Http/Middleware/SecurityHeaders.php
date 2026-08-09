<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * هدرهای امنیتی پایه روی همه‌ی پاسخ‌های API.
 *
 * ✅ قبلاً هیچ‌کدام از این هدرها ست نمی‌شدند (گزارش Qwen Code — SEC-09).
 * این‌ها فقط سخت‌گیری اضافه‌اند و هیچ رفتار موجودی را عوض نمی‌کنند؛ برای
 * همین بدون نیاز به تصمیم کسب‌وکاری اضافه شدند (برخلاف مثلاً درگاه پرداخت).
 */
class SecurityHeaders
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-XSS-Protection', '0'); // مرورگرهای مدرن خودشان CSP دارند؛ فیلتر قدیمی XSS گاهی خودش سوءاستفاده‌پذیر بود
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        return $response;
    }
}
