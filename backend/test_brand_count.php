<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Brand;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

echo "═══════════════════════════════════════════════════════════\n";
echo "🔍 بررسی مشکل products_count\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// 1. بررسی تعداد کل برندها
$totalBrands = Brand::count();
echo "📊 تعداد کل برندها: $totalBrands\n\n";

// 2. بررسی 5 برند اول با products_count
echo "📦 5 برند اول با products_count:\n";
$brands = Brand::limit(5)->get(['id', 'name', 'products_count']);
foreach ($brands as $brand) {
    echo "  - {$brand->name}: {$brand->products_count} محصول\n";
}
echo "\n";

// 3. بررسی تعداد واقعی محصولات بر اساس brand_id
echo "🔢 تعداد واقعی محصولات بر اساس brand_id:\n";
$realCounts = Product::select('brand_id', DB::raw('count(*) as count'))
    ->groupBy('brand_id')
    ->orderByDesc('count')
    ->limit(5)
    ->get();

foreach ($realCounts as $item) {
    $brand = Brand::find($item->brand_id);
    $brandName = $brand ? $brand->name : 'نامشخص';
    echo "  - $brandName (ID: {$item->brand_id}): {$item->count} محصول\n";
}
echo "\n";

// 4. بررسی رابطه products در Brand model
echo "🔗 بررسی رابطه products در Brand model:\n";
$brand = Brand::first();
if ($brand) {
    try {
        $productsRelation = $brand->products();
        echo "  ✅ رابطه products وجود دارد\n";
        echo "  📊 تعداد محصولات از طریق رابطه: " . $productsRelation->count() . "\n";
    } catch (\Exception $e) {
        echo "  ❌ رابطه products وجود ندارد یا خطا دارد\n";
        echo "  خطا: " . $e->getMessage() . "\n";
    }
} else {
    echo "  ❌ هیچ برندی در دیتابیس وجود ندارد\n";
}
echo "\n";

// 5. بررسی withCount
echo "📈 بررسی withCount:\n";
$brandWithCount = Brand::withCount('products')->first();
if ($brandWithCount) {
    echo "  - {$brandWithCount->name}: products_count = {$brandWithCount->products_count}\n";
}
echo "\n";

echo "═══════════════════════════════════════════════════════════\n";
echo "✅ بررسی کامل شد\n";
echo "═══════════════════════════════════════════════════════════\n";