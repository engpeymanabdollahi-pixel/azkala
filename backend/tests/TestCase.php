<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * ✅ ترفند معمارانه: افزودن خودکار پیشوند v1 به تمام درخواست‌های API در تست‌ها
     * این کار باعث می‌شود نیازی به ویرایش دستی ده‌ها فایل تست نباشد.
     */
    protected function prepareUrlForRequest($uri)
    {
        // اگر آدرس با /api/ شروع می‌شد، آن را به /api/v1/ تبدیل کن
        if (str_starts_with($uri, '/api/')) {
            $uri = '/api/v1' . substr($uri, 4);
        }
        
        return parent::prepareUrlForRequest($uri);
    }
}