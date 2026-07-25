<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=======================================================\n";
echo "  گزارش دقیق وضعیت فروشنده و محصولات\n";
echo "=======================================================\n";

$slug = 'froshgah-aaly-kamran';
$seller = \App\Models\User::where('slug', $slug)->first();

if (!$seller) {
    echo "❌ خطا: فروشنده‌ای با اسلاگ '$slug' یافت نشد.\n";
    exit;
}

echo "✅ فروشنده یافت شد:\n";
echo "   - ID: {$seller->id}\n";
echo "   - نام فروشگاه: {$seller->shop_name}\n";
echo "   - تعداد فالوور: {$seller->followers_count}\n";

$productCount = \App\Models\Product::where('seller_id', $seller->id)->count();
echo "\n📦 تعداد کل محصولات این فروشنده در دیتابیس: {$productCount}\n";

if ($productCount > 0) {
    $p = \App\Models\Product::where('seller_id', $seller->id)->first();
    echo "   - نمونه محصول ID: {$p->id}\n";
    echo "   - مقدار is_active: " . ($p->is_active ? 'true' : 'false') . "\n";

    echo "\n🔄 در حال شبیه‌سازی دقیق کوئری کنترلر...\n";
    try {
        $query = \App\Models\Product::where('seller_id', $seller->id)->where('is_active', true);
        $products = $query->paginate(5);
        echo "✅ مرحله ۱: کوئری paginate با موفقیت اجرا شد.\n";

        // شبیه‌سازی دقیق خط ۸۴ کنترلر شما
        $products->getCollection()->transform(function($item) {
            return [
                'id' => $item->id, 
                'name' => $item->name,
                'test_rating' => $item->rating ?? 'NULL',
                'test_sales' => $item->sales_count ?? 'NULL'
            ];
        });
        echo "✅ مرحله ۲: عملیات transform/map روی paginator با موفقیت انجام شد.\n";
        echo "\n🎉 نتیجه: کوئری و map سالم هستند. مشکل جای دیگری است.\n";
        
    } catch (\Exception $e) {
        echo "❌ خطای دقیق در خط " . $e->getLine() . ":\n";
        echo "   " . $e->getMessage() . "\n";
    }
} else {
    echo "\n⚠️ هشدار مهم: هیچ محصولی برای این فروشنده ثبت نشده است!\n";
    echo "   دلیل نمایش داده نشدن محصولات در فرانت‌اند همین است.\n";
}

echo "=======================================================\n";