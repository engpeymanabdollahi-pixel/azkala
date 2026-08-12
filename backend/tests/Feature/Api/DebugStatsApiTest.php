<?php

namespace Tests\Feature\Api;

use App\Http\Controllers\Api\DebugController;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ قبلاً DebugController::stats با Product::where('status', 'active')
 * کوئری می‌زد — ستونی که روی جدول products وجود ندارد (فقط is_active
 * بولین دارد). چون Laravel برای SQLite شناسه‌ها را با کوتیشن دوتایی
 * می‌گذارد، این به‌جای خطا همیشه ۰ برمی‌گرداند؛ روی MySQL همین کد ۵۰۰
 * واقعی می‌داد.
 */
class DebugStatsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_debug_stats_correctly_counts_active_products(): void
    {
        // این روت فقط وقتی APP_ENV=local باشد ثبت می‌شود؛ سوییت تست با
        // testing اجرا می‌شود، پس مستقیم متد کنترلر را صدا می‌زنیم — دقیقاً
        // همان الگوی تست‌شده برای مسیرهای local-only دیگر (/dev/*).
        $this->app['env'] = 'local';

        Product::factory()->count(2)->create(['is_active' => true]);
        Product::factory()->create(['is_active' => false]);

        $response = app(DebugController::class)->stats();

        $data = json_decode($response->getContent(), true);
        $this->assertSame(3, $data['products']['total']);
        $this->assertSame(2, $data['products']['active']);
        $this->assertSame(1, $data['products']['inactive']);
    }
}
