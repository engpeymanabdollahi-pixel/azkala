<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProductAlert;
use App\Models\User;
use App\Models\Product;

echo "=== Test ProductAlertFactory ===\n\n";

try {
    // هر تست از user و product جداگانه استفاده می‌کند تا UNIQUE constraint نقض نشود
    
    // ========================================
    // Test 1: Default alert
    // ========================================
    echo "🧪 Test 1: Default alert\n";
    $user1 = User::factory()->create();
    $product1 = Product::factory()->create(['price' => 1000000]);
    
    $alert1 = ProductAlert::factory()
        ->forUser($user1)
        ->forProduct($product1)
        ->create();
    echo "   ✅ ID: {$alert1->id}\n";
    echo "   Type: {$alert1->type}\n";
    echo "   Original Price: {$alert1->original_price}\n";
    echo "   is_active: " . ($alert1->is_active ? 'true' : 'false') . "\n";
    
    // ========================================
    // Test 2: Restock alert
    // ========================================
    echo "\n🧪 Test 2: Restock alert\n";
    $user2 = User::factory()->create();
    $product2 = Product::factory()->create(['price' => 500000, 'stock' => 0]);
    
    $restock = ProductAlert::factory()
        ->restock()
        ->forUser($user2)
        ->forProduct($product2)
        ->create();
    echo "   ✅ Type: {$restock->type}\n";
    echo "   isRestockAlert: " . ($restock->isRestockAlert() ? 'true' : 'false') . "\n";
    echo "   target_price: " . ($restock->target_price ?? 'null') . "\n";
    echo "   discount_percentage: " . ($restock->discount_percentage ?? 'null') . "\n";
    
    // ========================================
    // Test 3: Price Drop 15%
    // ========================================
    echo "\n🧪 Test 3: Price Drop 15%\n";
    $user3 = User::factory()->create();
    $product3 = Product::factory()->create(['price' => 2000000]);
    
    $priceDrop = ProductAlert::factory()
        ->priceDrop(15)
        ->forUser($user3)
        ->forProduct($product3)
        ->create();
    echo "   ✅ Type: {$priceDrop->type}\n";
    echo "   Discount %: {$priceDrop->discount_percentage}\n";
    echo "   isPriceDropAlert: " . ($priceDrop->isPriceDropAlert() ? 'true' : 'false') . "\n";
    
    // ========================================
    // Test 4: Target Price
    // ========================================
    echo "\n🧪 Test 4: Target Price 800,000\n";
    $user4 = User::factory()->create();
    $product4 = Product::factory()->create(['price' => 1500000]);
    
    $targetPrice = ProductAlert::factory()
        ->targetPrice(800000)
        ->forUser($user4)
        ->forProduct($product4)
        ->create();
    echo "   ✅ Type: {$targetPrice->type}\n";
    echo "   Target: {$targetPrice->target_price}\n";
    echo "   isTargetPriceAlert: " . ($targetPrice->isTargetPriceAlert() ? 'true' : 'false') . "\n";
    
    // ========================================
    // Test 5: Triggered alert
    // ========================================
    echo "\n🧪 Test 5: Triggered alert\n";
    $user5 = User::factory()->create();
    $product5 = Product::factory()->create(['price' => 3000000]);
    
    $triggered = ProductAlert::factory()
        ->restock()
        ->triggered()
        ->forUser($user5)
        ->forProduct($product5)
        ->create();
    echo "   ✅ is_triggered: " . ($triggered->is_triggered ? 'true' : 'false') . "\n";
    echo "   is_active: " . ($triggered->is_active ? 'true' : 'false') . "\n";
    echo "   triggered_at: {$triggered->triggered_at}\n";
    
    // ========================================
    // Test 6: Inactive alert
    // ========================================
    echo "\n🧪 Test 6: Inactive alert\n";
    $user6 = User::factory()->create();
    $product6 = Product::factory()->create(['price' => 750000]);
    
    $inactive = ProductAlert::factory()
        ->priceDrop(20)
        ->inactive()
        ->forUser($user6)
        ->forProduct($product6)
        ->create();
    echo "   ✅ is_active: " . ($inactive->is_active ? 'true' : 'false') . "\n";
    echo "   discount_percentage: {$inactive->discount_percentage}\n";
    
    // ========================================
    // Test 7: Multiple alerts (for different products)
    // ========================================
    echo "\n🧪 Test 7: Create 3 alerts for same user, different products\n";
    $user7 = User::factory()->create();
    $alerts = ProductAlert::factory()
        ->count(3)
        ->forUser($user7)
        ->create();
    echo "   ✅ Created: {$alerts->count()} alerts\n";
    echo "   User ID (same): {$user7->id}\n";
    $productIds = $alerts->pluck('product_id')->unique()->toArray();
    echo "   Product IDs (different): " . implode(', ', $productIds) . "\n";
    
    // ========================================
    // Test 8: Database-only channel
    // ========================================
    echo "\n🧪 Test 8: Database-only channel\n";
    $user8 = User::factory()->create();
    $product8 = Product::factory()->create(['price' => 450000]);
    
    $dbOnly = ProductAlert::factory()
        ->restock()
        ->databaseOnly()
        ->forUser($user8)
        ->forProduct($product8)
        ->create();
    echo "   ✅ Channels: " . json_encode($dbOnly->channels) . "\n";
    
    // ========================================
    // Summary
    // ========================================
    echo "\n════════════════════════════════════════\n";
    echo "✅ All factory tests passed!\n";
    echo "Total alerts created: " . ProductAlert::count() . "\n";
    echo "════════════════════════════════════════\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}