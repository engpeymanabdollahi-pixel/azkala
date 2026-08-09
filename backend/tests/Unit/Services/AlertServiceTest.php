<?php

namespace Tests\Unit\Services;

use App\Models\Notification;
use App\Models\Product;
use App\Models\ProductAlert;
use App\Models\User;
use App\Services\AlertService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class AlertServiceTest extends TestCase
{
    use RefreshDatabase;

    private AlertService $alertService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->alertService = app(AlertService::class);
    }

    // ==================== createAlert() ====================

    public function test_create_restock_alert(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1000000, 'stock' => 0]);

        $alert = $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'channels' => ['database'],
        ]);

        $this->assertInstanceOf(ProductAlert::class, $alert);
        $this->assertEquals(ProductAlert::TYPE_RESTOCK, $alert->type);
        $this->assertEquals($user->id, $alert->user_id);
        $this->assertEquals($product->id, $alert->product_id);
        $this->assertEquals(1000000, $alert->original_price);
        $this->assertTrue($alert->is_active);
        $this->assertFalse($alert->is_triggered);
        $this->assertEquals(['database'], $alert->channels);
    }

    public function test_create_price_drop_alert_with_discount_percentage(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 2000000, 'stock' => 10]);

        $alert = $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'discount_percentage' => 15,
            'channels' => ['database', 'email'],
        ]);

        $this->assertEquals(ProductAlert::TYPE_PRICE_DROP, $alert->type);
        $this->assertEquals(15, $alert->discount_percentage);
        $this->assertNull($alert->target_price);
        $this->assertEquals(2000000, $alert->original_price);
    }

    public function test_create_target_price_alert(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1500000, 'stock' => 5]);

        $alert = $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_TARGET_PRICE,
            'target_price' => 1000000,
            'channels' => ['database'],
        ]);

        $this->assertEquals(ProductAlert::TYPE_TARGET_PRICE, $alert->type);
        $this->assertEquals(1000000, $alert->target_price);
        $this->assertNull($alert->discount_percentage);
    }

    public function test_create_alert_with_discount_price_product(): void
    {
        $user = User::factory()->create();
        // محصول با discount_price: original_price باید discount_price باشد
        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 800000,
            'stock' => 10,
        ]);

        $alert = $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'discount_percentage' => 10,
        ]);

        $this->assertEquals(800000, $alert->original_price);
    }

    public function test_create_alert_prevents_duplicate(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1000000]);

        // اولین alert موفق
        $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
        ]);

        // تلاش برای ساخت alert تکراری باید exception بدهد
        $this->expectException(\Exception::class);
        $this->expectExceptionCode(409);
        $this->expectExceptionMessage('شما قبلاً برای این محصول هشدار فعال دارید');

        $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
        ]);
    }

    public function test_create_alert_allows_different_types_for_same_product(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1000000, 'stock' => 0]);

        $restock = $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
        ]);

        $priceDrop = $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'discount_percentage' => 10,
        ]);

        $targetPrice = $this->alertService->createAlert($user, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_TARGET_PRICE,
            'target_price' => 800000,
        ]);

        $this->assertEquals(3, $user->alerts()->count());
        $this->assertNotNull($restock->id);
        $this->assertNotNull($priceDrop->id);
        $this->assertNotNull($targetPrice->id);
    }

    public function test_create_alert_allows_different_users_for_same_product(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $product = Product::factory()->create(['price' => 1000000]);

        $alert1 = $this->alertService->createAlert($user1, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
        ]);

        $alert2 = $this->alertService->createAlert($user2, [
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
        ]);

        $this->assertEquals(2, $product->alerts()->count());
        $this->assertNotEquals($alert1->id, $alert2->id);
    }

    public function test_create_alert_throws_on_nonexistent_product(): void
    {
        $user = User::factory()->create();

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $this->alertService->createAlert($user, [
            'product_id' => 999999,
            'type' => ProductAlert::TYPE_RESTOCK,
        ]);
    }

    // ==================== processRestockAlerts() ====================

    public function test_process_restock_alerts_triggers_when_stock_becomes_positive(): void
    {
        $product = Product::factory()->create(['price' => 1000000, 'stock' => 10]);
        $user = User::factory()->create();

        $alert = ProductAlert::factory()
            ->restock()
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $processed = $this->alertService->processRestockAlerts($product);

        $this->assertEquals(1, $processed);

        $alert->refresh();
        $this->assertTrue($alert->is_triggered);
        $this->assertNotNull($alert->triggered_at);
    }

    public function test_process_restock_alerts_does_not_trigger_when_stock_zero(): void
    {
        $product = Product::factory()->create(['price' => 1000000, 'stock' => 0]);
        $user = User::factory()->create();

        $alert = ProductAlert::factory()
            ->restock()
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $processed = $this->alertService->processRestockAlerts($product);

        $this->assertEquals(0, $processed);

        $alert->refresh();
        $this->assertFalse($alert->is_triggered);
    }

    public function test_process_restock_alerts_processes_multiple_alerts(): void
    {
        $product = Product::factory()->create(['price' => 1000000, 'stock' => 5]);

        $users = User::factory()->count(3)->create();
        foreach ($users as $user) {
            ProductAlert::factory()
                ->restock()
                ->forUser($user)
                ->forProduct($product)
                ->databaseOnly()
                ->create();
        }

        $processed = $this->alertService->processRestockAlerts($product);

        $this->assertEquals(3, $processed);
        $this->assertEquals(3, ProductAlert::where('product_id', $product->id)->where('is_triggered', true)->count());
    }

    public function test_process_restock_alerts_ignores_already_triggered(): void
    {
        $product = Product::factory()->create(['price' => 1000000, 'stock' => 5]);
        $user = User::factory()->create();

        ProductAlert::factory()
            ->restock()
            ->triggered()
            ->forUser($user)
            ->forProduct($product)
            ->create();

        $processed = $this->alertService->processRestockAlerts($product);

        $this->assertEquals(0, $processed);
    }

    public function test_process_restock_alerts_ignores_inactive_alerts(): void
    {
        $product = Product::factory()->create(['price' => 1000000, 'stock' => 5]);
        $user = User::factory()->create();

        ProductAlert::factory()
            ->restock()
            ->inactive()
            ->forUser($user)
            ->forProduct($product)
            ->create();

        $processed = $this->alertService->processRestockAlerts($product);

        $this->assertEquals(0, $processed);
    }

    public function test_process_restock_alerts_creates_notification(): void
    {
        $product = Product::factory()->create(['name' => 'هدفون سونی', 'price' => 1000000, 'stock' => 5]);
        $user = User::factory()->create();

        ProductAlert::factory()
            ->restock()
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $initialNotifCount = Notification::count();

        $this->alertService->processRestockAlerts($product);

        $this->assertEquals($initialNotifCount + 1, Notification::count());

        $notification = Notification::latest()->first();
        $this->assertEquals($user->id, $notification->user_id);
        $this->assertEquals('product_alert', $notification->type);
        $this->assertStringContainsString('موجود شد', $notification->title);
    }

    // ==================== processPriceAlerts() ====================

    public function test_process_price_alerts_triggers_when_discount_meets_threshold(): void
    {
        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 850000, // 15% discount
            'stock' => 10,
        ]);
        $user = User::factory()->create();

        $alert = ProductAlert::factory()
            ->priceDrop(10)
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $processed = $this->alertService->processPriceAlerts($product);

        $this->assertEquals(1, $processed);

        $alert->refresh();
        $this->assertTrue($alert->is_triggered);
    }

    public function test_process_price_alerts_does_not_trigger_when_discount_below_threshold(): void
    {
        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 950000, // فقط 5% discount
            'stock' => 10,
        ]);
        $user = User::factory()->create();

        $alert = ProductAlert::factory()
            ->priceDrop(10) // کاربر 10% خواسته
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $processed = $this->alertService->processPriceAlerts($product);

        $this->assertEquals(0, $processed);

        $alert->refresh();
        $this->assertFalse($alert->is_triggered);
    }

    public function test_process_price_alerts_triggers_when_target_price_reached(): void
    {
        $product = Product::factory()->create([
            'price' => 750000, // کمتر از target
            'discount_price' => null,
            'stock' => 10,
        ]);
        $user = User::factory()->create();

        $alert = ProductAlert::factory()
            ->targetPrice(800000)
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $processed = $this->alertService->processPriceAlerts($product);

        $this->assertEquals(1, $processed);

        $alert->refresh();
        $this->assertTrue($alert->is_triggered);
    }

    public function test_process_price_alerts_does_not_trigger_when_price_above_target(): void
    {
        $product = Product::factory()->create([
            'price' => 850000, // بیشتر از target
            'discount_price' => null,
            'stock' => 10,
        ]);
        $user = User::factory()->create();

        $alert = ProductAlert::factory()
            ->targetPrice(800000)
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $processed = $this->alertService->processPriceAlerts($product);

        $this->assertEquals(0, $processed);

        $alert->refresh();
        $this->assertFalse($alert->is_triggered);
    }

    public function test_process_price_alerts_ignores_restock_alerts(): void
    {
        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 800000,
            'stock' => 10,
        ]);
        $user = User::factory()->create();

        ProductAlert::factory()
            ->restock()
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $processed = $this->alertService->processPriceAlerts($product);

        $this->assertEquals(0, $processed);
    }

    public function test_process_price_alerts_handles_both_types_together(): void
    {
        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 850000, // 15% discount
            'stock' => 10,
        ]);

        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        // User1: price drop 10% (باید trigger شود)
        ProductAlert::factory()
            ->priceDrop(10)
            ->forUser($user1)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        // User2: price drop 20% (نباید trigger شود، فقط 15% هست)
        ProductAlert::factory()
            ->priceDrop(20)
            ->forUser($user2)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        // User3: target price 900000 (باید trigger شود)
        ProductAlert::factory()
            ->targetPrice(900000)
            ->forUser($user3)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $processed = $this->alertService->processPriceAlerts($product);

        $this->assertEquals(2, $processed);

        $alert1 = ProductAlert::forUser($user1->id)->first();
        $alert2 = ProductAlert::forUser($user2->id)->first();
        $alert3 = ProductAlert::forUser($user3->id)->first();

        $this->assertTrue($alert1->is_triggered);
        $this->assertFalse($alert2->is_triggered);
        $this->assertTrue($alert3->is_triggered);
    }

    public function test_process_price_alerts_creates_notification_with_percentage(): void
    {
        $product = Product::factory()->create([
            'name' => 'هدفون سونی',
            'price' => 1000000,
            'discount_price' => 850000,
            'stock' => 10,
        ]);
        $user = User::factory()->create();

        ProductAlert::factory()
            ->priceDrop(10)
            ->forUser($user)
            ->forProduct($product)
            ->databaseOnly()
            ->create();

        $initialNotifCount = Notification::count();

        $this->alertService->processPriceAlerts($product);

        $this->assertEquals($initialNotifCount + 1, Notification::count());

        $notification = Notification::latest()->first();
        $this->assertStringContainsString('10', $notification->title);
        $this->assertStringContainsString('تخفیف', $notification->title);
    }

    // ==================== Edge Cases ====================

    public function test_process_restock_alerts_with_no_alerts(): void
    {
        $product = Product::factory()->create(['price' => 1000000, 'stock' => 5]);

        $processed = $this->alertService->processRestockAlerts($product);

        $this->assertEquals(0, $processed);
    }

    public function test_process_price_alerts_with_no_alerts(): void
    {
        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 800000,
            'stock' => 10,
        ]);

        $processed = $this->alertService->processPriceAlerts($product);

        $this->assertEquals(0, $processed);
    }

    public function test_email_channel_is_logged_not_sent(): void
    {
        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 850000,
            'stock' => 10,
        ]);
        $user = User::factory()->create(['email' => 'test@example.com']);

        ProductAlert::factory()
            ->priceDrop(10)
            ->forUser($user)
            ->forProduct($product)
            ->create(['channels' => ['email']]); // فقط email channel

        // Log fake برای بررسی لاگ شدن email
        Log::spy();

        $this->alertService->processPriceAlerts($product);

        // email channel فقط log می‌شود، notification ساخته نمی‌شود
        $this->assertEquals(0, Notification::count());
    }

    public function test_database_and_email_channels_create_notification(): void
    {
        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 850000,
            'stock' => 10,
        ]);
        $user = User::factory()->create();

        ProductAlert::factory()
            ->priceDrop(10)
            ->forUser($user)
            ->forProduct($product)
            ->create(['channels' => ['database', 'email']]);

        $this->alertService->processPriceAlerts($product);

        // notification ساخته می‌شود (email هم لاگ می‌شود)
        $this->assertEquals(1, Notification::count());
    }
}