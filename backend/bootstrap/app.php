<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ✅ اصلاح redirect برای API
        $middleware->redirectUsersTo('/auth');

        // ✅ Middleware برای بروزرسانی last_seen
        $middleware->append(\App\Http\Middleware\UpdateLastSeen::class);

        // ✅ Rate Limiting پیش‌فرض برای همه API routes
        $middleware->throttleApi();

        // ✅ Middleware برای بررسی نقش ادمین
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdminRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // ✅ برای API، JSON برگرداند نه redirect
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Please login first.',
                ], 401);
            }
        });

        // ✅ مدیریت خطای Too Many Requests (429)
        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.',
                    'retry_after' => $e->getHeaders()['Retry-After'] ?? 60,
                ], 429);
            }
        });
    })->create();