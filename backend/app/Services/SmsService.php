<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service for sending SMS notifications
 */
class SmsService
{
    /**
     * Send SMS to a phone number
     *
     * @param string $phone Phone number (e.g., 09123456789)
     * @param string $message Message content
     * @return bool Success status
     */
    public static function send(string $phone, string $message): bool
    {
        // Normalize phone number (remove leading 0 and add country code if needed)
        $phone = self::normalizePhoneNumber($phone);

        try {
            // Using Kavenegar as example SMS provider
            // Configurable via environment variables
            $apiKey = config('services.sms.kavenegar.api_key');
            
            if (empty($apiKey)) {
                Log::warning('SMS API key not configured', ['provider' => 'kavenegar']);
                return false;
            }

            $response = Http::withHeaders([
                'Accept' => 'application/json',
            ])->post("https://api.kavenegar.com/v1/{$apiKey}/sms/send.json", [
                'receptor' => $phone,
                'message' => $message,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['status']) && $data['status'] == 200) {
                    Log::info('SMS sent successfully', [
                        'phone' => $phone,
                        'message_length' => strlen($message),
                    ]);
                    return true;
                }
            }

            Log::error('SMS sending failed', [
                'phone' => $phone,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('SMS sending exception', [
                'phone' => $phone,
                'exception' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send OTP verification code
     *
     * @param string $phone Phone number
     * @param string $code Verification code
     * @return bool Success status
     */
    public static function sendOtp(string $phone, string $code): bool
    {
        $message = "کد تأیید شما: {$code}\nاین کد را به کسی ندهید.";
        return self::send($phone, $message);
    }

    /**
     * Send order confirmation SMS
     *
     * @param string $phone Customer phone number
     * @param string $orderNumber Order number
     * @param string $status Order status
     * @return bool Success status
     */
    public static function sendOrderConfirmation(string $phone, string $orderNumber, string $status = 'ثبت شده'): bool
    {
        $message = "سفارش {$orderNumber} با موفقیت {$status}.\nاز خرید شما سپاسگزاریم.";
        return self::send($phone, $message);
    }

    /**
     * Send shipping notification SMS
     *
     * @param string $phone Customer phone number
     * @param string $orderNumber Order number
     * @param string $trackingCode Tracking code
     * @return bool Success status
     */
    public static function sendShippingNotification(string $phone, string $orderNumber, string $trackingCode): bool
    {
        $message = "سفارش {$orderNumber} ارسال شد.\nکد پیگیری: {$trackingCode}";
        return self::send($phone, $message);
    }

    /**
     * Normalize phone number to standard format
     *
     * @param string $phone Phone number
     * @return string Normalized phone number
     */
    private static function normalizePhoneNumber(string $phone): string
    {
        // Remove any spaces, dashes, or other separators
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // If starts with 0, replace with +98
        if (str_starts_with($phone, '0')) {
            $phone = '+98' . substr($phone, 1);
        }

        // If doesn't start with +, add it
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }

        return $phone;
    }
}
