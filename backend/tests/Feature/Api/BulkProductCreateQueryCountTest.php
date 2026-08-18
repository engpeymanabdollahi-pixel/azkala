<?php

namespace Tests\Feature\Api;

use App\Models\Brand;
use App\Models\Category;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\User;
use App\Services\Seller\BulkProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * ✅ Device-First Architecture فاز ۳: BulkProductService::createProducts()
 * برای هر ردیفِ معتبر، category/brand/device_model را جدا با slug کوئری
 * می‌زد (به‌جای batch با whereIn، همان الگویی که validateFile() از قبل
 * داشت) و DeviceEnforcementService::assertModelsSelectable() هم به‌ازای هر
 * ردیف از نو مدل/دسته را resolve می‌کرد — رشد خطی: اندازه‌گیری واقعی نشان
 * داد ۶۰ کوئری برای ۵ ردیف و ۲۴۰ کوئری برای ۲۰ ردیف (۱۲ کوئری/ردیف، کاملاً
 * خطی). بعد از batch کردنِ سه lookup + کشِ درون‌درخواستیِ enforcement،
 * همان سناریو ۲۸ و ۸۳ کوئری شد — یعنی بخش قابل‌batch شدن دیگر با تعداد
 * ردیف رشد نمی‌کند؛ فقط هزینه‌ی ذاتیِ هر INSERT/uniqueness-check/sync
 * باقی می‌ماند. این تست همان کاهش را قفل می‌کند: نسبت کوئریِ ۲۰ ردیفی به
 * ۵ ردیفی باید بسیار کمتر از نسبت خطیِ قبلی (۴×) باشد.
 */
class BulkProductCreateQueryCountTest extends TestCase
{
    use RefreshDatabase;

    private function makeRows(int $n, Category $category, Brand $brand, DeviceModel $model): array
    {
        $rows = [];
        for ($i = 0; $i < $n; $i++) {
            $rows[] = [
                'row' => $i + 2,
                'data' => [
                    'name' => 'Product '.$i.'-'.uniqid(),
                    'sku' => 'SKU-'.$i.'-'.uniqid(),
                    'category_slug' => $category->slug,
                    'brand_slug' => $brand->slug,
                    'price' => 10000,
                    'compare_price' => null,
                    'stock' => 5,
                    'short_description' => '',
                    'description' => '',
                    'main_image_url' => '',
                    'specifications_json' => '',
                    'device_model_slug' => $model->slug,
                ],
            ];
        }

        return $rows;
    }

    public function test_query_count_does_not_grow_linearly_with_the_number_of_rows(): void
    {
        $seller = User::factory()->create(['role' => 'seller']);
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();
        $devBrand = DeviceBrand::create(['name' => 'B', 'slug' => 'b-'.uniqid(), 'is_active' => true]);
        $series = DeviceSeries::create(['brand_id' => $devBrand->id, 'name' => 'S', 'slug' => 's-'.uniqid(), 'is_active' => true]);
        $model = DeviceModel::create(['series_id' => $series->id, 'name' => 'M', 'slug' => 'm-'.uniqid(), 'is_active' => true]);

        $service = app(BulkProductService::class);

        DB::flushQueryLog();
        DB::enableQueryLog();
        $result5 = $service->createProducts($this->makeRows(5, $category, $brand, $model), $seller->id);
        $few = count(DB::getQueryLog());
        DB::flushQueryLog();

        $result20 = $service->createProducts($this->makeRows(20, $category, $brand, $model), $seller->id);
        $many = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertCount(5, $result5['created']);
        $this->assertCount(0, $result5['failed']);
        $this->assertCount(20, $result20['created']);
        $this->assertCount(0, $result20['failed']);

        // قبل از این فیکس نسبت ۲۰/۵ ردیف ~۴برابر بود (رشد کاملاً خطی، ۱۲
        // کوئری/ردیف ثابت)؛ بعد از batch کردن lookupها فقط هزینه‌ی ذاتیِ هر
        // ردیف (insert/uniqueness/sync) باقی می‌ماند، پس این نسبت باید به‌طور
        // محسوسی کمتر از ۴ باشد.
        $ratio = $many / max($few, 1);
        $this->assertLessThan(
            3.5,
            $ratio,
            "کوئری‌ها هنوز تقریباً خطی رشد می‌کنند: {$few} کوئری برای ۵ ردیف، {$many} کوئری برای ۲۰ ردیف (نسبت {$ratio})."
        );
    }
}
