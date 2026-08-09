<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Test Discount Logic ===\n\n";

// ایجاد یک alert با 10% discount requirement
$alert = new \App\Models\ProductAlert([
    'type' => 'price_drop',
    'discount_percentage' => 10,
    'original_price' => 1000000,
]);

// ایجاد محصول mock
$product = new \App\Models\Product([
    'name' => 'Test Product',
    'price' => 1000000,
]);

echo "Product Price: 1,000,000\n";
echo "Required Discount: 10%\n\n";

// Test 1: 5% discount (should NOT trigger)
$product->discount_price = 950000;
$isMet1 = $alert->isConditionMet($product);
echo "Test 1 - 5% discount (950,000): " . ($isMet1 ? '❌ TRIGGERED (WRONG!)' : '✅ NOT triggered (CORRECT)') . "\n";

// Test 2: 10% discount (should trigger)
$product->discount_price = 900000;
$isMet2 = $alert->isConditionMet($product);
echo "Test 2 - 10% discount (900,000): " . ($isMet2 ? '✅ TRIGGERED (CORRECT)' : '❌ NOT triggered (WRONG!)') . "\n";

// Test 3: 15% discount (should trigger)
$product->discount_price = 850000;
$isMet3 = $alert->isConditionMet($product);
echo "Test 3 - 15% discount (850,000): " . ($isMet3 ? '✅ TRIGGERED (CORRECT)' : '❌ NOT triggered (WRONG!)') . "\n";

// Test 4: No discount (should NOT trigger)
$product->discount_price = null;
$isMet4 = $alert->isConditionMet($product);
echo "Test 4 - No discount (1,000,000): " . ($isMet4 ? '❌ TRIGGERED (WRONG!)' : '✅ NOT triggered (CORRECT)') . "\n";

echo "\n=== Message Test ===\n";
$alert->product = $product;
$product->discount_price = 850000;
echo "Message: " . $alert->getMessage() . "\n";

echo "\n✅ Test completed!\n";