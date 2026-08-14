<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ✅ قبلاً کل گروه Route::prefix('seller') (داشبورد، محصولات، آپلود گروهی،
 * سفارشات، تنظیمات) فقط auth:sanctum داشت — یعنی هر کاربر لاگین‌شده (حتی
 * role=customer یا pending_seller که هنوز درخواست فروشندگی‌اش تایید نشده)
 * می‌توانست مستقیماً محصول واقعی در مارکت‌پلیس بسازد و کل مسیر تایید
 * فروشندگی (SellerRequest) را دور بزند. گروه admin دقیقاً همین یک خط پایین‌تر
 * middleware('admin') دارد؛ همان الگو اینجا هم اعمال می‌شود.
 */
class EnsureSellerRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->role !== 'seller') {
            return response()->json([
                'success' => false,
                'message' => 'دسترسی غیرمجاز. فقط فروشندگان تاییدشده می‌توانند به این بخش دسترسی داشته باشند.',
            ], 403);
        }

        return $next($request);
    }
}
