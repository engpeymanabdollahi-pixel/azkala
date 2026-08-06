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
        return array_map('array_values', $this->data);
    }

    public function headings(): array
    {
        return $this->headings;
    }
}
