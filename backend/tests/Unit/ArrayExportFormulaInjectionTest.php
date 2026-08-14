<?php

namespace Tests\Unit;

use App\Exports\ArrayExport;
use Tests\TestCase;

/**
 * ✅ ArrayExport برای همه‌ی export های ادمین (محصولات، سفارشات، کاربران،
 * چت، گزارش‌ها) استفاده می‌شود و مقادیرش مستقیم از داده‌ی کاربر می‌آیند
 * (مثلاً نام محصول از فیچر آپلود گروهی seller). بدون این محافظ، مقداری
 * مثل '=HYPERLINK(...)' در نام محصول، در فایل Excel/CSV صادرشده به‌عنوان
 * فرمول واقعی ذخیره می‌شد و با باز کردن فایل توسط ادمین اجرا می‌شد
 * (CSV/Excel Formula Injection — CWE-1236).
 */
class ArrayExportFormulaInjectionTest extends TestCase
{
    public function test_it_neutralizes_values_starting_with_formula_trigger_characters(): void
    {
        $dangerous = [
            '=HYPERLINK("http://evil.com","click")',
            '+1+1',
            '-1+1',
            '@SUM(A1)',
        ];

        foreach ($dangerous as $value) {
            $export = new ArrayExport([['نام' => $value]]);
            $cell = $export->array()[0][0];

            $this->assertSame("'".$value, $cell, "Formula-looking value \"{$value}\" was not neutralized.");
        }
    }

    public function test_it_leaves_ordinary_values_untouched(): void
    {
        $export = new ArrayExport([['نام' => 'قاب آیفون 15', 'قیمت' => 250000]]);
        $row = $export->array()[0];

        $this->assertSame('قاب آیفون 15', $row[0]);
        $this->assertSame(250000, $row[1]);
    }
}
