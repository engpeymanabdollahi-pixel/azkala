<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\MagazineArticle;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * سرویس تولید Sitemap داینامیک برای ازکالا
 *
 * این سرویس ۵ نوع sitemap تولید می‌کند:
 * 1. Index sitemap (/sitemap.xml) - فهرست همه sitemapها
 * 2. Pages (/sitemap-pages.xml) - صفحات استاتیک
 * 3. Products (/sitemap-products.xml) - محصولات فعال
 * 4. Articles (/sitemap-articles.xml) - مقالات منتشر شده
 * 5. Taxonomies (/sitemap-taxonomies.xml) - برندها و دسته‌بندی‌ها
 *
 * همه sitemapها برای ۶۰ دقیقه cache می‌شوند.
 */
class SitemapService
{
    private string $siteUrl;
    private int $cacheTtl;

    public function __construct()
    {
        // اولویت با SITE_URL، fallback به FRONTEND_URL، و در نهایت default
        $this->siteUrl = rtrim(
            env('SITE_URL', env('FRONTEND_URL', 'https://azkala.com')),
            '/'
        );
        $this->cacheTtl = (int) env('SITEMAP_CACHE_TTL', 60);
    }

    /**
     * Index Sitemap - فهرست همه sub-sitemap ها
     */
    public function index(): string
    {
        return Cache::remember('sitemap.index', $this->cacheTtl * 60, function () {
            $now = now()->toW3cString();
            $sitemaps = [
                ['loc' => '/sitemap-pages.xml', 'lastmod' => $now],
                ['loc' => '/sitemap-products.xml', 'lastmod' => $now],
                ['loc' => '/sitemap-articles.xml', 'lastmod' => $now],
                ['loc' => '/sitemap-taxonomies.xml', 'lastmod' => $now],
            ];

            return $this->renderIndex($sitemaps);
        });
    }

    /**
     * صفحات استاتیک ازکالا
     */
    public function pages(): string
    {
        return Cache::remember('sitemap.pages', $this->cacheTtl * 60, function () {
            $pages = [
                // صفحه اصلی - بالاترین اولویت
                ['loc' => '/', 'priority' => '1.0', 'changefreq' => 'daily'],
                
                // صفحات اصلی بازاریابی
                ['loc' => '/products', 'priority' => '0.9', 'changefreq' => 'daily'],
                ['loc' => '/brands', 'priority' => '0.8', 'changefreq' => 'weekly'],
                ['loc' => '/magazine', 'priority' => '0.8', 'changefreq' => 'daily'],
                
                // صفحات اعتماد و اطلاعات
                ['loc' => '/about', 'priority' => '0.5', 'changefreq' => 'monthly'],
                ['loc' => '/contact', 'priority' => '0.5', 'changefreq' => 'monthly'],
                ['loc' => '/help', 'priority' => '0.5', 'changefreq' => 'monthly'],
                ['loc' => '/guarantee', 'priority' => '0.4', 'changefreq' => 'yearly'],
                ['loc' => '/terms', 'priority' => '0.3', 'changefreq' => 'yearly'],
                // ✅ صفحات جدید ممیزی حقوقی — بدون دلیل خاصی نباید noindex
                // باشند؛ مثل بقیه‌ی صفحات اعتماد/اطلاعات به سایت‌مپ اضافه شدند.
                ['loc' => '/privacy', 'priority' => '0.3', 'changefreq' => 'yearly'],
                ['loc' => '/shipping', 'priority' => '0.4', 'changefreq' => 'monthly'],
                ['loc' => '/seller-agreement', 'priority' => '0.3', 'changefreq' => 'yearly'],

                // صفحات ورود فروشندگان
                ['loc' => '/seller-request', 'priority' => '0.6', 'changefreq' => 'monthly'],
            ];

            return $this->renderUrlset($pages);
        });
    }

    /**
     * محصولات فعال ازکالا
     */
    public function products(): string
    {
        return Cache::remember('sitemap.products', $this->cacheTtl * 60, function () {
            $products = Product::query()
                ->active()
                ->select(['slug', 'updated_at'])
                ->orderBy('updated_at', 'desc')
                ->get()
                ->map(fn ($p) => [
                    'loc' => "/products/{$p->slug}",
                    'lastmod' => $p->updated_at?->toW3cString(),
                    'priority' => '0.8',
                    'changefreq' => 'weekly',
                ])
                ->toArray();

            return $this->renderUrlset($products);
        });
    }

    /**
     * مقالات مجله منتشر شده
     */
    public function articles(): string
    {
        return Cache::remember('sitemap.articles', $this->cacheTtl * 60, function () {
            $articles = MagazineArticle::query()
                ->published()
                ->select(['slug', 'updated_at', 'published_at'])
                ->orderBy('published_at', 'desc')
                ->get()
                ->map(fn ($a) => [
                    'loc' => "/magazine/{$a->slug}",
                    'lastmod' => ($a->updated_at ?? $a->published_at)?->toW3cString(),
                    'priority' => '0.7',
                    'changefreq' => 'weekly',
                ])
                ->toArray();

            return $this->renderUrlset($articles);
        });
    }

    /**
     * برندها و دسته‌بندی‌های فعال
     */
    public function taxonomies(): string
    {
        return Cache::remember('sitemap.taxonomies', $this->cacheTtl * 60, function () {
            $urls = [];

            // برندها
            $brands = Brand::query()
                ->active()
                ->select(['slug', 'updated_at'])
                ->get()
                ->map(fn ($b) => [
                    'loc' => "/brands/{$b->slug}",
                    'lastmod' => $b->updated_at?->toW3cString(),
                    'priority' => '0.6',
                    'changefreq' => 'monthly',
                ])
                ->toArray();

            // دسته‌بندی‌ها
            $categories = Category::query()
                ->active()
                ->select(['slug', 'updated_at'])
                ->get()
                ->map(fn ($c) => [
                    'loc' => "/categories/{$c->slug}",
                    'lastmod' => $c->updated_at?->toW3cString(),
                    'priority' => '0.6',
                    'changefreq' => 'weekly',
                ])
                ->toArray();

            $urls = array_merge($brands, $categories);

            return $this->renderUrlset($urls);
        });
    }

    /**
     * پاک کردن cache همه sitemapها (برای فراخوانی بعد از تغییرات عمده)
     */
    public function clearCache(): void
    {
        Cache::forget('sitemap.index');
        Cache::forget('sitemap.pages');
        Cache::forget('sitemap.products');
        Cache::forget('sitemap.articles');
        Cache::forget('sitemap.taxonomies');
    }

    // ==================== Private Render Methods ====================

    /**
     * رندر Sitemap Index
     */
    private function renderIndex(array $sitemaps): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($sitemaps as $sitemap) {
            $xml .= "  <sitemap>\n";
            $xml .= "    <loc>{$this->siteUrl}{$sitemap['loc']}</loc>\n";
            $xml .= "    <lastmod>{$sitemap['lastmod']}</lastmod>\n";
            $xml .= "  </sitemap>\n";
        }

        $xml .= '</sitemapindex>';

        return $xml;
    }

    /**
     * رندر URL Set
     */
    private function renderUrlset(array $urls): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($urls as $url) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$this->siteUrl}{$url['loc']}</loc>\n";
            
            if (!empty($url['lastmod'])) {
                $xml .= "    <lastmod>{$url['lastmod']}</lastmod>\n";
            }
            
            if (!empty($url['changefreq'])) {
                $xml .= "    <changefreq>{$url['changefreq']}</changefreq>\n";
            }
            
            if (!empty($url['priority'])) {
                $xml .= "    <priority>{$url['priority']}</priority>\n";
            }
            
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }
}