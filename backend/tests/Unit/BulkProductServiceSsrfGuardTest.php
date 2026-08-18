<?php

namespace Tests\Unit;

use App\Services\Seller\BulkProductService;
use Tests\TestCase;

/**
 * ✅ قبلاً BulkProductService::downloadImage با هر URLای که در ستون
 * main_image_url فایل اکسل seller بود (بدون هیچ بررسی) از سمت سرور
 * Http::get می‌زد — یک SSRF واقعی به IPهای داخلی/private/متادیتای ابری.
 * این تست مستقیماً منطق isSafeExternalUrl (محافظ SSRF) را قفل می‌کند تا
 * این رفتار دوباره برنگردد.
 */
class BulkProductServiceSsrfGuardTest extends TestCase
{
    private function isSafe(string $url): bool
    {
        // ✅ Device-First Architecture فاز ۱L: BulkProductService اکنون
        // DeviceEnforcementService را از سازنده می‌گیرد — از کانتینر resolve
        // می‌کنیم تا این تست به‌جای وابستگی صریح، مثل کد واقعی رفتار کند.
        $service = app(BulkProductService::class);
        $method = new \ReflectionMethod(BulkProductService::class, 'isSafeExternalUrl');
        $method->setAccessible(true);

        return $method->invoke($service, $url);
    }

    public function test_it_blocks_localhost_and_loopback(): void
    {
        $this->assertFalse($this->isSafe('http://127.0.0.1/image.jpg'));
        $this->assertFalse($this->isSafe('http://localhost/image.jpg'));
    }

    public function test_it_blocks_cloud_metadata_endpoint(): void
    {
        $this->assertFalse($this->isSafe('http://169.254.169.254/latest/meta-data/'));
    }

    public function test_it_blocks_private_network_ranges(): void
    {
        $this->assertFalse($this->isSafe('http://10.0.0.5/image.jpg'));
        $this->assertFalse($this->isSafe('http://192.168.1.10/image.jpg'));
        $this->assertFalse($this->isSafe('http://172.16.0.5/image.jpg'));
    }

    public function test_it_blocks_non_http_schemes(): void
    {
        $this->assertFalse($this->isSafe('file:///etc/passwd'));
        $this->assertFalse($this->isSafe('ftp://93.184.216.34/image.jpg'));
    }

    public function test_it_allows_a_public_ip_literal(): void
    {
        $this->assertTrue($this->isSafe('http://93.184.216.34/image.jpg'));
    }
}
