<?php

namespace App\Console\Commands;

use App\Services\PersianNewsAggregatorService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Artisan Command برای جمع‌آوری اخبار فارسی
 * 
 * استفاده:
 *   php artisan app:fetch-persian-news
 *   php artisan app:fetch-persian-news --queue
 */
class FetchPersianNewsCommand extends Command
{
    /**
     * نام command
     */
    protected $signature = 'app:fetch-persian-news 
                            {--queue : Dispatch به صف به جای اجرای sync}';

    /**
     * توضیح command
     */
    protected $description = 'جمع‌آوری اخبار فارسی از منابع RSS و NewsData.io';

    /**
     * اجرای command
     */
    public function handle(PersianNewsAggregatorService $service): int
    {
        $this->info('🚀 شروع جمع‌آوری اخبار فارسی...');
        $this->newLine();

        if ($this->option('queue')) {
            $this->info('⏳ Dispatch به صف...');
            dispatch(new \App\Jobs\FetchPersianNewsJob());
            $this->info('✅ Job با موفقیت به صف اضافه شد');
            return Command::SUCCESS;
        }

        $startTime = microtime(true);

        try {
            $stats = $service->fetchAll();
            
            $duration = round(microtime(true) - $startTime, 2);

            $this->newLine();
            $this->info('════════════════════════════════════════');
            $this->info('📊 آمار جمع‌آوری:');
            $this->info('════════════════════════════════════════');
            $this->table(
                ['معیار', 'مقدار'],
                [
                    ['کل مقالات دریافتی', $stats['total_fetched']],
                    ['کل مقالات ذخیره شده', $stats['total_saved']],
                    ['کل مقالات تکراری (skip)', $stats['total_skipped']],
                    ['تعداد منابع موفق', count($stats['by_source'])],
                    ['زمان اجرا', "{$duration} ثانیه"],
                ]
            );

            // آمار به تفکیک منبع
            if (!empty($stats['by_source'])) {
                $this->newLine();
                $this->info('📰 آمار به تفکیک منبع:');
                
                $rows = [];
                foreach ($stats['by_source'] as $source => $data) {
                    $rows[] = [
                        $data['source'] ?? $source,
                        $data['fetched'],
                        $data['saved'],
                        $data['skipped'],
                    ];
                }
                
                $this->table(
                    ['منبع', 'دریافت', 'ذخیره', 'تکراری'],
                    $rows
                );
            }

            // نمایش خطاها
            if (!empty($stats['errors'])) {
                $this->newLine();
                $this->warn('⚠️  خطاها:');
                foreach ($stats['errors'] as $error) {
                    $this->line("   - $error");
                }
            }

            $this->newLine();
            $this->info('✅ جمع‌آوری اخبار با موفقیت کامل شد!');

            Log::info('FetchPersianNewsCommand completed', $stats);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ خطا در جمع‌آوری اخبار: ' . $e->getMessage());
            Log::error('FetchPersianNewsCommand failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}