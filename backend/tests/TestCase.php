<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * ✅ اصلاح شده: جلوگیری از افزودن تکراری /v1/
     */
    protected function prepareUrlForRequest($uri)
    {
        // فقط اگر /api/ بود و /api/v1/ نبود، تبدیل کن
        if (str_starts_with($uri, '/api/') && !str_starts_with($uri, '/api/v1/')) {
            $uri = '/api/v1' . substr($uri, 4);
        }
        
        return parent::prepareUrlForRequest($uri);
    }
}