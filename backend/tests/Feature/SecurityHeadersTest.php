<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * ✅ قبلاً هیچ هدر امنیتی روی پاسخ‌ها ست نمی‌شد (گزارش Qwen Code — SEC-09).
 */
class SecurityHeadersTest extends TestCase
{
    public function test_api_responses_include_basic_security_headers(): void
    {
        $response = $this->getJson('/api/v1/test');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    }
}
