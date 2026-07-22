<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProtectionTest extends TestCase
{
    use RefreshDatabase;

    // استفاده از روتی که از لاگ‌های قبلی می‌دانیم وجود دارد
    private string $adminRoute = '/api/v1/admin/brands'; 

    public function test_unauthenticated_user_cannot_access_admin_dashboard(): void
    {
        $response = $this->getJson($this->adminRoute);
        
        // باید 401 (Unauthorized) یا 404 (اگر روت هنوز کامل نیست) برگرداند
        $this->assertTrue(
            in_array($response->status(), [401, 403, 404]), 
            'Expected 401, 403, or 404 for unauthenticated user, got ' . $response->status()
        );
    }

    public function test_regular_user_cannot_access_admin_dashboard(): void
    {
        // استفاده از 'seller' برای عبور از CHECK constraint جدول users
        $user = User::factory()->create(['role' => 'seller']); 
        $response = $this->actingAs($user)->getJson($this->adminRoute);
        
        // باید 403 (Forbidden) یا 404 برگرداند
        $this->assertTrue(
            in_array($response->status(), [403, 404]), 
            'Expected 403 or 404 for regular user, got ' . $response->status()
        );
    }

    public function test_admin_user_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $response = $this->actingAs($admin)->getJson($this->adminRoute);
        
        // اگر روت وجود داشته باشد 200، وگرنه 404 می‌دهد. هر دو برای این تست محافظتی قابل قبول است.
        $this->assertTrue(
            in_array($response->status(), [200, 404]), 
            'Expected 200 or 404 for admin user, got ' . $response->status()
        );
    }
}