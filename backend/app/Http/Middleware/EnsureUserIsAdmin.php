<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // چک ۱: کاربر لاگین کرده است؟
        if (!$user) {
            return response()->json(['message' => 'لطفاً ابتدا وارد شوید.'], 401);
        }

        // چک ۲: کاربر فعال است؟
        if (!$user->is_active) {
            return response()->json(['message' => 'حساب کاربری شما غیرفعال است.'], 403);
        }

        // چک ۳: کاربر ادمین است؟
        if ($user->role !== 'admin') {
            // لاگ‌گیری تلاش ناموفق برای دسترسی ادمین
            \Log::warning("تلاش ناموفق برای دسترسی ادمین", [
                'user_id' => $user->id,
                'phone' => $user->phone,
                'current_role' => $user->role,
                'ip' => $request->ip(),
                'url' => $request->fullUrl(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'شما دسترسی به این بخش را ندارید.'
            ], 403);
        }

        // لاگ‌گیری دسترسی موفق (اختیاری)
        \Log::info("دسترسی ادمین", [
            'user_id' => $user->id,
            'phone' => $user->phone,
            'ip' => $request->ip(),
            'url' => $request->fullUrl(),
        ]);

        return $next($request);
    }
}