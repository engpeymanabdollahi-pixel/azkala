<?php

namespace Tests\Feature\Auth;

use App\Models\User;
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
        // پاک‌سازی کش و Rate Limiter قبل از هر تست
        Cache::flush();
        RateLimiter::clear('otp_request:09123456789');
    }

    public function test_user_can_request_otp_code(): void
    {
        $user = User::factory()->create(['phone' => '09123456789']);

        $response = $this->postJson('/api/v1/auth/otp/request', [
            'phone' => '09123456789'
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
        
        $this->assertDatabaseHas('otp_codes', [
            'phone' => '09123456789',
            'verified' => false
        ]);
    }

   public function test_user_cannot_request_otp_too_frequently(): void
{
    $phone = '09123456789';
    
    // ۳ درخواست موفق ارسال می‌کنیم تا سقف پر شود
    for ($i = 0; $i < 3; $i++) {
        $this->postJson('/api/v1/auth/otp/request', ['phone' => $phone])
             ->assertStatus(200);
    }

    // درخواست چهارم باید رد شود (429)
    $response = $this->postJson('/api/v1/auth/otp/request', ['phone' => $phone]);

    $response->assertStatus(429)
             ->assertJsonPath('success', false)
             ->assertJsonFragment(['message' => 'تعداد تلاش‌ها بیش از حد مجاز است']);
}

    public function test_user_can_login_with_valid_otp(): void
    {
        $user = User::factory()->create(['phone' => '09123456789']);
        Cache::put('otp_09123456789', '12345', now()->addMinutes(5));
        
        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'phone' => '09123456789',
            'code' => '12345' 
        ]);

        $response->assertStatus(200);
    }
}