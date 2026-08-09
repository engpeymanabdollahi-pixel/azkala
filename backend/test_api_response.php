<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\MagazineArticle;
use App\Http\Resources\MagazineSummaryResource;
use Illuminate\Http\Request;

echo "=== ساختار واقعی API Response ===\n\n";

try {
    $article = MagazineArticle::with(['devices.series.brand', 'author'])->first();
    
    if (!$article) {
        echo "❌ هیچ مقاله‌ای در DB نیست\n";
        exit(1);
    }
    
    echo "📰 مقاله تست:\n";
    echo "   Title: {$article->title}\n\n";
    
    // ساخت Request mock
    $request = Request::create('/magazine', 'GET');
    
    // ساخت resource
    $resource = new MagazineSummaryResource($article);
    $json = $resource->toJson();
    $data = json_decode($json, true);
    
    echo "📋 ساختار JSON کامل:\n";
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    
    echo "\n🔍 بررسی فیلدهای مهم:\n";
    echo "   source: " . (isset($data['source']) ? json_encode($data['source']) : 'NOT SET') . "\n";
    echo "   category: " . (isset($data['category']) ? json_encode($data['category']) : 'NOT SET') . "\n";
    echo "   content_source: " . (isset($data['content_source']) ? json_encode($data['content_source']) : 'NOT SET') . "\n";
    echo "   stats: " . (isset($data['stats']) ? json_encode($data['stats']) : 'NOT SET') . "\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}