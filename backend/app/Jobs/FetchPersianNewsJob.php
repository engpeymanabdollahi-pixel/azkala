<?php

namespace App\Jobs;

use App\Services\PersianNewsAggregatorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job برای جمع‌آوری اخبار فارسی در صف
 * 
 * این Job توسط Scheduler یا Command با --queue اجرا می‌شود
 */
class FetchPersianNewsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * حداکثر زمان اجرا (ثانیه)
     */
    public int $timeout = 300;

    /**
     * تعداد تلاش مجدد در صورت خطا
     */
    public int $tries = 3;

    /**
     * فاصله بین تلاش مجدد (ثانیه)
     */
    public int $backoff = 60;

    /**
     * Queue
     */
    public string $queue = 'default';

    /**
     * اجرای Job
     */
    public function handle(PersianNewsAggregatorService $service): void
    {
        Log::info('FetchPersianNewsJob: شروع اجرا');

        try {
            $startTime = microtime(true);
            $stats = $service->fetchAll();
            $duration = round(microtime(true) - $startTime, 2);

            Log::info('FetchPersianNewsJob: کامل شد', [
                'duration' => $duration,
                'total_fetched' => $stats['total_fetched'],
                'total_saved' => $stats['total_saved'],
                'total_skipped' => $stats['total_skipped'],
                'errors_count' => count($stats['errors']),
            ]);

            // اگر خطایی بود، log می‌کنیم ولی Job را fail نمی‌کنیم
            if (!empty($stats['errors'])) {
                Log::warning('FetchPersianNewsJob: برخی منابع با خطا مواجه شدند', [
                    'errors' => $stats['errors'],
                ]);
            }

        } catch (\Exception $e) {
            Log::error('FetchPersianNewsJob: خطای غیرمنتظره', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            throw $e; // برای retry شدن
        }
    }

    /**
     * وقتی Job با موفقیت کامل شد
     */
    public function handleSuccess(): void
    {
        Log::info('FetchPersianNewsJob: با موفقیت پردازش شد');
    }

    /**
     * وقتی Job fail شد (بعد از همه تلاش‌ها)
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('FetchPersianNewsJob: پس از همه تلاش‌ها fail شد', [
            'error' => $exception->getMessage(),
        ]);
    }
}