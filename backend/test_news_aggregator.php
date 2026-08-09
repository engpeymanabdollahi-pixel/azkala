<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\PersianNewsAggregatorService;
use App\Models\MagazineArticle;

echo "=== Test PersianNewsAggregatorService ===\n\n";

try {
    // پاکسازی مقالات RSS قبلی (admin ها را نگه دار)
    MagazineArticle::where('content_source', 'rss')->forceDelete();
    echo "🧹 پاکسازی: مقالات RSS قبلی حذف شدند\n\n";
    
    $service = new PersianNewsAggregatorService();
    
    // ========================================
    // Test 1: fetchFromRss با یک feed
    // ========================================
    echo "🧪 Test 1: fetchFromRss (zoomit)\n";
    
    try {
        $result = $service->fetchFromRss(
            'https://www.zoomit.ir/feed',
            'زومیت'
        );
        
        echo "   ✅ RSS fetched successfully\n";
        echo "   Fetched: {$result['fetched']}\n";
        echo "   Saved: {$result['saved']}\n";
        echo "   Skipped: {$result['skipped']}\n";
        
        // بررسی نمونه
        $sample = MagazineArticle::where('source_name', 'زومیت')->latest()->first();
        if ($sample) {
            echo "   Sample article: {$sample->title}\n";
            echo "   Slug: {$sample->slug}\n";
            echo "   Category: {$sample->category_label}\n";
            echo "   Devices matched: {$sample->devices->count()}\n";
        }
    } catch (\Exception $e) {
        echo "   ⚠️ RSS fetch failed: {$e->getMessage()}\n";
        echo "   (This is expected if internet connection is blocked)\n";
    }
    
    // ========================================
    // Test 2: matchWithDevices (تست مستقیم)
    // ========================================
    echo "\n🧪 Test 2: matchWithDevices (unit test)\n";
    
    $reflection = new \ReflectionClass($service);
    $method = $reflection->getMethod('matchWithDevices');
    $method->setAccessible(true);
    
    $testCases = [
        'آیفون ۱۵ پرو مکس در ایران عرضه شد' => 'iPhone 15 Pro Max',
        'بررسی گلکسی S24 Ultra سامسونگ' => 'Galaxy S24 Ultra',
        'مقایسه iPhone 15 Pro با Pixel 8 Pro' => 'iPhone 15 Pro + Pixel 8 Pro',
        'اخبار عمومی فناوری بدون اشاره به دستگاه' => 'no device',
    ];
    
    foreach ($testCases as $title => $expected) {
        $matched = $method->invoke($service, $title, '');
        echo "   '$title'\n";
        echo "      Matched: " . count($matched) . " devices\n";
        if (!empty($matched)) {
            foreach ($matched as $deviceId => $score) {
                $device = \App\Models\DeviceModel::find($deviceId);
                echo "      - {$device->name} (score: $score)\n";
            }
        } else {
            echo "      - No devices matched\n";
        }
    }
    
    // ========================================
    // Test 3: guessCategory
    // ========================================
    echo "\n🧪 Test 3: guessCategory\n";
    
    $method = $reflection->getMethod('guessCategory');
    $method->setAccessible(true);
    
    $categoryTests = [
        ['بررسی کامل iPhone 15 Pro', '', 'review'],
        ['مقایسه Galaxy S24 با iPhone 15', '', 'comparison'],
        ['راهنمای خرید بهترین گوشی', '', 'guide'],
        ['شایعات جدید درباره iPhone 16', '', 'rumor'],
        ['سامسونگ از Galaxy S24 رونمایی کرد', '', 'news'],
    ];
    
    foreach ($categoryTests as [$title, $content, $expected]) {
        $category = $method->invoke($service, $title, $content);
        $status = $category === $expected ? '✅' : '❌';
        echo "   $status '$title' → $category (expected: $expected)\n";
    }
    
    // ========================================
    // Test 4: deduplication
    // ========================================
    echo "\n🧪 Test 4: Deduplication\n";
    
    $initialCount = MagazineArticle::where('content_source', 'rss')->count();
    
    // دوباره fetch کنیم (همه باید skip شوند)
    try {
        $result = $service->fetchFromRss(
            'https://www.zoomit.ir/feed',
            'زومیت'
        );
        
        if ($result['saved'] === 0 && $result['skipped'] > 0) {
            echo "   ✅ Deduplication works (all skipped on second fetch)\n";
            echo "   Skipped: {$result['skipped']}\n";
        } else {
            echo "   ⚠️ Saved: {$result['saved']}, Skipped: {$result['skipped']}\n";
        }
    } catch (\Exception $e) {
        echo "   ⚠️ RSS fetch failed: {$e->getMessage()}\n";
    }
    
    // ========================================
    // Cleanup (اختیاری)
    // ========================================
    $finalCount = MagazineArticle::where('content_source', 'rss')->count();
    echo "\n📊 مقالات RSS در دیتابیس: $finalCount\n";
    
    // نظر: اگر می‌خواهید مقالات را نگه دارید، این خط را کامنت کنید
    // MagazineArticle::where('content_source', 'rss')->forceDelete();
    
    echo "\n════════════════════════════════════════\n";
    echo "✅ News Aggregator tests completed!\n";
    echo "════════════════════════════════════════\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "   Trace:\n";
    foreach (explode("\n", $e->getTraceAsString()) as $line) {
        echo "     $line\n";
    }
}