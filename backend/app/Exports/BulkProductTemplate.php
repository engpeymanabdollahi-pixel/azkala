<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BulkProductTemplate implements WithHeadings, WithColumnWidths, WithStyles
{
    public function headings(): array
    {
        return [
            'نام محصول (الزامی)',
            'SKU - کد محصول (الزامی)',
            'slug دسته‌بندی (الزامی)',
            'slug برند (اختیاری)',
            'قیمت (الزامی)',
            'قیمت قبل از تخفیف (اختیاری)',
            'موجودی (الزامی)',
            'توضیح کوتاه (اختیاری)',
            'توضیحات کامل (اختیاری)',
            'URL تصویر اصلی (اختیاری)',
            'مشخصات فنی - JSON (اختیاری)',
            'slug مدل دستگاه سازگار (اختیاری)',
        ];
    }
    
    public function columnWidths(): array
    {
        return [
            'A' => 30, 'B' => 20, 'C' => 20, 'D' => 20,
            'E' => 15, 'F' => 20, 'G' => 12, 'H' => 40,
            'I' => 60, 'J' => 40, 'K' => 40, 'L' => 25,
        ];
    }
    
    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
        ];
    }
}