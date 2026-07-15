<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_admin_dashboard(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(401); // Unauthorized
    }

    public function test_regular_user_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'customer']); // نقش مشتری

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(403); // Forbidden
    }

    public function test_admin_user_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']); // نقش ادمین

        $response = $this->actingAs($admin, 'sanctum')
                         ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(200);
    }
}