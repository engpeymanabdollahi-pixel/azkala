<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class OtpAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_otp(): void
    {
        $response = $this->postJson('/api/verify-otp', [
            'phone' => '09123456789'
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'debug_otp'
                 ]);
        
        // بررسی اینکه کد در کش ذخیره شده است
        $this->assertNotNull(Cache::get('otp_09123456789'));
    }

        public function test_user_cannot_request_otp_too_frequently(): void
    {
        // پاک کردن کش قبل از تست برای اطمینان از شروع شمارنده از صفر
        \Illuminate\Support\Facades\Cache::flush();

        // ۵ درخواست اول باید موفق باشند (محدوده throttle ما ۵ درخواست در دقیقه است)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/verify-otp', ['phone' => '09123456789'])
                 ->assertStatus(200);
        }

        // درخواست ششم باید با خطای 429 (Too Many Requests) مواجه شود
        $response = $this->postJson('/api/verify-otp', [
            'phone' => '09123456789'
        ]);

        $response->assertStatus(429);
    }
    
    public function test_user_can_login_with_valid_otp(): void
    {
        $phone = '09123456789';
        
        // ۱. درخواست کد (مرحله اول)
        $this->postJson('/api/verify-otp', ['phone' => $phone]);
        
        // دریافت کد تولید شده از کش
        $validOtp = Cache::get('otp_' . $phone);

        // ۲. ارسال کد برای ورود (مرحله دوم)
        $response = $this->postJson('/api/verify-otp', [
            'phone' => $phone,
            'otp' => $validOtp
        ]);

        // بررسی پاسخ موفقیت‌آمیز و وجود توکن
        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'ورود با موفقیت انجام شد.'
                 ])
                 ->assertJsonStructure([
                     'data' => [
                         'user' => ['id', 'name', 'phone'],
                         'token'
                     ]
                 ]);

        // بررسی اینکه کاربر در دیتابیس ساخته یا به‌روزرسانی شده است
        $this->assertDatabaseHas('users', [
            'phone' => $phone
        ]);
    }

    public function test_user_cannot_login_with_invalid_otp(): void
    {
        $phone = '09123456789';
        
        // درخواست کد
        $this->postJson('/api/verify-otp', ['phone' => $phone]);

        // ارسال کد اشتباه
        $response = $this->postJson('/api/verify-otp', [
            'phone' => $phone,
            'otp' => '99999' // کد اشتباه
        ]);

        $response->assertStatus(422)
                 ->assertJson([
                     'success' => false,
                     'message' => 'کد تایید نامعتبر یا منقضی است.'
                 ]);
    }
}