<?php

namespace Tests\Unit\Models;

use App\Models\Product;
use App\Models\ProductAlert;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ProductAlertTest extends TestCase
{
    use RefreshDatabase;

    // ==================== Creation Tests ====================

    public function test_can_create_product_alert(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1000000]);

        $alert = ProductAlert::factory()
            ->restock()
            ->forUser($user)
            ->forProduct($product)
            ->create();

        $this->assertDatabaseHas('product_alerts', [
            'id' => $alert->id,
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'is_active' => true,
            'is_triggered' => false,
        ]);
    }

    public function test_can_create_target_price_alert(): void
    {
        $alert = ProductAlert::factory()
            ->targetPrice(800000)
            ->create(['original_price' => 1000000]);

        $this->assertEquals(ProductAlert::TYPE_TARGET_PRICE, $alert->type);
        $this->assertEquals(800000, $alert->target_price);
        $this->assertTrue($alert->isTargetPriceAlert());
    }

    public function test_can_create_price_drop_alert_with_percentage(): void
    {
        $alert = ProductAlert::factory()
            ->priceDrop(15)
            ->create(['original_price' => 1000000]);

        $this->assertEquals(ProductAlert::TYPE_PRICE_DROP, $alert->type);
        $this->assertEquals(15, $alert->discount_percentage);
        $this->assertTrue($alert->isPriceDropAlert());
        $this->assertNull($alert->target_price);
    }

    public function test_unique_constraint_on_user_product_type(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1000000]);

        ProductAlert::factory()
            ->restock()
            ->forUser($user)
            ->forProduct($product)
            ->create();

        $this->expectException(\Illuminate\Database\QueryException::class);

        // تلاش برای ساخت alert تکراری با همان type
        ProductAlert::factory()
            ->restock()
            ->forUser($user)
            ->forProduct($product)
            ->create();
    }

    public function test_same_user_product_can_have_different_types(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1000000]);

        $restock = ProductAlert::factory()
            ->restock()
            ->forUser($user)
            ->forProduct($product)
            ->create();

        $priceDrop = ProductAlert::factory()
            ->priceDrop(10)
            ->forUser($user)
            ->forProduct($product)
            ->create();

        $targetPrice = ProductAlert::factory()
            ->targetPrice(800000)
            ->forUser($user)
            ->forProduct($product)
            ->create();

        $this->assertEquals(3, ProductAlert::count());
        $this->assertNotNull($restock->id);
        $this->assertNotNull($priceDrop->id);
        $this->assertNotNull($targetPrice->id);
    }

    // ==================== Relationships ====================

    public function test_alert_belongs_to_user_and_product(): void
    {
        $alert = ProductAlert::factory()->create();

        $this->assertInstanceOf(User::class, $alert->user);
        $this->assertInstanceOf(Product::class, $alert->product);
        $this->assertEquals($alert->user_id, $alert->user->id);
        $this->assertEquals($alert->product_id, $alert->product->id);
    }

    public function test_user_has_many_alerts(): void
    {
        $user = User::factory()->create();
        ProductAlert::factory()->count(3)->forUser($user)->create();

        $this->assertEquals(3, $user->alerts()->count());
    }

    public function test_product_has_many_alerts(): void
    {
        $product = Product::factory()->create(['price' => 1000000]);
        ProductAlert::factory()->count(3)->forProduct($product)->create();

        $this->assertEquals(3, $product->alerts()->count());
    }

    // ==================== Scopes ====================

    public function test_active_scope(): void
    {
        ProductAlert::factory()->count(2)->active()->create();
        ProductAlert::factory()->inactive()->create();

        $this->assertEquals(2, ProductAlert::active()->count());
    }

    public function test_triggered_scope(): void
    {
        ProductAlert::factory()->triggered()->create();
        ProductAlert::factory()->count(2)->active()->create();

        $this->assertEquals(1, ProductAlert::triggered()->count());
    }

    public function test_not_triggered_scope(): void
    {
        ProductAlert::factory()->triggered()->create();
        ProductAlert::factory()->count(3)->active()->create();

        $this->assertEquals(3, ProductAlert::notTriggered()->count());
    }

    public function test_pending_scope_is_alias_for_ready_for_processing(): void
    {
        ProductAlert::factory()->count(2)->active()->create();
        ProductAlert::factory()->inactive()->create();
        ProductAlert::factory()->triggered()->create();

        $pending = ProductAlert::pending()->count();
        $ready = ProductAlert::readyForProcessing()->count();

        $this->assertEquals($pending, $ready);
        $this->assertEquals(2, $pending);
    }

    public function test_restock_scope(): void
    {
        ProductAlert::factory()->count(2)->restock()->create();
        ProductAlert::factory()->priceDrop(10)->create();
        ProductAlert::factory()->targetPrice(800000)->create();

        $this->assertEquals(2, ProductAlert::restock()->count());
    }

    public function test_price_drop_scope(): void
    {
        ProductAlert::factory()->restock()->create();
        ProductAlert::factory()->count(3)->priceDrop(10)->create();
        ProductAlert::factory()->targetPrice(800000)->create();

        $this->assertEquals(3, ProductAlert::priceDrop()->count());
    }

    public function test_target_price_scope(): void
    {
        ProductAlert::factory()->restock()->create();
        ProductAlert::factory()->priceDrop(10)->create();
        ProductAlert::factory()->count(2)->targetPrice(800000)->create();

        $this->assertEquals(2, ProductAlert::targetPrice()->count());
    }

    public function test_for_user_scope(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        ProductAlert::factory()->count(3)->forUser($user1)->create();
        ProductAlert::factory()->count(2)->forUser($user2)->create();

        $this->assertEquals(3, ProductAlert::forUser($user1->id)->count());
        $this->assertEquals(2, ProductAlert::forUser($user2->id)->count());
    }

    public function test_for_product_scope(): void
    {
        $product1 = Product::factory()->create(['price' => 1000000]);
        $product2 = Product::factory()->create(['price' => 500000]);

        ProductAlert::factory()->count(2)->forProduct($product1)->create();
        ProductAlert::factory()->count(4)->forProduct($product2)->create();

        $this->assertEquals(2, ProductAlert::forProduct($product1->id)->count());
        $this->assertEquals(4, ProductAlert::forProduct($product2->id)->count());
    }

    public function test_of_type_scope(): void
    {
        ProductAlert::factory()->count(2)->restock()->create();
        ProductAlert::factory()->count(3)->priceDrop(10)->create();

        $this->assertEquals(2, ProductAlert::ofType(ProductAlert::TYPE_RESTOCK)->count());
        $this->assertEquals(3, ProductAlert::ofType(ProductAlert::TYPE_PRICE_DROP)->count());
    }

    // ==================== Type Checkers ====================

    public function test_type_checker_methods(): void
    {
        $restock = ProductAlert::factory()->restock()->create();
        $priceDrop = ProductAlert::factory()->priceDrop(10)->create();
        $target = ProductAlert::factory()->targetPrice(800000)->create();

        $this->assertTrue($restock->isRestockAlert());
        $this->assertFalse($restock->isPriceDropAlert());
        $this->assertFalse($restock->isTargetPriceAlert());

        $this->assertFalse($priceDrop->isRestockAlert());
        $this->assertTrue($priceDrop->isPriceDropAlert());
        $this->assertFalse($priceDrop->isTargetPriceAlert());

        $this->assertFalse($target->isRestockAlert());
        $this->assertFalse($target->isPriceDropAlert());
        $this->assertTrue($target->isTargetPriceAlert());
    }

    // ==================== State Methods ====================

    public function test_mark_as_triggered(): void
    {
        $alert = ProductAlert::factory()->active()->create();

        $this->assertFalse($alert->is_triggered);
        $this->assertNull($alert->triggered_at);

        Carbon::setTestNow('2026-08-09 12:00:00');
        $alert->markAsTriggered();
        Carbon::setTestNow();

        $alert->refresh();
        $this->assertTrue($alert->is_triggered);
        $this->assertEquals('2026-08-09 12:00:00', $alert->triggered_at->format('Y-m-d H:i:s'));
    }

    public function test_activate_method(): void
    {
        $alert = ProductAlert::factory()->inactive()->create();
        $this->assertFalse($alert->is_active);

        $alert->activate();
        $alert->refresh();

        $this->assertTrue($alert->is_active);
    }

    public function test_deactivate_method(): void
    {
        $alert = ProductAlert::factory()->active()->create();
        $this->assertTrue($alert->is_active);

        $alert->deactivate();
        $alert->refresh();

        $this->assertFalse($alert->is_active);
    }

    // ==================== isConditionMet - RESTOCK ====================

    public function test_condition_met_restock_when_stock_becomes_positive(): void
    {
        $alert = ProductAlert::factory()->restock()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $this->assertTrue($alert->isConditionMet($product));
    }

    public function test_condition_not_met_restock_when_stock_still_zero(): void
    {
        $alert = ProductAlert::factory()->restock()->create();
        $product = Product::factory()->create(['stock' => 0]);

        $this->assertFalse($alert->isConditionMet($product));
    }

    // ==================== isConditionMet - PRICE DROP (with %) ====================

    public function test_condition_met_price_drop_when_actual_discount_meets_threshold(): void
    {
        // کاربر 10% تخفیف خواسته، محصول 15% تخفیف دارد
        $alert = ProductAlert::factory()->priceDrop(10)->create();

        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 850000, // 15% discount
        ]);

        $this->assertTrue($alert->isConditionMet($product));
    }

    public function test_condition_met_price_drop_when_exact_discount(): void
    {
        // کاربر 10% تخفیف خواسته، محصول دقیقاً 10% تخفیف دارد
        $alert = ProductAlert::factory()->priceDrop(10)->create();

        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 900000, // 10% discount
        ]);

        $this->assertTrue($alert->isConditionMet($product));
    }

    public function test_condition_not_met_price_drop_when_discount_less_than_threshold(): void
    {
        // کاربر 10% تخفیف خواسته، محصول فقط 5% تخفیف دارد
        $alert = ProductAlert::factory()->priceDrop(10)->create();

        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 950000, // 5% discount
        ]);

        $this->assertFalse($alert->isConditionMet($product));
    }

    public function test_condition_not_met_price_drop_when_no_discount(): void
    {
        $alert = ProductAlert::factory()->priceDrop(10)->create();

        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => null, // بدون تخفیف
        ]);

        $this->assertFalse($alert->isConditionMet($product));
    }

    // ==================== isConditionMet - PRICE DROP (legacy, no %) ====================

    public function test_condition_met_price_drop_legacy_when_price_decreased(): void
    {
        $alert = ProductAlert::factory()->create([
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'discount_percentage' => null,
            'original_price' => 1000000,
        ]);

        $product = Product::factory()->create([
            'price' => 900000,
            'discount_price' => null,
        ]);

        $this->assertTrue($alert->isConditionMet($product));
    }

    public function test_condition_not_met_price_drop_legacy_when_price_same(): void
    {
        $alert = ProductAlert::factory()->create([
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'discount_percentage' => null,
            'original_price' => 1000000,
        ]);

        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => null,
        ]);

        $this->assertFalse($alert->isConditionMet($product));
    }

    // ==================== isConditionMet - TARGET PRICE ====================

    public function test_condition_met_target_price_when_price_below_target(): void
    {
        $alert = ProductAlert::factory()->targetPrice(800000)->create();

        $product = Product::factory()->create([
            'price' => 750000,
            'discount_price' => null,
        ]);

        $this->assertTrue($alert->isConditionMet($product));
    }

    public function test_condition_met_target_price_when_price_equals_target(): void
    {
        $alert = ProductAlert::factory()->targetPrice(800000)->create();

        $product = Product::factory()->create([
            'price' => 800000,
            'discount_price' => null,
        ]);

        $this->assertTrue($alert->isConditionMet($product));
    }

    public function test_condition_not_met_target_price_when_price_above_target(): void
    {
        $alert = ProductAlert::factory()->targetPrice(800000)->create();

        $product = Product::factory()->create([
            'price' => 850000,
            'discount_price' => null,
        ]);

        $this->assertFalse($alert->isConditionMet($product));
    }

    public function test_condition_met_target_price_with_discount_price(): void
    {
        // target_price با discount_price چک می‌شود نه price
        $alert = ProductAlert::factory()->targetPrice(800000)->create();

        $product = Product::factory()->create([
            'price' => 1000000,
            'discount_price' => 750000, // قیمت نهایی کمتر از هدف
        ]);

        $this->assertTrue($alert->isConditionMet($product));
    }

    // ==================== calculateDiscountPercentage (via isConditionMet) ====================

    public function test_calculate_discount_percentage_edge_cases(): void
    {
        // قیمت = 0 نباید crash کند
        $alert = ProductAlert::factory()->priceDrop(10)->create();

        $product = Product::factory()->create([
            'price' => 0,
            'discount_price' => null,
        ]);

        $this->assertFalse($alert->isConditionMet($product));
    }

    public function test_calculate_discount_with_high_percentage(): void
    {
        $alert = ProductAlert::factory()->priceDrop(50)->create();

        $product = Product::factory()->create([
            'price' => 2000000,
            'discount_price' => 900000, // 55% discount
        ]);

        $this->assertTrue($alert->isConditionMet($product));
    }

    // ==================== getMessage ====================

    public function test_get_message_for_restock(): void
    {
        $product = Product::factory()->create(['name' => 'آیفون ۱۵']);
        $alert = ProductAlert::factory()->restock()->forProduct($product)->create();

        $message = $alert->getMessage();

        $this->assertStringContainsString('موجود شد', $message);
        $this->assertStringContainsString('آیفون ۱۵', $message);
    }

    public function test_get_message_for_price_drop_with_percentage(): void
    {
        $product = Product::factory()->create([
            'name' => 'هدفون سونی',
            'price' => 1000000,
            'discount_price' => 850000,
        ]);

        $alert = ProductAlert::factory()
            ->priceDrop(10)
            ->forProduct($product)
            ->create();

        $message = $alert->getMessage();

        $this->assertStringContainsString('10', $message);
        $this->assertStringContainsString('تخفیف', $message);
        $this->assertStringContainsString('هدفون سونی', $message);
    }

    public function test_get_message_for_price_drop_without_percentage(): void
    {
        $product = Product::factory()->create([
            'name' => 'لپ‌تاپ ایسوس',
            'price' => 30000000,
            'discount_price' => 25000000,
        ]);

        $alert = ProductAlert::factory()->create([
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'discount_percentage' => null,
            'product_id' => $product->id,
            'original_price' => 30000000,
        ]);

        $message = $alert->getMessage();

        $this->assertStringContainsString('کاهش یافت', $message);
        $this->assertStringContainsString('لپ‌تاپ ایسوس', $message);
    }

    public function test_get_message_for_target_price(): void
    {
        $product = Product::factory()->create([
            'name' => 'ساعت هوشمند',
            'price' => 5000000,
            'discount_price' => null,
        ]);

        $alert = ProductAlert::factory()
            ->targetPrice(4000000)
            ->forProduct($product)
            ->create();

        $message = $alert->getMessage();

        $this->assertStringContainsString('محدوده دلخواه', $message);
        $this->assertStringContainsString('ساعت هوشمند', $message);
    }

    public function test_get_message_when_product_deleted(): void
    {
        $alert = ProductAlert::factory()->restock()->create(['product_id' => 999999]);

        // product رابطه null برمی‌گرداند
        $message = $alert->getMessage();

        $this->assertIsString($message);
        $this->assertStringContainsString('موجود شد', $message);
    }
}