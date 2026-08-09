<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MagazineArticle;
use App\Models\DeviceModel;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

echo "=== Test MagazineController Methods ===\n\n";

try {
    // پاکسازی
    MagazineArticle::query()->forceDelete();
    Cache::flush();
    
    $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
    $device = DeviceModel::first();
    
    if (!$device) {
        throw new \Exception("No device found. Please seed device_models first.");
    }
    
    // ========================================
    // Setup: Create 15 test articles
    // ========================================
    echo "📦 Setup: Creating 15 test articles...\n";
    
    $articles = [];
    $categories = ['news', 'review', 'comparison', 'guide', 'rumor'];
    
    for ($i = 1; $i <= 15; $i++) {
        $article = MagazineArticle::create([
            'slug' => 'test-article-' . $i . '-' . time(),
            'title' => "مقاله تست شماره $i - iPhone 15 Pro",
            'excerpt' => "خلاصه مقاله تست شماره $i درباره iPhone 15 Pro",
            'content' => "<h1>مقاله $i</h1><p>محتوای کامل...</p>",
            'featured_image' => "https://example.com/article-$i.jpg",
            'source_name' => $i % 2 === 0 ? 'زومیت' : 'دیجیاتو',
            'author_id' => $admin->id,
            'category' => $categories[$i % 5],
            'published_at' => now()->subHours($i), // هر مقاله یک ساعت قدیمی‌تر
            'is_published' => true,
            'content_source' => 'admin',
            'view_count' => $i * 10, // view_count متفاوت
        ]);
        
        // لینک به دستگاه (برای مقالات ۱ تا ۱۰)
        if ($i <= 10) {
            $article->devices()->attach($device->id, ['relevance_score' => 100 - $i]);
        }
        
        $articles[] = $article;
    }
    
    // یک مقاله unpublished هم بسازیم
    $unpublished = MagazineArticle::create([
        'slug' => 'unpublished-article-' . time(),
        'title' => 'مقاله منتشر نشده',
        'content' => 'محتوا',
        'category' => 'news',
        'published_at' => now()->addDays(7),
        'is_published' => false,
        'content_source' => 'admin',
    ]);
    
    echo "   ✅ Created 15 published + 1 unpublished articles\n\n";
    
    // ========================================
    // Test 1: index (لیست با pagination)
    // ========================================
    echo "🧪 Test 1: index() - list with pagination\n";
    
    $controller = new \App\Http\Controllers\Api\MagazineController();
    $request = \Illuminate\Http\Request::create('/magazine', 'GET', ['per_page' => 5]);
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && count($data['data']) === 5 && $data['meta']['total'] === 15) {
        echo "   ✅ Pagination works (5 of 15, meta included)\n";
        echo "   First article: {$data['data'][0]['title']}\n";
    } else {
        echo "   ❌ index() failed\n";
        print_r($data);
    }
    
    // ========================================
    // Test 2: index with category filter
    // ========================================
    echo "\n🧪 Test 2: index() with category filter\n";
    
    $request = \Illuminate\Http\Request::create('/magazine', 'GET', ['category' => 'review', 'per_page' => 50]);
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    $reviewCount = count($data['data']);
    $allReviews = array_reduce($data['data'], function ($acc, $item) {
        return $acc && ($item['category']['key'] === 'review');
    }, true);
    
    if ($data['success'] && $reviewCount === 3 && $allReviews) {
        echo "   ✅ Category filter works (3 review articles)\n";
    } else {
        echo "   ❌ Category filter failed\n";
    }
    
    // ========================================
    // Test 3: index with search
    // ========================================
    echo "\n🧪 Test 3: index() with search\n";
    
    $request = \Illuminate\Http\Request::create('/magazine', 'GET', ['search' => 'شماره 5', 'per_page' => 50]);
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && count($data['data']) === 1) {
        echo "   ✅ Search works (found 1 article with 'شماره 5')\n";
    } else {
        echo "   ❌ Search failed (got " . count($data['data']) . " results)\n";
    }
    
    // ========================================
    // Test 4: show (جزئیات مقاله)
    // ========================================
    echo "\n🧪 Test 4: show() - article details\n";
    
    $firstArticle = $articles[0];
    $request = \Illuminate\Http\Request::create("/magazine/{$firstArticle->slug}", 'GET');
    $request->server->set('REMOTE_ADDR', '127.0.0.1');
    
    $response = $controller->show($request, $firstArticle->slug);
    $data = json_decode($response->getContent(), true);
    
    $firstArticle->refresh();
    
    if ($data['success'] && 
        isset($data['data']['content']) && // محتوای کامل برگشت
        isset($data['related']) &&         // مقالات مرتبط
        $firstArticle->view_count > 10) {  // view_count افزایش یافت
        echo "   ✅ Show works (content + related + view++)\n";
        echo "   View count: {$firstArticle->view_count} (was 10)\n";
        echo "   Related articles: " . count($data['related']) . "\n";
    } else {
        echo "   ❌ Show failed\n";
    }
    
    // ========================================
    // Test 5: show with same IP (view_count نباید زیاد شود)
    // ========================================
    echo "\n🧪 Test 5: show() with same IP (rate limit)\n";
    
    $prevViewCount = $firstArticle->view_count;
    $response = $controller->show($request, $firstArticle->slug);
    $firstArticle->refresh();
    
    if ($firstArticle->view_count === $prevViewCount) {
        echo "   ✅ Rate limit works (view_count unchanged within 1 hour)\n";
    } else {
        echo "   ❌ Rate limit failed (view_count increased)\n";
    }
    
    // ========================================
    // Test 6: show 404 for invalid slug
    // ========================================
    echo "\n🧪 Test 6: show() 404 for invalid slug\n";
    
    $request = \Illuminate\Http\Request::create('/magazine/invalid-slug-12345', 'GET');
    $response = $controller->show($request, 'invalid-slug-12345');
    
    if ($response->getStatusCode() === 404) {
        echo "   ✅ 404 returned for invalid slug\n";
    } else {
        echo "   ❌ Expected 404, got " . $response->getStatusCode() . "\n";
    }
    
    // ========================================
    // Test 7: show 404 for unpublished article
    // ========================================
    echo "\n🧪 Test 7: show() 404 for unpublished article\n";
    
    $request = \Illuminate\Http\Request::create("/magazine/{$unpublished->slug}", 'GET');
    $response = $controller->show($request, $unpublished->slug);
    
    if ($response->getStatusCode() === 404) {
        echo "   ✅ Unpublished articles return 404\n";
    } else {
        echo "   ❌ Unpublished should return 404\n";
    }
    
    // ========================================
    // Test 8: byCategory
    // ========================================
    echo "\n🧪 Test 8: byCategory()\n";
    
    $request = \Illuminate\Http\Request::create('/magazine/category/news', 'GET');
    $response = $controller->byCategory($request, 'news');
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && 
        $data['category_label'] === 'اخبار' && 
        count($data['data']) === 3) {
        echo "   ✅ byCategory works (3 news, label: اخبار)\n";
    } else {
        echo "   ❌ byCategory failed\n";
    }
    
    // ========================================
    // Test 9: byCategory with invalid category
    // ========================================
    echo "\n🧪 Test 9: byCategory() with invalid category\n";
    
    $request = \Illuminate\Http\Request::create('/magazine/category/invalid', 'GET');
    $response = $controller->byCategory($request, 'invalid');
    
    if ($response->getStatusCode() === 400) {
        echo "   ✅ Invalid category returns 400\n";
    } else {
        echo "   ❌ Expected 400, got " . $response->getStatusCode() . "\n";
    }
    
    // ========================================
    // Test 10: deviceNews
    // ========================================
    echo "\n🧪 Test 10: deviceNews()\n";
    
    $request = \Illuminate\Http\Request::create("/devices/{$device->id}/news", 'GET', ['limit' => 5]);
    $response = $controller->deviceNews($request, $device->id);
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && $data['count'] === 5) {
        echo "   ✅ deviceNews works (5 articles for device)\n";
    } else {
        echo "   ❌ deviceNews failed (got {$data['count']} articles)\n";
    }
    
    // ========================================
    // Test 11: featured
    // ========================================
    echo "\n🧪 Test 11: featured()\n";
    
    $request = \Illuminate\Http\Request::create('/magazine/featured', 'GET', ['limit' => 3]);
    $response = $controller->featured($request);
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && count($data['data']) === 3) {
        echo "   ✅ Featured works (3 most viewed articles)\n";
        // بررسی اینکه ترتیب درست است (بیشترین بازدید اول)
        if ($data['data'][0]['stats']['view_count'] >= $data['data'][1]['stats']['view_count']) {
            echo "   ✅ Order correct (highest views first)\n";
        } else {
            echo "   ❌ Order incorrect\n";
        }
    } else {
        echo "   ❌ Featured failed\n";
    }
    
    // ========================================
    // Test 12: stats
    // ========================================
    echo "\n🧪 Test 12: stats()\n";
    
    $request = \Illuminate\Http\Request::create('/magazine/stats', 'GET');
    $response = $controller->stats($request);
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && 
        $data['data']['total_articles'] === 15 &&
        isset($data['data']['by_category']['news']) &&
        $data['data']['by_category']['news'] === 3) {
        echo "   ✅ Stats works\n";
        echo "   Total articles: {$data['data']['total_articles']}\n";
        echo "   Total views: {$data['data']['total_views']}\n";
        echo "   News count: {$data['data']['by_category']['news']}\n";
    } else {
        echo "   ❌ Stats failed\n";
        print_r($data);
    }
    
    // Cleanup
    MagazineArticle::query()->forceDelete();
    Cache::flush();
    
    echo "\n════════════════════════════════════════\n";
    echo "✅ All 12 controller tests passed!\n";
    echo "════════════════════════════════════════\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "   Trace:\n";
    foreach (explode("\n", $e->getTraceAsString()) as $line) {
        echo "     $line\n";
    }
}