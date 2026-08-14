<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\Seller\BulkProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * ✅ تا قبل از این تست، هیچ تست HTTP واقعی این feature را با یک فایل
 * واقعی صدا نمی‌زد — یعنی باگ Excel::toCollection($file) (آرگومان دوم
 * اجباری فراموش‌شده) کاملاً نامرئی بود، چون هیچ کدی مسیر «آپلود واقعی»
 * را اجرا نمی‌کرد. این تست دقیقاً همان مسیر end-to-end (validate → commit)
 * را با یک فایل xlsx واقعی طی می‌کند.
 */
class BulkProductUploadTest extends TestCase
{
    use RefreshDatabase;

    private function makeXlsx(array $rows): UploadedFile
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray(['نام', 'SKU', 'دسته', 'برند', 'قیمت', 'قبل تخفیف', 'موجودی'], null, 'A1');

        foreach ($rows as $i => $row) {
            $sheet->fromArray($row, null, 'A'.($i + 2));
        }

        $path = tempnam(sys_get_temp_dir(), 'bulk_test_').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        return new UploadedFile($path, 'products.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }

    public function test_seller_can_validate_and_commit_a_real_xlsx_file(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        $category = Category::factory()->create(['is_active' => true]);

        $file = $this->makeXlsx([
            ['قاب آیفون 15', 'SKU-A-1', $category->slug, '', 150000, '', 10],
            ['شارژر سامسونگ', 'SKU-A-2', $category->slug, '', 80000, '', 5],
        ]);

        $validateResponse = $this->actingAs($seller)
            ->postJson('/api/v1/seller/products/bulk/validate', ['file' => $file])
            ->assertOk();

        $validateResponse->assertJsonPath('data.valid_count', 2);
        $validateResponse->assertJsonPath('data.error_count', 0);

        $commitResponse = $this->actingAs($seller)
            ->postJson('/api/v1/seller/products/bulk/commit', [
                'valid_rows' => $validateResponse->json('data.valid'),
            ])
            ->assertOk();

        $commitResponse->assertJsonCount(2, 'data.created');
        $this->assertSame(2, Product::where('seller_id', $seller->id)->count());
    }

    public function test_row_with_unknown_category_is_reported_as_an_error_not_created(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);

        $file = $this->makeXlsx([
            ['محصول با دسته ناموجود', 'SKU-B-1', 'no-such-category-slug', '', 10000, '', 1],
        ]);

        $response = $this->actingAs($seller)
            ->postJson('/api/v1/seller/products/bulk/validate', ['file' => $file])
            ->assertOk();

        $response->assertJsonPath('data.valid_count', 0);
        $response->assertJsonPath('data.error_count', 1);
    }

    public function test_file_over_the_row_limit_is_rejected_before_any_query_runs(): void
    {
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);
        $category = Category::factory()->create(['is_active' => true]);

        $rows = [];
        for ($i = 1; $i <= BulkProductService::MAX_ROWS + 1; $i++) {
            $rows[] = ["محصول {$i}", "SKU-C-{$i}", $category->slug, '', 10000, '', 1];
        }

        $this->actingAs($seller)
            ->postJson('/api/v1/seller/products/bulk/validate', ['file' => $this->makeXlsx($rows)])
            ->assertStatus(422);
    }
}
