<?php

namespace App\Http\Controllers;

use App\Services\SitemapService;
use Illuminate\Http\Response;

/**
 * کنترلر Sitemap داینامیک
 *
 * همه responseها به‌صورت XML با header صحیح و cache browser برای ۱ ساعت
 */
class SitemapController extends Controller
{
    private SitemapService $sitemapService;

    public function __construct(SitemapService $sitemapService)
    {
        $this->sitemapService = $sitemapService;
    }

    public function index(): Response
    {
        return $this->xmlResponse($this->sitemapService->index());
    }

    public function pages(): Response
    {
        return $this->xmlResponse($this->sitemapService->pages());
    }

    public function products(): Response
    {
        return $this->xmlResponse($this->sitemapService->products());
    }

    public function articles(): Response
    {
        return $this->xmlResponse($this->sitemapService->articles());
    }

    public function taxonomies(): Response
    {
        return $this->xmlResponse($this->sitemapService->taxonomies());
    }

    /**
     * Endpoint برای پاک کردن cache (فقط برای admin)
     * مثال: POST /sitemap/clear-cache
     */
    public function clearCache(): Response
    {
        $this->sitemapService->clearCache();
        
        return response('Sitemap cache cleared successfully', 200)
            ->header('Content-Type', 'text/plain');
    }

    /**
     * ساخت Response XML استاندارد
     */
    private function xmlResponse(string $xml): Response
    {
        return response($xml, 200)
            ->header('Content-Type', 'application/xml; charset=utf-8')
            ->header('Cache-Control', 'public, max-age=3600') // ۱ ساعت browser cache
            ->header('X-Robots-Tag', 'noindex, follow');
    }
}