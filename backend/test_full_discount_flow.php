<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProductAlert;
use App\Models\User;
use App\Models\Product;
use App\Services\AlertService;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\Alerts\CreateAlertRequest;

echo "=== Full Discount Flow Test ===\n\n";

try {
    $user = User::first();
    $product = Product::where('price', '>', 100000)->first();
    
    if (!$user || !$product) {
        echo "❌ No user or product found\n";
        exit(1);
    }
    
    echo "👤 User: {$user->name} (ID: {$user->id})\n";
    echo "📦 Product: {$product->name} (Price: " . number_format($product->price) . ")\n\n";
    
    // ============================================================
    // Test 1: Validation - discount_percentage required for price_drop
    // ============================================================
    echo "🧪 Test 1: Validation (price_drop without discount_percentage)\n";
    $validator = Validator::make([
        'product_id' => $product->id,
        'type' => 'price_drop',
    ], (new CreateAlertRequest())->rules());
    
    if ($validator->fails()) {
        echo "   ✅ Validation failed as expected:\n";
        foreach ($validator->errors()->all() as $error) {
            echo "      - $error\n";
        }
    } else {
        echo "   ❌ Validation should have failed!\n";
    }
    
    // ============================================================
    // Test 2: Validation - valid discount_percentage
    // ============================================================
    echo "\n🧪 Test 2: Validation (valid discount_percentage = 15)\n";
    $validator2 = Validator::make([
        'product_id' => $product->id,
        'type' => 'price_drop',
        'discount_percentage' => 15,
    ], (new CreateAlertRequest())->rules());
    
    if ($validator2->fails()) {
        echo "   ❌ Validation should have passed: " . json_encode($validator2->errors()->all()) . "\n";
    } else {
        echo "   ✅ Validation passed\n";
    }
    
    // ============================================================
    // Test 3: Validation - discount > 99 should fail
    // ============================================================
    echo "\n🧪 Test 3: Validation (discount_percentage = 150)\n";
    $validator3 = Validator::make([
        'product_id' => $product->id,
        'type' => 'price_drop',
        'discount_percentage' => 150,
    ], (new CreateAlertRequest())->rules());
    
    if ($validator3->fails()) {
        echo "   ✅ Validation failed as expected:\n";
        foreach ($validator3->errors()->all() as $error) {
            echo "      - $error\n";
        }
    } else {
        echo "   ❌ Validation should have failed!\n";
    }
    
    // ============================================================
    // Test 4: Create alert via AlertService
    // ============================================================
    echo "\n🧪 Test 4: Create alert via AlertService\n";
    
    // پاکسازی هشدارهای قبلی
    $user->alerts()->where('product_id', $product->id)->forceDelete();
    
    $alertService = app(AlertService::class);
    $alert = $alertService->createAlert($user, [
        'product_id' => $product->id,
        'type' => 'price_drop',
        'discount_percentage' => 20,
        'channels' => ['database'],
    ]);
    
    echo "   ✅ Alert created!\n";
    echo "      ID: {$alert->id}\n";
    echo "      Type: {$alert->type}\n";
    echo "      Discount: {$alert->discount_percentage}%\n";
    echo "      Original Price: " . number_format($alert->original_price) . "\n";
    
    // ============================================================
    // Test 5: Trigger flow
    // ============================================================
    echo "\n🧪 Test 5: Trigger flow (15% discount - should NOT trigger)\n";
    $product->discount_price = $product->price * 0.85; // 15% discount
    $product->save();
    
    $processed = $alertService->processPriceAlerts($product);
    echo "   Processed alerts: $processed\n";
    echo "   Alert still active: " . ($alert->fresh()->is_active ? '✅ YES' : '❌ NO (WRONG!)') . "\n";
    
    echo "\n🧪 Test 6: Trigger flow (25% discount - should trigger)\n";
    $product->discount_price = $product->price * 0.75; // 25% discount
    $product->save();
    
    $processed = $alertService->processPriceAlerts($product);
    $alert->refresh();
    echo "   Processed alerts: $processed\n";
    echo "   Alert triggered: " . ($alert->is_triggered ? '✅ YES' : '❌ NO (WRONG!)') . "\n";
    echo "   Alert still active: " . ($alert->is_active ? '✅ YES' : '❌ NO (correctly deactivated)') . "\n";
    
    // ============================================================
    // Test 7: Notification created
    // ============================================================
    echo "\n🧪 Test 7: Notification check\n";
    $notifCount = \App\Models\Notification::where('user_id', $user->id)
        ->where('type', 'product_alert')
        ->count();
    echo "   Total product_alert notifications: $notifCount\n";
    
    $lastNotif = \App\Models\Notification::where('user_id', $user->id)
        ->where('type', 'product_alert')
        ->latest()
        ->first();
    
    if ($lastNotif) {
        echo "   Last notification:\n";
        echo "      Title: {$lastNotif->title}\n";
        echo "      Message: {$lastNotif->message}\n";
    }
    
    echo "\n✅ All tests completed!\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}