<?php

namespace Tests\Feature;

use App\Models\CommissionRule;
use App\Models\Order;
use App\Models\Product;
use App\Models\SellerTransaction;
use App\Models\Setting;
use App\Models\User;
use App\Services\Admin\AdminOrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerCommissionPayoutTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrderWithSeller(User $seller, float $total = 100000): Order
    {
        $product = Product::factory()->create(['seller_id' => $seller->id, 'price' => $total]);
        $order = Order::factory()->create(['status' => 'processing', 'total' => $total]);
        $order->items()->create([
            'product_id' => $product->id,
            'seller_id' => $seller->id,
            'quantity' => 1,
            'price' => $total,
            'total' => $total,
        ]);

        return $order;
    }

    public function test_payout_uses_seller_override_rate_not_score(): void
    {
        Setting::set('commission_new_seller_score', 95, ['group' => 'commission', 'type' => 'number']); // یعنی اگر override نبود، باید platinum/1% می‌شد
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 6.0]);
        $order = $this->makeOrderWithSeller($seller, 100000);

        app(AdminOrderService::class)->updateStatus($order->id, ['status' => 'delivered']);

        $seller->refresh();
        $this->assertEquals(94000, (float) $seller->wallet_balance); // 100000 - 6%
        $this->assertDatabaseHas('seller_transactions', [
            'order_id' => $order->id,
            'seller_id' => $seller->id,
            'type' => 'payout',
            'commission_rate' => 6.00,
            'commission_source' => 'override',
        ]);
    }

    /**
     * ✅ تست رگرسیون برای باگ واقعی که در حین ساخت این سیستم پیدا و رفع شد:
     * قبلاً type='order_payout' بود که در CHECK constraint واقعی enum ستون
     * type وجود نداشت — یعنی INSERT همیشه شکست می‌خورد و wallet_balance
     * هرگز واقعاً افزایش نمی‌یافت، بدون هیچ خطای قابل‌مشاهده برای ادمین.
     */
    public function test_payout_actually_persists_with_valid_transaction_type(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 2.0]);
        $order = $this->makeOrderWithSeller($seller, 50000);

        app(AdminOrderService::class)->updateStatus($order->id, ['status' => 'delivered']);

        $seller->refresh();
        $this->assertGreaterThan(0, (float) $seller->wallet_balance);
        $this->assertDatabaseHas('seller_transactions', [
            'order_id' => $order->id,
            'type' => 'payout',
            'status' => 'completed',
        ]);
    }

    public function test_score_based_rate_matches_the_rule_for_the_recorded_level(): void
    {
        // بدون override — باید از مسیر Score/Rule محاسبه شود، نه مقدار
        // پیش‌فرض «فروشنده‌ی جدید» (چون تا لحظه‌ی پردازش payout، همین
        // سفارش خودش already delivered شده و دیگر «بدون سابقه» نیست).
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => null]);
        $order = $this->makeOrderWithSeller($seller, 100000);

        app(AdminOrderService::class)->updateStatus($order->id, ['status' => 'delivered']);

        $tx = SellerTransaction::where('order_id', $order->id)->where('type', 'payout')->first();
        $this->assertEquals('score_rule', $tx->commission_source);
        $this->assertNotNull($tx->seller_level);

        $matchingRule = CommissionRule::where('level', $tx->seller_level)->first();
        $this->assertNotNull($matchingRule, 'سطح ثبت‌شده باید متناظر با یک Commission Rule واقعی باشد');
        $this->assertEquals((float) $matchingRule->commission_rate, (float) $tx->commission_rate);
    }

    public function test_seller_with_poor_history_lands_in_bronze_with_highest_rate(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => null]);

        // سابقه‌ی ضعیف: ۳ سفارش لغوشده قبلی + یک سفارش موفق فعلی -> نرخ موفقیت پایین
        $this->makeOrderWithSeller($seller, 50000)->update(['status' => 'cancelled']);
        $this->makeOrderWithSeller($seller, 50000)->update(['status' => 'cancelled']);
        $this->makeOrderWithSeller($seller, 50000)->update(['status' => 'cancelled']);
        $order = $this->makeOrderWithSeller($seller, 100000);

        app(AdminOrderService::class)->updateStatus($order->id, ['status' => 'delivered']);

        $tx = SellerTransaction::where('order_id', $order->id)->where('type', 'payout')->first();
        $this->assertEquals('bronze', $tx->seller_level);
        $this->assertEquals(4.00, (float) $tx->commission_rate);
    }

    public function test_repeated_status_transitions_do_not_duplicate_payout(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 2.0]);
        $order = $this->makeOrderWithSeller($seller, 100000);

        $service = app(AdminOrderService::class);
        $service->updateStatus($order->id, ['status' => 'delivered']);
        $balanceAfterFirst = $seller->refresh()->wallet_balance;

        // شبیه‌سازی delivered->shipped->delivered (یا دوبار درخواست هم‌زمان)
        $service->updateStatus($order->id, ['status' => 'shipped']);
        $service->updateStatus($order->id, ['status' => 'delivered']);

        $this->assertEquals(1, SellerTransaction::where('order_id', $order->id)->where('type', 'payout')->count());
        $this->assertEquals((float) $balanceAfterFirst, (float) $seller->refresh()->wallet_balance);
    }

    public function test_cancelled_order_never_triggers_a_payout(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 2.0]);
        $order = $this->makeOrderWithSeller($seller, 100000);

        app(AdminOrderService::class)->updateStatus($order->id, ['status' => 'cancelled']);

        $this->assertEquals(0, (float) $seller->refresh()->wallet_balance);
        $this->assertDatabaseMissing('seller_transactions', ['order_id' => $order->id, 'type' => 'payout']);
    }

    /**
     * الزام صریح: تغییر Commission Rule بعد از یک تسویه‌ی قبلی نباید آن
     * تسویه‌ی قدیمی را دوباره محاسبه/تغییر دهد.
     */
    public function test_changing_commission_rule_does_not_affect_past_transactions(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => null]);
        $order = $this->makeOrderWithSeller($seller, 100000);

        app(AdminOrderService::class)->updateStatus($order->id, ['status' => 'delivered']);

        $tx = SellerTransaction::where('order_id', $order->id)->where('type', 'payout')->first();
        $originalRate = (float) $tx->commission_rate;
        $originalAmount = (float) $tx->amount;
        $originalLevel = $tx->seller_level;
        $this->assertNotNull($originalLevel);

        // ادمین بعداً نرخ همان سطحی که به این تراکنش اختصاص یافته را عوض
        // می‌کند (مقدار جدید عمداً داخل بازه‌ی مجاز پیش‌فرض [1,4] انتخاب
        // شده تا با clamp تداخل نکند و تست فقط «آیا تسویه‌ی بعدی نرخ جدید
        // را می‌بیند» را بسنجد، نه رفتار clamp که جدا تست شده).
        $newRate = $originalRate >= 2.5 ? 1.5 : 3.5;
        CommissionRule::where('level', $originalLevel)->update(['commission_rate' => $newRate]);

        $tx->refresh();
        $this->assertEquals($originalRate, (float) $tx->commission_rate, 'نرخ ثبت‌شده روی تراکنش قدیمی نباید تغییر کند');
        $this->assertEquals($originalAmount, (float) $tx->amount, 'مبلغ تراکنش قدیمی نباید تغییر کند');

        // ولی تسویه‌ی *بعدی* باید نرخ جدید را ببیند — یعنی تغییر واقعاً اثر دارد، فقط نه روی گذشته
        $order2 = $this->makeOrderWithSeller($seller, 100000);
        app(AdminOrderService::class)->updateStatus($order2->id, ['status' => 'delivered']);
        $tx2 = SellerTransaction::where('order_id', $order2->id)->where('type', 'payout')->first();
        if ($tx2->seller_level === $originalLevel) {
            $this->assertEquals($newRate, (float) $tx2->commission_rate);
        }
    }

    public function test_wallet_increment_is_atomic_under_concurrent_style_calls(): void
    {
        // شبیه‌سازی race با فراخوانی متوالی سریع روی دو سفارش مستقل برای
        // یک فروشنده — هر دو باید صحیح جمع بخورند، نه بازنویسی هم.
        $seller = User::factory()->create(['role' => 'seller', 'seller_commission_rate' => 2.0]);
        $order1 = $this->makeOrderWithSeller($seller, 50000);
        $order2 = $this->makeOrderWithSeller($seller, 70000);

        $service = app(AdminOrderService::class);
        $service->updateStatus($order1->id, ['status' => 'delivered']);
        $service->updateStatus($order2->id, ['status' => 'delivered']);

        $expected = (50000 * 0.98) + (70000 * 0.98);
        $this->assertEquals($expected, (float) $seller->refresh()->wallet_balance);
    }
}
