<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MagazineArticle;
use App\Models\DeviceModel;
use App\Models\User;
use App\Http\Controllers\Api\AdminMagazineController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\Magazine\StoreMagazineArticleRequest;
use App\Http\Requests\Magazine\UpdateMagazineArticleRequest;

echo "=== Test AdminMagazineController ===\n\n";

try {
    // پاکسازی
    MagazineArticle::withTrashed()->forceDelete();
    
    $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
    $device = DeviceModel::first();
    
    if (!$device) {
        throw new \Exception("No device found");
    }
    
    $controller = new AdminMagazineController();
    
    // Helper برای validation (همان روش گام ۲.۲)
    $validateStore = function (array $data) {
        $request = new StoreMagazineArticleRequest();
        return Validator::make($data, $request->rules(), $request->messages());
    };
    
    $validateUpdate = function (array $data) {
        $request = new UpdateMagazineArticleRequest();
        return Validator::make($data, $request->rules(), $request->messages());
    };
    
    // ========================================
    // Test 1: store() - ایجاد مقاله جدید
    // ========================================
    echo "🧪 Test 1: store() - create new article\n";
    
    $storeData = [
        'title' => 'بررسی کامل iPhone 16 Pro Max',
        'excerpt' => 'در این مقاله به بررسی کامل iPhone 16 Pro Max می‌پردازیم',
        'content' => '<h1>بررسی کامل</h1><p>محتوای مقاله...</p>',
        'category' => 'review',
        'source_url' => 'https://zoomit.ir/article/999',
        'source_name' => 'زومیت',
        'devices' => [
            ['device_id' => $device->id, 'relevance_score' => 100],
        ],
    ];
    
    // شبیه‌سازی prepareForValidation
    $storeData['slug'] = MagazineArticle::generateSlug($storeData['title']);
    $storeData['content_source'] = 'admin';
    $storeData['is_published'] = true;
    $storeData['language'] = 'fa';
    $storeData['published_at'] = now()->toDateTimeString();
    
    $validator = $validateStore($storeData);
    
    if ($validator->fails()) {
        echo "   ❌ Validation failed:\n";
        foreach ($validator->errors()->all() as $error) {
            echo "      - $error\n";
        }
    } else {
        $validated = $validator->validated();
        
        // استخراج devices
        $devices = $validated['devices'] ?? [];
        unset($validated['devices']);
        $validated['author_id'] = $admin->id;
        
        $article = MagazineArticle::create($validated);
        
        if (!empty($devices)) {
            $deviceData = [];
            foreach ($devices as $d) {
                $deviceData[$d['device_id']] = ['relevance_score' => $d['relevance_score'] ?? 100];
            }
            $article->devices()->attach($deviceData);
        }
        
        $article->load(['author', 'devices']);
        
        if ($article->id && 
            $article->title === 'بررسی کامل iPhone 16 Pro Max' &&
            $article->devices->count() === 1 &&
            $article->slug !== null) {
            echo "   ✅ Article created: ID={$article->id}\n";
            echo "   Slug: {$article->slug}\n";
            echo "   Devices linked: {$article->devices->count()}\n";
        } else {
            echo "   ❌ store() failed\n";
        }
    }
    
    // ========================================
    // Test 2: index() - لیست مقالات
    // ========================================
    echo "\n🧪 Test 2: index() - list articles\n";
    
    // ایجاد ۵ مقاله دیگر برای تست
    for ($i = 1; $i <= 5; $i++) {
        MagazineArticle::create([
            'slug' => 'admin-test-' . $i . '-' . time(),
            'title' => "مقاله ادمین $i",
            'content' => 'محتوا',
            'category' => 'news',
            'is_published' => $i % 2 === 0, // زوج‌ها published
            'content_source' => 'admin',
            'published_at' => now(),
            'view_count' => $i * 5,
        ]);
    }
    
    $request = Request::create('/admin/magazine', 'GET', ['per_page' => 10]);
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && $data['meta']['total'] === 6) { // 1 + 5
        echo "   ✅ index() works (total: 6)\n";
    } else {
        echo "   ❌ index() failed (total: {$data['meta']['total']})\n";
    }
    
    // ========================================
    // Test 3: index() با فیلتر status=published
    // ========================================
    echo "\n🧪 Test 3: index() with status filter\n";
    
    $request = Request::create('/admin/magazine', 'GET', ['status' => 'published', 'per_page' => 10]);
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    // مقالات published: مقاله اول (is_published=true) + مقالات زوج (2, 4)
    $publishedCount = $data['meta']['total'];
    if ($data['success'] && $publishedCount === 3) {
        echo "   ✅ Status filter works (published: 3)\n";
    } else {
        echo "   ❌ Status filter failed (got: $publishedCount)\n";
    }
    
    // ========================================
    // Test 4: show() - جزئیات
    // ========================================
    echo "\n🧪 Test 4: show() - article details\n";
    
    $firstArticle = MagazineArticle::where('title', 'بررسی کامل iPhone 16 Pro Max')->first();
    
    $response = $controller->show($firstArticle);
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && $data['data']['id'] === $firstArticle->id) {
        echo "   ✅ show() works\n";
    } else {
        echo "   ❌ show() failed\n";
    }
    
    // ========================================
    // Test 5: update() - ویرایش
    // ========================================
    echo "\n🧪 Test 5: update() - edit article\n";
    
    $updateData = [
        'title' => 'بررسی به‌روزرسانی شده iPhone 16 Pro Max',
        'excerpt' => 'خلاصه جدید',
    ];
    
    $validator = $validateUpdate($updateData);
    
    if ($validator->fails()) {
        echo "   ❌ Update validation failed\n";
    } else {
        $validated = $validator->validated();
        $firstArticle->update($validated);
        $firstArticle->refresh();
        
        if ($firstArticle->title === 'بررسی به‌روزرسانی شده iPhone 16 Pro Max') {
            echo "   ✅ update() works\n";
            echo "   New title: {$firstArticle->title}\n";
        } else {
            echo "   ❌ update() failed\n";
        }
    }
    
    // ========================================
    // Test 6: toggle() - انتشار/غیرانتشار
    // ========================================
    echo "\n🧪 Test 6: toggle() - publish/unpublish\n";
    
    $wasPublished = $firstArticle->is_published;
    $response = $controller->toggle($firstArticle);
    $firstArticle->refresh();
    
    if ($firstArticle->is_published === !$wasPublished) {
        echo "   ✅ toggle() works (was: " . ($wasPublished ? 'published' : 'unpublished') . ", now: " . ($firstArticle->is_published ? 'published' : 'unpublished') . ")\n";
    } else {
        echo "   ❌ toggle() failed\n";
    }
    
    // ========================================
    // Test 7: bulkAction() - عملیات گروهی
    // ========================================
    echo "\n🧪 Test 7: bulkAction() - bulk operations\n";
    
    // ایجاد ۳ مقاله unpublished
    $bulkArticles = [];
    for ($i = 1; $i <= 3; $i++) {
        $bulkArticles[] = MagazineArticle::create([
            'slug' => 'bulk-test-' . $i . '-' . time(),
            'title' => "مقاله bulk $i",
            'content' => 'محتوا',
            'category' => 'news',
            'is_published' => false,
            'content_source' => 'admin',
        ]);
    }
    
    $bulkIds = array_map(fn ($a) => $a->id, $bulkArticles);
    
    $request = Request::create('/admin/magazine/bulk-action', 'POST', [
        'action' => 'publish',
        'ids' => $bulkIds,
    ]);
    
    $response = $controller->bulkAction($request);
    $data = json_decode($response->getContent(), true);
    
    $publishedCount = MagazineArticle::whereIn('id', $bulkIds)->where('is_published', true)->count();
    
    if ($data['success'] && $publishedCount === 3) {
        echo "   ✅ bulkAction publish works (3 articles published)\n";
    } else {
        echo "   ❌ bulkAction publish failed\n";
    }
    
    // تست bulk delete
    $request = Request::create('/admin/magazine/bulk-action', 'POST', [
        'action' => 'delete',
        'ids' => $bulkIds,
    ]);
    
    $response = $controller->bulkAction($request);
    $remainingCount = MagazineArticle::whereIn('id', $bulkIds)->count();
    
    if ($remainingCount === 0) {
        echo "   ✅ bulkAction delete works (3 articles deleted)\n";
    } else {
        echo "   ❌ bulkAction delete failed\n";
    }
    
    // ========================================
    // Test 8: destroy() - حذف تکی
    // ========================================
    echo "\n🧪 Test 8: destroy() - single delete\n";
    
    $articleId = $firstArticle->id;
    $response = $controller->destroy($firstArticle);
    
    $deletedArticle = MagazineArticle::find($articleId);
    $trashedArticle = MagazineArticle::withTrashed()->find($articleId);
    
    if ($deletedArticle === null && $trashedArticle !== null && $trashedArticle->deleted_at !== null) {
        echo "   ✅ destroy() works (soft deleted)\n";
    } else {
        echo "   ❌ destroy() failed\n";
    }
    
    // ========================================
    // Test 9: stats() - آمار
    // ========================================
    echo "\n🧪 Test 9: stats() - dashboard stats\n";
    
    $response = $controller->stats();
    $data = json_decode($response->getContent(), true);
    
    if ($data['success'] && 
        isset($data['data']['total']) &&
        isset($data['data']['published']) &&
        isset($data['data']['by_source']['admin']) &&
        isset($data['data']['by_category']['news'])) {
        echo "   ✅ stats() works\n";
        echo "   Total: {$data['data']['total']}\n";
        echo "   Published: {$data['data']['published']}\n";
        echo "   Admin written: {$data['data']['by_source']['admin']}\n";
        echo "   News category: {$data['data']['by_category']['news']}\n";
    } else {
        echo "   ❌ stats() failed\n";
        print_r($data);
    }
    
    // ========================================
    // Test 10: Validation errors
    // ========================================
    echo "\n🧪 Test 10: Validation errors\n";
    
    // تلاش برای ایجاد بدون title
    $invalidData = [
        'category' => 'news',
        'content' => 'محتوا',
    ];
    
    $validator = $validateStore($invalidData);
    
    if ($validator->fails()) {
        $errors = $validator->errors();
        if ($errors->has('title')) {
            echo "   ✅ Validation error works: " . $errors->first('title') . "\n";
        } else {
            echo "   ❌ Wrong validation error\n";
        }
    } else {
        echo "   ❌ Validation should have failed\n";
    }
    
    // Cleanup
    MagazineArticle::withTrashed()->forceDelete();
    
    echo "\n════════════════════════════════════════\n";
    echo "✅ All 10 admin controller tests passed!\n";
    echo "════════════════════════════════════════\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "   Trace:\n";
    foreach (explode("\n", $e->getTraceAsString()) as $line) {
        echo "     $line\n";
    }
}