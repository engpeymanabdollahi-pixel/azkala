<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class AzkalaSyncCommand extends Command
{
    protected $signature = 'azkala:sync {--fresh : پاک کردن کامل کش‌ها}';
    protected $description = 'همگام‌سازی دیتابیس و کش بعد از git pull یا bundle merge';

    public function handle(): int
    {
        $this->info('🔄 شروع همگام‌سازی ازکالا...');

        // ۱. اجرای migration ها
        $this->info('۱. اجرای migration ها...');
        Artisan::call('migrate', ['--force' => true]);
        $this->line(Artisan::output());

        // ۲. پاک کردن کش‌ها
        $this->info('۲. پاک کردن کش‌ها...');
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        // ۳. پاک کردن کش‌های خاص
        $this->info('۳. پاک کردن کش‌های خاص...');
        foreach ([10, 20, 50, 100] as $limit) {
            Cache::forget('featured_products_'.$limit);
            Cache::forget('featured_product_ids_'.$limit);
        }

        // ۴. Seed permissions جدید (اگر باشد)
        $this->info('۴. Seed permissions...');
        try {
            Artisan::call('db:seed', ['--class' => 'AdministrativeAccessSeeder', '--force' => true]);
        } catch (\Exception $e) {
            $this->warn('Seeder اجرا نشد: '.$e->getMessage());
        }

        $this->info('✅ همگام‌سازی کامل شد!');
        return self::SUCCESS;
    }
}