<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * ✅ BulkProductService::validateRow برای هر ردیف اکسل ۳ کوئری جدا می‌زد
 * (SKU/دسته‌بندی/برند exists) — با رشد خطی به تعداد ردیف. الگوی این تست
 * از tests/Feature/ProductListQueryCountTest.php گرفته شده: کوئری برای
 * تعداد کم و زیاد ردیف را می‌سنجد و برابری‌شان را قفل می‌کند (batch
 * lookup به‌جای کوئری به‌ازای هر ردیف).
 */
class BulkProductValidateQueryCountTest extends TestCase
{
    use RefreshDatabase;

    private function countQueries(callable $call): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $call();
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    }

    private function makeXlsx(int $rowCount, Category $category): UploadedFile
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray(['نام', 'SKU', 'دسته', 'برند', 'قیمت', 'قبل تخفیف', 'موجودی'], null, 'A1');

        for ($i = 1; $i <= $rowCount; $i++) {
            $sheet->fromArray(
                ["محصول {$i}", "SKU-TEST-{$i}", $category->slug, '', 10000, '', 5],
                null,
                'A'.($i + 1)
            );
        }

        $path = tempnam(sys_get_temp_dir(), 'bulk_test_').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        return new UploadedFile($path, 'products.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }

    public function test_validate_query_count_does_not_grow_with_the_number_of_rows(): void
    {
        // ✅ دو seller جدا برای دو سناریو (نه یک seller مشترک): middleware
        // UpdateLastSeen هر ۶۰ ثانیه یک‌بار یک UPDATE اضافه به ازای هر
        // کاربر می‌زند (cache-throttled) — با یک seller مشترک، فراخوانی
        // دوم این کوئری را نمی‌زند و مقایسه را کاذب می‌کند.
        $category = Category::factory()->create(['is_active' => true]);

        $few = $this->countQueries(function () use ($category) {
            $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
            $this->actingAs($seller)
                ->postJson('/api/v1/seller/products/bulk/validate', [
                    'file' => $this->makeXlsx(3, $category),
                ])
                ->assertStatus(200);
        });

        $many = $this->countQueries(function () use ($category) {
            $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
            $this->actingAs($seller)
                ->postJson('/api/v1/seller/products/bulk/validate', [
                    'file' => $this->makeXlsx(30, $category),
                ])
                ->assertStatus(200);
        });

        $this->assertSame(
            $few,
            $many,
            "Bulk validate issued {$few} queries for 3 rows but {$many} for 30 - SKU/category/brand are being checked per row instead of batched."
        );
    }
}
