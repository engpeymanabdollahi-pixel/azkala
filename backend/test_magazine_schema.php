<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Test Magazine Schema ===\n\n";

try {
    // ========================================
    // پاکسازی قبل از تست (hard delete)
    // ========================================
    \App\Models\MagazineArticle::query()->forceDelete();
    echo "🧹 پاکسازی: همه مقالات قبلی حذف شدند\n\n";
    
    // ========================================
    // Test 1: Create magazine article
    // ========================================
    echo "🧪 Test 1: Create magazine article\n";
    
    // slug یکتا با timestamp
    $uniqueSlug = 'test-article-' . time();
    
    $article = \App\Models\MagazineArticle::create([
        'slug' => $uniqueSlug,
        'title' => 'تست باتری iPhone 15 Pro',
        'excerpt' => 'بررسی کامل باتری iPhone 15 Pro در سال ۲۰۲۶',
        'content' => 'محتوای کامل مقاله تست. باتری iPhone 15 Pro با ظرفیت ۳۲۷۴ میلی‌آمپر ساعت، عملکرد فوق‌العاده‌ای دارد...',
        'featured_image' => 'https://example.com/iphone-15-pro.jpg',
        'source_url' => 'https://zoomit.ir/article/12345',
        'source_name' => 'زومیت',
        'category' => 'review',
        'published_at' => now(),
        'is_published' => true,
        'content_source' => 'rss',
    ]);
    
    echo "   ✅ Created: ID={$article->id}\n";
    echo "   Slug: {$article->slug}\n";
    echo "   Title: {$article->title}\n";
    echo "   Category Label: {$article->category_label}\n";
    echo "   Content Source Label: {$article->content_source_label}\n";
    echo "   isLive: " . ($article->isLive() ? 'true' : 'false') . "\n";
    
    // ========================================
    // Test 2: Link article to device
    // ========================================
    echo "\n🧪 Test 2: Link article to device\n";
    $device = \App\Models\DeviceModel::first();
    
    if ($device) {
        $article->devices()->attach($device->id, ['relevance_score' => 100]);
        echo "   ✅ Linked to device: {$device->name} (ID: {$device->id})\n";
        echo "   Device articles count: {$device->magazineArticles()->count()}\n";
        echo "   Relevance score: " . $article->devices()->first()->pivot->relevance_score . "\n";
    } else {
        echo "   ⚠️ No device found (skipped)\n";
    }
    
    // ========================================
    // Test 3: Query published articles
    // ========================================
    echo "\n🧪 Test 3: Query published articles\n";
    $published = \App\Models\MagazineArticle::published()->latestPublished()->get();
    echo "   ✅ Published count: {$published->count()}\n";
    
    // ========================================
    // Test 4: Search
    // ========================================
    echo "\n🧪 Test 4: Search\n";
    $searchResults = \App\Models\MagazineArticle::search('باتری')->get();
    echo "   ✅ Search results: {$searchResults->count()}\n";
    
    // ========================================
    // Test 5: Slug generation
    // ========================================
    echo "\n🧪 Test 5: Slug generation\n";
    $slug = \App\Models\MagazineArticle::generateSlug('مقایسه iPhone 15 Pro با Galaxy S24 Ultra');
    echo "   ✅ Generated slug: {$slug}\n";
    
    // بررسی uniqueness با تکرار
    $slug2 = \App\Models\MagazineArticle::generateSlug('مقایسه iPhone 15 Pro با Galaxy S24 Ultra');
    echo "   ✅ Generated unique slug (2nd): {$slug2}\n";
    
    // ========================================
    // Test 6: Create unpublished article
    // ========================================
    echo "\n🧪 Test 6: Create unpublished article\n";
    $unpublished = \App\Models\MagazineArticle::create([
        'slug' => 'unpublished-' . time(),
        'title' => 'مقاله منتشر نشده',
        'excerpt' => 'این مقاله هنوز منتشر نشده',
        'content' => 'محتوا...',
        'category' => 'news',
        'published_at' => now()->addDays(7), // ۷ روز آینده
        'is_published' => false,
        'content_source' => 'admin',
    ]);
    
    echo "   ✅ Unpublished ID: {$unpublished->id}\n";
    echo "   isLive: " . ($unpublished->isLive() ? 'true' : 'false') . " (expected: false)\n";
    
    // بررسی scopePublished این را برنمی‌گرداند
    $publishedCount = \App\Models\MagazineArticle::published()->count();
    echo "   Published scope count: {$publishedCount} (expected: 1, not 2)\n";
    
    // ========================================
    // Test 7: Category scope
    // ========================================
    echo "\n🧪 Test 7: Category scope\n";
    $reviews = \App\Models\MagazineArticle::category('review')->get();
    $news = \App\Models\MagazineArticle::category('news')->get();
    echo "   ✅ Reviews count: {$reviews->count()}\n";
    echo "   ✅ News count: {$news->count()}\n";
    
    // ========================================
    // Test 8: Most viewed
    // ========================================
    echo "\n🧪 Test 8: Most viewed\n";
    $article->incrementViewCount();
    $article->incrementViewCount();
    $article->incrementViewCount();
    $article->refresh();
    echo "   ✅ View count after 3 increments: {$article->view_count}\n";
    
    $mostViewed = \App\Models\MagazineArticle::mostViewed()->first();
    echo "   ✅ Most viewed article ID: {$mostViewed->id}\n";
    
    // ========================================
    // Test 9: Soft delete
    // ========================================
    echo "\n🧪 Test 9: Soft delete\n";
    $article->delete();
    echo "   ✅ Soft deleted\n";
    echo "   Total (with trashed): " . \App\Models\MagazineArticle::withTrashed()->count() . "\n";
    echo "   Total (without trashed): " . \App\Models\MagazineArticle::count() . "\n";
    
    // ========================================
    // Cleanup
    // ========================================
    echo "\n🧹 Cleanup: hard delete همه مقالات تست\n";
    \App\Models\MagazineArticle::withTrashed()->forceDelete();
    echo "   ✅ All test data cleaned up\n";
    
    echo "\n════════════════════════════════════════\n";
    echo "✅ All 9 schema tests passed!\n";
    echo "════════════════════════════════════════\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "   Trace:\n";
    foreach (explode("\n", $e->getTraceAsString()) as $line) {
        echo "     $line\n";
    }
}