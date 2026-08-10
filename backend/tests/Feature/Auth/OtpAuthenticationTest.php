<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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
            ->assertJsonStructure(['data' => ['user_id']]);

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
        Cache::put('otp_'.$phone, $validOtp, now()->addMinutes(5));

        $response = $this->postJson('/api/v1/verify-otp', [
            'phone' => $phone,
            'otp' => $validOtp,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', ['phone' => $phone]);
    }

    /**
     * ✅ قبلاً firstOrCreate در registerOrRequestOtp/handleOtpLogin کلید
     * is_active را در آرایه‌ی ساخت نمی‌گذاشت. ستون در دیتابیس true دیفالت
     * دارد، ولی مدل درون‌حافظه‌ای که firstOrCreate برمی‌گرداند فقط مقادیر
     * صریحاً پاس‌داده‌شده را دارد — یعنی is_active همان لحظه null بود (با
     * cast بولین یعنی false)، هرچند ردیف واقعی در دیتابیس true بود. کاربری
     * که تازه با OTP ثبت‌نام کرده بود، در همان پاسخ اول «غیرفعال» دیده
     * می‌شد.
     */
    public function test_a_freshly_registered_otp_user_is_active_in_the_response(): void
    {
        $phone = '09123456789';
        $validOtp = '12345';
        Cache::put('otp_'.$phone, $validOtp, now()->addMinutes(5));

        $response = $this->postJson('/api/v1/verify-otp', ['phone' => $phone, 'otp' => $validOtp]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.is_active', true);

        $this->assertDatabaseHas('users', ['phone' => $phone, 'is_active' => true]);
    }

    /**
     * ✅ قبلاً handleOtp فقط توکن Bearer برمی‌گرداند و هیچ نشست کوکی‌محور
     * نمی‌ساخت (برخلاف AuthController::login که Auth::guard('web')->login()
     * و session()->regenerate() را صدا می‌زد). چون توکن فقط در حافظه‌ی
     * Zustand فرانت‌اند می‌ماند (عمداً persist نمی‌شود)، اولین reload بعد از
     * ورود با OTP — یعنی مسیر اصلی AuthModal، رایج‌ترین راه ورود سایت —
     * کاربر را کاملاً بدون راه بازیابی رها می‌کرد: نه توکن مانده بود، نه
     * کوکی معتبری وجود داشت که interceptor بتواند از آن استفاده کند.
     */
    public function test_verifying_otp_also_starts_a_cookie_session(): void
    {
        $phone = '09123456789';
        $validOtp = '12345';
        Cache::put('otp_'.$phone, $validOtp, now()->addMinutes(5));

        $this->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/v1/verify-otp', ['phone' => $phone, 'otp' => $validOtp])
            ->assertStatus(200);

        // این همان چیزی است که بعد از reload (بدون هیچ هدر Authorization) باید
        // کاربر را دوباره احراز هویت کند.
        $this->withHeader('Origin', 'http://localhost:5173')
            ->getJson('/api/v1/user')
            ->assertStatus(200)
            ->assertJsonPath('data.phone', $phone);
    }

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }
}
