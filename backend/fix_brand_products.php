<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Brand;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

echo "═══════════════════════════════════════════════════════════\n";
echo "🔧 اختصاص محصولات به برندها\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// دریافت برندها
$brands = Brand::all();
echo "📊 تعداد برندها: " . $brands->count() . "\n\n";

// دریافت محصولات بدون برند
$productsWithoutBrand = Product::whereNull('brand_id')->get();
echo "📦 تعداد محصولات بدون برند: " . $productsWithoutBrand->count() . "\n\n";

if ($productsWithoutBrand->isEmpty()) {
    echo "✅ همه محصولات دارای برند هستند!\n";
    exit;
}

// اختصاص تصادفی محصولات به برندها
echo "🔄 در حال اختصاص محصولات به برندها...\n\n";

$brandIds = $brands->pluck('id')->toArray();
$updated = 0;

foreach ($productsWithoutBrand as $product) {
    // انتخاب تصادفی یک برند
    $brandId = $brandIds[array_rand($brandIds)];
    $brand = Brand::find($brandId);
    
    echo "  📱 {$product->name} → {$brand->name}\n";
    
    $product->update(['brand_id' => $brandId]);
    $updated++;
}

echo "\n✅ {$updated} محصول با موفقیت به برندها اختصاص داده شدند!\n\n";

// به‌روزرسانی products_count در جدول brands
echo "🔄 در حال به‌روزرسانی products_count...\n";

foreach ($brands as $brand) {
    $count = Product::where('brand_id', $brand->id)->count();
    $brand->update(['products_count' => $count]);
    echo "  🏷️ {$brand->name}: {$count} محصول\n";
}

echo "\n═══════════════════════════════════════════════════════════\n";
echo "✅ عملیات با موفقیت کامل شد!\n";
echo "═══════════════════════════════════════════════════════════\n";