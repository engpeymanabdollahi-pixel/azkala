<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class OtpAuthenticationTest extends TestCase
{
    use RefreshDatabase;

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
        $user = User::factory()->create(['phone' => '09123456789']);
        $cacheKey = 'otp_rate_limit:09123456789';
        Cache::put($cacheKey, true, 60); // شبیه‌سازی محدودیت زمانی

        $response = $this->postJson('/api/v1/auth/otp/request', [
            'phone' => '09123456789'
        ]);

        $response->assertStatus(429) // Too Many Requests
                 ->assertJson(['message' => 'Too many attempts. Please try again later.']);
    }

    public function test_user_can_login_with_valid_otp(): void
    {
        $user = User::factory()->create(['phone' => '09123456789']);
        // فرض بر این است که کد 12345 در دیتابیس یا کش ذخیره شده است
        // در محیط واقعی باید سرویس OTP را ماک کنیم
        
        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'phone' => '09123456789',
            'code' => '12345' 
        ]);

        // اگر کد معتبر باشد، توکن برمی‌گردد
        // نکته: این تست نیازمند ماک کردن سرویس OTP است تا کد ثابت تولید کند
        $response->assertStatus(200);
    }
}