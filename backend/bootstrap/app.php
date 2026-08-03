<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // تنظیم redirect برای کاربران غیر وارد شده
        $middleware->redirectUsersTo('/auth');
        
        // Middleware برای بروزرسانی last_seen
        $middleware->append(\App\Http\Middleware\UpdateLastSeen::class);
        
        // ❌ حذف شده: $middleware->throttleApi();
        // دلیل: این دستور در مرحله package:discover باعث خطای Facade می‌شود
        // Rate limiting همچنان کار می‌کند چون در routes/api.php اعمال شده است
        
        // ✅ اضافه کردن میدلورهای Stateful و CORS به گروه api
        $middleware->appendToGroup('api', [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        
        // Middleware برای دسترسی ادمین
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdminRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // مدیریت AuthenticationException برای API
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Please login first.',
                ], 401);
            }
        });
        
        // مدیریت Too Many Requests (429)
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