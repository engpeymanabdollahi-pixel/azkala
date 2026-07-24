<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class OtpAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_otp(): void
    {
        $phone = '09123456789';

        $response = $this->postJson('/api/v1/register', ['phone' => $phone]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonStructure(['phone']);
                 
        $this->assertDatabaseHas('users', ['phone' => $phone]);
    }

         public function test_user_cannot_request_otp_too_frequently(): void
    {
        $phone = '09123456789';
        
        // ✅ روش قطعی: ارسال واقعی ۱۰ درخواست مجاز (محدودیت ما ۱۰ درخواست در دقیقه است)
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/register', ['phone' => $phone])->assertStatus(200);
        }

        // درخواست یازدهم باید با کد ۴۲۹ رد شود
        $response = $this->postJson('/api/v1/register', ['phone' => $phone]);

        $response->assertStatus(429); // Too Many Requests
    }

    public function test_user_can_login_with_valid_otp(): void
    {
        $phone = '09123456789';
        $validOtp = '12345';
        
        // Pre-seed the cache with a valid OTP
        Cache::put('otp_' . $phone, $validOtp, now()->addMinutes(5));

        $response = $this->postJson('/api/v1/verify-otp', [
            'phone' => $phone, 
            'otp' => $validOtp
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonStructure(['data' => ['user', 'token']]);
                 
        $this->assertDatabaseHas('users', ['phone' => $phone]);
    }

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }
}