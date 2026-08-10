<?php

namespace Tests\Unit\Jobs;

use App\Jobs\SendOtpSms;
use Tests\TestCase;

/**
 * ✅ قبلاً هیچ‌جا OTP واقعاً پیامک نمی‌شد. این Job همان چیزی است که حالا
 * OtpService بعد از تولید هر کد صف می‌کند.
 *
 * قبل از این رفع، ساخت این Job با یک PHP Fatal Error در ترکیب trait
 * (تداخل property با Queueable::$queue) شکست می‌خورد — این تست دقیقاً
 * تضمین می‌کند که ساخت و اجرای Job بدون خطای PHP انجام می‌شود.
 */
class SendOtpSmsTest extends TestCase
{
    public function test_it_runs_without_error_with_the_default_log_provider(): void
    {
        config(['services.sms.provider' => 'log']);

        (new SendOtpSms('09123456789', '12345'))->handle();

        $this->assertTrue(true);
    }

    public function test_it_falls_back_to_log_when_kavenegar_has_no_api_key(): void
    {
        config(['services.sms.provider' => 'kavenegar', 'services.kavenegar.api_key' => null]);

        // بدون API Key، SmsService خودش به sendViaLog برمی‌گردد؛ این تست فقط
        // تضمین می‌کند این مسیر هم بدون پرتاب استثنا اجرا شود.
        (new SendOtpSms('09123456789', '12345'))->handle();

        $this->assertTrue(true);
    }
}
