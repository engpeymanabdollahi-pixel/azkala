<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * سرویس ارسال پیامک
 * 
 * قابل توسعه برای ارائه‌دهندگان مختلف مانند کاوه‌نگار، ملی‌پیامک و غیره
 */
class SmsService
{
    /**
     * ارسال پیامک به شماره موبایل
     *
     * @param string $phone شماره موبایل (مثلاً 09123456789)
     * @param string $message متن پیامک
     * @return bool نتیجه عملیات
     */
    public static function send(string $phone, string $message): bool
    {
        try {
            // بررسی فرمت شماره موبایل
            $phone = self::normalizePhoneNumber($phone);
            
            if (!self::isValidPhoneNumber($phone)) {
                Log::warning('شماره موبایل نامعتبر', ['phone' => $phone]);
                return false;
            }

            // دریافت تنظیمات از environment
            $provider = config('services.sms.provider', 'log');
            
            return match ($provider) {
                'kavenegar' => self::sendViaKavenegar($phone, $message),
                'melipayamak' => self::sendViaMelipayamak($phone, $message),
                'ghasedak' => self::sendViaGhasedak($phone, $message),
                default => self::sendViaLog($phone, $message),
            };
        } catch (\Exception $e) {
            Log::error('خطا در ارسال پیامک', [
                'phone' => $phone,
                'message' => $message,
                'exception' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * ارسال پیامک از طریق کاوه‌نگار
     */
    private static function sendViaKavenegar(string $phone, string $message): bool
    {
        $apiKey = config('services.kavenegar.api_key');
        
        if (!$apiKey) {
            Log::warning('API Key کاوه‌نگار تنظیم نشده است');
            return self::sendViaLog($phone, $message);
        }

        $response = Http::withHeaders([
            'Accept' => 'application/json',
        ])->post('https://api.kavenegar.com/v1/' . $apiKey . '/sms/send.json', [
            'receptor' => $phone,
            'message' => $message,
        ]);

        $result = $response->json();
        
        if ($response->successful() && isset($result['return']['status']) && $result['return']['status'] == 200) {
            Log::info('پیامک از طریق کاوه‌نگار ارسال شد', [
                'phone' => $phone,
                'ref_id' => $result['return']['refid'] ?? null,
            ]);
            return true;
        }

        Log::error('ارسال پیامک کاوه‌نگار ناموفق بود', [
            'phone' => $phone,
            'response' => $result,
        ]);

        return false;
    }

    /**
     * ارسال پیامک از طریق ملی‌پیامک
     */
    private static function sendViaMelipayamak(string $phone, string $message): bool
    {
        $username = config('services.melipayamak.username');
        $password = config('services.melipayamak.password');
        
        if (!$username || !$password) {
            Log::warning('اطلاعات ملی‌پیامک تنظیم نشده است');
            return self::sendViaLog($phone, $message);
        }

        $response = Http::asForm()->post('https://rest.payamak-panel.ir/services/SendSMS/SendSMS', [
            'username' => $username,
            'password' => $password,
            'from' => config('services.melipayamak.from', '50005'),
            'to' => $phone,
            'text' => $message,
        ]);

        if ($response->successful()) {
            Log::info('پیامک از طریق ملی‌پیامک ارسال شد', ['phone' => $phone]);
            return true;
        }

        Log::error('ارسال پیامک ملی‌پیامک ناموفق بود', [
            'phone' => $phone,
            'response' => $response->body(),
        ]);

        return false;
    }

    /**
     * ارسال پیامک از طریق قاصدک
     */
    private static function sendViaGhasedak(string $phone, string $message): bool
    {
        $apiKey = config('services.ghasedak.api_key');
        
        if (!$apiKey) {
            Log::warning('API Key قاصدک تنظیم نشده است');
            return self::sendViaLog($phone, $message);
        }

        $response = Http::asForm()->post('https://api.ghasedak.me/v2/sms/send/simple', [
            'apikey' => $apiKey,
            'message' => $message,
            'receptor' => $phone,
        ]);

        if ($response->successful()) {
            Log::info('پیامک از طریق قاصدک ارسال شد', ['phone' => $phone]);
            return true;
        }

        Log::error('ارسال پیامک قاصدک ناموفق بود', [
            'phone' => $phone,
            'response' => $response->body(),
        ]);

        return false;
    }

    /**
     * لاگ کردن پیامک (برای محیط توسعه و تست)
     */
    private static function sendViaLog(string $phone, string $message): bool
    {
        Log::channel('daily')->info('[SMS LOG] پیامک ارسال شد (شبیه‌سازی)', [
            'phone' => $phone,
            'message' => $message,
        ]);
        
        return true;
    }

    /**
     * نرمال‌سازی شماره موبایل
     */
    private static function normalizePhoneNumber(string $phone): string
    {
        // حذف فاصله و خط تیره
        $phone = preg_replace('/[\s\-]/', '', $phone);
        
        // تبدیل 98+ به 0
        if (str_starts_with($phone, '+98')) {
            $phone = '0' . substr($phone, 3);
        } elseif (str_starts_with($phone, '98')) {
            $phone = '0' . substr($phone, 2);
        }
        
        return $phone;
    }

    /**
     * اعتبارسنجی شماره موبایل ایران
     */
    private static function isValidPhoneNumber(string $phone): bool
    {
        return (bool) preg_match('/^09[0-9]{9}$/', $phone);
    }

    /**
     * ارسال پیامک انبوه به چندین شماره
     *
     * @param array $phones آرایه‌ای از شماره‌های موبایل
     * @param string $message متن پیامک
     * @return int تعداد پیامک‌های موفق
     */
    public static function sendBulk(array $phones, string $message): int
    {
        $successCount = 0;
        
        foreach ($phones as $phone) {
            if (self::send($phone, $message)) {
                $successCount++;
            }
            
            // جلوگیری از Rate Limit
            usleep(100000); // 100ms تأخیر
        }
        
        return $successCount;
    }
}
