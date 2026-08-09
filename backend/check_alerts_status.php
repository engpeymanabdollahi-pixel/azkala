<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "╔══════════════════════════════════════════════════╗\n";
echo "║  🔍 بررسی دقیق وضعیت product_alerts               ║\n";
echo "╚══════════════════════════════════════════════════╝\n\n";

// ============================================================
// ۱. آیا جدول وجود دارد؟
// ============================================================
echo "📌 ۱. وجود جدول:\n";
if (Schema::hasTable('product_alerts')) {
    echo "   ✅ جدول product_alerts وجود دارد\n";
    
    // ============================================================
    // ۲. ستون‌های موجود
    // ============================================================
    echo "\n📌 ۲. ستون‌های موجود:\n";
    $columns = Schema::getColumnListing('product_alerts');
    foreach ($columns as $col) {
        $marker = ($col === 'deleted_at') ? ' ← 🔴 این ستون' : '';
        echo "   - $col$marker\n";
    }
    
    // ============================================================
    // ۳. آیا deleted_at وجود دارد؟
    // ============================================================
    echo "\n📌 ۳. وضعیت deleted_at:\n";
    $hasDeletedAt = in_array('deleted_at', $columns);
    if ($hasDeletedAt) {
        echo "   ✅ ستون deleted_at وجود دارد\n";
        echo "   → نیازی به migration جدید نیست\n";
    } else {
        echo "   ❌ ستون deleted_at وجود ندارد\n";
        echo "   → نیاز به migration جدید داریم\n";
    }
    
    // ============================================================
    // ۴. تعداد رکوردها
    // ============================================================
    echo "\n📌 ۴. تعداد رکوردها:\n";
    $count = DB::table('product_alerts')->count();
    echo "   تعداد: $count رکورد\n";
    
    if ($count > 0) {
        echo "   ⚠️  داده وجود دارد - حذف ستون خطرناک است\n";
    } else {
        echo "   ✅ جدول خالی است\n";
    }
} else {
    echo "   ❌ جدول product_alerts وجود ندارد\n";
    echo "   → migration اصلی هنوز اجرا نشده\n";
}

// ============================================================
// ۵. وضعیت migration در دیتابیس
// ============================================================
echo "\n📌 ۵. وضعیت migration:\n";
$migrations = DB::table('migrations')
    ->where('migration', 'like', '%product_alerts%')
    ->get();

if ($migrations->isEmpty()) {
    echo "   ❌ هیچ migration مربوط به product_alerts ثبت نشده\n";
    echo "   → migration اصلی اجرا نشده است\n";
} else {
    echo "   ✅ migration(های) زیر اجرا شده:\n";
    foreach ($migrations as $m) {
        echo "   - {$m->migration} (batch {$m->batch})\n";
    }
}

// ============================================================
// ۶. Migration های pending
// ============================================================
echo "\n📌 ۶. Migration های pending:\n";
$allMigrations = DB::table('migrations')->pluck('migration')->toArray();
$files = glob(__DIR__.'/database/migrations/*.php');

$pending = [];
foreach ($files as $file) {
    $name = pathinfo($file, PATHINFO_FILENAME);
    if (!in_array($name, $allMigrations)) {
        $pending[] = $name;
    }
}

if (empty($pending)) {
    echo "   ✅ هیچ migration pending وجود ندارد\n";
} else {
    echo "   ⚠️  " . count($pending) . " migration pending:\n";
    foreach ($pending as $p) {
        $marker = (strpos($p, 'product_alerts') !== false) ? ' ← 🔴 مرتبط' : '';
        echo "   - $p$marker\n";
    }
}

echo "\n══════════════════════════════════════════════════\n";
echo "✅ بررسی کامل شد\n";
echo "══════════════════════════════════════════════════\n";