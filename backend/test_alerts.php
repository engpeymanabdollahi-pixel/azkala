<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Test AlertService ===\n";

try {
    $user = \App\Models\User::first();
    $product = \App\Models\Product::where('stock', '>', 0)->first();
    
    if (!$user || !$product) {
        echo "❌ No user or product found\n";
        exit(1);
    }
    
    $alertService = app(\App\Services\AlertService::class);
    
    $alert = $alertService->createAlert($user, [
        'product_id' => $product->id,
        'type' => 'restock',
        'channels' => ['database'],
    ]);
    
    echo "✅ Alert created! ID: {$alert->id}\n";
    echo "   Product: {$product->name}\n";
    echo "   Type: {$alert->type}\n";
    
    // تست Notification
    $notifCount = \App\Models\Notification::count();
    echo "   Total Notifications: {$notifCount}\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    if ($e->getCode() === 409) {
        echo "   (Duplicate alert - قبلاً تست شده)\n";
    }
}

echo "\n✅ Test completed!\n";