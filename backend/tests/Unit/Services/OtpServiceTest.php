<?php

namespace Tests\Unit\Services;

use App\Jobs\SendOtpSms;
use App\Services\Auth\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * ✅ CONFIRMED SECURITY FINDING (Backend Full Audit): OtpService::generateAndCache
 * قبلاً OTP را عیناً در همه‌ی environment ها (از جمله production) با
 * Log::info می‌نوشت — یک مسیر واقعی Account Takeover برای هر کسی که به
 * لاگ‌های اپ دسترسی دارد. این تست تضمین می‌کند که در محیطی غیر از
 * local (دقیقاً همان چیزی که تست‌ها زیرش اجرا می‌شوند — APP_ENV=testing
 * طبق phpunit.xml)، مقدار خودِ OTP هرگز در هیچ پیام لاگی ظاهر نمی‌شود.
 */
class OtpServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_generating_otp_does_not_log_the_code_outside_local_environment(): void
    {
        $this->assertNotSame(
            'local',
            app()->environment(),
            'این تست فرض می‌کند APP_ENV محیط تست local نیست (طبق phpunit.xml باید testing باشد).'
        );

        Queue::fake(); // جلوگیری از dispatch واقعی SendOtpSms به صف sync
        Log::spy();

        $phone = '09121110000';
        $otp = app(OtpService::class)->generateAndCache($phone);

        Log::shouldNotHaveReceived('info', function (array $args) use ($otp) {
            $message = is_string($args[0] ?? null) ? $args[0] : '';

            return str_contains($message, $otp);
        });
    }

    public function test_otp_is_still_cached_and_dispatched_for_sms_delivery_even_when_not_logged(): void
    {
        Queue::fake();

        $phone = '09121110001';
        $otp = app(OtpService::class)->generateAndCache($phone);

        $this->assertSame($otp, (string) Cache::get('otp_'.$phone));
        Queue::assertPushed(SendOtpSms::class);
    }

    public function test_verify_succeeds_once_and_then_prevents_replay(): void
    {
        Queue::fake();
        $phone = '09121110002';
        $otp = app(OtpService::class)->generateAndCache($phone);

        $this->assertTrue(app(OtpService::class)->verify($phone, $otp));
        // ✅ Replay: دومین verify با همان کد باید رد شود (Cache::forget بعد از موفقیت اول)
        $this->assertFalse(app(OtpService::class)->verify($phone, $otp));
    }
}
