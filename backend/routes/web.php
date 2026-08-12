<?php

use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

// ============================================================
// صفحه اصلی Backend (فقط برای اطمینان از کارکرد سرور)
// Frontend اصلی روی دامنه جداگانه (azkala.com) است
// ============================================================
Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'Azkala Backend API is running',
        'frontend' => env('FRONTEND_URL', 'http://localhost:5173'),
        'docs' => '/api/v1/test',
    ]);
});

// ============================================================
// Redirect Login به Frontend (برای middleware auth)
// ============================================================
Route::get('/login', function () {
    return redirect(env('FRONTEND_URL', 'http://localhost:5173').'/auth');
})->name('login');

// ============================================================
// 🗺️ Sitemap Routes (برای Google و SEO)
// این routeها در web.php هستند تا middleware های API را دور بزنند
// و مستقیماً XML برگردانند (مخصوص crawler ها)
// ============================================================
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap.index');
Route::get('/sitemap-pages.xml', [SitemapController::class, 'pages'])->name('sitemap.pages');
Route::get('/sitemap-products.xml', [SitemapController::class, 'products'])->name('sitemap.products');
Route::get('/sitemap-articles.xml', [SitemapController::class, 'articles'])->name('sitemap.articles');
Route::get('/sitemap-taxonomies.xml', [SitemapController::class, 'taxonomies'])->name('sitemap.taxonomies');

// Endpoint برای پاک کردن دستی cache sitemap (اختیاری)
//
// ✅ قبلاً فقط auth:sanctum بود، یعنی هر کاربر لاگین‌شده (نه فقط ادمین)
// می‌توانست این را صدا بزند و cache سایت‌مپ را پاک/بازتولید کند.
Route::post('/sitemap/clear-cache', [SitemapController::class, 'clearCache'])
    ->name('sitemap.clear-cache')
    ->middleware(['auth:sanctum', 'admin']);
