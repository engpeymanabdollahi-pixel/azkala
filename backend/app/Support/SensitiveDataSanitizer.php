<?php

namespace App\Support;

/**
 * Sanitizer برای حذف/mask کردن داده‌های حساس از context لاگ.
 *
 * قوانین:
 * - کلیدهای حساس (password, token, otp, ...) → [REDACTED]
 * - شماره موبایل → 0912****789
 * - شناسه‌هایی که نیاز به correlation دارند → SHA-256 hash
 */
class SensitiveDataSanitizer
{
    /**
     * کلیدهای حساس (case-insensitive substring match)
     */
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'access_token',
        'refresh_token',
        'plaintexttoken',  // lowercase چون strtolower می‌کنیم
        'otp',
        'otp_code',
        'secret',
        'api_key',
        'api_secret',
        'credit_card',
        'card_number',
        'cvv',
        'cvv2',
        'authorization',
        'cookie',
    ];

    /**
     * sanitize کردن recursive یک آرایه.
     */
    public static function sanitize(array $data): array
    {
        $result = [];

        foreach ($data as $key => $value) {
            if (is_string($key) && self::isSensitiveKey($key)) {
                $result[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $result[$key] = self::sanitize($value);
            } else {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * بررسی حساس بودن کلید (substring match، case-insensitive).
     */
    public static function isSensitiveKey(string $key): bool
    {
        $lower = strtolower($key);

        foreach (self::SENSITIVE_KEYS as $sensitive) {
            if (str_contains($lower, $sensitive)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Mask کردن شماره موبایل.
     * مثال: 09123456789 → 0912****789
     */
    public static function maskPhone(?string $phone): string
    {
        if ($phone === null || $phone === '') {
            return '';
        }

        $len = strlen($phone);

        if ($len < 7) {
            return str_repeat('*', $len);
        }

        // ۴ رقم اول + ستاره + ۳ رقم آخر
        $maskLength = max(1, $len - 7);

        return substr($phone, 0, 4) . str_repeat('*', $maskLength) . substr($phone, -3);
    }

    /**
     * Hash کردن یک شناسه برای correlation بدون نشت داده.
     */
    public static function hashIdentifier(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return hash('sha256', $value);
    }
}