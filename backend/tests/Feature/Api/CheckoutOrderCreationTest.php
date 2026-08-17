<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * POST /api/v1/orders — همان مسیر واقعی که CheckoutForm.tsx صدا می‌زند.
 *
 * OrderController::store() از قبل متد $this->orderService->createOrderFromCart(...)
 * را صدا می‌زد، ولی این متد اصلاً در OrderService تعریف نشده بود — یعنی هر
 * تلاش واقعی برای ثبت سفارش، با یک \Error («Call to undefined method»)
 * کرش می‌کرد (چون \Error زیرکلاس \Exception نیست، حتی catch (\Exception $e)
 * در همان کنترلر هم آن را نمی‌گرفت). این تست همان مسیر واقعی چک‌اوت را از
 * ابتدا تا انتها بررسی می‌کند.
 */
class CheckoutOrderCreationTest extends TestCase
{
    use RefreshDatabase;

    private function shippingAddressPayload(): array
    {
        return [
            'receiver_name' => 'علی محمدی',
            'phone' => '09123456789',
            'province' => 'تهران',
            'city' => 'تهران',
            'address' => 'خیابان آزادی، پلاک ۱',
            'postal_code' => '1234567890',
        ];
    }

    public function test_customer_can_create_order_from_their_cart(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10, 'price' => 100000, 'is_active' => true]);

        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'price' => $product->price,
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'shipping_address' => $this->shippingAddressPayload(),
                'payment_method' => 'online',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $this->assertNotEmpty($response->json('data.order_number'));

        $this->assertDatabaseHas('orders', [
            'user_id' => $customer->id,
            'payment_method' => 'online',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        // ✅ موجودی محصول باید کم شده باشد
        $this->assertEquals(8, $product->fresh()->stock);

        // ✅ سبد خرید باید خالی شده باشد
        $this->assertEquals(0, $cart->items()->count());
    }

    public function test_checkout_fails_with_clear_message_when_cart_is_empty(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        Cart::create(['user_id' => $customer->id]);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'shipping_address' => $this->shippingAddressPayload(),
                'payment_method' => 'online',
            ]);

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);
    }

    public function test_checkout_fails_with_clear_message_when_stock_is_insufficient(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 1, 'is_active' => true]);

        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'price' => $product->price,
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'shipping_address' => $this->shippingAddressPayload(),
                'payment_method' => 'online',
            ]);

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);
        $this->assertStringContainsString('موجودی', $response->json('message'));

        // سفارش نباید ساخته شده باشد و موجودی نباید تغییر کرده باشد
        $this->assertDatabaseCount('orders', 0);
        $this->assertEquals(1, $product->fresh()->stock);
    }

    /**
     * ✅ قبلاً محصولات هنگام بررسی موجودی بدون lockForUpdate خوانده
     * می‌شدند — یعنی دو سفارش همزمان برای آخرین واحد موجودی می‌توانستند
     * هر دو از بررسی «موجودی کافی است» عبور کنند و stock منفی شود.
     * تست همزمانی واقعی نیازمند ابزار جداگانه (چند اتصال/فرآیند) است؛
     * این تست تضمین می‌کند که خودِ رفع باگ (قفل ردیف) در کد باقی می‌ماند
     * و به‌صورت ناخواسته در بازنویسی‌های بعدی حذف نمی‌شود.
     */
    public function test_stock_check_locks_the_product_row_to_prevent_overselling(): void
    {
        $source = file_get_contents(app_path('Services/Order/OrderService.php'));

        $this->assertStringContainsString(
            'lockForUpdate()',
            $source,
            'validateAndPrepareItems باید محصولات را با lockForUpdate بخواند تا از فروش بیش از موجودی جلوگیری شود.'
        );
    }

    // ==================== P0 Audit: Settings → Runtime Checkout ====================

    private function checkoutOnce(User $customer, Product $product, int $quantity = 1): \Illuminate\Testing\TestResponse
    {
        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'price' => $product->price,
        ]);

        return $this->actingAs($customer, 'sanctum')->postJson('/api/v1/orders', [
            'shipping_address' => $this->shippingAddressPayload(),
            'payment_method' => 'online',
        ]);
    }

    /**
     * ✅ قبل از این فیکس، این تست fail می‌شد: vat_rate ادمین هیچ اثری روی
     * total نداشت (همیشه از config('azkala.tax_rate', 9) می‌آمد).
     */
    public function test_changing_vat_rate_setting_changes_the_calculated_total(): void
    {
        Setting::set('vat_rate', '20', ['group' => 'tax', 'type' => 'number']);
        Setting::set('vat_enabled', '1', ['group' => 'tax', 'type' => 'boolean']);
        Setting::set('free_shipping_enabled', '0', ['group' => 'shipping', 'type' => 'boolean']);

        $customer = User::factory()->create(['role' => 'customer']);
        // ✅ زیر آستانه‌ی پیش‌فرض ارسال رایگان تا shipping هم ثابت بماند و
        // فقط اثر مالیات را جدا بسنجیم.
        $product = Product::factory()->create(['stock' => 10, 'price' => 100000, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertCreated();
        $order = Order::where('user_id', $customer->id)->first();

        // subtotal=100000, tax=20% => 20000, shipping=۵۰۰۰۰ (پیش‌فرض چون free_shipping خاموش است)
        $this->assertEquals(20000, (float) $order->tax);
        $this->assertEquals(170000, (float) $order->total);
    }

    /**
     * ✅ قبل از این فیکس: vat_enabled=false هیچ اثری نداشت — مالیات همیشه
     * بدون قید و شرط اعمال می‌شد.
     */
    public function test_disabling_vat_removes_tax_entirely(): void
    {
        Setting::set('vat_enabled', '0', ['group' => 'tax', 'type' => 'boolean']);
        Setting::set('vat_rate', '9', ['group' => 'tax', 'type' => 'number']);
        Setting::set('free_shipping_enabled', '0', ['group' => 'shipping', 'type' => 'boolean']);

        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10, 'price' => 100000, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertCreated();
        $order = Order::where('user_id', $customer->id)->first();

        $this->assertEquals(0, (float) $order->tax);
        // subtotal=100000 + shipping=50000 (پیش‌فرض) + tax=0
        $this->assertEquals(150000, (float) $order->total);
    }

    /**
     * ✅ price_include_tax=true: قیمت از قبل شامل مالیات است — total نباید
     * دوباره مالیات را رویش اضافه کند (که قبلاً دوبار حساب می‌شد اگر کسی
     * ساده‌لوحانه فقط tax را روی افterDiscount اضافه می‌کرد).
     */
    public function test_price_include_tax_does_not_double_count_tax_in_total(): void
    {
        Setting::set('vat_enabled', '1', ['group' => 'tax', 'type' => 'boolean']);
        Setting::set('vat_rate', '9', ['group' => 'tax', 'type' => 'number']);
        Setting::set('price_include_tax', '1', ['group' => 'tax', 'type' => 'boolean']);
        Setting::set('free_shipping_enabled', '0', ['group' => 'shipping', 'type' => 'boolean']);

        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10, 'price' => 109000, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertCreated();
        $order = Order::where('user_id', $customer->id)->first();

        // total = afterDiscount(109000) + shipping(50000) — بدون افزودن دوباره‌ی tax
        $this->assertEquals(159000, (float) $order->total);
        // ولی tax همچنان برای گزارش‌گیری/فاکتور به‌درستی از دل قیمت استخراج شده
        $this->assertEqualsWithDelta(9000, (float) $order->tax, 1.0);
    }

    /**
     * ✅ قبل از این فیکس: free_shipping_min_amount ادمین هیچ اثری نداشت —
     * آستانه همیشه از config (پیش‌فرض ۵۰۰,۰۰۰) می‌آمد.
     */
    public function test_changing_free_shipping_threshold_setting_takes_effect(): void
    {
        Setting::set('free_shipping_enabled', '1', ['group' => 'shipping', 'type' => 'boolean']);
        Setting::set('free_shipping_min_amount', '50000', ['group' => 'shipping', 'type' => 'number']);
        Setting::set('vat_enabled', '0', ['group' => 'tax', 'type' => 'boolean']);

        $customer = User::factory()->create(['role' => 'customer']);
        // قیمت دقیقاً برابر آستانه‌ی جدید (پایین‌تر از آستانه‌ی پیش‌فرض ۵۰۰,۰۰۰)
        $product = Product::factory()->create(['stock' => 10, 'price' => 60000, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertCreated();
        $order = Order::where('user_id', $customer->id)->first();

        $this->assertEquals(0, (float) $order->shipping);
        $this->assertEquals(60000, (float) $order->total);
    }

    /**
     * ✅ free_shipping_enabled=false: حتی بالای آستانه هم باید هزینه‌ی
     * ارسال گرفته شود — قبلاً این toggle اصلاً خوانده نمی‌شد.
     */
    public function test_disabling_free_shipping_charges_shipping_even_above_threshold(): void
    {
        Setting::set('free_shipping_enabled', '0', ['group' => 'shipping', 'type' => 'boolean']);
        Setting::set('vat_enabled', '0', ['group' => 'tax', 'type' => 'boolean']);

        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10, 'price' => 1000000, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertCreated();
        $order = Order::where('user_id', $customer->id)->first();

        $this->assertEquals(50000, (float) $order->shipping);
    }

    /**
     * ✅ قبل از این فیکس: min_order_amount قابل‌تنظیم بود ولی هیچ‌جا
     * enforce نمی‌شد — سفارش با هر مبلغی ثبت می‌شد.
     */
    public function test_order_below_minimum_amount_is_rejected(): void
    {
        Setting::set('min_order_amount', '200000', ['group' => 'payment', 'type' => 'number']);

        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10, 'price' => 10000, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);
        $this->assertStringContainsString('حداقل مبلغ سفارش', $response->json('message'));
        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * ✅ قبل از این فیکس: max_order_amount قابل‌تنظیم بود ولی هیچ‌جا
     * enforce نمی‌شد.
     */
    public function test_order_above_maximum_amount_is_rejected(): void
    {
        Setting::set('max_order_amount', '50000', ['group' => 'payment', 'type' => 'number']);

        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10, 'price' => 1000000, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);
        $this->assertStringContainsString('حداکثر مبلغ سفارش', $response->json('message'));
        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * ✅ min/max = ۰ (یا نبودِ Setting) یعنی «بدون محدودیت» — نباید یک
     * سفارش عادی و معقول را رد کند.
     */
    public function test_zero_min_and_max_amount_means_no_limit(): void
    {
        Setting::set('min_order_amount', '0', ['group' => 'payment', 'type' => 'number']);
        Setting::set('max_order_amount', '0', ['group' => 'payment', 'type' => 'number']);

        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create(['stock' => 10, 'price' => 100, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertCreated();
    }

    /**
     * ✅ Fallback: وقتی هیچ Setting ای اصلاً در دیتابیس seed نشده
     * (RefreshDatabase یعنی جدول settings کاملاً خالی است)، رفتار باید
     * دقیقاً همان رفتار قبلیِ مبتنی‌بر config باشد — نه خطا، نه محاسبه‌ی
     * نادرست. این تضمین می‌کند نصب‌های تازه (که هنوز seedDefaults نزده‌اند)
     * نمی‌شکنند.
     */
    public function test_falls_back_to_config_defaults_when_no_settings_exist_in_database(): void
    {
        $this->assertDatabaseCount('settings', 0);

        $customer = User::factory()->create(['role' => 'customer']);
        // زیر آستانه‌ی پیش‌فرض config (۵۰۰,۰۰۰) تا شامل هزینه‌ی ارسال پیش‌فرض باشد.
        $product = Product::factory()->create(['stock' => 10, 'price' => 100000, 'is_active' => true]);

        $response = $this->checkoutOnce($customer, $product);

        $response->assertCreated();
        $order = Order::where('user_id', $customer->id)->first();

        // subtotal=100000, tax=9%(config پیش‌فرض)=9000, shipping=50000(config پیش‌فرض)
        $this->assertEquals(9000, (float) $order->tax);
        $this->assertEquals(50000, (float) $order->shipping);
        $this->assertEquals(159000, (float) $order->total);
    }
}
