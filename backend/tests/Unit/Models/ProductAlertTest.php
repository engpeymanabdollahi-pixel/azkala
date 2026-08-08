<?php

namespace Tests\Unit\Models;

use App\Models\ProductAlert;
use App\Models\User;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductAlertTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a product alert can be created
     */
    public function test_can_create_product_alert(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $alert = ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'original_price' => 100.00,
            'channels' => ['database', 'email'],
        ]);

        $this->assertDatabaseHas('product_alerts', [
            'id' => $alert->id,
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'is_active' => true,
            'is_triggered' => false,
        ]);
    }

    /**
     * Test that alert relationships work correctly
     */
    public function test_alert_belongs_to_user_and_product(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $alert = ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'original_price' => 200.00,
        ]);

        $this->assertEquals($user->id, $alert->user->id);
        $this->assertEquals($product->id, $alert->product->id);
    }

    /**
     * Test target price alert creation
     */
    public function test_can_create_target_price_alert(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $alert = ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_TARGET_PRICE,
            'target_price' => 50.00,
            'original_price' => 100.00,
        ]);

        $this->assertEquals(ProductAlert::TYPE_TARGET_PRICE, $alert->type);
        $this->assertEquals(50.00, $alert->target_price);
        $this->assertTrue($alert->isTargetPriceAlert());
    }

    /**
     * Test alert scopes
     */
    public function test_alert_scopes(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        // Create different types of alerts
        ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'original_price' => 100.00,
            'is_active' => true,
            'is_triggered' => false,
        ]);

        ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'original_price' => 200.00,
            'is_active' => true,
            'is_triggered' => true,
            'triggered_at' => now(),
        ]);

        // Test active scope
        $activeAlerts = ProductAlert::active()->get();
        $this->assertCount(1, $activeAlerts);
        $this->assertEquals(ProductAlert::TYPE_RESTOCK, $activeAlerts->first()->type);

        // Test triggered scope
        $triggeredAlerts = ProductAlert::triggered()->get();
        $this->assertCount(1, $triggeredAlerts);
        $this->assertEquals(ProductAlert::TYPE_PRICE_DROP, $triggeredAlerts->first()->type);

        // Test restock scope
        $restockAlerts = ProductAlert::restock()->get();
        $this->assertCount(1, $restockAlerts);

        // Test ready for processing scope
        $readyAlerts = ProductAlert::readyForProcessing()->get();
        $this->assertCount(1, $readyAlerts);
    }

    /**
     * Test marking alert as triggered
     */
    public function test_mark_alert_as_triggered(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $alert = ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'original_price' => 100.00,
            'is_active' => true,
            'is_triggered' => false,
        ]);

        $this->assertFalse($alert->is_triggered);
        $this->assertNull($alert->triggered_at);

        $alert->markAsTriggered();

        $this->assertTrue($alert->fresh()->is_triggered);
        $this->assertNotNull($alert->fresh()->triggered_at);
    }

    /**
     * Test user alerts relationship
     */
    public function test_user_has_many_alerts(): void
    {
        $user = User::factory()->create();
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();

        ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product1->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'original_price' => 100.00,
        ]);

        ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product2->id,
            'type' => ProductAlert::TYPE_PRICE_DROP,
            'original_price' => 200.00,
        ]);

        $this->assertEquals(2, $user->alerts()->count());
    }

    /**
     * Test product has many alerts
     */
    public function test_product_has_many_alerts(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $product = Product::factory()->create();

        ProductAlert::create([
            'user_id' => $user1->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'original_price' => 100.00,
        ]);

        ProductAlert::create([
            'user_id' => $user2->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_TARGET_PRICE,
            'target_price' => 50.00,
            'original_price' => 100.00,
        ]);

        $this->assertEquals(2, $product->alerts()->count());
    }

    /**
     * Test unique constraint on user_id, product_id, type
     */
    public function test_unique_constraint_on_user_product_type(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'original_price' => 100.00,
        ]);

        // Attempting to create a duplicate should fail
        $this->expectException(\Illuminate\Database\QueryException::class);

        ProductAlert::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'type' => ProductAlert::TYPE_RESTOCK,
            'original_price' => 150.00,
        ]);
    }
}
