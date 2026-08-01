<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== ساختار جدول orders ===\n";
echo implode(',', Schema::getColumnListing('orders'));
echo "\n\n";

echo "=== ساختار جدول order_items ===\n";
echo implode(',', Schema::getColumnListing('order_items'));
echo "\n\n";

echo "=== تعداد سفارشات ===\n";
echo "کل سفارشات: " . DB::table('orders')->count() . "\n";
echo "کل order_items: " . DB::table('order_items')->count() . "\n";

echo "\n=== نمونه سفارش ===\n";
$order = DB::table('orders')->first();
if ($order) {
    echo "Order ID: " . $order->id . "\n";
    echo "User ID: " . $order->user_id . "\n";
    echo "Status: " . $order->status . "\n";
    echo "Payment: " . $order->payment_status . "\n";
    
    $items = DB::table('order_items')->where('order_id', $order->id)->get();
    echo "Items: " . $items->count() . "\n";
    foreach ($items as $item) {
        echo "  - Product: " . $item->product_id . ", Seller: " . ($item->seller_id ?? 'NULL') . "\n";
    }
}
