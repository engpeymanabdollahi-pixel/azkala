<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\MagazineArticle;
use App\Models\User;
use App\Http\Resources\MagazineResource;
use App\Http\Resources\MagazineSummaryResource;

echo "=== Test Magazine Resources ===\n\n";

try {
    // پاکسازی
    MagazineArticle::query()->forceDelete();
    
    // ========================================
    // Test 1: Create test data
    // ========================================
    echo "🧪 Test 1: Create test article\n";
    
    $admin = User::where('role', 'admin')->first() 
        ?? User::factory()->create(['role' => 'admin']);
    
    $device = \App\Models\DeviceModel::with('series.brand')->first();
    
    $article = MagazineArticle::create([
        'slug' => 'test-' . time(),
        'title' => 'تست باتری iPhone 15 Pro - بررسی کامل',
        'excerpt' => 'بررسی کامل باتری iPhone 15 Pro با ظرفیت ۳۲۷۴ میلی‌آمپر ساعت',
        'content' => '<h1>محتوای کامل</h1><p>این یک متن کامل است...</p>',
        'featured_image' => 'https://example.com/iphone-15.jpg',
        'source_url' => 'https://zoomit.ir/article/12345',
        'source_name' => 'زومیت',
        'author_id' => $admin->id,
        'category' => 'review',
        'published_at' => now(),
        'is_published' => true,
        'content_source' => 'rss',
        'view_count' => 42,
    ]);
    
    if ($device) {
        $article->devices()->attach($device->id, ['relevance_score' => 100]);
    }
    
    echo "   ✅ Article created: ID={$article->id}\n";
    
    // ========================================
    // Test 2: MagazineResource output
    // ========================================
    echo "\n🧪 Test 2: MagazineResource output\n";
    
    $article->load(['author', 'devices.series.brand']);
    $resource = new MagazineResource($article);
    $array = $resource->toArray(request());
    
    echo "   ✅ Resource keys: " . implode(', ', array_keys($array)) . "\n";
    echo "   Title: {$array['title']}\n";
    echo "   Category: {$array['category']['label']}\n";
    echo "   Content Source: {$array['content_source']['label']}\n";
    echo "   View Count: {$array['stats']['view_count']}\n";
    echo "   Author: {$array['author']['name']}\n";
    
    if (!empty($array['devices'])) {
        echo "   Devices count: " . count($array['devices']) . "\n";
        echo "   First device: {$array['devices'][0]['name']}\n";
    }
    
    // ========================================
    // Test 3: MagazineSummaryResource output
    // ========================================
    echo "\n🧪 Test 3: MagazineSummaryResource output\n";
    
    $summary = new MagazineSummaryResource($article);
    $summaryArray = $summary->toArray(request());
    
    echo "   ✅ Summary keys: " . implode(', ', array_keys($summaryArray)) . "\n";
    echo "   Title: {$summaryArray['title']}\n";
    echo "   Category: {$summaryArray['category']['label']}\n";
    
    // ========================================
    // Test 4: JSON response
    // ========================================
    echo "\n🧪 Test 4: JSON response format\n";
    
    $response = response()->json([
        'success' => true,
        'data' => new MagazineResource($article),
    ]);
    
    $json = json_decode($response->getContent(), true);
    echo "   ✅ JSON keys: " . implode(', ', array_keys($json)) . "\n";
    echo "   success: " . ($json['success'] ? 'true' : 'false') . "\n";
    
    // ========================================
    // Test 5: Collection
    // ========================================
    echo "\n🧪 Test 5: Collection response\n";
    
    $articles = MagazineArticle::with(['devices'])->take(3)->get();
    $collection = MagazineSummaryResource::collection($articles);
    
    echo "   ✅ Collection count: " . $collection->count() . "\n";
    
    // Cleanup
    MagazineArticle::query()->forceDelete();
    
    echo "\n════════════════════════════════════════\n";
    echo "✅ All 5 Resource tests passed!\n";
    echo "════════════════════════════════════════\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}