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
        $this->markTestSkipped('Admin dashboard route not implemented yet');
    }

    public function test_regular_user_cannot_access_admin_dashboard(): void
    {
        $this->markTestSkipped('Admin dashboard route not implemented yet');
    }

    public function test_admin_user_can_access_admin_dashboard(): void
    {
        $this->markTestSkipped('Admin dashboard route not implemented yet');
    }
}