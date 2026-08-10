<?php

namespace App\Jobs;

use App\Services\SmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ارسال کد OTP از طریق پیامک، در صف.
 *
 * ✅ قبلاً OtpService::generateAndCache فقط کد را در Log می‌نوشت — SmsService
 * که همین پروژه برای زرین‌پال/کاوه‌نگار/ملی‌پیامک/قاصدک دارد اصلاً برای OTP
 * صدا زده نمی‌شد. یعنی هیچ کاربر واقعی (نه فقط در محیط لوکال) هیچ‌وقت کد
 * تأیید را روی گوشی‌اش دریافت نمی‌کرد — کل مسیر ثبت‌نام/ورود با OTP برای
 * کاربر واقعی از کار افتاده بود، صرف نظر از حجم کاربران.
 *
 * در صف اجرا می‌شود (نه synchronous داخل request) چون:
 * - درخواست HTTP ثبت‌نام/ورود نباید منتظر پاسخ یک API خارجی (پیامک) بماند؛
 *   کندی یا قطعی سرویس پیامک نباید کل مسیر ثبت‌نام را کند/متوقف کند.
 * - در مقیاس بالا (هزاران ثبت‌نام هم‌زمان)، فراخوانی synchronous یک API
 *   خارجی از داخل هر request، دقیقاً همان‌جایی است که اول از همه زیر بار
 *   می‌شکند.
 */
class SendOtpSms implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 30;

    public int $tries = 3;

    public int $backoff = 15;

    public function __construct(
        protected string $phone,
        protected string $otp
    ) {
        // ✅ اعلام مستقیم `public string $queue` با trait Queueable تداخل
        // نوع دارد (هر دو یک property با تایپ متفاوت تعریف می‌کنند) و
        // PHP Fatal Error «incompatible property composition» می‌داد —
        // متد استاندارد onQueue() همان کار را بدون این تداخل انجام می‌دهد.
        $this->onQueue('sms');
    }

    public function handle(): void
    {
        $message = "کد تایید آزکالا: {$this->otp}\nاین کد تا ۲ دقیقه معتبر است.";

        $sent = SmsService::send($this->phone, $message);

        if (! $sent) {
            Log::warning('SendOtpSms: ارسال پیامک OTP ناموفق بود', ['phone' => $this->phone]);
        }
    }
}
