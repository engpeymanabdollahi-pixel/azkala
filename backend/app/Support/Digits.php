<?php

namespace App\Support;

/**
 * یکسان‌سازی ارقام فارسی و عربی به لاتین.
 *
 * قواعد اعتبارسنجی شماره موبایل با [0-9] یا \d نوشته شده‌اند و هر دو فقط ارقام
 * لاتین را می‌گیرند. یعنی کاربری که با کیبورد فارسی «۰۹۱۲۳۴۵۶۷۸۹» تایپ می‌کند
 * پیام «فرمت شماره نامعتبر است» می‌گیرد بدون اینکه بفهمد چه چیزی غلط است —
 * شماره از نظر خودش کاملاً درست بوده.
 *
 * همتای سمت فرانت‌اند: frontend/src/utils/digits.ts
 */
class Digits
{
    private const PERSIAN = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    private const ARABIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    private const LATIN = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    public static function toLatin(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        return str_replace(
            array_merge(self::PERSIAN, self::ARABIC),
            array_merge(self::LATIN, self::LATIN),
            $value
        );
    }
}
