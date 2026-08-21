<?php

namespace App\Http\Middleware;

use App\Services\Permission\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Support\SecurityLog;

/**
 * لایه‌ی سوم زنجیره‌ی authorization ادمین:
 *   auth:sanctum → admin role check (EnsureAdminRole) → این middleware → controller
 *
 * استفاده در route:
 *   ->middleware('permission:orders.view')
 *   ->middleware('permission:orders.manage,finance.payout')   // AND — هر دو لازم است
 *
 * این middleware جایگزین EnsureAdminRole نمی‌شود — همیشه *بعد* از آن در
 * زنجیره است (چون خودِ /admin/* group از قبل middleware('admin') دارد؛
 * این middleware فرض می‌کند کاربر از قبل رد شده). با این حال، برای دفاع
 * مضاعف، اگر روی route ای بدون EnsureAdminRole هم اشتباهاً استفاده شود،
 * باز هم عدم وجود Permission را به‌درستی رد می‌کند — فقط این‌که چک
 * صریح users.role اینجا تکرار نمی‌شود (مسئولیت EnsureAdminRole است).
 */
class EnsurePermission
{
    public function __construct(protected PermissionService $permissionService) {}

    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (empty($permissions)) {
            // یک middleware('permission:') بدون آرگومان همیشه یعنی خطای
            // پیکربندی route، نه یک باز بودن دسترسی.
            return response()->json([
                'success' => false,
                'message' => 'دسترسی غیرمجاز.',
            ], 403);
        }

        if (! $this->permissionService->userHasAllPermissions($user, $permissions)) {
            SecurityLog::auth('auth.permission.denied', $request, [
                'user_id'              => $user->id,
                'required_permissions' => $permissions,
                'reason'               => 'missing_permissions',
            ]);

            // ✅ عمداً فهرست دقیق Permission های لازم را در پاسخ لو
            // نمی‌دهیم — فقط پیام عمومی، تا کاربر بدون دسترسی نتواند
            // نقشه‌ی کامل taxonomy را از پاسخ‌های ۴۰۳ استخراج کند.
            return response()->json([
                'success' => false,
                'message' => 'شما دسترسی لازم برای انجام این عملیات را ندارید.',
            ], 403);
        }

        return $next($request);
    }
}
