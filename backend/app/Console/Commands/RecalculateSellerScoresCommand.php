<?php

namespace App\Console\Commands;

use App\Services\Seller\SellerPerformanceService;
use Illuminate\Console\Command;

/**
 * محاسبه‌ی دوباره‌ی امتیاز عملکرد همه‌ی فروشندگان (seller_performance_scores).
 *
 * توجه: این اسنپ‌شات فقط برای نمایش (پنل ادمین) و به‌عنوان fallback سریع
 * استفاده می‌شود؛ CommissionService در لحظه‌ی واقعیِ هر تسویه (payout) خودش
 * همیشه یک محاسبه‌ی زنده انجام می‌دهد، نه اتکا به همین اسنپ‌شات — پس اجرای
 * دیرهنگام یا نبودِ این command روی صحت مالی هیچ تسویه‌ای اثر نمی‌گذارد.
 *
 * استفاده:
 *   php artisan app:recalculate-seller-scores
 */
class RecalculateSellerScoresCommand extends Command
{
    protected $signature = 'app:recalculate-seller-scores';

    protected $description = 'محاسبه‌ی دوباره‌ی امتیاز عملکرد و سطح همه‌ی فروشندگان';

    public function handle(SellerPerformanceService $service): int
    {
        $this->info('🚀 محاسبه‌ی امتیاز عملکرد فروشندگان...');

        $count = $service->recalculateAll();

        $this->info("✅ امتیاز {$count} فروشنده محاسبه شد.");

        return self::SUCCESS;
    }
}
