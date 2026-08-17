<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ✅ فاز ۳ تسک P0 SETTINGS/SECURITY FIX: enforcement واقعی برای
 * maintenance_mode/maintenance_message که تا پیش از این کاملاً no-op
 * بودند — فقط دو ردیف Setting در دیتابیس، بدون هیچ middleware/چک در کل
 * کدبیس (تایید شده با grep قبل از این تغییر).
 *
 * قرارگیری (بوت‌استرپ در bootstrap/app.php): با appendToGroup('api', ...)
 * دقیقاً بعد از EnsureFrontendRequestsAreStateful — همان لایه‌ای که
 * UpdateLastSeen (middleware ای که از قبل global است) با موفقیت به
 * $request->user() برای هر دو حالت auth کوکی-محور (SPA) و Bearer Token
 * متکی است؛ همان الگوی اثبات‌شده اینجا هم تکرار می‌شود.
 *
 * دو استثنای عمدی — هر دو صرفاً برای جلوگیری از قفل خودزنی (self-lockout)،
 * نه اضافه کردن رفتار جدید و دلخواه:
 *   ۱. مسیرهای auth.* (ثبت‌نام/OTP/ورود) همیشه باز می‌مانند. بدون این
 *      استثنا، حتی خودِ ادمین هم — چون پیش از ورود هنوز $request->user()
 *      ندارد — نمی‌توانست دوباره وارد شود تا maintenance_mode را از پنل
 *      خاموش کند (یعنی تنها راه خروج، ویرایش مستقیم دیتابیس می‌بود).
 *   ۲. کاربر admin احراز-هویت‌شده از این گیت معاف است — دقیقاً همان
 *      تعریفی که EnsureAdminRole از قبل در کل این کدبیس استفاده می‌کند
 *      (users.role==='admin'؛ شامل هر سه‌ی manager/admin/super_admin،
 *      چون Administrative Role یک لایه‌ی جدا روی همین ستون است) — تا
 *      بتواند از پنل کار کند و در نهایت حالت تعمیر را خاموش کند.
 *
 * غیر از این دو استثنا، هر درخواست دیگر (شامل کاربر لاگین‌کرده‌ی عادی)
 * با ۵۰۳ + پیام قابل‌ویرایش رد می‌شود. توجه: فرانت‌اند فعلاً هیچ صفحه‌ی
 * اختصاصی «سایت در حال تعمیر» ندارد (تایید شده با grep) — این خارج از
 * محدوده‌ی فاز ۳ (که صریحاً فقط enforcement بکندی خواسته) است و باید در
 * گزارش نهایی به‌عنوان یک محدودیت شناخته‌شده گزارش شود.
 */
class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! (bool) Setting::get('maintenance_mode', false)) {
            return $next($request);
        }

        if (str_starts_with((string) $request->route()?->getName(), 'auth.')) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && $user->role === 'admin') {
            return $next($request);
        }

        $message = (string) Setting::get('maintenance_message', 'سایت در حال بروزرسانی است');

        return response()->json([
            'success' => false,
            'message' => $message,
            'code' => 'MAINTENANCE_MODE',
        ], 503);
    }
}
