<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_index_is_publicly_accessible(): void
    {
        $this->get('/sitemap.xml')
            ->assertStatus(200)
            ->assertHeader('Content-Type', 'application/xml; charset=utf-8');
    }

    /**
     * ✅ قبلاً این مسیر فقط auth:sanctum داشت (کامنتش هم می‌گفت «فقط
     * برای admin»، ولی کد این را اجرا نمی‌کرد) — یعنی هر کاربر لاگین‌شده
     * (نه فقط ادمین) می‌توانست cache سایت‌مپ را پاک کند.
     */
    public function test_clearing_sitemap_cache_requires_admin(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)
            ->post('/sitemap/clear-cache')
            ->assertStatus(403);
    }

    public function test_admin_can_clear_sitemap_cache(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/sitemap/clear-cache')
            ->assertStatus(200);
    }

    public function test_guest_cannot_clear_sitemap_cache(): void
    {
        // این مسیر در web.php است (نه api.php)، پس کاربر واردنشده به‌جای
        // ۴۰۱ به صفحه‌ی لاگین ریدایرکت می‌شود — رفتار استاندارد میدلور
        // auth برای مسیرهای وب.
        $this->post('/sitemap/clear-cache')->assertRedirect();
    }
}
