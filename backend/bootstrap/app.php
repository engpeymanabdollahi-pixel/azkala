<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;
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

        // ✅ اضافه کردن middleware های Stateful و CORS به گروه api
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

        // رکورد پیدا نشد → ۴۰۴ (نه ۵۰۰).
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'مورد درخواستی یافت نشد.',
                ], 404);
            }
        });

        // رد شدن Policy/Gate → ۴۰۳
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما مجاز به انجام این عملیات نیستید.',
                ], 403);
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
    })
    // ==================== Scheduler ====================
    ->withSchedule(function (Schedule $schedule) {
        // جمع‌آوری اخبار فارسی - هر ۱ ساعت
        $schedule->command('app:fetch-persian-news')
                 ->hourly()
                 ->withoutOverlapping()      // جلوگیری از اجرای همزمان
                 ->runInBackground()         // اجرا در background
                 ->name('fetch-persian-news')
                 ->evenInMaintenanceMode();  // حتی در حالت maintenance هم اجرا شود
        
        // پاکسازی مقالات قدیمی (اختیاری) - هر روز ساعت ۳ صبح
        // $schedule->call(function () {
        //     \App\Models\MagazineArticle::where('published_at', '<', now()->subDays(90))
        //         ->where('view_count', '<', 10)
        //         ->forceDelete();
        // })->dailyAt('03:00')->name('cleanup-old-articles');
    })
    ->create();