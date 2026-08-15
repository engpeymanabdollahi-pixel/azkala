<?php

namespace App\Services\Auth;

use App\Jobs\SendOtpSms;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class OtpService
{
    /**
     * تولید و ذخیره کد OTP امن
     */
    public function generateAndCache(string $phone): string
    {
        // ✅ رفع باگ امنیتی: استفاده از random_int به جای rand برای امنیت رمزنگاری
        $otp = (string) random_int(10000, 99999);

        // ذخیره در کش به مدت ۲ دقیقه
        Cache::put('otp_'.$phone, $otp, now()->addMinutes(2));

        // ✅ CONFIRMED SECURITY FINDING (Backend Full Audit): این خط قبلاً
        // در همه‌ی environment ها (از جمله production) اجرا می‌شد و OTP را
        // عیناً در storage/logs می‌نوشت. هر کسی که به لاگ‌های اپ دسترسی
        // دارد (که معمولاً دسترسی گسترده‌تری از Redis/Cache دارد، و
        // لاگ‌ها اغلب به سرویس‌های ثالث ارسال/برای مدت طولانی‌تری نگه
        // داشته می‌شوند) می‌توانست OTP زنده‌ی هر کاربری را بخواند و در
        // همان بازه‌ی ۲ دقیقه‌ای حساب او را تصاحب کند — یک مسیر واقعی
        // Account Takeover. الان دقیقاً همان الگوی app()->environment
        // ('local') که DebugController/DevController این پروژه از قبل
        // استفاده می‌کنند به کار رفته: امکان دیباگ محلی حفظ شده، ولی OTP
        // دیگر هرگز در production/staging لاگ نمی‌شود.
        if (app()->environment('local')) {
            Log::info("OTP generated for phone {$phone}: {$otp}");
        }

        // ✅ قبلاً همین‌جا کار تمام می‌شد و هیچ پیامک واقعی‌ای فرستاده
        // نمی‌شد — کاربر واقعی (نه محیط dev) هیچ‌وقت کد را دریافت نمی‌کرد.
        // در صف اجرا می‌شود تا این درخواست منتظر پاسخ سرویس پیامک نماند.
        SendOtpSms::dispatch($phone, $otp);

        return $otp;
    }

    /**
     * بررسی صحت کد OTP
     */
    public function verify(string $phone, string $otp): bool
    {
        $cachedOtp = Cache::get('otp_'.$phone);

        if (! $cachedOtp || (string) $cachedOtp !== $otp) {
            return false;
        }

        // حذف OTP پس از استفاده موفق (جلوگیری از استفاده مجدد - Replay Attack)
        Cache::forget('otp_'.$phone);

        return true;
    }
}
