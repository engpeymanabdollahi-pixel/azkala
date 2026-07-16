<?php
namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class OtpAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('otp_request:09123456789');
    }

    public function test_user_can_request_otp(): void
    {
        $response = $this->postJson('/api/verify-otp', ['phone' => '09123456789']);
        $response->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_user_cannot_request_otp_too_frequently(): void
    {
        $phone = '09123456789';
        $key = 'otp_request:' . $phone;
        for ($i = 0; $i < 3; $i++) { RateLimiter::hit($key, 60); }

        $response = $this->postJson('/api/verify-otp', ['phone' => $phone]);
        $response->assertStatus(429)->assertJson(['success' => false]);
    }

    public function test_user_can_login_with_valid_otp(): void
    {
        $phone = '09123456789';
        Cache::put('otp_' . $phone, '12345', now()->addMinutes(5));
        
        $response = $this->postJson('/api/verify-otp', ['phone' => $phone, 'otp' => '12345']);
        $response->assertStatus(200)->assertJson(['success' => true])->assertJsonStructure(['data' => ['user', 'token']]);
    }
}