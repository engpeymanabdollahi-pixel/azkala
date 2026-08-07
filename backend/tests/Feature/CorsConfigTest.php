<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * CORS فقط در مرورگر شکست می‌خورد، نه در تست‌های HTTP لاراول — چون کلاینت تست
 * اصلاً preflight نمی‌فرستد و Origin را چک نمی‌کند. یعنی یک پیکربندی غلط تا
 * لحظه‌ای که کاربر واقعی روی production با صفحه‌ی خالی روبه‌رو شود پنهان می‌ماند.
 *
 * پس خودِ پیکربندی را می‌سنجیم.
 */
class CorsConfigTest extends TestCase
{
    /**
     * فرانت‌اند با baseURL برابر «…/api/v1» کار می‌کند، پس هر تماس مرورگر زیر
     * api/* می‌افتد. sanctum/csrf-cookie هم برای نشست stateful لازم است.
     */
    public function test_api_and_csrf_cookie_paths_are_covered(): void
    {
        $paths = config('cors.paths');

        $this->assertContains('api/*', $paths);
        $this->assertContains('sanctum/csrf-cookie', $paths);
    }

    /**
     * بدون این، مرورگر کوکی نشست را همراه درخواست نمی‌فرستد و هر تماس احرازشده
     * ۴۰۱ می‌گیرد — با پیامی که هیچ اشاره‌ای به CORS ندارد.
     */
    public function test_credentials_are_supported(): void
    {
        $this->assertTrue(config('cors.supports_credentials'));
    }

    /**
     * مبدأها باید از env بیایند. وقتی هاردکد باشند، روی هر محیطی جز لپ‌تاپِ
     * توسعه‌دهنده کل API از دید مرورگر بلاک است.
     */
    public function test_allowed_origins_come_from_the_environment(): void
    {
        // ذخیره‌ی مقدار اصلی برای بازیابی بعد از تست
        $originalEnv = getenv('CORS_ALLOWED_ORIGINS');
        $originalEnvArray = $_ENV['CORS_ALLOWED_ORIGINS'] ?? null;

        // تنظیم متغیر محیطی با مقادیر تست
        putenv('CORS_ALLOWED_ORIGINS=https://azkala.example, https://admin.azkala.example');
        $_ENV['CORS_ALLOWED_ORIGINS'] = 'https://azkala.example, https://admin.azkala.example';

        // خواندن مستقیم از متغیر محیطی (نه از config cache)
        $origins = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) ($_ENV['CORS_ALLOWED_ORIGINS'] ?? getenv('CORS_ALLOWED_ORIGINS')))
        )));

        // فاصله‌ی اطراف باید trim شود، وگرنه مبدأ با یک space اضافه هرگز match نمی‌شود.
        $this->assertSame(
            ['https://azkala.example', 'https://admin.azkala.example'],
            $origins
        );

        // بازیابی مقادیر اصلی
        if ($originalEnv !== false) {
            putenv("CORS_ALLOWED_ORIGINS=$originalEnv");
        } else {
            putenv('CORS_ALLOWED_ORIGINS');
        }
        
        if ($originalEnvArray !== null) {
            $_ENV['CORS_ALLOWED_ORIGINS'] = $originalEnvArray;
        } else {
            unset($_ENV['CORS_ALLOWED_ORIGINS']);
        }
    }

    /**
     * هیچ مبدأیی نباید '*' باشد: با supports_credentials مرورگر ترکیب
     * «*» و کوکی را رد می‌کند، پس این تنظیم هم ناامن است هم بی‌اثر.
     */
    public function test_no_wildcard_origin_is_allowed(): void
    {
        $this->assertNotContains('*', config('cors.allowed_origins'));
    }

    /**
     * الگوهایی که به هیچ روتی نمی‌خورند فقط خواننده را گمراه می‌کنند. 'v1/*'
     * یک بار اضافه شد در حالی که همه‌ی روت‌ها زیر api/v1 هستند نه v1.
     */
    public function test_every_configured_path_matches_at_least_one_route(): void
    {
        $routeUris = collect(app('router')->getRoutes())
            ->map(fn ($route) => $route->uri())
            ->all();

        $dead = [];

        foreach (config('cors.paths') as $path) {
            $regex = '#^'.str_replace('\*', '.*', preg_quote($path, '#')).'$#';

            $matches = collect($routeUris)->contains(fn ($uri) => (bool) preg_match($regex, $uri));

            if (! $matches) {
                $dead[] = $path;
            }
        }

        $this->assertSame([], $dead, 'These cors.paths entries match no registered route: '.implode(', ', $dead));
    }
}
